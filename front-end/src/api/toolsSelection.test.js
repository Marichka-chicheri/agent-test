import { describe, expect, it } from "vitest"
import { agentToolsToSelection, selectionToAgentTools } from "./toolsSelection"

const AVAILABLE = [
  { id: "web_search", label: "Web search" },
  { id: "run_python", label: "Run Python" },
  { id: "read_document", label: "Read document" },
]

describe("agentToolsToSelection", () => {
  it("selects all tools when agent has empty tools list", () => {
    const selected = agentToolsToSelection([], AVAILABLE)
    expect(selected.size).toBe(3)
    expect(selected.has("web_search")).toBe(true)
  })

  it("selects only allowed tools from agent declaration", () => {
    const selected = agentToolsToSelection(["web_search"], AVAILABLE)
    expect(selected.size).toBe(1)
    expect(selected.has("web_search")).toBe(true)
  })
})

describe("selectionToAgentTools", () => {
  it("returns empty array when all tools selected", () => {
    const selected = new Set(AVAILABLE.map((t) => t.id))
    expect(selectionToAgentTools(selected, AVAILABLE)).toEqual([])
  })

  it("returns subset when partially selected", () => {
    const selected = new Set(["web_search", "run_python"])
    expect(selectionToAgentTools(selected, AVAILABLE)).toEqual([
      "web_search",
      "run_python",
    ])
  })
})
