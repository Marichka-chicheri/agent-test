import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom"
import { isAuthenticated } from "./api/api"
import { AuthProvider } from "./context/AuthProvider"
import { ProtectedRoute } from "./components/ProtectedRoute"
import CreateAgent from "./pages/CreateAgent"
import { ApiKeysSettings } from "./pages/ApiKeysSettings"
import { LiveView } from "./pages/LiveView"
import { Register } from "./pages/Register"

function HomeRedirect() {
  return <Navigate to={isAuthenticated() ? "/live" : "/login"} replace />
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomeRedirect />} />
          <Route path="/login" element={<Register mode="login" />} />
          <Route path="/register" element={<Register mode="register" />} />
          <Route
            path="/constructor"
            element={
              <ProtectedRoute>
                <CreateAgent />
              </ProtectedRoute>
            }
          />
          <Route
            path="/live"
            element={
              <ProtectedRoute>
                <LiveView />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <ApiKeysSettings />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
