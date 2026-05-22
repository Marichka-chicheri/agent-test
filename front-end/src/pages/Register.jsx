import { useState } from "react"
import { Link, Navigate, useNavigate } from "react-router-dom"
import { login, register } from "../api/auth"
import { isAuthenticated } from "../api/api"

export function Register({ mode = "register" }) {
  const navigate = useNavigate()
  const isLogin = mode === "login"

  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  if (isAuthenticated()) {
    return <Navigate to="/live" replace />
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError("")

    if (!username.trim() || !password) {
      setError("Enter username and password")
      return
    }

    if (!isLogin && password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    try {
      setLoading(true)
      if (isLogin) {
        await login({ username: username.trim(), password })
      } else {
        await register({ username: username.trim(), password })
      }
      navigate("/live", { replace: true })
    } catch (err) {
      setError(err.message || "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={styles.root}>
      <div style={styles.header}>
        <div style={styles.logoBadge}>
          Agentic<span style={{ color: "#b3f0ff" }}>Studio</span>
        </div>
      </div>

      <div style={styles.authContainer}>
        <div style={styles.card}>
          <h2 style={styles.title}>
            {isLogin ? "Sign in" : "Create account"}
          </h2>
          <p style={styles.subtitle}>
            {isLogin
              ? "Use your credentials to access the studio"
              : "Register to build and run agents"}
          </p>

          <div style={styles.tabs}>
            <Link
              to="/login"
              style={{
                ...styles.tab,
                ...(isLogin ? styles.tabActive : {}),
              }}
            >
              Sign in
            </Link>
            <Link
              to="/register"
              style={{
                ...styles.tab,
                ...(!isLogin ? styles.tabActive : {}),
              }}
            >
              Register
            </Link>
          </div>

          <form style={styles.form} onSubmit={handleSubmit}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Username</label>
              <input
                type="text"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="your_username"
                style={styles.input}
                disabled={loading}
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Password</label>
              <input
                type="password"
                autoComplete={isLogin ? "current-password" : "new-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={styles.input}
                disabled={loading}
              />
            </div>

            {!isLogin && (
              <div style={styles.inputGroup}>
                <label style={styles.label}>Confirm password</label>
                <input
                  type="password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  style={styles.input}
                  disabled={loading}
                />
              </div>
            )}

            {error && <div style={styles.error}>{error}</div>}

            <button
              type="submit"
              disabled={
                loading || !username.trim() || !password || (!isLogin && !confirmPassword)
              }
              style={{
                ...styles.runBtn,
                background:
                  loading || !username.trim() || !password
                    ? "rgba(255,255,255,0.1)"
                    : "rgba(255,255,255,0.25)",
                marginTop: 4,
                cursor: loading ? "wait" : "pointer",
              }}
            >
              {loading
                ? isLogin
                  ? "Signing in..."
                  : "Creating account..."
                : isLogin
                  ? "Sign in"
                  : "Create account"}
            </button>
          </form>
        </div>

        <p style={styles.footerText}>
          Django API: <code style={styles.code}>localhost:8000</code>
        </p>
      </div>
    </div>
  )
}

const styles = {
  root: {
    minHeight: "100vh",
    justifyContent: "center",
    display: "flex",
    flexDirection: "column",
    background:
      "linear-gradient(160deg, #5ececa 0%, #3a9fbf 40%, #1a6080 100%)",
    color: "#fff",
    fontFamily:
      'Frutiger, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    padding: "40px 16px",
    gap: 40,
    boxSizing: "border-box",
    alignItems: "center",
  },
  header: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "0 4px",
  },
  logoBadge: {
    fontWeight: 700,
    fontSize: 18,
    color: "#fff",
    background: "rgba(255,255,255,0.15)",
    backdropFilter: "blur(8px)",
    border: "1px solid rgba(255,255,255,0.2)",
    borderRadius: 12,
    padding: "10px 24px",
  },
  authContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 20,
    width: "100%",
    maxWidth: 400,
  },
  card: {
    width: "100%",
    padding: "32px",
    display: "flex",
    flexDirection: "column",
    gap: 8,
    background: "rgba(255,255,255,0.08)",
    backdropFilter: "blur(12px)",
    borderRadius: 24,
    border: "2px solid rgba(80,180,255,0.6)",
    boxShadow: "0 0 40px rgba(80,180,255,0.2)",
  },
  title: {
    fontSize: 24,
    fontWeight: 700,
    margin: 0,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.7)",
    textAlign: "center",
    marginBottom: 12,
  },
  tabs: {
    display: "flex",
    gap: 8,
    marginBottom: 8,
    background: "rgba(0,0,0,0.15)",
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    textAlign: "center",
    padding: "10px 12px",
    borderRadius: 10,
    fontSize: 13,
    fontWeight: 600,
    color: "rgba(255,255,255,0.7)",
    textDecoration: "none",
  },
  tabActive: {
    background: "rgba(255,255,255,0.2)",
    color: "#fff",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },
  inputGroup: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: 600,
    color: "rgba(255,255,255,0.9)",
    marginLeft: 4,
  },
  input: {
    background: "rgba(255,255,255,0.1)",
    border: "1px solid rgba(255,255,255,0.15)",
    borderRadius: 12,
    padding: "12px 16px",
    color: "#fff",
    fontSize: 14,
    outline: "none",
  },
  error: {
    fontSize: 13,
    color: "#ffb4b4",
    background: "rgba(255,80,80,0.15)",
    border: "1px solid rgba(255,120,120,0.35)",
    borderRadius: 10,
    padding: "10px 12px",
  },
  runBtn: {
    padding: "14px",
    border: "1px solid rgba(255,255,255,0.2)",
    borderRadius: 12,
    color: "#fff",
    fontSize: 15,
    fontWeight: 700,
    transition: "all 0.2s",
  },
  footerText: {
    fontSize: 13,
    color: "rgba(255,255,255,0.8)",
  },
  code: {
    fontSize: 12,
    background: "rgba(0,0,0,0.2)",
    padding: "2px 6px",
    borderRadius: 6,
  },
}
