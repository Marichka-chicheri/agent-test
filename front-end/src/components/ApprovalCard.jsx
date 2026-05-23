import { useState } from "react"
import { resolveApproval } from "../api/approvals"

function describeAction(event) {
  const tool = event.tool || "unknown tool"
  let detail = ""
  try {
    const parsed = JSON.parse(event.input || "{}")
    detail = JSON.stringify(parsed, null, 2)
  } catch {
    detail = event.input || ""
  }
  return { tool, detail }
}

export function ApprovalCard({ event, onResolved }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const { tool, detail } = describeAction(event)

  async function submit(decision, alwaysAllow = false) {
    if (!event.approval_id || loading) return
    setLoading(true)
    setError("")
    try {
      await resolveApproval(event.approval_id, decision, { alwaysAllow })
      onResolved?.()
    } catch (err) {
      setError(err.message || "Failed to submit approval")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={styles.card} role="region" aria-label="Approval required">
      <div style={styles.label}>Approval required</div>
      <p style={styles.intro}>Agent wants to:</p>
      <div style={styles.actionBox}>
        <strong style={styles.toolName}>{tool}</strong>
        {detail && <pre style={styles.detail}>{detail}</pre>}
      </div>
      {error && <div style={styles.error}>{error}</div>}
      <div style={styles.actions}>
        <button
          type="button"
          style={styles.approveBtn}
          disabled={loading}
          onClick={() => submit("approve", false)}
        >
          Approve once
        </button>
        <button
          type="button"
          style={styles.alwaysBtn}
          disabled={loading}
          onClick={() => submit("approve", true)}
        >
          Always allow
        </button>
        <button
          type="button"
          style={styles.rejectBtn}
          disabled={loading}
          onClick={() => submit("deny", false)}
        >
          Reject
        </button>
      </div>
    </div>
  )
}

const styles = {
  card: {
    background: "rgba(80,50,0,0.55)",
    border: "1px solid rgba(255,200,80,0.5)",
    borderRadius: 12,
    padding: "14px 16px",
    backdropFilter: "blur(10px)",
  },
  label: {
    fontSize: 11,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.8px",
    color: "#fcd34d",
    marginBottom: 8,
  },
  intro: { margin: "0 0 8px", fontSize: 14, color: "#fff" },
  actionBox: {
    background: "rgba(0,0,0,0.25)",
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  toolName: { fontSize: 14, color: "#fde68a" },
  detail: {
    margin: "8px 0 0",
    fontSize: 12,
    color: "rgba(255,255,255,0.85)",
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
    maxHeight: 120,
    overflow: "auto",
  },
  error: {
    fontSize: 12,
    color: "#ffb4b4",
    marginBottom: 8,
  },
  actions: { display: "flex", flexWrap: "wrap", gap: 8 },
  approveBtn: {
    padding: "8px 12px",
    borderRadius: 8,
    border: "1px solid rgba(110,231,183,0.5)",
    background: "rgba(16,120,80,0.5)",
    color: "#ecfdf5",
    cursor: "pointer",
    fontWeight: 600,
    fontSize: 12,
  },
  alwaysBtn: {
    padding: "8px 12px",
    borderRadius: 8,
    border: "1px solid rgba(255,255,255,0.25)",
    background: "rgba(255,255,255,0.1)",
    color: "#fff",
    cursor: "pointer",
    fontSize: 12,
  },
  rejectBtn: {
    padding: "8px 12px",
    borderRadius: 8,
    border: "1px solid rgba(255,120,120,0.5)",
    background: "rgba(120,30,30,0.45)",
    color: "#fee2e2",
    cursor: "pointer",
    fontSize: 12,
  },
}
