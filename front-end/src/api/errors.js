export function formatApiError(data) {
  if (!data || typeof data !== "object") return "Request failed"
  if (typeof data === "string") return data
  if (data.error) return data.error
  if (data.detail) return String(data.detail)

  const parts = Object.entries(data).map(([key, value]) => {
    const msg = Array.isArray(value) ? value.join(", ") : String(value)
    return `${key}: ${msg}`
  })
  return parts.join("; ") || "Request failed"
}
