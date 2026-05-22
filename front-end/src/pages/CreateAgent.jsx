import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { createAgent } from "../api/agents"
import { AppNav } from "../components/AppNav"
import { ProfileMenu } from "../components/ProfileMenu"
import { useAuth } from "../hooks/useAuth"

const INITIAL_CONFIG = {
  name: "",
  role: "",
  backstory: "",
  additional_context: "",
  maxSteps: 10,
  forbiddenTopics: "",
}

function validateConfig(config) {
  const errors = {}

  if (!config.name.trim()) {
    errors.name = "Agent name is required"
  } else if (config.name.trim().length < 2) {
    errors.name = "Name must be at least 2 characters"
  }

  if (!config.role.trim()) {
    errors.role = "Role is required"
  }

  if (!config.backstory.trim()) {
    errors.backstory = "Backstory is required"
  } else if (config.backstory.trim().length < 10) {
    errors.backstory = "Backstory must be at least 10 characters"
  }

  return errors
}

const CreateAgent = () => {
  const navigate = useNavigate()
  const { apiKeys } = useAuth()

  const [config, setConfig] = useState(INITIAL_CONFIG)
  const [maxStepsInput, setMaxStepsInput] = useState("10")
  const [loading, setLoading] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({})
  const [submitError, setSubmitError] = useState("")
  const [successMessage, setSuccessMessage] = useState("")

  async function handleSave() {
    setSubmitError("")
    setSuccessMessage("")

    if (!apiKeys.gemini_configured) {
      setSubmitError("Add your Gemini API key in Settings before creating agents.")
      return
    }

    const errors = validateConfig(config)
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) return

    try {
      setLoading(true)

      const payload = {
        name: config.name.trim(),
        role: config.role.trim(),
        backstory: config.backstory.trim(),
        additional_context: config.additional_context.trim(),
        max_iterations: config.maxSteps,
        forbidden_topics: config.forbiddenTopics.trim(),
        tools: [],
      }

      await createAgent(payload)

      setSuccessMessage("Agent saved. Opening Live view…")
      setConfig(INITIAL_CONFIG)
      setMaxStepsInput("10")
      setFieldErrors({})

      setTimeout(() => navigate("/live"), 600)
    } catch (err) {
      setSubmitError(err.message || "Failed to create agent")
    } finally {
      setLoading(false)
    }
  }

  const canSave =
    config.name.trim() &&
    config.role.trim() &&
    config.backstory.trim() &&
    !loading

  return (
    <div style={styles.root}>
      <div style={styles.topBar}>
        <div style={styles.logoBadge}>
          Agentic<span style={{ color: "#b3f0ff" }}>Studio</span>
        </div>
        <AppNav />
        <ProfileMenu />
      </div>

      {!apiKeys.gemini_configured && (
        <div style={styles.warnBanner}>
          Gemini API key required.{" "}
          <span
            style={styles.warnLink}
            onClick={() => navigate("/settings")}
          >
            Open Settings
          </span>
        </div>
      )}

      <div style={styles.scroll}>
        <div style={styles.card}>
          <p style={styles.providerNote}>
            Powered by <strong>Google Gemini</strong> only.
          </p>

          <div style={styles.section}>
            <label style={styles.label}>Name</label>
            <input
              value={config.name}
              onChange={(e) => {
                setConfig({ ...config, name: e.target.value })
                if (fieldErrors.name) {
                  setFieldErrors((prev) => ({ ...prev, name: undefined }))
                }
              }}
              style={{
                ...styles.input,
                border: fieldErrors.name
                  ? "1px solid rgba(255,120,120,0.6)"
                  : "none",
              }}
              disabled={loading}
              placeholder="Research Assistant"
            />
            {fieldErrors.name && (
              <span style={styles.fieldError}>{fieldErrors.name}</span>
            )}
          </div>

          <div style={styles.section}>
            <label style={styles.label}>Role</label>
            <input
              value={config.role}
              onChange={(e) => {
                setConfig({ ...config, role: e.target.value })
                if (fieldErrors.role) {
                  setFieldErrors((prev) => ({ ...prev, role: undefined }))
                }
              }}
              style={{
                ...styles.input,
                border: fieldErrors.role
                  ? "1px solid rgba(255,120,120,0.6)"
                  : "none",
              }}
              disabled={loading}
              placeholder="Senior Software Engineer"
            />
            {fieldErrors.role && (
              <span style={styles.fieldError}>{fieldErrors.role}</span>
            )}
          </div>

          <div style={styles.section}>
            <label style={styles.label}>Backstory</label>
            <textarea
              rows={5}
              value={config.backstory}
              onChange={(e) => {
                setConfig({ ...config, backstory: e.target.value })
                if (fieldErrors.backstory) {
                  setFieldErrors((prev) => ({ ...prev, backstory: undefined }))
                }
              }}
              style={{
                ...styles.textarea,
                border: fieldErrors.backstory
                  ? "1px solid rgba(255,120,120,0.6)"
                  : "none",
              }}
              disabled={loading}
              placeholder="10 years of experience building SaaS products…"
            />
            {fieldErrors.backstory && (
              <span style={styles.fieldError}>{fieldErrors.backstory}</span>
            )}
          </div>

          <div style={styles.section}>
            <label style={styles.label}>Additional context (optional)</label>
            <textarea
              rows={4}
              value={config.additional_context}
              onChange={(e) =>
                setConfig({ ...config, additional_context: e.target.value })
              }
              style={styles.textarea}
              disabled={loading}
              placeholder="Behavioral guidelines, tone, constraints…"
            />
            <span style={styles.hint}>
              Combined with role and backstory to build the Gemini system prompt automatically.
            </span>
          </div>

          <div style={styles.section}>
            <label style={styles.label}>Max iterations</label>
            <input
              type="number"
              min={1}
              max={20}
              value={maxStepsInput}
              style={{ ...styles.input, width: 120 }}
              disabled={loading}
              onChange={(e) => setMaxStepsInput(e.target.value)}
              onBlur={() => {
                const val = Math.min(
                  20,
                  Math.max(1, Number(maxStepsInput) || 1)
                )
                setMaxStepsInput(String(val))
                setConfig({ ...config, maxSteps: val })
              }}
            />
          </div>

          <div style={styles.section}>
            <label style={styles.label}>Forbidden topics (optional)</label>
            <input
              value={config.forbiddenTopics}
              placeholder="politics, violence…"
              style={styles.input}
              disabled={loading}
              onChange={(e) =>
                setConfig({ ...config, forbiddenTopics: e.target.value })
              }
            />
          </div>

          {submitError && <div style={styles.submitError}>{submitError}</div>}
          {successMessage && (
            <div style={styles.successMessage}>{successMessage}</div>
          )}
        </div>
      </div>

      <button
        disabled={!canSave}
        onClick={handleSave}
        style={{
          ...styles.saveBtn,
          opacity: canSave ? 1 : 0.5,
          cursor: loading ? "wait" : "pointer",
        }}
      >
        {loading ? "Saving…" : "Save agent"}
      </button>
    </div>
  )
}

const styles = {
  root: {
    display: "flex",
    flexDirection: "column",
    height: "100vh",
    padding: 12,
    gap: 10,
    boxSizing: "border-box",
    background:
      "linear-gradient(160deg,#5ececa 0%,#3a9fbf 40%,#1a6080 100%)",
    color: "#fff",
    fontFamily: "-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif",
  },
  topBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  logoBadge: {
    padding: "8px 16px",
    borderRadius: 12,
    background: "rgba(255,255,255,.15)",
    fontWeight: 700,
  },
  warnBanner: {
    fontSize: 13,
    padding: "10px 14px",
    borderRadius: 10,
    background: "rgba(255,180,50,0.15)",
    border: "1px solid rgba(255,200,80,0.35)",
  },
  warnLink: {
    textDecoration: "underline",
    cursor: "pointer",
    fontWeight: 700,
  },
  scroll: { flex: 1, overflowY: "auto" },
  card: {
    padding: 16,
    borderRadius: 16,
    background: "rgba(255,255,255,.08)",
  },
  providerNote: {
    fontSize: 13,
    color: "rgba(255,255,255,0.75)",
    marginTop: 0,
    marginBottom: 16,
  },
  section: { marginBottom: 20 },
  label: { display: "block", marginBottom: 8, fontWeight: 700 },
  hint: {
    display: "block",
    marginTop: 6,
    fontSize: 12,
    color: "rgba(255,255,255,0.55)",
  },
  input: {
    width: "100%",
    padding: 12,
    borderRadius: 10,
    border: "none",
    background: "rgba(0,0,0,.2)",
    color: "#fff",
    boxSizing: "border-box",
  },
  textarea: {
    width: "100%",
    padding: 12,
    borderRadius: 10,
    border: "none",
    background: "rgba(0,0,0,.2)",
    color: "#fff",
    boxSizing: "border-box",
    resize: "vertical",
  },
  fieldError: {
    display: "block",
    marginTop: 6,
    fontSize: 12,
    color: "#ffb4b4",
  },
  submitError: {
    fontSize: 13,
    color: "#ffb4b4",
    background: "rgba(255,80,80,0.15)",
    border: "1px solid rgba(255,120,120,0.35)",
    borderRadius: 10,
    padding: "10px 12px",
  },
  successMessage: {
    fontSize: 13,
    color: "#b3f0ff",
    background: "rgba(80,180,255,0.15)",
    border: "1px solid rgba(80,180,255,0.35)",
    borderRadius: 10,
    padding: "10px 12px",
  },
  saveBtn: {
    padding: 16,
    border: "none",
    borderRadius: 12,
    fontWeight: 700,
    color: "#fff",
    background: "rgba(255,255,255,.2)",
  },
}

export default CreateAgent
