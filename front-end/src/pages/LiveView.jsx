import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAgents } from '../api/agents'
import { AppNav } from '../components/AppNav'
import { ProfileMenu } from '../components/ProfileMenu'
import { useAuth } from '../hooks/useAuth'
import { useEventStream } from '../hooks/useEventStream'
import { FileUploadModal } from '../components/FileUploadModal'
import { EventCard, ThinkingCard } from '../components/EventCard'

function getFileIcon(filename) {
  const ext = (filename.split('.').pop() || '').toLowerCase()
  const icons = {
    txt: '📄', md: '📝', docx: '📘', xlsx: '📊', pdf: '📕',
    csv: '📊', json: '📋', js: '📜', jsx: '⚛️', ts: '📘', tsx: '⚛️',
    py: '🐍', html: '🌐', css: '🎨', yaml: '⚙️', yml: '⚙️', xml: '📰',
  }
  return icons[ext] || '📎'
}

export function LiveView() {
  const navigate = useNavigate()
  const { apiKeys } = useAuth()
  const [message, setMessage] = useState('')
  const [sentMessage, setSentMessage] = useState('')
  const [agents, setAgents] = useState([])
  const [agentsLoading, setAgentsLoading] = useState(true)
  const [agentsError, setAgentsError] = useState('')
  const [activeAgent, setActiveAgent] = useState(null)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [attachments, setAttachments] = useState([])
  const { events, status, step, error, run, reset } = useEventStream(pollTick)
  const feedRef = useRef(null)
  const [pollTick, setPollTick] = useState(0)

  useEffect(() => {
    let cancelled = false

    async function loadAgents() {
      try {
        setAgentsLoading(true)
        setAgentsError('')
        const list = await getAgents()
        if (cancelled) return
        setAgents(list)
        setActiveAgent((prev) => {
          if (prev && list.some((a) => a.id === prev.id)) return prev
          return list[0] ?? null
        })
      } catch (err) {
        if (!cancelled) {
          setAgentsError(err.message || 'Failed to load agents')
        }
      } finally {
        if (!cancelled) setAgentsLoading(false)
      }
    }

    loadAgents()
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    if (feedRef.current) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight
    }
  }, [events])

  function handleFilesReady(uploaded) {
    setAttachments((prev) => {
      const seen = new Set(prev.map((f) => f.path))
      const next = [...prev]
      uploaded.forEach((file) => {
        if (!seen.has(file.path)) next.push(file)
      })
      return next
    })
  }

  function removeAttachment(index) {
    setAttachments((prev) => prev.filter((_, i) => i !== index))
  }

  function handleRun() {
    if ((!message.trim() && attachments.length === 0) || status === 'running' || !activeAgent) return
    const attachmentPaths = attachments.map((f) => f.path)
    const displayMsg = [
      message.trim(),
      attachments.length ? `\n[${attachments.length} attached file(s)]` : '',
    ].filter(Boolean).join('')
    setSentMessage(displayMsg)
    run(activeAgent.id, message, attachmentPaths)
    setMessage('')
    setAttachments([])
  }

  function handleApprovalResolved() {
    setPollTick((t) => t + 1)
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleRun()
    }
  }

  function handleAgentSwitch(agent) {
    setActiveAgent(agent)
    setSentMessage('')
    reset()
  }

  function handleReset() {
    reset()
    setSentMessage('')
    setAttachments([])
  }

  const canRun = (message.trim() || attachments.length > 0) && status !== 'running' && !!activeAgent

  const hasPendingApproval = events.some((e) => e.type === 'approval_pending')

  return (
    <div style={styles.root}>

      {/* TOP BAR */}
      <div style={styles.topBar}>
        <div style={styles.logoBadge}>
          Agentic<span style={{ color: '#b3f0ff' }}>Studio</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <AppNav />
          {status === 'running' && (
            <span style={styles.statusRunning}>Step {step} · running...</span>
          )}
          {status === 'done' && (
            <span style={styles.statusDone}>Done in {step} steps</span>
          )}
          {status === 'error' && (
            <span style={styles.statusError}>Run failed</span>
          )}
          <ProfileMenu />
        </div>
      </div>

      {!apiKeys.gemini_configured && (
        <div style={styles.warnBanner}>
          Add your Gemini API key in{' '}
          <span style={styles.warnLink} onClick={() => navigate('/settings')}>
            Settings
          </span>{' '}
          to run agents.
        </div>
      )}

      {/* BODY */}
      <div style={styles.body}>

        {/* SIDEBAR */}
        <div style={styles.sidebar}>
          <div style={styles.sidebarLabel}>My Agents</div>
          {agentsLoading && (
            <div style={styles.sidebarHint}>Loading agents...</div>
          )}
          {agentsError && (
            <div style={styles.sidebarError}>{agentsError}</div>
          )}
          {!agentsLoading && agents.length === 0 && (
            <div style={styles.sidebarHint}>
              No agents yet. Create one to get started.
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {agents.map(agent => (
              <div
                key={agent.id}
                onClick={() => handleAgentSwitch(agent)}
                style={{
                  ...styles.agentItem,
                  background: activeAgent?.id === agent.id
                    ? 'rgba(255,255,255,0.28)'
                    : 'rgba(0,0,0,0.2)',
                  border: activeAgent?.id === agent.id
                    ? '1px solid rgba(255,255,255,0.5)'
                    : '1px solid rgba(255,255,255,0.15)',
                }}
              >
                <div style={styles.agentDot} />
                <div>
                  <div style={styles.agentName}>{agent.name}</div>
                </div>
              </div>
            ))}
          </div>

          <div
            style={styles.newAgentBtn}
            onClick={() => navigate('/constructor')}
          >
            + New Agent
          </div>
        </div>

        {/* MAIN CONTENT */}
        <div style={styles.main}>

          <div ref={feedRef} style={styles.feed}>
            {events.length === 0 && status === 'idle' && (
              <div style={styles.emptyState}>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>
                  {activeAgent?.name ?? 'No agent selected'}
                </div>
                <div>
                  {activeAgent
                    ? 'Ask your agent something to get started'
                    : 'Create an agent in the constructor first'}
                </div>
              </div>
            )}
            {sentMessage && (
              <div style={styles.userBubble}>{sentMessage}</div>
            )}
            {events.map((event, i) => (
              <EventCard
                key={`${i}-${event.approval_id || event.type}`}
                event={event}
                onApprovalResolved={handleApprovalResolved}
              />
            ))}
            {status === 'running' && !hasPendingApproval && <ThinkingCard />}
            {status === 'error' && error && (
              <div style={styles.errorBanner}>{error}</div>
            )}
          </div>

          {/* Input wrapper */}
          <div style={styles.inputWrapper}>

            {/* File chips */}
            {attachments.length > 0 && (
              <div style={styles.fileChipsRow}>
                {attachments.map((file, i) => (
                  <div key={file.path || i} style={styles.fileChip}>
                    <span style={{ fontSize: 13 }}>{getFileIcon(file.name)}</span>
                    <span style={styles.chipName}>{file.name}</span>
                    <span
                      onClick={() => removeAttachment(i)}
                      style={styles.chipRemove}
                      title="Remove"
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => e.key === 'Enter' && removeAttachment(i)}
                    >
                      ×
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Input row */}
            <div style={styles.inputArea}>

              {/* + Attach button */}
              <button
                type="button"
                onClick={() => setShowUploadModal(true)}
                style={{
                  ...styles.attachBtn,
                  background: showUploadModal
                    ? 'rgba(255,255,255,0.25)'
                    : 'rgba(255,255,255,0.12)',
                }}
                title="Attach files"
                disabled={status === 'running'}
                aria-label="Attach files"
              >
                +
              </button>

              <FileUploadModal
                open={showUploadModal}
                onClose={() => setShowUploadModal(false)}
                onFilesReady={handleFilesReady}
                disabled={status === 'running'}
              />

              <input
                value={message}
                onChange={e => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  activeAgent
                    ? `Ask ${activeAgent.name} something...`
                    : 'Select or create an agent...'
                }
                disabled={status === 'running' || !activeAgent}
                style={{
                  ...styles.input,
                  opacity: status === 'running' ? 0.5 : 1,
                }}
              />

              {status !== 'idle' && (
                <button onClick={handleReset} style={styles.resetBtn}>New</button>
              )}

              <button
                onClick={handleRun}
                disabled={!canRun}
                style={{
                  ...styles.runBtn,
                  background: canRun ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.1)',
                  cursor: canRun ? 'pointer' : 'not-allowed',
                }}
              >
                {status === 'running' ? 'Running...' : 'Run'}
              </button>

            </div>
          </div>

        </div>
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
    padding: 12, gap: 10, boxSizing: 'border-box',
  },
  topBar: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '6px 8px', flexShrink: 0,
  },
  logoBadge: {
    fontWeight: 700, fontSize: 15, color: '#fff',
    background: 'rgba(255,255,255,0.15)',
    backdropFilter: 'blur(8px)',
    border: '1px solid rgba(255,255,255,0.2)',
    borderRadius: 12, padding: '7px 16px',
  },
  warnBanner: {
    fontSize: 13,
    padding: '8px 12px',
    borderRadius: 10,
    background: 'rgba(255,180,50,0.15)',
    border: '1px solid rgba(255,200,80,0.35)',
    flexShrink: 0,
  },
  warnLink: {
    textDecoration: 'underline',
    cursor: 'pointer',
    fontWeight: 700,
  },
  statusRunning: { fontSize: 12, color: '#fff', background: 'rgba(255,255,255,0.15)', padding: '5px 14px', borderRadius: 20, backdropFilter: 'blur(8px)' },
  statusDone: { fontSize: 12, color: '#fff', background: 'rgba(255,255,255,0.15)', padding: '5px 14px', borderRadius: 20 },
  statusError: { fontSize: 12, color: '#ffb4b4', background: 'rgba(255,80,80,0.2)', padding: '5px 14px', borderRadius: 20 },
  errorBanner: {
    fontSize: 13,
    color: '#ffb4b4',
    background: 'rgba(255,80,80,0.15)',
    border: '1px solid rgba(255,120,120,0.35)',
    borderRadius: 10,
    padding: '10px 12px',
  },
  body: { display: 'flex', flex: 1, gap: 10, overflow: 'hidden' },
  sidebar: {
    width: 180, flexShrink: 0, background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)',
    borderRadius: 16, border: '1px solid rgba(255,255,255,0.15)', padding: 12,
    display: 'flex', flexDirection: 'column', gap: 8, overflowY: 'auto',
  },
  sidebarLabel: { fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px', color: 'rgba(255,255,255,0.8)', paddingBottom: 4, borderBottom: '1px solid rgba(255,255,255,0.08)' },
  sidebarHint: { fontSize: 12, color: 'rgba(255,255,255,0.55)', padding: '4px 2px' },
  sidebarError: { fontSize: 12, color: '#ffb4b4', padding: '4px 2px' },
  agentItem: { display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 10, cursor: 'pointer', transition: 'all 0.15s' },
  agentDot: { width: 6, height: 6, borderRadius: '50%', background: '#6ee7b7', flexShrink: 0 },
  agentName: { fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.9)' },
  newAgentBtn: { marginTop: 'auto', padding: '8px 10px', background: 'rgba(255,255,255,0.06)', border: '1px dashed rgba(255,255,255,0.2)', borderRadius: 10, fontSize: 12, color: 'rgba(255,255,255,0.5)', cursor: 'pointer', textAlign: 'center' },
  main: { flex: 1, display: 'flex', flexDirection: 'column', gap: 10, overflow: 'hidden' },
  feed: {
    flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 8,
    background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)',
    borderRadius: 16, border: '2px solid rgba(80,180,255,0.6)',
    boxShadow: '0 0 30px rgba(80,180,255,0.15), inset 0 1px 0 rgba(255,255,255,0.1)',
  },
  userBubble: { alignSelf: 'flex-end', background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '16px 16px 4px 16px', padding: '10px 14px', fontSize: 14, color: '#fff', maxWidth: '70%', wordBreak: 'break-word', backdropFilter: 'blur(8px)' },
  emptyState: { textAlign: 'center', marginTop: 60, color: 'rgba(255,255,255,0.5)', fontSize: 13 },
  // Input wrapper (chips + row)
  inputWrapper: {
    display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0,
  },
  fileChipsRow: {
    display: 'flex', flexWrap: 'wrap', gap: 6,
    padding: '2px 4px',
  },
  fileChip: {
    display: 'flex', alignItems: 'center', gap: 5,
    background: 'rgba(255,255,255,0.15)',
    border: '1px solid rgba(255,255,255,0.25)',
    borderRadius: 20, padding: '4px 8px 4px 8px',
    fontSize: 11, color: '#fff', maxWidth: 180,
  },
  chipName: {
    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
    maxWidth: 110,
  },
  chipRemove: {
    cursor: 'pointer', fontSize: 15, opacity: 0.7,
    lineHeight: 1, marginLeft: 2, flexShrink: 0,
  },
  inputArea: {
    display: 'flex', gap: 8, padding: '10px 14px',
    background: 'rgba(0,0,0,0.15)', backdropFilter: 'blur(12px)',
    borderRadius: 14, border: '1px solid rgba(255,255,255,0.1)',
    alignItems: 'center',
  },
  // + Attach button
  attachBtn: {
    width: 34, height: 34, borderRadius: 10,
    border: '1px solid rgba(255,255,255,0.2)',
    color: '#fff', fontSize: 22, fontWeight: 300,
    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
    lineHeight: 1, padding: 0, flexShrink: 0,
    transition: 'background 0.15s',
  },
  // Upload dropdown
  uploadMenu: {
    position: 'absolute',
    bottom: 'calc(100% + 8px)',
    left: 0,
    background: 'rgba(15, 35, 55, 0.96)',
    backdropFilter: 'blur(16px)',
    border: '1px solid rgba(255,255,255,0.18)',
    borderRadius: 12,
    padding: 6,
    minWidth: 185,
    zIndex: 1000,
    boxShadow: '0 8px 28px rgba(0,0,0,0.45)',
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  },
  uploadMenuHeader: {
    fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
    letterSpacing: '0.6px', color: 'rgba(255,255,255,0.4)',
    padding: '4px 10px 6px',
  },
  uploadMenuItem: {
    display: 'flex', alignItems: 'center', gap: 9,
    padding: '8px 10px', borderRadius: 8,
    fontSize: 12, fontWeight: 500, color: 'rgba(255,255,255,0.9)',
    cursor: 'pointer',
    transition: 'background 0.1s',
  },
  input: {
    flex: 1, background: 'rgba(255,255,255,0.1)',
    border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: 10, padding: '9px 14px',
    color: '#fff', fontSize: 13, outline: 'none',
  },
  resetBtn: {
    padding: '9px 14px', background: 'rgba(255,255,255,0.1)',
    border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: 10, color: '#fff', fontSize: 13, cursor: 'pointer',
  },
  runBtn: {
    padding: '9px 18px', border: '1px solid rgba(255,255,255,0.2)',
    borderRadius: 10, color: '#fff', fontSize: 13, fontWeight: 600,
  },
}
