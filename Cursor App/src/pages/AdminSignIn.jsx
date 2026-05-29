import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Logo from '../components/Logo'

export default function AdminSignIn() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const { adminSignIn, user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (user?.role === 'admin') navigate('/admin', { replace: true })
  }, [user, navigate])

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await adminSignIn(email, password)
      navigate('/admin', { replace: true })
    } catch (err) {
      const msg = err.message || 'Sign in failed'
      setError(/fetch|network|refused/i.test(msg) ? 'Cannot reach the server. Run start-app.bat.' : msg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card card admin-auth-card">
        <Logo size={52} className="auth-logo" />
        <h1>Admin sign in</h1>
        <p className="auth-sub">View usage analytics and user data.</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label>
            Admin email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@studyhub.local"
              required
              autoComplete="username"
              disabled={submitting}
            />
          </label>
          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              disabled={submitting}
            />
          </label>
          {error && <div className="alert-error" role="alert">{error}</div>}
          <button type="submit" className="btn btn-primary auth-submit" disabled={submitting}>
            {submitting ? 'Signing in…' : 'Sign in as admin'}
          </button>
        </form>

        <p className="auth-footer">
          <Link to="/">← Back to app</Link>
          {' · '}
          <Link to="/signin">Student sign in</Link>
        </p>
      </div>
    </div>
  )
}
