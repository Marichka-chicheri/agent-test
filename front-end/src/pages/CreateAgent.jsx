import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { createAgent, getAvailableTools } from "../api/agents"
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
  const [availableTools, setAvailableTools] = useState([])
  const [toolsLoading, setToolsLoading] = useState(true)
  const [toolsError, setToolsError] = useState("")
  const [selectedTools, setSelectedTools] = useState(new Set())
  const [loading, setLoading] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({})
  const [submitError, setSubmitError] = useState("")
  const [successMessage, setSuccessMessage] = useState("")

  useEffect(() => {
    let cancelled = false
    getAvailableTools()
      .then((tools) => {
        if (!cancelled) {
          setAvailableTools(Array.isArray(tools) ? tools : [])
          setToolsError("")
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setToolsError(err.message || "Failed to load tools")
        }
      })
      .finally(() => {
        if (!cancelled) setToolsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const allSelected =
    availableTools.length > 0 &&
    selectedTools.size === availableTools.length
  const noneSelected = selectedTools.size === 0

  function toggleTool(id) {
    setSelectedTools(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function toggleAll() {
    if (allSelected) {
      setSelectedTools(new Set())
    } else {
      setSelectedTools(new Set(availableTools.map(t => t.id)))
    }
  }

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
        // empty array means "use all tools" on the backend
        tools: noneSelected ? [] : Array.from(selectedTools),
      }

      await createAgent(payload)

      setSuccessMessage("Agent saved. Opening Live view…")
      setConfig(INITIAL_CONFIG)
      setMaxStepsInput("10")
      setSelectedTools(new Set())
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <AppNav />
          <ProfileMenu />
        </div>
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

          <div style={styles.section}>
            <div style={styles.toolsHeader}>
              <label style={styles.label}>Tools</label>
              <button
                type="button"
                onClick={toggleAll}
                disabled={loading}
                style={styles.selectAllBtn}
              >
                {allSelected ? "Deselect all" : "Select all"}
              </button>
            </div>

            {toolsError && (
              <div style={styles.submitError}>{toolsError}</div>
            )}
            {toolsLoading && (
              <span style={styles.hint}>Loading tools…</span>
            )}

            <div style={styles.toolsGrid}>
              {availableTools.map(tool => {
                const checked = selectedTools.has(tool.id)
                return (
                  <div
                    key={tool.id}
                    onClick={() => !loading && toggleTool(tool.id)}
                    style={{
                      ...styles.toolCard,
                      background: checked
                        ? "rgba(80,200,180,0.18)"
                        : "rgba(0,0,0,0.18)",
                      border: checked
                        ? "1px solid rgba(110,231,183,0.55)"
                        : "1px solid rgba(255,255,255,0.1)",
                      cursor: loading ? "not-allowed" : "pointer",
                      opacity: loading ? 0.6 : 1,
                    }}
                  >
                    <div style={styles.toolCheckRow}>
                      <span style={styles.toolLabel}>{tool.label}</span>
                      <span style={{
                        ...styles.toolCheckbox,
                        background: checked ? "#6ee7b7" : "rgba(255,255,255,0.1)",
                        border: checked ? "1px solid #6ee7b7" : "1px solid rgba(255,255,255,0.25)",
                      }}>
                        {checked && <span style={styles.checkmark}>✓</span>}
                      </span>
                    </div>
                    <div style={styles.toolDesc}>{tool.desc}</div>
                  </div>
                )
              })}
            </div>

            {noneSelected && (
              <span style={styles.hint}>No tools selected — all tools will be available to the agent.</span>
            )}
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
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '6px 8px', flexShrink: 0,
  },
  logoBadge: {
    fontWeight: 700, fontSize: 15, color: '#fff',
    background: 'rgba(255,255,255,0.15)',
    backdropFilter: 'blur(8px)',
    border: '1px solid rgba(255,255,255,0.2)',
    borderRadius: 12, padding: '7px 16px',
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
  toolsHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  selectAllBtn: {
    padding: "4px 12px",
    borderRadius: 8,
    border: "1px solid rgba(255,255,255,0.2)",
    background: "rgba(255,255,255,0.1)",
    color: "#fff",
    fontSize: 11,
    fontWeight: 600,
    cursor: "pointer",
  },
  toolsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 8,
  },
  toolCard: {
    borderRadius: 10,
    padding: "10px 10px",
    transition: "background 0.15s, border 0.15s",
    userSelect: "none",
  },
  toolCheckRow: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },

  toolLabel: {
    fontSize: 12,
    fontWeight: 700,
    color: "#fff",
    flex: 1,
  },
  toolCheckbox: {
    width: 16,
    height: 16,
    borderRadius: 4,
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "background 0.15s, border 0.15s",
  },
  checkmark: {
    fontSize: 10,
    color: "#065f46",
    fontWeight: 700,
    lineHeight: 1,
  },
  toolDesc: {
    fontSize: 10,
    color: "rgba(255,255,255,0.5)",
    lineHeight: 1.4,
  },
}

export default CreateAgent
