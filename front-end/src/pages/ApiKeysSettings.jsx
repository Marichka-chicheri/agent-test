import { useCallback, useEffect, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { logout } from "../api/api"
import {
  createRestApiKey,
  fetchRestApiKeys,
  revokeRestApiKey,
} from "../api/restApiKeys"
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
  const [restKeys, setRestKeys] = useState([])
  const [restKeyName, setRestKeyName] = useState("")
  const [restLoading, setRestLoading] = useState(false)
  const [restError, setRestError] = useState("")
  const [createdRestKey, setCreatedRestKey] = useState(null)

  const loadRestKeys = useCallback(async () => {
    const data = await fetchRestApiKeys()
    setRestKeys(Array.isArray(data) ? data : [])
  }, [])

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

    async function loadRest() {
      try {
        await loadRestKeys()
      } catch (err) {
        if (!cancelled) setRestError(err.message || "Failed to load REST API keys")
      }
    }

    load()
    loadRest()
    return () => { cancelled = true }
  }, [loadApiKeys, loadRestKeys])

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

  async function handleCreateRestKey(e) {
    e.preventDefault()
    setRestError("")
    setCreatedRestKey(null)

    const name = restKeyName.trim()
    if (!name) {
      setRestError("Enter a name for the API key.")
      return
    }

    try {
      setRestLoading(true)
      const created = await createRestApiKey(name)
      setCreatedRestKey(created)
      setRestKeyName("")
      await loadRestKeys()
    } catch (err) {
      setRestError(err.message || "Failed to create REST API key")
    } finally {
      setRestLoading(false)
    }
  }

  async function handleRevokeRestKey(keyId) {
    setRestError("")
    try {
      setRestLoading(true)
      await revokeRestApiKey(keyId)
      if (createdRestKey?.id === keyId) setCreatedRestKey(null)
      await loadRestKeys()
    } catch (err) {
      setRestError(err.message || "Failed to revoke API key")
    } finally {
      setRestLoading(false)
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

        <hr style={styles.divider} />

        <h3 style={styles.sectionTitle}>REST API keys</h3>
        <p style={styles.subtitle}>
          Use these to call the API from scripts or CI without a browser session.
          Send <code style={styles.code}>Authorization: Api-Key &lt;key&gt;</code> or{" "}
          <code style={styles.code}>X-API-Key: &lt;key&gt;</code>.
        </p>

        {createdRestKey?.key && (
          <div style={styles.keyReveal}>
            <strong>Copy this key now — it will not be shown again.</strong>
            <code style={styles.keyValue}>{createdRestKey.key}</code>
          </div>
        )}

        {restKeys.length > 0 ? (
          <ul style={styles.keyList}>
            {restKeys.map((item) => (
              <li key={item.id} style={styles.keyItem}>
                <div>
                  <strong>{item.name}</strong>
                  <span style={styles.keyMeta}>
                    {" "}
                    · {item.prefix}… · {new Date(item.created_at).toLocaleDateString()}
                  </span>
                </div>
                <button
                  type="button"
                  disabled={restLoading}
                  onClick={() => handleRevokeRestKey(item.id)}
                  style={styles.revokeBtn}
                >
                  Revoke
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p style={styles.hint}>No REST API keys yet.</p>
        )}

        <form onSubmit={handleCreateRestKey} style={styles.form}>
          <label style={styles.label}>New key name</label>
          <input
            type="text"
            value={restKeyName}
            onChange={(e) => setRestKeyName(e.target.value)}
            placeholder="e.g. CI pipeline"
            style={styles.input}
            disabled={restLoading || loadingMeta}
          />
          {restError && <div style={styles.error}>{restError}</div>}
          <button
            type="submit"
            disabled={restLoading || loadingMeta || !restKeyName.trim()}
            style={styles.primaryBtn}
          >
            {restLoading ? "Working…" : "Create REST API key"}
          </button>
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
  divider: {
    border: "none",
    borderTop: "1px solid rgba(255,255,255,.2)",
    margin: "28px 0",
  },
  sectionTitle: { margin: "0 0 8px", fontSize: 18 },
  code: {
    fontFamily: "ui-monospace, monospace",
    fontSize: 12,
    background: "rgba(0,0,0,.2)",
    padding: "2px 6px",
    borderRadius: 4,
  },
  keyReveal: {
    marginBottom: 16,
    padding: 12,
    borderRadius: 10,
    background: "rgba(0,0,0,.25)",
    fontSize: 13,
    lineHeight: 1.5,
  },
  keyValue: {
    display: "block",
    marginTop: 8,
    wordBreak: "break-all",
    fontFamily: "ui-monospace, monospace",
    fontSize: 12,
  },
  keyList: {
    listStyle: "none",
    margin: "0 0 16px",
    padding: 0,
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  keyItem: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    padding: "10px 12px",
    borderRadius: 10,
    background: "rgba(0,0,0,.15)",
    fontSize: 13,
  },
  keyMeta: { color: "rgba(255,255,255,0.65)", fontWeight: 400 },
  revokeBtn: {
    padding: "6px 10px",
    borderRadius: 8,
    border: "1px solid rgba(255,100,100,.4)",
    background: "transparent",
    color: "#ffb4b4",
    cursor: "pointer",
    flexShrink: 0,
  },
}
