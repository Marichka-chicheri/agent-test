import { useState, useRef, useEffect } from 'react'
import { useEventStream } from '../hooks/useEventStream'
import { EventCard, ThinkingCard } from '../components/EventCard'

const AGENT_ID = 1 // replace with real ID once backend is ready

export function LiveView() {
  const [message, setMessage] = useState('')
  const { events, status, step, run, reset } = useEventStream()
  const feedRef = useRef(null)

  useEffect(() => {
    if (feedRef.current) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight
    }
  }, [events])

  function handleRun() {
    if (!message.trim() || status === 'running') return
    run(AGENT_ID, message)
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleRun()
    }
  }

  return (
    <div style={styles.root}>

      {/* Header */}
      <div style={styles.header}>
        <div style={styles.logoBadge}>
          Agentic<span style={{ color: '#b3f0ff' }}>Studio</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {status === 'running' && (
            <span style={styles.statusRunning}>Step {step} · running...</span>
          )}
          {status === 'done' && (
            <span style={styles.statusDone}>Done in {step} steps</span>
          )}
          {status === 'error' && (
            <span style={styles.statusError}>Something went wrong</span>
          )}
          {status !== 'idle' && (
            <button onClick={reset} style={styles.resetBtn}>New run</button>
          )}
        </div>
      </div>

      {/* Feed */}
      <div ref={feedRef} style={styles.feed}>
        {events.length === 0 && status === 'idle' && (
          <div style={styles.emptyState}>
            <div>Ask your agent something to get started</div>
          </div>
        )}
        {events.map((event, i) => (
          <EventCard key={i} event={event} />
        ))}
        {status === 'running' && <ThinkingCard />}
      </div>

      {/* Input */}
      <div style={styles.inputArea}>
        <input
          value={message}
          onChange={e => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          // placeholder="Ask your agent something..."
          disabled={status === 'running'}
          style={{
            ...styles.input,
            opacity: status === 'running' ? 0.5 : 1,
          }}
        />
        <button
          onClick={handleRun}
          disabled={status === 'running' || !message.trim()}
          style={{
            ...styles.runBtn,
            background: status === 'running' || !message.trim()
              ? 'rgba(255,255,255,0.1)'
              : 'rgba(255,255,255,0.25)',
            cursor: status === 'running' || !message.trim() ? 'not-allowed' : 'pointer',
          }}
        >
          {status === 'running' ? 'Running...' : 'Run'}
        </button>
      </div>

    </div>
  )
}

const styles = {
  root: {
    display: 'flex', flexDirection: 'column', height: '100vh',
    background: 'linear-gradient(160deg, #5ececa 0%, #3a9fbf 40%, #1a6080 100%)',
    color: '#fff',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    padding: 16,
    gap: 12,
    boxSizing: 'border-box',
  },
  header: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    gap: 12, padding: '0 4px',
  },
  logoBadge: {
    fontWeight: 700, fontSize: 15, color: '#fff',
    background: 'rgba(255,255,255,0.15)',
    backdropFilter: 'blur(8px)',
    border: '1px solid rgba(255,255,255,0.2)',
    borderRadius: 12, padding: '7px 16px',
  },
  statusRunning: {
    fontSize: 12, color: '#fff',
    background: 'rgba(255,255,255,0.15)', padding: '5px 14px',
    borderRadius: 20, backdropFilter: 'blur(8px)',
  },
  statusDone: {
    fontSize: 12, color: '#fff',
    background: 'rgba(255,255,255,0.15)', padding: '5px 14px',
    borderRadius: 20,
  },
  statusError: {
    fontSize: 12, color: '#fff',
    background: 'rgba(255,100,100,0.3)', padding: '5px 14px',
    borderRadius: 20,
  },
  resetBtn: {
    fontSize: 12, padding: '6px 16px',
    background: 'rgba(255,255,255,0.15)',
    backdropFilter: 'blur(8px)',
    border: '1px solid rgba(255,255,255,0.2)',
    borderRadius: 20, color: '#fff', cursor: 'pointer',
  },
  feed: {
    flex: 1, overflowY: 'auto', padding: '16px',
    display: 'flex', flexDirection: 'column', gap: 8,
    background: 'rgba(255,255,255,0.08)',
    backdropFilter: 'blur(12px)',
    borderRadius: 16,
    border: '2px solid rgba(80,180,255,0.6)',
    boxShadow: '0 0 30px rgba(80,180,255,0.15), inset 0 1px 0 rgba(255,255,255,0.1)',
  },
  emptyState: {
    textAlign: 'center', marginTop: 80,
    color: 'rgba(255,255,255,0.8)', fontSize: 14,
  },
  inputArea: {
    display: 'flex', gap: 10,
    padding: '12px 16px',
    background: 'rgba(0,0,0,0.15)',
    backdropFilter: 'blur(12px)',
    borderRadius: 16,
    border: '1px solid rgba(255,255,255,0.1)',
  },
  input: {
    flex: 1,
    background: 'rgba(255,255,255,0.1)',
    border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: 10, padding: '10px 14px',
    color: '#fff', fontSize: 14, outline: 'none',
  },
  runBtn: {
    padding: '10px 22px', border: '1px solid rgba(255,255,255,0.2)',
    borderRadius: 10, color: '#fff', fontSize: 14, fontWeight: 600,
  },
}
