import { API_URL } from "./config"

export { API_URL }

export function setTokens(data) {
  localStorage.setItem("access", data.access)
  localStorage.setItem("refresh", data.refresh)
}

export function getAccessToken() {
  return localStorage.getItem("access")
}

export function isAuthenticated() {
  return Boolean(getAccessToken())
}

export function logout() {
  localStorage.removeItem("access")
  localStorage.removeItem("refresh")
}

export async function authFetch(url, options = {}) {
  const token = getAccessToken()

  return fetch(`${API_URL}${url}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  })
}
