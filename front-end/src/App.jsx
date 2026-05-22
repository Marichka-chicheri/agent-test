import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom"
import { isAuthenticated } from "./api/api"
import { ProtectedRoute } from "./components/ProtectedRoute"
import CreateAgent from "./pages/CreateAgent"
import { LiveView } from "./pages/LiveView"
import { Register } from "./pages/Register"

function HomeRedirect() {
  return <Navigate to={isAuthenticated() ? "/live" : "/login"} replace />
}

function App() {
  return (
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
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
