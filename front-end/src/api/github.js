import { authFetch } from "./api"
import { parseJsonResponse, withRetry } from "./http"

export async function testGitHubConnection() {
  return withRetry(async () => {
    const res = await authFetch("/api-keys/github/test/", { method: "POST" })
    return parseJsonResponse(res)
  }, { retries: 0 })
}
