import { Router } from "express"
import Patient from "../models/Patient.js"
import { requireAuth } from "../middleware/auth.js"
import fetch from "node-fetch"

const router = Router()
router.use(requireAuth)

const resolveAnalysisUrl = () => {
  const raw = (process.env.ANALYSIS_SERVICE_URL || "").trim()
  if (!raw) return "https://virtual-therapist-analysis.onrender.com/api/analyze"

  if (/\/(api\/)?analyze\/?$/i.test(raw) || /\/predict\/?$/i.test(raw)) {
    return raw
  }

  return `${raw.replace(/\/$/, "")}/api/analyze`
}

router.post("/", async (req, res) => {
  try {
    const { name } = req.body
    if (!name) return res.status(400).json({ error: "Name is required" })
    const patient = await Patient.create({ name, createdBy: req.userId })
    return res.status(201).json(patient)
  } catch (err) {
    console.error("[patients POST] error:", err)
    return res.status(500).json({ error: "Server error" })
  }
})

router.get("/", async (req, res) => {
  try {
    const list = await Patient.find({ createdBy: req.userId }).sort({ createdAt: -1 })
    return res.json(list)
  } catch (err) {
    console.error("[patients GET] error:", err)
    return res.status(500).json({ error: "Server error" })
  }
})

router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params
    const patient = await Patient.findOneAndDelete({ _id: id, createdBy: req.userId })
    if (!patient) return res.status(404).json({ error: "Patient not found" })
    return res.json({ message: "Patient deleted", id })
  } catch (err) {
    console.error("[patients DELETE] error:", err)
    return res.status(500).json({ error: "Server error" })
  }
})

router.post("/:id/analyze", async (req, res) => {
  try {
    const { text } = req.body
    if (!text || text.trim().length < 5) return res.status(400).json({ error: "Text is too short" })

    const patient = await Patient.findOne({ _id: req.params.id, createdBy: req.userId })
    if (!patient) return res.status(404).json({ error: "Patient not found" })

    const analysisUrl = resolveAnalysisUrl()
    const resp = await fetch(analysisUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    })
    if (!resp.ok) {
      const t = await resp.text()
      console.error("[analyze] analysis service error:", t)
      return res.status(502).json({ error: "Analysis service failed" })
    }
    const result = await resp.json()
    const entry = {
      text,
      topPattern: result.topPattern,
      confidenceScores: result.confidenceScores,
      createdAt: new Date(),
    }
    patient.history = [entry, ...(patient.history || [])]
    await patient.save()
    return res.json({ patientId: patient._id, entry })
  } catch (err) {
    console.error("[patients analyze] error:", err)
    return res.status(500).json({ error: "Server error" })
  }
})

export default router
