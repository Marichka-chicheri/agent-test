import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { getUserInfo, logout, setUserInfo } from "../api/api"
import { saveApiKeys } from "../api/apiKeys"
import { testGitHubConnection } from "../api/github"
import { AppNav } from "../components/AppNav"
import { ProfileMenu } from "../components/ProfileMenu"
import { useAuth } from "../hooks/useAuth"

const GITHUB_STATUS_LABEL = {
  connected: "Connected",
  invalid: "Invalid token",
  not_configured: "Not configured",
}

function StatusBadge({ status }) {
  const colors = {
    connected: "#6ee7b7",
    invalid: "#fca5a5",
    not_configured: "rgba(255,255,255,0.55)",
  }
  return (
    <span style={{ fontSize: 11, color: colors[status] || colors.not_configured, fontWeight: 600 }}>
      {GITHUB_STATUS_LABEL[status] || status}
    </span>
  )
}

export function ApiKeysSettings() {
  const navigate = useNavigate()
  const { apiKeys, loadApiKeys, updateGeminiKey } = useAuth()

  const stored = getUserInfo()
  const [username, setUsername] = useState(stored.username || "")
  const [email, setEmail] = useState(stored.email || "")
  const [userSaved, setUserSaved] = useState(false)

  const [geminiKey, setGeminiKey] = useState("")
  const [showGeminiKey, setShowGeminiKey] = useState(false)
  const [keyLoading, setKeyLoading] = useState(false)
  const [keySuccess, setKeySuccess] = useState("")
  const [keyError, setKeyError] = useState("")

  const [githubToken, setGithubToken] = useState("")
  const [showGithubToken, setShowGithubToken] = useState(false)
  const [githubLoading, setGithubLoading] = useState(false)
  const [githubTestLoading, setGithubTestLoading] = useState(false)
  const [githubError, setGithubError] = useState("")
  const [githubSuccess, setGithubSuccess] = useState("")

  const [loadingMeta, setLoadingMeta] = useState(true)
  const [loadError, setLoadError] = useState("")

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        setLoadingMeta(true)
        setLoadError("")
        await loadApiKeys()
      } catch (err) {
        if (!cancelled) setLoadError(err.message || "Failed to load settings")
      } finally {
        if (!cancelled) setLoadingMeta(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [loadApiKeys])

  function handleSaveUser() {
    setUserInfo({ username, email })
    setUserSaved(true)
    setTimeout(() => setUserSaved(false), 2000)
  }

  async function handleSaveGeminiKey() {
    if (!geminiKey.trim()) return
    setKeyLoading(true)
    setKeyError("")
    setKeySuccess("")
    try {
      await updateGeminiKey(geminiKey.trim())
      setGeminiKey("")
      setKeySuccess("API key saved!")
    } catch (err) {
      setKeyError(err.message || "Failed to save key")
    } finally {
      setKeyLoading(false)
    }
  }

  async function handleSaveGithubToken() {
    setGithubLoading(true)
    setGithubError("")
    setGithubSuccess("")
    try {
      const meta = await saveApiKeys({ github_token: githubToken.trim() })
      if (meta.github_status === "connected") {
        setGithubSuccess("GitHub token saved and verified.")
      } else if (githubToken.trim()) {
        setGithubSuccess("Token saved. Use Test Connection to verify.")
      } else {
        setGithubSuccess("GitHub token removed.")
      }
      setGithubToken("")
      await loadApiKeys()
    } catch (err) {
      setGithubError(err.message || "Failed to save GitHub token")
    } finally {
      setGithubLoading(false)
    }
  }

  async function handleTestGithub() {
    setGithubTestLoading(true)
    setGithubError("")
    setGithubSuccess("")
    try {
      const result = await testGitHubConnection()
      setGithubSuccess(result.message || "Connection successful.")
      await loadApiKeys()
    } catch (err) {
      setGithubError(err.message || "Connection test failed")
      await loadApiKeys()
    } finally {
      setGithubTestLoading(false)
    }
  }

  function handleLogout() {
    logout()
    navigate("/login", { replace: true })
  }

  if (loadingMeta) {
    return (
      <div style={styles.root}>
        <div style={styles.topBar}>
          <div style={styles.logoBadge}>
            Agentic<span style={{ color: "#b3f0ff" }}>Studio</span>
          </div>
          <AppNav />
        </div>
        <div style={styles.loadingWrap} role="status" aria-live="polite">
          <div style={styles.spinner} />
          <span>Loading settings…</span>
        </div>
      </div>
    )
  }

  return (
    <div style={styles.root}>
      <div style={styles.topBar}>
        <div style={styles.logoBadge}>
          Agentic<span style={{ color: "#b3f0ff" }}>Studio</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <AppNav />
          <ProfileMenu />
        </div>
      </div>

      <div style={styles.scroll}>
        <div style={styles.card}>
          {loadError && <div style={styles.errorMsg}>{loadError}</div>}

          <section aria-labelledby="user-data-heading">
            <h2 id="user-data-heading" style={styles.sectionTitle}>User data</h2>

            <div style={styles.section}>
              <label style={styles.label} htmlFor="settings-username">Username</label>
              <input
                id="settings-username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="your_username"
                style={styles.input}
                autoComplete="username"
              />
            </div>

            <div style={styles.section}>
              <label style={styles.label} htmlFor="settings-email">Email</label>
              <input
                id="settings-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                style={styles.input}
                autoComplete="email"
              />
            </div>

            <button
              type="button"
              onClick={handleSaveUser}
              disabled={!username.trim()}
              style={{
                ...styles.saveBtn,
                opacity: username.trim() ? 1 : 0.5,
                cursor: username.trim() ? "pointer" : "not-allowed",
              }}
            >
              {userSaved ? "Saved ✓" : "Save user data"}
            </button>
          </section>

          <hr style={styles.divider} />

          <section aria-labelledby="api-keys-heading">
            <h2 id="api-keys-heading" style={styles.sectionTitle}>API Keys</h2>

            <div style={styles.section}>
              <label style={styles.label} htmlFor="gemini-key">
                Gemini API Key
                {apiKeys.gemini_configured && (
                  <span style={styles.badgeConfigured}>
                    Configured {apiKeys.gemini_key_hint ? `(${apiKeys.gemini_key_hint})` : ""}
                  </span>
                )}
              </label>
              <div style={styles.inputRow}>
                <input
                  id="gemini-key"
                  type={showGeminiKey ? "text" : "password"}
                  value={geminiKey}
                  onChange={(e) => setGeminiKey(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSaveGeminiKey()}
                  placeholder={apiKeys.gemini_configured ? "Enter new key to replace…" : "AIza…"}
                  style={styles.input}
                  disabled={keyLoading}
                  autoComplete="off"
                />
                <button
                  type="button"
                  style={styles.toggleBtn}
                  onClick={() => setShowGeminiKey((v) => !v)}
                  aria-label={showGeminiKey ? "Hide API key" : "Show API key"}
                >
                  {showGeminiKey ? "Hide" : "Show"}
                </button>
              </div>
              <p style={styles.hint}>
                Get your key at{" "}
                <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer" style={styles.link}>
                  aistudio.google.com
                </a>
              </p>
            </div>

            {keyError && <div style={styles.errorMsg} role="alert">{keyError}</div>}
            {keySuccess && <div style={styles.successMsg} role="status">{keySuccess}</div>}

            <button
              type="button"
              onClick={handleSaveGeminiKey}
              disabled={!geminiKey.trim() || keyLoading}
              style={{
                ...styles.saveBtn,
                opacity: !geminiKey.trim() || keyLoading ? 0.5 : 1,
                cursor: !geminiKey.trim() || keyLoading ? "not-allowed" : "pointer",
              }}
            >
              {keyLoading ? "Saving…" : "Save API key"}
            </button>
          </section>

          <hr style={styles.divider} />

          <section aria-labelledby="github-heading">
            <h2 id="github-heading" style={styles.sectionTitle}>GitHub Integration</h2>

            <div style={styles.section}>
              <label style={styles.label} htmlFor="github-token">
                GitHub Personal Access Token
                <StatusBadge status={apiKeys.github_status || "not_configured"} />
              </label>
              {apiKeys.github_configured && apiKeys.github_key_hint && (
                <p style={styles.hint}>Stored token: {apiKeys.github_key_hint}</p>
              )}
              <div style={styles.inputRow}>
                <input
                  id="github-token"
                  type={showGithubToken ? "text" : "password"}
                  value={githubToken}
                  onChange={(e) => setGithubToken(e.target.value)}
                  placeholder={apiKeys.github_configured ? "Enter new token to replace…" : "ghp_… or github_pat_…"}
                  style={styles.input}
                  disabled={githubLoading}
                  autoComplete="off"
                />
                <button
                  type="button"
                  style={styles.toggleBtn}
                  onClick={() => setShowGithubToken((v) => !v)}
                  aria-label={showGithubToken ? "Hide token" : "Show token"}
                >
                  {showGithubToken ? "Hide" : "Show"}
                </button>
              </div>
              <p style={styles.hint}>
                Token is encrypted at rest and never shown after saving. Create tokens at{" "}
                <a href="https://github.com/settings/tokens" target="_blank" rel="noreferrer" style={styles.link}>
                  github.com/settings/tokens
                </a>
              </p>
            </div>

            {githubError && <div style={styles.errorMsg} role="alert">{githubError}</div>}
            {githubSuccess && <div style={styles.successMsg} role="status">{githubSuccess}</div>}

            <div style={styles.buttonRow}>
              <button
                type="button"
                onClick={handleSaveGithubToken}
                disabled={githubLoading}
                style={styles.saveBtn}
              >
                {githubLoading ? "Saving…" : "Save token"}
              </button>
              <button
                type="button"
                onClick={handleTestGithub}
                disabled={githubTestLoading || !apiKeys.github_configured}
                style={styles.secondaryBtn}
              >
                {githubTestLoading ? "Testing…" : "Test Connection"}
              </button>
            </div>
          </section>

          <hr style={styles.divider} />

          <button type="button" onClick={handleLogout} style={styles.logoutBtn}>
            Log out
          </button>
        </div>
      </div>
    </div>
  )
}

const styles = {
  root: {
    display: "flex",
    flexDirection: "column",
    minHeight: "100vh",
    background: "linear-gradient(160deg, #5ececa 0%, #3a9fbf 40%, #1a6080 100%)",
    color: "#fff",
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    padding: 12,
    gap: 10,
    boxSizing: "border-box",
  },
  topBar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "6px 8px",
    flexShrink: 0,
    flexWrap: "wrap",
    gap: 8,
  },
  logoBadge: {
    fontWeight: 700,
    fontSize: 15,
    color: "#fff",
    background: "rgba(255,255,255,0.15)",
    backdropFilter: "blur(8px)",
    border: "1px solid rgba(255,255,255,0.2)",
    borderRadius: 12,
    padding: "7px 16px",
  },
  loadingWrap: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    fontSize: 14,
    opacity: 0.85,
  },
  spinner: {
    width: 32,
    height: 32,
    border: "3px solid rgba(255,255,255,0.2)",
    borderTopColor: "#fff",
    borderRadius: "50%",
    animation: "settings-spin 0.8s linear infinite",
  },
  scroll: { flex: 1, overflowY: "auto", padding: "0 4px 16px" },
  card: {
    background: "rgba(255,255,255,0.08)",
    backdropFilter: "blur(12px)",
    borderRadius: 16,
    border: "2px solid rgba(80,180,255,0.6)",
    boxShadow: "0 0 30px rgba(80,180,255,0.15), inset 0 1px 0 rgba(255,255,255,0.1)",
    padding: 24,
    maxWidth: 560,
    margin: "0 auto",
    width: "100%",
    boxSizing: "border-box",
  },
  sectionTitle: { fontSize: 18, fontWeight: 700, margin: "0 0 12px" },
  section: { marginBottom: 16 },
  label: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 6,
    fontSize: 11,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.6px",
    marginBottom: 8,
  },
  badgeConfigured: { fontSize: 11, color: "#6ee7b7", fontWeight: 600, textTransform: "none" },
  inputRow: { display: "flex", gap: 8, alignItems: "stretch" },
  input: {
    flex: 1,
    minWidth: 0,
    background: "rgba(0,0,0,0.2)",
    border: "1px solid rgba(255,255,255,0.15)",
    borderRadius: 10,
    padding: "10px 14px",
    color: "#fff",
    fontSize: 14,
    outline: "none",
    boxSizing: "border-box",
  },
  toggleBtn: {
    flexShrink: 0,
    padding: "0 12px",
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.2)",
    background: "rgba(255,255,255,0.1)",
    color: "#fff",
    cursor: "pointer",
    fontSize: 12,
    fontWeight: 600,
  },
  hint: { fontSize: 11, color: "rgba(255,255,255,0.7)", marginTop: 6, lineHeight: 1.5 },
  link: { color: "#b3f0ff" },
  errorMsg: {
    background: "rgba(255,100,100,0.2)",
    border: "1px solid rgba(255,100,100,0.4)",
    borderRadius: 10,
    padding: "10px 14px",
    fontSize: 13,
    color: "#ffaaaa",
    marginBottom: 12,
  },
  successMsg: {
    background: "rgba(100,220,150,0.2)",
    border: "1px solid rgba(100,220,150,0.4)",
    borderRadius: 10,
    padding: "10px 14px",
    fontSize: 13,
    color: "#6ee7b7",
    marginBottom: 12,
  },
  saveBtn: {
    width: "100%",
    marginTop: 4,
    padding: 13,
    borderRadius: 12,
    color: "#fff",
    fontSize: 15,
    fontWeight: 700,
    background: "rgba(255,255,255,0.25)",
    border: "1px solid rgba(255,255,255,0.2)",
    cursor: "pointer",
  },
  secondaryBtn: {
    padding: 13,
    borderRadius: 12,
    color: "#fff",
    fontSize: 14,
    fontWeight: 600,
    background: "rgba(255,255,255,0.1)",
    border: "1px solid rgba(255,255,255,0.2)",
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
  buttonRow: { display: "flex", flexDirection: "column", gap: 10 },
  divider: { border: "none", borderTop: "1px solid rgba(255,255,255,0.2)", margin: "24px 0" },
  logoutBtn: {
    width: "100%",
    padding: 12,
    borderRadius: 12,
    border: "1px solid rgba(255,120,120,0.4)",
    background: "transparent",
    color: "#ffb4b4",
    cursor: "pointer",
    fontWeight: 600,
  },
}
