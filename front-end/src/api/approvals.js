import { authFetch } from "./api"
import { parseJsonResponse } from "./http"

export async function resolveApproval(approvalId, decision, { alwaysAllow = false } = {}) {
  const res = await authFetch(`/approvals/${approvalId}/`, {
    method: "POST",
    body: JSON.stringify({
      decision,
      always_allow: alwaysAllow,
    }),
  })
  return parseJsonResponse(res)
}
