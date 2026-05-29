import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function AdminRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) return <div className="auth-loading">Loading…</div>
  if (!user || user.role !== 'admin') {
    return <Navigate to="/admin/signin" replace />
  }

  return children
}
