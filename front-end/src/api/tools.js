import { authFetch } from "./api"
import { resolveApiUrl } from "./config"
import { API_PATHS } from "./paths"
import { FALLBACK_TOOL_CATALOG } from "./toolCatalogFallback"
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

function isToolsNotFoundError(err) {
  const message = err?.message || ""
  return (
    message.includes("404") ||
    message.includes("not found") ||
    message.includes("<!doctype") ||
    message.includes("API route not found")
  )
}

export async function fetchAvailableTools() {
  const path = API_PATHS.tools()
  const url = resolveApiUrl(path)
  console.debug("[tools] GET", url)

  try {
    return await withRetry(async () => {
      const res = await authFetch(path)
      const data = await parseJsonResponse(res)
      const tools = normalizeToolCatalog(data)

      if (!tools.length) {
        console.warn("[tools] Catalog empty or unrecognized shape", data)
        return { tools: FALLBACK_TOOL_CATALOG, fromFallback: true }
      }

      return { tools, fromFallback: false }
    }, { retries: 1 })
  } catch (err) {
    console.error("[tools] Catalog request failed", url, err)
    if (isToolsNotFoundError(err)) {
      console.warn("[tools] Using built-in catalog fallback — deploy backend with GET /api/tools/")
      return { tools: FALLBACK_TOOL_CATALOG, fromFallback: true }
    }
    throw err
  }
}
