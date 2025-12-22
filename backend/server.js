import express from "express"
import cors from "cors"
import morgan from "morgan"
import dotenv from "dotenv"
import mongoose from "mongoose"
import fetch from "node-fetch"
import path from "path"
import { fileURLToPath } from "url"

import authRoutes from "./routes/auth.js"
import patientRoutes from "./routes/patients.js"
import sessionRoutes from "./routes/sessions.js"
import { callGroq } from "./services/groqClient.js"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Load .env from project root
dotenv.config({ path: path.join(__dirname, '..', '.env') })

const app = express()

app.use(
  cors({
    origin: [
      "https://virtual-therapist.vercel.app",
      "http://localhost:3000",
      "http://localhost:5173",
      "http://127.0.0.1:3000",
      "http://127.0.0.1:5173"
    ],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
)
app.use(express.json({ limit: "1mb" }))
app.use(express.urlencoded({ extended: true }))
app.use(morgan("dev"))

app.get("/health", (_req, res) => res.json({ ok: true }))

app.use("/api/auth", authRoutes)
app.use("/api/patients", patientRoutes)
app.use("/api/sessions", sessionRoutes)

const resolveAnalysisUrl = () => {
  const raw = (process.env.ANALYSIS_SERVICE_URL || "").trim()
  if (!raw) return "http://127.0.0.1:5001/api/analyze"

  // If the env already points to a specific endpoint (predict/analyze), use it as-is
  if (/\/(api\/)?analyze\/?$/i.test(raw) || /\/predict\/?$/i.test(raw)) {
    return raw
  }

  // Otherwise treat it as a base URL and append the default analyze endpoint
  return `${raw.replace(/\/$/, "")}/api/analyze`
}

// Individual user analysis endpoint (no auth required)
app.post("/api/analyze", async (req, res) => {
  try {
    const { text } = req.body
    if (!text || text.trim().length < 5) {
      return res.status(400).json({ error: "Text is too short" })
    }

    const analysisUrl = resolveAnalysisUrl()
    const response = await fetch(analysisUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    })

    if (!response.ok) {
      console.error("[analyze] analysis service error:", response.status)
      return res.status(502).json({ error: "Analysis service unavailable" })
    }

    const result = await response.json()

    // ---------------------------------------------------------
    // HYBRID ROUTING LOGIC (Node.js Gateway)
    // ---------------------------------------------------------
    const CONFIDENCE_HIGH = 0.85
    const CONFIDENCE_LOW = 0.65

    // 1. Extract Model Confidence
    const topPattern = result.topPattern
    const confidenceScores = result.confidenceScores || []

    // Find score for the top pattern
    let topScore = 0.0
    const topMatch = confidenceScores.find(item => item.label === topPattern)
    if (topMatch) {
      topScore = topMatch.score
    }

    console.log(`[analyze] Prediction: ${topPattern}, Score: ${topScore.toFixed(2)}`)

    // 2. Routing Decision

    // Case A: High Confidence (>= 0.7) -> Model ONLY
    if (topScore >= CONFIDENCE_HIGH) {
      console.log("[analyze] High confidence. Returning model response ONLY.")
      result.source = "model"
      // No Groq call
    }

    // Case B: Mid Confidence (0.4 <= score < 0.7) -> Supportive AI
    else if (topScore >= CONFIDENCE_LOW) {
      console.log("[analyze] Mid confidence. Calling Groq for supportive response.")

      const systemPrompt = `
        You are a supportive, empathetic mental health assistant.
        The user seems to be experiencing ${topPattern} (Context: Uncertain confidence ${topScore.toFixed(2)}).
        
        Task: Provide a brief, supportive, and non-judgmental response.
        - Acknowledge their feelings based on the context.
        - Do NOT diagnose.
        - Do NOT act as a doctor.
        - Keep it under 3 sentences.
      `

      const aiResponse = await callGroq(systemPrompt, text)

      if (aiResponse) {
        result.ai_response = aiResponse
        result.source = "model+groq"

        // Zero out scores to prevent misclassification in UI (User Request)
        result.topPattern = "None"
        if (result.confidenceScores) {
          result.confidenceScores = result.confidenceScores.map(item => ({ ...item, score: 0 }))
        }
      } else {
        result.source = "model_fallback" // Groq failed
      }
    }

    // Case C: Low Confidence (< 0.4) -> General AI + Disclaimer
    else {
      console.log("[analyze] Low confidence. Treating as general query.")

      const systemPrompt = `
        You are a helpful general assistant.
        The user's query does not appear to be strongly related to specific mental health conditions based on our model.
        
        Task: Answer the user's question normally and helpfully.
        - If it is a general question, answer it.
        - Do NOT try to force a mental health context.
        - Keep it concise.
      `

      const aiResponse = await callGroq(systemPrompt, text)

      if (aiResponse) {
        // Prepend disclaimer
        const disclaimer = "This question doesn't seem directly related to specific mental health conditions, but here is some information: "
        result.ai_response = disclaimer + aiResponse
        result.source = "groq"

        // Zero out scores to prevent misclassification in UI
        result.topPattern = "None"
        if (result.confidenceScores) {
          result.confidenceScores = result.confidenceScores.map(item => ({ ...item, score: 0 }))
        }
      } else {
        result.source = "model_fallback"
      }
    }

    return res.json(result)
  } catch (err) {
    console.error("[analyze] error:", err)
    return res.status(500).json({ error: "Server error" })
  }
})

const PORT = process.env.PORT || 4000
const MONGODB_URI = process.env.MONGODB_URI
const JWT_SECRET = process.env.JWT_SECRET
const ANALYSIS_SERVICE_URL = process.env.ANALYSIS_SERVICE_URL || "http://127.0.0.1:5001/api/analyze"

// Validate MongoDB URI
if (!MONGODB_URI) {
  console.error("[auth_service] ❌ Missing MONGODB_URI in environment.")
  console.error("[auth_service] Please update the .env file with your MongoDB Atlas connection string.")
  console.error("[auth_service] Example: mongodb+srv://username:password@cluster.mongodb.net/virtual_therapist?retryWrites=true&w=majority")
  process.exit(1)
}

// Check if MongoDB URI contains placeholder values
if (MONGODB_URI.includes("<") || MONGODB_URI.includes(">") || MONGODB_URI.includes("cluster-url") || MONGODB_URI.includes("username") || MONGODB_URI.includes("password")) {
  console.error("[auth_service] ❌ MONGODB_URI contains placeholder values.")
  console.error("[auth_service] Please update the .env file with your actual MongoDB Atlas connection string.")
  console.error("[auth_service] Current value:", MONGODB_URI.replace(/\/\/[^:]+:[^@]+@/, "//***:***@")) // Hide credentials in log
  console.error("[auth_service] Get your connection string from: https://cloud.mongodb.com/")
  process.exit(1)
}

if (!JWT_SECRET || JWT_SECRET.includes("change_in_production") || JWT_SECRET.includes("your_super_secret")) {
  console.warn("[auth_service] ⚠️  JWT_SECRET is using default/placeholder value.")
  console.warn("[auth_service] Please update JWT_SECRET in .env file for production use.")
  // Don't exit, just warn - allow development with default secret
}

// Enhanced MongoDB connection with better error handling
const connectToMongoDB = async () => {
  try {
    const connectionOptions = {
      dbName: process.env.MONGODB_DB || "virtual_therapist",
      serverSelectionTimeoutMS: 10000, // 10 seconds timeout
      socketTimeoutMS: 45000, // 45 seconds socket timeout
      connectTimeoutMS: 10000, // 10 seconds connection timeout
      retryWrites: true,
      w: "majority",
    }

    await mongoose.connect(MONGODB_URI, connectionOptions)
    console.log("[auth_service] ✅ Connected to MongoDB successfully")

    // Handle connection events
    mongoose.connection.on("error", (err) => {
      console.error("[auth_service] MongoDB connection error:", err.message)
    })

    mongoose.connection.on("disconnected", () => {
      console.warn("[auth_service] ⚠️  MongoDB disconnected")
    })

    mongoose.connection.on("reconnected", () => {
      console.log("[auth_service] ✅ MongoDB reconnected")
    })

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`[auth_service] 🚀 Server listening on port ${PORT}`)
    })
  } catch (err) {
    console.error("\n[auth_service] ❌ MongoDB connection failed!")
    console.error("[auth_service] Error details:", err.message)

    // Provide specific guidance based on error type
    if (err.message.includes("querySrv") || err.message.includes("EBADNAME") || err.message.includes("ENOTFOUND")) {
      console.error("\n[auth_service] 🔍 DNS Resolution Error Detected")
      console.error("[auth_service] This usually means:")
      console.error("  1. The cluster URL in your MONGODB_URI is incorrect or contains placeholders")
      console.error("  2. The cluster doesn't exist or has been deleted")
      console.error("  3. There's a typo in the cluster hostname")
      console.error("\n[auth_service] 📝 Action required:")
      console.error("  1. Go to https://cloud.mongodb.com/")
      console.error("  2. Navigate to your cluster → Connect → Drivers")
      console.error("  3. Copy the connection string and replace <password> with your actual password")
      console.error("  4. Update MONGODB_URI in your .env file")
      console.error("\n[auth_service] Example format:")
      console.error("  mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/virtual_therapist?retryWrites=true&w=majority")
    } else if (err.message.includes("authentication failed") || err.message.includes("bad auth")) {
      console.error("\n[auth_service] 🔐 Authentication Error Detected")
      console.error("[auth_service] This usually means:")
      console.error("  1. The username or password in MONGODB_URI is incorrect")
      console.error("  2. The database user doesn't exist or has been deleted")
      console.error("  3. Special characters in password need to be URL-encoded")
      console.error("\n[auth_service] 📝 Action required:")
      console.error("  1. Verify your MongoDB Atlas username and password")
      console.error("  2. If password contains special characters, URL-encode them (e.g., @ becomes %40)")
      console.error("  3. Check Database Access in MongoDB Atlas to ensure the user exists")
    } else if (err.message.includes("timeout") || err.message.includes("ETIMEDOUT")) {
      console.error("\n[auth_service] ⏱️  Connection Timeout Error")
      console.error("[auth_service] This usually means:")
      console.error("  1. Your IP address is not whitelisted in MongoDB Atlas")
      console.error("  2. Network connectivity issues")
      console.error("  3. MongoDB Atlas cluster is paused or unavailable")
      console.error("\n[auth_service] 📝 Action required:")
      console.error("  1. Go to MongoDB Atlas → Network Access")
      console.error("  2. Add your current IP address (or 0.0.0.0/0 for development)")
      console.error("  3. Wait a few minutes for changes to propagate")
      console.error("  4. Check if your cluster is running (not paused)")
    } else {
      console.error("\n[auth_service] 📝 General troubleshooting:")
      console.error("  1. Verify MONGODB_URI in your .env file is correct")
      console.error("  2. Check MongoDB Atlas dashboard: https://cloud.mongodb.com/")
      console.error("  3. Ensure your cluster is running and accessible")
      console.error("  4. Verify network access settings allow your IP")
    }

    console.error("\n[auth_service] Full error:", err)
    process.exit(1)
  }
}

// Start the connection
connectToMongoDB()
