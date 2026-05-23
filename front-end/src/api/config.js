function normalizeApiBaseUrl(raw) {
  const trimmed = (raw || "").trim().replace(/\/+$/, "")
  if (!trimmed) {
    return "https://literal-agentic-studio.onrender.com/api"
  }
  return trimmed.endsWith("/api") ? trimmed : `${trimmed}/api`
}

export const API_URL = normalizeApiBaseUrl(
  import.meta.env.VITE_API_URL ?? "https://literal-agentic-studio.onrender.com/api"
)
