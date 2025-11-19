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

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Load .env from project root
dotenv.config({ path: path.join(__dirname, '..', '.env') })

const app = express()

app.use(
  cors({
    origin: ["https://virtual-therapist.vercel.app"],
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
  if (!raw) return "https://virtual-therapist-analysis.onrender.com/api/analyze"

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
    return res.json(result)
  } catch (err) {
    console.error("[analyze] error:", err)
    return res.status(500).json({ error: "Server error" })
  }
})

const PORT = process.env.PORT || 4000
const MONGODB_URI = process.env.MONGODB_URI
const JWT_SECRET = process.env.JWT_SECRET
const ANALYSIS_SERVICE_URL = process.env.ANALYSIS_SERVICE_URL || "https://virtual-therapist-analysis.onrender.com/api/analyze"

if (!MONGODB_URI) {
  console.error("[auth_service] Missing MONGODB_URI in environment.")
  process.exit(1)
}

if (!JWT_SECRET) {
  console.error("[auth_service] Missing JWT_SECRET in environment.")
  process.exit(1)
}

mongoose
  .connect(MONGODB_URI, { dbName: process.env.MONGODB_DB || "virtual_therapist" })
  .then(() => {
    console.log("[auth_service] Connected to MongoDB")
    app.listen(PORT, () => console.log(`[auth_service] Listening on ${PORT}`))
  })
  .catch((err) => {
    console.error("[auth_service] MongoDB connection error:", err.message)
    process.exit(1)
  })
