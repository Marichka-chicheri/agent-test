import { setTokens } from "./api"
import { API_URL } from "./config"

export function formatApiError(data) {
  if (!data || typeof data !== "object") return "Request failed"
  if (data.error) return data.error
  const parts = Object.entries(data).map(([key, value]) => {
    const msg = Array.isArray(value) ? value.join(", ") : String(value)
    return `${key}: ${msg}`
  })
  return parts.join("; ") || "Request failed"
}

export async function login({ username, password }) {
  const res = await fetch(`${API_URL}/login/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  })

  const data = await res.json()

  if (!res.ok) {
    throw new Error(formatApiError(data))
  }

  setTokens(data)
  return data
}

export async function register({ username, password }) {
  const res = await fetch(`${API_URL}/register/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  })

  const data = await res.json()

  if (!res.ok) {
    throw new Error(formatApiError(data))
  }

  setTokens(data)
  return data
}
