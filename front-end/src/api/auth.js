import { API_URL } from "./config"
import { applyAuthPayload } from "./api"
import { formatApiError } from "./errors"

export { formatApiError }

async function parseAuthResponse(res) {
  const data = await res.json()
  if (!res.ok) {
    throw new Error(formatApiError(data))
  }
  applyAuthPayload(data)
  return data
}

export async function login({ username, password }) {
  const res = await fetch(`${API_URL}/login/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  })
  return parseAuthResponse(res)
}

export async function register({ username, password }) {
  const res = await fetch(`${API_URL}/register/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  })
  return parseAuthResponse(res)
}
