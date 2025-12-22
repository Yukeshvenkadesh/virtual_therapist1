"use client"

import { useEffect, useState } from "react"
import ResultCard from "./ResultCard.jsx"

function loadHistory() {
  try {
    const raw = localStorage.getItem("vt_history")
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}
function saveHistory(list) {
  try {
    localStorage.setItem("vt_history", JSON.stringify(list))
  } catch { }
}

export default function IndividualView({ analysisApi }) {
  const [text, setText] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [result, setResult] = useState(null)
  const [history, setHistory] = useState(() => loadHistory())
  const [sessionId, setSessionId] = useState(() => {
    const saved = localStorage.getItem("vt_session_id")
    return saved || null
  })

  useEffect(() => {
    saveHistory(history)
  }, [history])

  useEffect(() => {
    if (sessionId) {
      localStorage.setItem("vt_session_id", sessionId)
    }
  }, [sessionId])

  async function analyze() {
    setError("")
    setResult(null)
    if (text.trim().length < 5) {
      setError("Please enter at least 5 characters.")
      return
    }
    setLoading(true)
    try {
      // Use backend API instead of direct model service
      const resp = await fetch(`${analysisApi}/api/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      })
      const data = await resp.json()
      if (!resp.ok) throw new Error(data.error || "Analysis failed")
      setResult(data)
      setHistory((h) => [{ id: Date.now(), text, result: data, date: new Date().toISOString() }, ...h.slice(0, 49)])
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="row">
      <div className="col">
        <div className="card">
          <div className="privacy-notice">
            <div className="privacy-icon">🔒</div>
            <div className="privacy-text">
              <strong>Privacy Notice:</strong> Your data is stored temporarily in your browser and will be deleted when you close this tab. No personal information is saved on our servers.
            </div>
          </div>
          <label htmlFor="notes" className="help">
            Enter your thoughts or notes:
          </label>
          <textarea
            id="notes"
            className="input"
            placeholder="Write here... (minimum 5 characters)"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.75rem", flexWrap: "wrap" }}>
            <button className="button" onClick={analyze} disabled={loading} style={{ flex: "1 1 200px" }}>
              {loading ? "Analyzing..." : "Analyze Text"}
            </button>
            <button className="button secondary" onClick={() => setText("")} disabled={loading} style={{ flex: "1 1 100px" }}>
              Clear
            </button>
          </div>
          {error && (
            <p className="help" style={{ color: "var(--primary)" }}>
              {error}
            </p>
          )}

          {/* New Result Display Area as requested */}
          {result && (
            <div style={{ marginTop: "1rem" }}>
              <label htmlFor="ai-response" className="help">
                Analysis Result:
              </label>
              <textarea
                id="ai-response"
                className="input"
                readOnly
                rows={4}
                value={result.ai_response || `Model Prediction: ${result.topPattern}`}
                style={{
                  backgroundColor: "var(--background-alt)",
                  color: "var(--text)",
                  borderColor: result.ai_response ? "var(--primary)" : "var(--border)"
                }}
              />
            </div>
          )}
        </div>
        <div style={{ marginTop: "1rem" }}>
          <ResultCard result={result} />
        </div>
      </div>
      <div className="col">
        <div className="card">
          <div className="result-title">Session History</div>
          <div className="help" style={{ marginBottom: "0.5rem", fontSize: "0.8rem" }}>
            Data stored locally in your browser - deleted when you close this tab
          </div>
          <div className="list">
            {history.length === 0 && <div className="help">No history yet.</div>}
            {history.map((h) => (
              <div key={h.id} className="list-item">
                <div style={{ maxWidth: "65%" }}>
                  <div className="help" style={{ marginBottom: 4 }}>
                    {new Date(h.date).toLocaleString()}
                  </div>
                  <div style={{ fontSize: "0.95rem" }}>
                    {h.text.slice(0, 120)}
                    {h.text.length > 120 ? "..." : ""}
                  </div>
                </div>
                <div style={{ fontWeight: 600 }}>{h.result.topPattern}</div>
              </div>
            ))}
          </div>
          {history.length > 0 && (
            <div style={{ marginTop: "0.75rem", display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              <button className="button secondary" onClick={() => setHistory([])} style={{ flex: "1 1 120px" }}>
                Clear history
              </button>
              <button
                className="button secondary"
                onClick={() => navigator.clipboard.writeText(JSON.stringify(history, null, 2))}
                style={{ flex: "1 1 120px" }}
              >
                Copy JSON
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
