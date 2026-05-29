import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Logo from '../components/Logo'

export default function Dashboard() {
  const { user } = useAuth()

  return (
    <div className="home">
      <div className="home-hero">
        <Logo size={64} className="home-logo" />
        <h1>
          Study <span className="text-accent">smarter</span>
        </h1>
        <p className="home-sub">
          {user
            ? `Hi ${user.name.split(' ')[0]} — build courses and generate AI study guides.`
            : 'Sign in to save courses, generate study guides, and use the AI tutor.'}
        </p>
      </div>
      <div className="home-actions">
        {user ? (
          <>
            <Link to="/courses" className="home-cta">
              My courses
            </Link>
            <Link to="/tutor" className="home-cta home-cta--secondary">
              AI Tutor
            </Link>
          </>
        ) : (
          <Link to="/signin" className="home-cta">
            Sign in to get started
          </Link>
        )}
      </div>
      <section className="home-features card">
        <h2>Each study guide includes</h2>
        <ul>
          <li>Overview & key concepts</li>
          <li>Step-by-step sections</li>
          <li>Practice questions</li>
          <li>Curated resources</li>
        </ul>
      </section>
    </div>
  )
}
