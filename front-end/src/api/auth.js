import { API_URL } from "./config"
import { applyAuthPayload, setUserInfo } from "./api"
import { formatApiError } from "./errors"

export { formatApiError }

async function parseAuthResponse(res) {
  const isJson = (res.headers.get("content-type") || "").includes("application/json")

  if (!isJson) {
    const text = await res.text().catch(() => "")
    throw new Error(
      text.includes("<!DOCTYPE")
        ? `Server error ${res.status} — check Django terminal for details`
        : text.slice(0, 200) || `Request failed (${res.status})`
    )
  }

  const data = await res.json()
  if (!res.ok) throw new Error(formatApiError(data))
  applyAuthPayload(data)
  return data
}

export async function login({ username, password }) {
  const res = await fetch(`${API_URL}/login/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  })
  const data = await parseAuthResponse(res)
  setUserInfo({ username })
  return data
}

export async function register({ username, password, email = "" }) {
  const res = await fetch(`${API_URL}/register/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  })
  const data = await parseAuthResponse(res)
  setUserInfo({ username, email })
  return data
}
