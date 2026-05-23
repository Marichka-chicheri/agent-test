import { describe, expect, it, vi } from "vitest"
import { API_PATHS, apiPath } from "./paths"

describe("apiPath", () => {
  it("does not duplicate /api when base already ends with /api", async () => {
    vi.resetModules()
    vi.doMock("./config", () => ({
      API_URL: "https://example.com/api",
    }))
    const { apiPath: path } = await import("./paths")
    expect(path("/tools/")).toBe("/tools/")
    expect(path("/api/tools/")).toBe("/tools/")
  })

  it("API_PATHS.agents returns relative agents path", () => {
    expect(API_PATHS.agents()).toBe("/agents/")
    expect(API_PATHS.tools()).toBe("/tools/")
    expect(API_PATHS.agent(42)).toBe("/agents/42/")
  })
})
