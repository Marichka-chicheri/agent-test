import { authFetch } from "./api"
import { parseJsonResponse, withRetry } from "./http"

export async function fetchApiKeys() {
  return withRetry(async () => {
    const res = await authFetch("/api-keys/")
    return parseJsonResponse(res)
  })
}

export async function saveApiKeys({ gemini_api_key }) {
  return withRetry(async () => {
    const res = await authFetch("/api-keys/", {
      method: "PUT",
      body: JSON.stringify({ gemini_api_key }),
    })
    return parseJsonResponse(res)
  })
}
