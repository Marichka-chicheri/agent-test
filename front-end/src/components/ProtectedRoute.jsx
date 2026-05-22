import { Navigate, useLocation } from "react-router-dom"
import { getAccessToken } from "../api/api"

export function ProtectedRoute({ children }) {
  const location = useLocation()
  const token = getAccessToken()

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return children
}
