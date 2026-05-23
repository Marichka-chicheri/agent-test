import { formatApiError } from "./errors"

export async function parseJsonResponse(res) {
  const contentType = res.headers.get("content-type") || ""
  const isJson = contentType.includes("application/json")

  let data = null
  if (isJson) {
    data = await res.json().catch(() => null)
  } else {
    const text = await res.text().catch(() => "")
    if (text.includes("no such table") || text.includes("OperationalError")) {
      throw new Error(
        "Database schema is outdated. Run: python manage.py migrate"
      )
    }
    if (!res.ok) {
      throw new Error(
        text.includes("<!DOCTYPE html>")
          ? `Server error (${res.status}). Check Django logs.`
          : text.slice(0, 300) || `Request failed (${res.status})`
      )
    }
    return null
  }

  if (!res.ok) {
    throw new Error(formatApiError(data) || `Request failed (${res.status})`)
  }

  return data
}

export async function withRetry(fn, { retries = 2, delayMs = 600 } = {}) {
  let lastError

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await fn()
    } catch (err) {
      lastError = err
      if (attempt < retries) {
        await new Promise((resolve) => setTimeout(resolve, delayMs))
      }
    }
  }

  throw lastError
}
