import { API_URL } from "./config"

/**
 * Build a path under the API base without duplicating `/api`.
 * authFetch prepends API_URL; segments must be relative (e.g. `/tools/`).
 */
export function apiPath(segment) {
  const base = (API_URL || "").replace(/\/+$/, "")
  let path = segment.startsWith("/") ? segment : `/${segment}`

  if (base.endsWith("/api") && path.startsWith("/api/")) {
    path = path.slice(4)
  }

  return path
}

export const API_PATHS = {
  tools: () => apiPath("/tools/"),
  agents: () => apiPath("/agents/"),
  agent: (agentId) => apiPath(`/agents/${agentId}/`),
  agentRun: (agentId) => apiPath(`/agents/${agentId}/run/`),
  run: (runId) => apiPath(`/runs/${runId}/`),
}
