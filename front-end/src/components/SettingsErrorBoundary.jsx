import { Component } from "react"
import { Link } from "react-router-dom"

export class SettingsErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error("Settings page error:", error, info)
  }

  render() {
    if (this.state.error) {
      return (
        <div style={styles.root} role="alert">
          <h1 style={styles.title}>Settings unavailable</h1>
          <p style={styles.message}>
            {this.state.error.message || "Something went wrong loading settings."}
          </p>
          <button
            type="button"
            style={styles.button}
            onClick={() => this.setState({ error: null })}
          >
            Try again
          </button>
          <Link to="/live" style={styles.link}>
            Back to Live
          </Link>
        </div>
      )
    }

    return this.props.children
  }
}

const styles = {
  root: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    padding: 24,
    background: "linear-gradient(160deg, #5ececa 0%, #3a9fbf 40%, #1a6080 100%)",
    color: "#fff",
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    textAlign: "center",
  },
  title: { margin: 0, fontSize: 22 },
  message: { margin: 0, opacity: 0.85, maxWidth: 420 },
  button: {
    padding: "10px 18px",
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.3)",
    background: "rgba(255,255,255,0.2)",
    color: "#fff",
    cursor: "pointer",
    fontWeight: 600,
  },
  link: { color: "#b3f0ff", marginTop: 8 },
}
