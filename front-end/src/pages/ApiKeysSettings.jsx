import { useCallback, useEffect, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { logout } from "../api/api"
// import {
//   createRestApiKey,
//   fetchRestApiKeys,
//   revokeRestApiKey,
// } from "../api/restApiKeys"
import { AppNav } from "../components/AppNav"
import { useAuth } from "../hooks/useAuth"
import { ProfileMenu } from "../components/ProfileMenu"

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

  // User info (stored locally)
  const stored = getUserInfo()
  const [username, setUsername] = useState(stored.username || "")
  const [email, setEmail] = useState(stored.email || "")
  const [userSaved, setUserSaved] = useState(false)

  function handleSaveUser() {
    setUserInfo({ username, email })
    setUserSaved(true)
    setTimeout(() => setUserSaved(false), 2000)
  }

  //Gemini API key
  const [keyLoading, setKeyLoading] = useState(false)
  const [keySuccess, setKeySuccess] = useState("")
  const [keyError, setKeyError] = useState("")

  async function handleSaveKey() {
    if (!geminiKey.trim()) return
    setKeyLoading(true)
    setKeyError("")
    setKeySuccess("")
    try {
      const res = await authFetch("/api-keys/", {
        method: "PUT",
        body: JSON.stringify({ gemini_api_key: geminiKey.trim() }),
      })
      const data = await parseJsonResponse(res)
      updateApiKeys(data)
      setGeminiKey("")
      setKeySuccess("API key saved!")
    } catch (err) {
      setKeyError(err.message || "Failed to save key")
    } finally {
      setKeyLoading(false)
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <AppNav />
          <ProfileMenu />
        </div>
      </div>

      <div style={styles.scroll}>
        <div style={styles.card}>

          <div style={styles.sectionTitle}>User data</div>

          <div style={styles.section}>
            <label style={styles.label}>Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="your_username"
              style={styles.input}
            />
          </div>

          <div style={styles.section}>
            <label style={styles.label}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              style={styles.input}
            />
          </div>

          <button
            onClick={handleSaveUser}
            disabled={!username.trim()}
            style={{
              ...styles.saveBtn,
              background: username.trim() ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.08)",
              cursor: username.trim() ? "pointer" : "not-allowed",
              marginBottom: 24,
            }}
          >
            {userSaved ? "Saved ✓" : "Save user data"}
          </button>

          <div style={styles.sectionTitle}>API Keys</div>

          <div style={styles.section}>
            <label style={styles.label}>
              Gemini API Key
              {apiKeys.gemini_configured && (
                <span style={styles.badge}>
                  ● Configured {apiKeys.gemini_key_hint ? `(${apiKeys.gemini_key_hint})` : ""}
                </span>
              )}
            </label>
            <input
              type="password"
              value={geminiKey}
              onChange={(e) => setGeminiKey(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSaveKey()}
              placeholder="AIza..."
              style={styles.input}
              disabled={keyLoading}
            />
            <div style={styles.hint}>
              Get your key at{" "}
              <a
                href="https://aistudio.google.com/apikey"
                target="_blank"
                rel="noreferrer"
                style={{ color: "#b3f0ff" }}
              >
                aistudio.google.com
              </a>
            </div>
          </div>

          {keyError && <div style={styles.errorMsg}>{keyError}</div>}
          {keySuccess && <div style={styles.successMsg}>{keySuccess}</div>}

          <button
            onClick={handleSaveKey}
            disabled={!geminiKey.trim() || keyLoading}
            style={{
              ...styles.saveBtn,
              background: !geminiKey.trim() || keyLoading
                ? "rgba(255,255,255,0.08)"
                : "rgba(255,255,255,0.25)",
              cursor: !geminiKey.trim() || keyLoading ? "not-allowed" : "pointer",
            }}
          >
            {keyLoading ? "Saving..." : "Save API key"}
          </button>

        </div>
      </div>
    </div>
  )
}

const styles = {
  root: {
    display: "flex", flexDirection: "column", height: "100vh",
    background: "linear-gradient(160deg, #5ececa 0%, #3a9fbf 40%, #1a6080 100%)",
    color: "#fff",
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    padding: 12, gap: 10, boxSizing: "border-box",
  },
  topBar: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "6px 8px", flexShrink: 0,
  },
  logoBadge: {
    fontWeight: 700, fontSize: 15, color: "#fff",
    background: "rgba(255,255,255,0.15)",
    backdropFilter: "blur(8px)",
    border: "1px solid rgba(255,255,255,0.2)",
    borderRadius: 12, padding: "7px 16px",
  },
  scroll: { flex: 1, overflowY: "auto" },
  card: {
    background: "rgba(255,255,255,0.08)",
    backdropFilter: "blur(12px)",
    borderRadius: 16,
    border: "2px solid rgba(80,180,255,0.6)",
    boxShadow: "0 0 30px rgba(80,180,255,0.15), inset 0 1px 0 rgba(255,255,255,0.1)",
    padding: 24,
    display: "flex", flexDirection: "column", gap: 4,
    maxWidth: 560, margin: "0 auto",
  },
  sectionTitle: {
    fontSize: 16, fontWeight: 700, marginBottom: 4, marginTop: 8,
    color: "#fff",
  },
  section: {
    padding: "12px 0",
    borderBottom: "1px solid rgba(255,255,255,0.07)",
  },
  label: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    fontSize: 11, fontWeight: 700, textTransform: "uppercase",
    letterSpacing: "0.6px", color: "#fff", marginBottom: 10,
  },
  badge: { fontSize: 11, color: "#6ee7b7", fontWeight: 600, textTransform: "none" },
  input: {
    width: "100%", background: "rgba(0,0,0,0.2)",
    border: "1px solid rgba(255,255,255,0.15)",
    borderRadius: 10, padding: "10px 14px",
    color: "#fff", fontSize: 14, outline: "none",
    boxSizing: "border-box",
  },
  hint: { fontSize: 11, color: "rgba(255,255,255,0.7)", marginTop: 6 },
  errorMsg: {
    background: "rgba(255,100,100,0.2)", border: "1px solid rgba(255,100,100,0.4)",
    borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "#ffaaaa", marginTop: 8,
  },
  successMsg: {
    background: "rgba(100,220,150,0.2)", border: "1px solid rgba(100,220,150,0.4)",
    borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "#6ee7b7", marginTop: 8,
  },
  saveBtn: {
    marginTop: 12, padding: 13, borderRadius: 12, color: "#fff",
    fontSize: 15, fontWeight: 700, backdropFilter: "blur(8px)",
    border: "1px solid rgba(255,255,255,0.2)",
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
