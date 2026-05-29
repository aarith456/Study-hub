import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { fetchAdminAnalytics } from '../services/auth'

function StatCard({ label, value }) {
  return (
    <div className="admin-stat card">
      <span className="admin-stat-value">{value}</span>
      <span className="admin-stat-label">{label}</span>
    </div>
  )
}

export default function AdminDashboard() {
  const { signOut } = useAuth()
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const analytics = await fetchAdminAnalytics()
        if (!cancelled) setData(analytics)
      } catch (err) {
        if (!cancelled) setError(err.message || 'Failed to load analytics')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  if (loading) return <div className="auth-loading">Loading analytics…</div>
  if (error) {
    return (
      <div className="admin-page">
        <div className="alert-error">{error}</div>
        <button type="button" className="btn btn-primary" onClick={() => window.location.reload()}>
          Retry
        </button>
      </div>
    )
  }

  const { summary, activityLast7Days, users, recentEvents, eventsByType } = data
  const maxActivity = Math.max(...activityLast7Days.map((d) => d.count), 1)

  return (
    <div className="admin-page">
      <header className="page-head">
        <div>
          <h1>Admin analytics</h1>
          <p className="page-sub">User usage and activity across StudyHub</p>
        </div>
        <div className="admin-head-actions">
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => window.location.reload()}>
            Refresh
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => {
              signOut()
              window.location.href = '/admin/signin'
            }}
          >
            Sign out
          </button>
        </div>
      </header>

      <section className="admin-stats">
        <StatCard label="Total users" value={summary.totalUsers} />
        <StatCard label="Active today" value={summary.activeToday} />
        <StatCard label="Study guides" value={summary.studyGuides} />
        <StatCard label="Tutor messages" value={summary.tutorMessages} />
        <StatCard label="Sign ups" value={summary.signups} />
        <StatCard label="Total events" value={summary.totalEvents} />
      </section>

      <section className="card admin-section">
        <h2>Activity (last 7 days)</h2>
        <div className="admin-chart">
          {activityLast7Days.map((d) => (
            <div key={d.date} className="admin-chart-bar-wrap" title={`${d.date}: ${d.count} events`}>
              <div
                className="admin-chart-bar"
                style={{ height: `${Math.max(8, (d.count / maxActivity) * 100)}%` }}
              />
              <span className="admin-chart-label">{d.date.slice(5)}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="card admin-section">
        <h2>Event breakdown</h2>
        <ul className="admin-event-types">
          {Object.entries(eventsByType).map(([type, count]) => (
            <li key={type}>
              <span>{type.replace(/_/g, ' ')}</span>
              <strong>{count}</strong>
            </li>
          ))}
        </ul>
      </section>

      <section className="card admin-section">
        <h2>Users</h2>
        {users.length === 0 ? (
          <p className="muted">No user data yet. Users appear after sign up and activity.</p>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Courses</th>
                  <th>Guides</th>
                  <th>Last active</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td>{u.name || '—'}</td>
                    <td>{u.email}</td>
                    <td>{u.courseCount}</td>
                    <td>{u.guideCount}</td>
                    <td>{u.lastSeen ? new Date(u.lastSeen).toLocaleString() : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="card admin-section">
        <h2>Recent activity</h2>
        <ul className="admin-recent">
          {recentEvents.map((e) => (
            <li key={e.id}>
              <span className="admin-event-type">{e.type}</span>
              <span className="admin-event-meta">
                {e.email || e.userId || 'system'}
                {e.meta?.topic ? ` · ${e.meta.topic}` : ''}
              </span>
              <time>{new Date(e.at).toLocaleString()}</time>
            </li>
          ))}
        </ul>
      </section>

      <p className="admin-footer">
        <Link to="/">← Back to app</Link>
      </p>
    </div>
  )
}
