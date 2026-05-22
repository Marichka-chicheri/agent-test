import { useEffect } from "react"
import { Navigate, useLocation } from "react-router-dom"
import { getAccessToken } from "../api/api"
import { useAuth } from "../hooks/useAuth"

export function ProtectedRoute({ children }) {
  const location = useLocation()
  const token = getAccessToken()
  const { loadApiKeys } = useAuth()

  useEffect(() => {
    if (token) {
      loadApiKeys().catch(() => {})
    }
  }, [token, loadApiKeys])

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return children
}
