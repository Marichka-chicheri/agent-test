import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { logout } from "../api/api"
import { useAuth } from "../hooks/useAuth"

export function ProfileMenu() {
  const navigate = useNavigate()
  const { apiKeys } = useAuth()
  const [open, setOpen] = useState(false)

  function handleLogout() {
    logout()
    navigate("/login", { replace: true })
  }

  return (
    <div style={{ position: "relative" }}>
      <div style={styles.profileBar} onClick={() => setOpen(!open)}>
        Profile
      </div>

      {open && (
        <div style={styles.popup}>
          <div style={styles.meta}>
            Gemini:{" "}
            {apiKeys.gemini_configured
              ? `✓ ${apiKeys.gemini_key_hint || "set"}`
              : "not set"}
          </div>
          <Link to="/settings" style={styles.popupLink} onClick={() => setOpen(false)}>
            API Keys
          </Link>
          <div style={styles.popupItem} onClick={handleLogout}>
            Logout
          </div>
        </div>
      )}
    </div>
  )
}

const styles = {
  profileBar: {
    background: "rgba(255,255,255,0.15)",
    backdropFilter: "blur(8px)",
    border: "1px solid rgba(255,255,255,0.2)",
    borderRadius: 20,
    padding: "6px 14px",
    fontSize: 12,
    fontWeight: 700,
    color: "#fff",
    cursor: "pointer",
    userSelect: "none",
  },
  popup: {
    position: "absolute",
    top: "calc(100% + 10px)",
    right: 0,
    background: "rgba(25, 45, 60, 0.9)",
    backdropFilter: "blur(12px)",
    border: "1px solid rgba(255,255,255,0.2)",
    borderRadius: 12,
    padding: 8,
    minWidth: 160,
    zIndex: 1000,
    boxShadow: "0 10px 25px rgba(0,0,0,0.3)",
    display: "flex",
    flexDirection: "column",
    gap: 4,
  },
  meta: {
    fontSize: 11,
    color: "rgba(255,255,255,0.7)",
    padding: "6px 10px",
  },
  popupLink: {
    padding: "8px 12px",
    borderRadius: 8,
    fontSize: 12,
    fontWeight: 600,
    color: "#b3f0ff",
    textDecoration: "none",
  },
  popupItem: {
    padding: "8px 12px",
    borderRadius: 8,
    fontSize: 12,
    fontWeight: 600,
    color: "#ff8080",
    cursor: "pointer",
  },
}
