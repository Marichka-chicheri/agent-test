/**
 * Map agent.tools from API to checkbox selection state.
 * Empty tools on agent means "all tools allowed" on the backend.
 */
export function agentToolsToSelection(agentTools, availableTools) {
  const ids = availableTools.map((t) => t.id)

  if (!Array.isArray(agentTools) || agentTools.length === 0) {
    return new Set(ids)
  }

  const allowed = new Set(
    agentTools.filter((name) => ids.includes(name))
  )

  return allowed.size > 0 ? allowed : new Set(ids)
}

/**
 * Map checkbox state to API payload.
 * All selected (or none) → [] meaning unrestricted on backend.
 */
export function selectionToAgentTools(selectedTools, availableTools) {
  const ids = availableTools.map((t) => t.id)
  if (!ids.length) {
    return []
  }

  if (selectedTools.size === 0 || selectedTools.size === ids.length) {
    return []
  }

  return ids.filter((id) => selectedTools.has(id))
}
