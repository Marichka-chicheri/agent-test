import { describe, expect, it } from "vitest"
import { normalizeToolCatalog, normalizeToolEntry } from "./tools"

describe("normalizeToolEntry", () => {
  it("maps backend name field to id", () => {
    const tool = normalizeToolEntry({
      name: "web_search",
      label: "Web search",
      description: "Search the web",
    })
    expect(tool.id).toBe("web_search")
    expect(tool.label).toBe("Web search")
    expect(tool.desc).toBe("Search the web")
  })

  it("returns null for invalid entries", () => {
    expect(normalizeToolEntry(null)).toBeNull()
    expect(normalizeToolEntry({})).toBeNull()
  })
})

describe("normalizeToolCatalog", () => {
  it("accepts wrapped tools array from API", () => {
    const tools = normalizeToolCatalog({
      tools: [{ id: "run_python", label: "Run Python", description: "Exec" }],
    })
    expect(tools).toHaveLength(1)
    expect(tools[0].id).toBe("run_python")
  })

  it("accepts bare array responses", () => {
    const tools = normalizeToolCatalog([
      { name: "http_request", label: "HTTP" },
    ])
    expect(tools[0].id).toBe("http_request")
  })
})
