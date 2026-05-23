import { useState, useCallback, useRef, useEffect } from "react"
import { getAgentRun, startAgentRun } from "../api/agents"

const POLL_INTERVAL_MS = 800

function countSteps(events) {
  return events.filter(
    (e) => e.type === "thought" || e.type === "tool_call"
  ).length
}

export function useEventStream(refreshKey = 0) {
  const [events, setEvents] = useState([])
  const [status, setStatus] = useState("idle")
  const [step, setStep] = useState(0)
  const [error, setError] = useState(null)
  const pollRef = useRef(null)
  const runIdRef = useRef(null)

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current)
      pollRef.current = null
    }
  }, [])

  const applyRunSnapshot = useCallback((run) => {
    const steps = Array.isArray(run.steps) ? run.steps : []
    setEvents(steps)
    setStep(countSteps(steps))

    if (run.status === "done") {
      setStatus("done")
      setError(null)
      return true
    }

    if (run.status === "error") {
      setStatus("error")
      setError(run.error || "Agent run failed")
      return true
    }

    setStatus("running")
    return false
  }, [])

  const pollRun = useCallback(async () => {
    const runId = runIdRef.current
    if (!runId) return

    try {
      const run = await getAgentRun(runId)
      if (applyRunSnapshot(run)) {
        stopPolling()
      }
    } catch (err) {
      setStatus("error")
      setError(err.message || "Failed to fetch run status")
      stopPolling()
    }
  }, [applyRunSnapshot, stopPolling])

  const run = useCallback(
    async (agentId, message, attachmentPaths = []) => {
      stopPolling()
      setEvents([])
      setStatus("running")
      setStep(0)
      setError(null)
      runIdRef.current = null

      try {
        const { run_id: runId } = await startAgentRun(agentId, message, attachmentPaths)
        runIdRef.current = runId

        const initial = await getAgentRun(runId)
        if (!applyRunSnapshot(initial)) {
          pollRef.current = setInterval(pollRun, POLL_INTERVAL_MS)
        }
      } catch (err) {
        setStatus("error")
        setError(err.message || "Failed to start agent run")
        stopPolling()
      }
    },
    [applyRunSnapshot, pollRun, stopPolling]
  )

  const reset = useCallback(() => {
    stopPolling()
    runIdRef.current = null
    setEvents([])
    setStatus("idle")
    setStep(0)
    setError(null)
  }, [stopPolling])

  useEffect(() => () => stopPolling(), [stopPolling])

  useEffect(() => {
    if (refreshKey > 0 && runIdRef.current && status === "running") {
      pollRun()
    }
  }, [refreshKey, pollRun, status])

  return { events, status, step, error, run, reset }
}
