import { authFetch } from "./api"
import { parseJsonResponse, withRetry } from "./http"

export async function createAgent(data) {
  return withRetry(async () => {
    const res = await authFetch("/agents/", {
      method: "POST",
      body: JSON.stringify(data),
    })
    return parseJsonResponse(res)
  })
}

export async function getAgents() {
  return withRetry(async () => {
    const res = await authFetch("/agents/")
    return parseJsonResponse(res)
  })
}

export async function startAgentRun(agentId, message, attachmentPaths = []) {
  return withRetry(async () => {
    const res = await authFetch(`/agents/${agentId}/run/`, {
      method: "POST",
      body: JSON.stringify({
        message: message || "",
        attachment_paths: attachmentPaths,
      }),
    })
    return parseJsonResponse(res)
  }, { retries: 1 })
}

export async function getAgentRun(runId) {
  const res = await authFetch(`/runs/${runId}/`)
  return parseJsonResponse(res)
}
