import { Outlet, NavLink, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import Logo from './Logo'

export default function Layout() {
  const { user, signOut, loading, isAdmin } = useAuth()
  const { theme, toggle } = useTheme()

  return (
    <div className="layout">
      <header className="header">
        <NavLink to="/" className="logo">
          <Logo size={38} />
          <span className="logo-text">
            Studyer<span className="logo-accent">Hub</span>
          </span>
        </NavLink>
        <nav className="nav">
          <NavLink to="/" end className="nav-link">Home</NavLink>
          {user && !isAdmin && (
            <>
              <NavLink to="/courses" className="nav-link">Courses</NavLink>
              <NavLink to="/tutor" className="nav-link">Tutor</NavLink>
            </>
          )}
          {isAdmin && (
            <NavLink to="/admin" className="nav-link">Analytics</NavLink>
          )}
          {!loading && (
            <div className="nav-auth">
              {user ? (
                <>
                  <span className="nav-user" title={user.email}>{user.name}</span>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={signOut}>Sign out</button>
                </>
              ) : (
                <Link to="/signin" className="btn btn-primary btn-sm nav-signin">Sign in</Link>
              )}
            </div>
          )}
          <button className="theme-toggle" onClick={toggle} title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}>
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
        </nav>
      </header>
      <main className={`main ${isAdmin ? 'main--admin' : ''}`}>
        <Outlet />
      </main>
    </div>
  )
}
