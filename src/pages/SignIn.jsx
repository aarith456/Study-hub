import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Logo from '../components/Logo'

export default function SignIn() {
  const [mode, setMode] = useState('signin')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const { signIn, signUp, user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const from = location.state?.from || '/courses'

  useEffect(() => {
    if (user) navigate(from, { replace: true })
  }, [user, navigate, from])

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      if (mode === 'signup') {
        await signUp(email, password, name)
      } else {
        await signIn(email, password)
      }
      navigate(from, { replace: true })
    } catch (err) {
      const msg = err.message || 'Something went wrong'
      setError(
        /fetch|network|refused|failed/i.test(msg)
          ? 'Cannot reach the server. Run start-app.bat and keep the API window open.'
          : msg
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card card">
        <Logo size={52} className="auth-logo" />
        <h1>{mode === 'signup' ? 'Create account' : 'Sign in'}</h1>
        <p className="auth-sub">
          {mode === 'signup'
            ? 'Save your courses and study guides to your account.'
            : 'Welcome back to StudyHub.'}
        </p>

        <div className="auth-tabs">
          <button
            type="button"
            className={`auth-tab ${mode === 'signin' ? 'active' : ''}`}
            onClick={() => { setMode('signin'); setError(null) }}
          >
            Sign in
          </button>
          <button
            type="button"
            className={`auth-tab ${mode === 'signup' ? 'active' : ''}`}
            onClick={() => { setMode('signup'); setError(null) }}
          >
            Sign up
          </button>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {mode === 'signup' && (
            <label>
              Name
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                required
                autoComplete="name"
                disabled={submitting}
              />
            </label>
          )}
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@school.edu"
              required
              autoComplete="email"
              disabled={submitting}
            />
          </label>
          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={mode === 'signup' ? 'At least 6 characters' : 'Your password'}
              required
              minLength={mode === 'signup' ? 6 : undefined}
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              disabled={submitting}
            />
          </label>
          {error && <div className="alert-error" role="alert">{error}</div>}
          <button type="submit" className="btn btn-primary auth-submit" disabled={submitting}>
            {submitting ? 'Please wait…' : mode === 'signup' ? 'Create account' : 'Sign in'}
          </button>
        </form>

        <p className="auth-footer">
          <Link to="/">← Back to home</Link>
          {' · '}
          <Link to="/admin/signin">Admin</Link>
        </p>
      </div>
    </div>
  )
}
