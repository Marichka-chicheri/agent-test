import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { fetchAppConfig, uploadFiles } from "../api/uploads"

const FALLBACK_EXTENSIONS = [
  "txt", "md", "docx", "xlsx", "csv", "pdf", "json",
  "js", "jsx", "ts", "tsx", "py", "html", "css", "yaml", "yml", "xml",
]

function extOf(name) {
  const parts = (name || "").split(".")
  return parts.length > 1 ? parts.pop().toLowerCase() : ""
}

export function FileUploadModal({ open, onClose, onFilesReady, disabled }) {
  const [config, setConfig] = useState(null)
  const [configError, setConfigError] = useState("")
  const [pending, setPending] = useState([])
  const [uploadError, setUploadError] = useState("")
  const [uploadProgress, setUploadProgress] = useState(null)
  const [dragActive, setDragActive] = useState(false)
  const inputRef = useRef(null)

  useEffect(() => {
    if (!open) return
    let cancelled = false

    async function load() {
      try {
        const data = await fetchAppConfig()
        if (!cancelled) setConfig(data)
      } catch (err) {
        if (!cancelled) {
          setConfigError(err.message || "Failed to load upload settings")
          setConfig({
            supported_extensions: FALLBACK_EXTENSIONS,
            max_upload_bytes: 10 * 1024 * 1024,
          })
        }
      }
    }

    load()
    return () => { cancelled = true }
  }, [open])

  const allowedExtensions = useMemo(
    () => config?.supported_extensions || FALLBACK_EXTENSIONS,
    [config]
  )

  const maxBytes = config?.max_upload_bytes || 10 * 1024 * 1024
  const acceptAttr = allowedExtensions.map((e) => `.${e}`).join(",")

  const validateFile = useCallback((file) => {
    const ext = extOf(file.name)
    if (!allowedExtensions.includes(ext)) {
      return `Unsupported file type (.${ext || "?"}). Allowed: ${allowedExtensions.map((e) => `.${e}`).join(", ")}`
    }
    if (file.size > maxBytes) {
      return `File exceeds ${(maxBytes / (1024 * 1024)).toFixed(0)} MB limit.`
    }
    return null
  }, [allowedExtensions, maxBytes])

  const addFiles = useCallback((files) => {
    const next = []
    const errors = []
    files.forEach((file) => {
      const err = validateFile(file)
      if (err) {
        errors.push(`${file.name}: ${err}`)
        return
      }
      next.push({
        id: `${file.name}-${file.size}-${file.lastModified}`,
        file,
        name: file.name,
        size: file.size,
      })
    })
    if (errors.length) setUploadError(errors.join(" "))
    else setUploadError("")
    if (next.length) setPending((prev) => [...prev, ...next])
  }, [validateFile])

  function onDragOver(e) {
    e.preventDefault()
    e.stopPropagation()
    if (!disabled && uploadProgress === null) setDragActive(true)
  }

  function onDragLeave(e) {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
  }

  function onDrop(e) {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (disabled || uploadProgress !== null) return
    addFiles(Array.from(e.dataTransfer.files || []))
  }

  function onInputChange(e) {
    addFiles(Array.from(e.target.files || []))
    e.target.value = ""
  }

  function removePending(id) {
    setPending((prev) => prev.filter((f) => f.id !== id))
  }

  async function handleConfirm() {
    const ready = pending.filter((f) => f.file)
    if (!ready.length) {
      onClose()
      return
    }

    setUploadError("")
    setUploadProgress(0)

    try {
      const result = await uploadFiles(
        ready.map((f) => f.file),
        { onProgress: setUploadProgress }
      )
      onFilesReady(result?.files || [])
      setPending([])
      setUploadProgress(null)
      onClose()
    } catch (err) {
      setUploadError(err.message || "Upload failed")
      setUploadProgress(null)
    }
  }

  if (!open) return null

  return (
    <div style={styles.overlay} role="dialog" aria-modal="true" aria-label="Upload files">
      <div style={styles.modal}>
        <div style={styles.header}>
          <h2 style={styles.title}>Attach files</h2>
          <button type="button" onClick={onClose} style={styles.closeBtn} aria-label="Close">
            ×
          </button>
        </div>

        {configError && <div style={styles.warn}>{configError}</div>}

        <div
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          style={{
            ...styles.dropzone,
            borderColor: dragActive ? "rgba(120,220,255,0.9)" : "rgba(255,255,255,0.25)",
            background: dragActive ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.15)",
          }}
        >
          <p style={styles.dropText}>
            {dragActive ? "Drop files here…" : "Drag and drop files here"}
          </p>
          <button
            type="button"
            style={styles.pickBtn}
            onClick={() => inputRef.current?.click()}
            disabled={disabled || uploadProgress !== null}
          >
            Choose files
          </button>
          <input
            ref={inputRef}
            type="file"
            multiple
            accept={acceptAttr}
            style={{ display: "none" }}
            onChange={onInputChange}
          />
          <p style={styles.hint}>
            {allowedExtensions.map((e) => `.${e}`).join(", ")} · max {(maxBytes / (1024 * 1024)).toFixed(0)} MB
          </p>
        </div>

        {uploadError && <div style={styles.error}>{uploadError}</div>}

        {uploadProgress !== null && (
          <div style={styles.progressWrap}>
            <div style={styles.progressBar}>
              <div style={{ ...styles.progressFill, width: `${uploadProgress}%` }} />
            </div>
            <span style={styles.progressLabel}>Uploading… {uploadProgress}%</span>
          </div>
        )}

        {pending.length > 0 && (
          <ul style={styles.fileList}>
            {pending.map((item) => (
              <li key={item.id} style={styles.fileItem}>
                <span style={styles.fileName}>{item.name}</span>
                <span style={styles.fileSize}>{(item.size / 1024).toFixed(1)} KB</span>
                <button
                  type="button"
                  style={styles.removeBtn}
                  onClick={() => removePending(item.id)}
                  disabled={uploadProgress !== null}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}

        <div style={styles.actions}>
          <button type="button" style={styles.cancelBtn} onClick={onClose} disabled={uploadProgress !== null}>
            Cancel
          </button>
          <button
            type="button"
            style={styles.confirmBtn}
            onClick={handleConfirm}
            disabled={!pending.length || uploadProgress !== null}
          >
            {uploadProgress !== null ? "Uploading…" : `Attach ${pending.length || ""} file${pending.length === 1 ? "" : "s"}`}
          </button>
        </div>
      </div>
    </div>
  )
}

const styles = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,20,40,0.55)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2000,
    padding: 16,
  },
  modal: {
    width: "100%",
    maxWidth: 480,
    background: "rgba(12, 40, 60, 0.98)",
    border: "1px solid rgba(255,255,255,0.2)",
    borderRadius: 16,
    padding: 20,
    color: "#fff",
    boxShadow: "0 12px 40px rgba(0,0,0,0.45)",
  },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  title: { margin: 0, fontSize: 18 },
  closeBtn: { background: "transparent", border: "none", color: "#fff", fontSize: 24, cursor: "pointer" },
  dropzone: { border: "2px dashed rgba(255,255,255,0.25)", borderRadius: 12, padding: 24, textAlign: "center", marginBottom: 12 },
  dropText: { margin: "0 0 12px", fontSize: 14 },
  pickBtn: {
    padding: "8px 16px",
    borderRadius: 8,
    border: "1px solid rgba(255,255,255,0.3)",
    background: "rgba(255,255,255,0.15)",
    color: "#fff",
    cursor: "pointer",
    fontWeight: 600,
  },
  hint: { margin: "12px 0 0", fontSize: 11, opacity: 0.65 },
  error: {
    background: "rgba(255,100,100,0.2)",
    border: "1px solid rgba(255,100,100,0.4)",
    borderRadius: 8,
    padding: "8px 12px",
    fontSize: 13,
    marginBottom: 12,
  },
  warn: { fontSize: 12, opacity: 0.75, marginBottom: 8 },
  progressWrap: { marginBottom: 12 },
  progressBar: { height: 6, background: "rgba(255,255,255,0.15)", borderRadius: 4, overflow: "hidden" },
  progressFill: { height: "100%", background: "#6ee7b7", transition: "width 0.2s" },
  progressLabel: { fontSize: 12, opacity: 0.8, marginTop: 4, display: "block" },
  fileList: { listStyle: "none", margin: "0 0 16px", padding: 0, display: "flex", flexDirection: "column", gap: 6 },
  fileItem: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "8px 10px",
    background: "rgba(0,0,0,0.2)",
    borderRadius: 8,
    fontSize: 13,
  },
  fileName: { flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  fileSize: { opacity: 0.65, fontSize: 11 },
  removeBtn: {
    background: "transparent",
    border: "1px solid rgba(255,120,120,0.5)",
    color: "#ffb4b4",
    borderRadius: 6,
    padding: "4px 8px",
    cursor: "pointer",
    fontSize: 11,
  },
  actions: { display: "flex", gap: 10, justifyContent: "flex-end" },
  cancelBtn: {
    padding: "10px 16px",
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.2)",
    background: "transparent",
    color: "#fff",
    cursor: "pointer",
  },
  confirmBtn: {
    padding: "10px 16px",
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.25)",
    background: "rgba(255,255,255,0.22)",
    color: "#fff",
    fontWeight: 700,
    cursor: "pointer",
  },
}
