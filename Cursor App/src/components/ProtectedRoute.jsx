import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return <div className="auth-loading">Loading…</div>
  }

  if (!user) {
    return <Navigate to="/signin" state={{ from: location.pathname }} replace />
  }

  if (user.role === 'admin') {
    return <Navigate to="/admin" replace />
  }

  return children
}
