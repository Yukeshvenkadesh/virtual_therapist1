"use client"

import { useEffect, useMemo, useState } from "react"
import { Routes, Route, Navigate, useLocation } from "react-router-dom"
import Header from "./components/Header.jsx"
import IndividualView from "./components/IndividualView.jsx"
import PsychologistView from "./components/PsychologistView.jsx"

export default function App() {
  const [dark, setDark] = useState(() => {
    const saved = localStorage.getItem("vt_dark")
    return saved ? JSON.parse(saved) : true
  })
  useEffect(() => {
    localStorage.setItem("vt_dark", JSON.stringify(dark))
    document.documentElement.classList.toggle("dark", dark)
  }, [dark])

  function normalizeBase(url) {
    if (!url) return ""
    const trimmed = url.replace(/\/$/, "")
    // Strip trailing /api if user provided it in env
    return trimmed.replace(/\/api$/, "")
  }

  const BACKEND_API = normalizeBase(
    import.meta.env.VITE_BACKEND_URL ||
      import.meta.env.VITE_AUTH_API_URL ||
      import.meta.env.VITE_ANALYSIS_API_URL ||
      "http://localhost:4000",
  )
  console.log("BACKEND:", BACKEND_API)
  const AUTH_API = BACKEND_API
  const ANALYSIS_API = BACKEND_API

  const location = useLocation()
  const title = useMemo(() => {
    if (location.pathname.startsWith("/pro")) return "For Professionals"
    return "Individual"
  }, [location.pathname])

  return (
    <div className="app">
      <Header dark={dark} setDark={setDark} />
      <main className="container">
        <h1 className="page-title">{title}</h1>
        <Routes>
          <Route path="/" element={<IndividualView analysisApi={ANALYSIS_API} />} />
          <Route path="/pro/*" element={<PsychologistView authApi={AUTH_API} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <footer className="footer">© {new Date().getFullYear()} Virtual Therapist</footer>
    </div>
  )
}
