import { authFetch } from "./api"
import { API_PATHS } from "./paths"
import { parseJsonResponse, withRetry } from "./http"

/**
 * Normalize a tool entry from the API or declaration catalog.
 * Backend may send `name`; UI uses `id` consistently.
 */
export function normalizeToolEntry(raw) {
  if (!raw || typeof raw !== "object") {
    return null
  }

  const id = String(raw.id ?? raw.name ?? "").trim()
  if (!id) {
    return null
  }

  const label = String(raw.label ?? id).trim() || id
  const desc = String(
    raw.desc ?? raw.description ?? raw.summary ?? ""
  ).trim()

  return { id, name: id, label, desc }
}

export function normalizeToolCatalog(payload) {
  const list = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.tools)
      ? payload.tools
      : []

  return list.map(normalizeToolEntry).filter(Boolean)
}

export async function fetchAvailableTools() {
  const path = API_PATHS.tools()
  console.debug("[tools] GET", path)

  return withRetry(async () => {
    const res = await authFetch(path)
    const data = await parseJsonResponse(res)
    const tools = normalizeToolCatalog(data)

    if (!tools.length) {
      console.warn("[tools] Catalog empty or unrecognized shape", data)
    }

    return tools
  })
}
