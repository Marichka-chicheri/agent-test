import { getAccessToken } from "./api"
import { resolveApiUrl } from "./config"
import { formatApiError } from "./errors"
import { parseJsonResponse } from "./http"

export async function fetchAppConfig() {
  const token = getAccessToken()
  const res = await fetch(resolveApiUrl("/config/"), {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
  return parseJsonResponse(res)
}

export async function uploadFiles(files, { onProgress } = {}) {
  const token = getAccessToken()
  const formData = new FormData()
  files.forEach((file) => formData.append("files", file))

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open("POST", resolveApiUrl("/uploads/"))
    if (token) {
      xhr.setRequestHeader("Authorization", `Bearer ${token}`)
    }

    if (onProgress) {
      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable) {
          onProgress(Math.round((event.loaded / event.total) * 100))
        }
      })
    }

    xhr.onload = async () => {
      const contentType = xhr.getResponseHeader("content-type") || ""
      let data = null
      if (contentType.includes("application/json")) {
        try {
          data = JSON.parse(xhr.responseText)
        } catch {
          data = null
        }
      }

      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(data)
        return
      }

      reject(new Error(formatApiError(data) || `Upload failed (${xhr.status})`))
    }

    xhr.onerror = () => reject(new Error("Upload failed due to a network error."))
    xhr.send(formData)
  })
}
