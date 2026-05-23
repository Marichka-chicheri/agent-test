import { useEffect, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { logout } from "../api/api"
import { AppNav } from "../components/AppNav"
import { useAuth } from "../hooks/useAuth"

export function ApiKeysSettings() {
  const navigate = useNavigate()
  const { apiKeys, loadApiKeys, updateGeminiKey } = useAuth()
  const [geminiKey, setGeminiKey] = useState("")
  const [loading, setLoading] = useState(false)
  const [loadingMeta, setLoadingMeta] = useState(true)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        setLoadingMeta(true)
        await loadApiKeys()
      } catch (err) {
        if (!cancelled) setError(err.message || "Failed to load API keys")
      } finally {
        if (!cancelled) setLoadingMeta(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [loadApiKeys])

  async function handleSave(e) {
    e.preventDefault()
    setError("")
    setSuccess("")

    try {
      setLoading(true)
      await updateGeminiKey(geminiKey.trim())
      setGeminiKey("")
      setSuccess("Gemini API key saved securely.")
    } catch (err) {
      setError(err.message || "Failed to save API key")
    } finally {
      setLoading(false)
    }
  }

  async function handleClear() {
    setError("")
    setSuccess("")
    try {
      setLoading(true)
      await updateGeminiKey("")
      setGeminiKey("")
      setSuccess("Gemini API key removed.")
    } catch (err) {
      setError(err.message || "Failed to remove API key")
    } finally {
      setLoading(false)
    }
  }

  function handleLogout() {
    logout()
    navigate("/login", { replace: true })
  }

  return (
    <div style={styles.root}>
      <div style={styles.topBar}>
        <div style={styles.logoBadge}>
          Agentic<span style={{ color: "#b3f0ff" }}>Studio</span>
        </div>
        <AppNav />
        <button type="button" style={styles.profileBar} onClick={handleLogout}>
          Logout
        </button>
      </div>

      <div style={styles.card}>
        <h2 style={styles.title}>API Keys</h2>
        <p style={styles.subtitle}>
          This app uses <strong>Google Gemini only</strong>. Store your personal
          Gemini API key; it is encrypted in the database and loaded when you sign in.
        </p>

        {loadingMeta ? (
          <p style={styles.hint}>Loading saved key status…</p>
        ) : (
          <p style={styles.hint}>
            Status:{" "}
            {apiKeys.gemini_configured
              ? `Configured (${apiKeys.gemini_key_hint || "saved"})`
              : "Not configured"}
          </p>
        )}

        <form onSubmit={handleSave} style={styles.form}>
          <label style={styles.label}>Gemini API key</label>
          <input
            type="password"
            autoComplete="off"
            value={geminiKey}
            onChange={(e) => setGeminiKey(e.target.value)}
            placeholder="AIza…"
            style={styles.input}
            disabled={loading || loadingMeta}
          />
          <p style={styles.note}>
            Leave blank and use Clear to remove an existing key. Keys are never
            returned in full after saving.
          </p>

          {error && <div style={styles.error}>{error}</div>}
          {success && <div style={styles.success}>{success}</div>}

          <div style={styles.actions}>
            <button
              type="submit"
              disabled={loading || loadingMeta || !geminiKey.trim()}
              style={styles.primaryBtn}
            >
              {loading ? "Saving…" : "Save key"}
            </button>
            <button
              type="button"
              disabled={loading || loadingMeta || !apiKeys.gemini_configured}
              onClick={handleClear}
              style={styles.secondaryBtn}
            >
              Clear key
            </button>
            <Link to="/live" style={styles.link}>
              Back to Live
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}

const styles = {
  root: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    gap: 12,
    padding: 12,
    boxSizing: "border-box",
    background:
      "linear-gradient(160deg,#5ececa 0%,#3a9fbf 40%,#1a6080 100%)",
    color: "#fff",
    fontFamily: "-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif",
  },
  topBar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  logoBadge: {
    padding: "8px 16px",
    borderRadius: 12,
    background: "rgba(255,255,255,.15)",
    fontWeight: 700,
  },
  profileBar: {
    padding: "8px 14px",
    background: "rgba(255,255,255,.15)",
    borderRadius: 20,
    border: "none",
    color: "#fff",
    cursor: "pointer",
    fontWeight: 600,
  },
  card: {
    maxWidth: 520,
    margin: "0 auto",
    width: "100%",
    padding: 24,
    borderRadius: 16,
    background: "rgba(255,255,255,.08)",
  },
  title: { margin: "0 0 8px", fontSize: 22 },
  subtitle: {
    margin: "0 0 16px",
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
    lineHeight: 1.5,
  },
  hint: { fontSize: 13, color: "rgba(255,255,255,0.75)", marginBottom: 16 },
  form: { display: "flex", flexDirection: "column", gap: 10 },
  label: { fontSize: 12, fontWeight: 700 },
  input: {
    padding: 12,
    borderRadius: 10,
    border: "none",
    background: "rgba(0,0,0,.2)",
    color: "#fff",
  },
  note: { fontSize: 12, color: "rgba(255,255,255,0.6)", margin: 0 },
  error: {
    fontSize: 13,
    color: "#ffb4b4",
    background: "rgba(255,80,80,0.15)",
    borderRadius: 10,
    padding: "10px 12px",
  },
  success: {
    fontSize: 13,
    color: "#b3f0ff",
    background: "rgba(80,180,255,0.15)",
    borderRadius: 10,
    padding: "10px 12px",
  },
  actions: { display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center", marginTop: 8 },
  primaryBtn: {
    padding: "10px 16px",
    borderRadius: 10,
    border: "none",
    background: "rgba(255,255,255,.25)",
    color: "#fff",
    fontWeight: 700,
    cursor: "pointer",
  },
  secondaryBtn: {
    padding: "10px 16px",
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,.25)",
    background: "transparent",
    color: "#fff",
    cursor: "pointer",
  },
  link: {
    color: "#b3f0ff",
    fontSize: 13,
    textDecoration: "none",
    marginLeft: "auto",
  },
}
