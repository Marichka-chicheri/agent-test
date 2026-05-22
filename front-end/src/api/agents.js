import { authFetch } from "./api"

export async function createAgent(data) {
  const res = await authFetch("/agents/", {
    method: "POST",
    body: JSON.stringify(data),
  })

  const result = await res.json()

  if (!res.ok) {
    throw new Error(JSON.stringify(result))
  }

  return result
}

export async function getAgents() {
  const res = await authFetch("/agents/")

  const result = await res.json()

  if (!res.ok) {
    throw new Error("Failed to load agents")
  }

  return result
}