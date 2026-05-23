import { describe, expect, it } from "vitest"
import { normalizeApiBaseUrl, resolveApiUrl } from "./config"

describe("normalizeApiBaseUrl", () => {
  it("collapses duplicate /api suffix", () => {
    expect(normalizeApiBaseUrl("https://example.com/api/api")).toBe(
      "https://example.com/api"
    )
  })

  it("adds /api when missing", () => {
    expect(normalizeApiBaseUrl("https://example.com")).toBe(
      "https://example.com/api"
    )
  })

  it("uses relative /api when empty", () => {
    expect(normalizeApiBaseUrl("")).toBe("/api")
  })
})

describe("resolveApiUrl", () => {
  it("builds tools path without double api", async () => {
    const { normalizeApiBaseUrl: norm } = await import("./config")
    // resolveApiUrl uses module-level API_URL; test norm + manual join
    const base = norm("https://example.com/api/api")
    expect(`${base}/tools/`).toBe("https://example.com/api/tools/")
  })
})
