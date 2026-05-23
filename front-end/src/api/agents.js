import { authFetch } from "./api"
import { API_PATHS } from "./paths"
import { parseJsonResponse, withRetry } from "./http"

export { fetchAvailableTools } from "./tools"

export async function createAgent(data) {
  const path = API_PATHS.agents()
  console.debug("[agents] POST", path, { tools: data?.tools })

  return withRetry(async () => {
    const res = await authFetch(path, {
      method: "POST",
      body: JSON.stringify(data),
    })
    return parseJsonResponse(res)
  })
}

export async function getAgent(agentId) {
  const path = API_PATHS.agent(agentId)
  console.debug("[agents] GET", path)

  return withRetry(async () => {
    const res = await authFetch(path)
    return parseJsonResponse(res)
  })
}

export async function updateAgent(agentId, data) {
  const path = API_PATHS.agent(agentId)
  console.debug("[agents] PATCH", path, { tools: data?.tools })

  return withRetry(async () => {
    const res = await authFetch(path, {
      method: "PATCH",
      body: JSON.stringify(data),
    })
    return parseJsonResponse(res)
  })
}

export async function getAgents() {
  return withRetry(async () => {
    const res = await authFetch(API_PATHS.agents())
    return parseJsonResponse(res)
  })
}

export async function startAgentRun(agentId, message, attachmentPaths = []) {
  return withRetry(async () => {
    const res = await authFetch(API_PATHS.agentRun(agentId), {
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
  const res = await authFetch(API_PATHS.run(runId))
  return parseJsonResponse(res)
}

// Backwards-compatible alias used by Constructor
export { fetchAvailableTools as getAvailableTools } from "./tools"
