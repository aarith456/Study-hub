import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Logo from '../components/Logo'

export default function Landing() {
  const { user } = useAuth()

  return (
    <div className="landing">
      <nav className="landing-nav">
        <div className="landing-nav-logo">
          <Logo size={32} />
          <span className="landing-nav-name">Studyer<span className="landing-accent">Hub</span></span>
        </div>
        <div className="landing-nav-links">
          {user ? (
            <Link to="/courses" className="landing-btn-primary">Go to App</Link>
          ) : (
            <>
              <Link to="/signin" className="landing-btn-ghost">Sign in</Link>
              <Link to="/signin" className="landing-btn-primary">Get started free</Link>
            </>
          )}
        </div>
      </nav>

      <section className="landing-hero">
        <div className="landing-hero-badge">AI-Powered Learning</div>
        <h1 className="landing-hero-title">
          Study smarter,<br />
          <span className="landing-accent">not harder</span>
        </h1>
        <p className="landing-hero-sub">
          Studyer Hub turns any topic into a full lesson — with study guides, key concepts, practice questions, and a personal AI tutor. Built for every student.
        </p>
        <div className="landing-hero-cta">
          <Link to="/signin" className="landing-btn-primary landing-btn-lg">Start for free →</Link>
          <span className="landing-hero-note">No credit card required</span>
        </div>
      </section>

      <section className="landing-features">
        <div className="landing-feature-card">
          <div className="landing-feature-icon">📚</div>
          <h3>AI Study Guides</h3>
          <p>Enter any topic and get a full structured lesson with key concepts, examples, and practice questions — generated instantly.</p>
        </div>
        <div className="landing-feature-card">
          <div className="landing-feature-icon">🧑‍🏫</div>
          <h3>Personal AI Tutor</h3>
          <p>Ask anything and get clear, step-by-step explanations. Your tutor checks your understanding and adjusts to your level.</p>
        </div>
        <div className="landing-feature-card">
          <div className="landing-feature-icon">🗂️</div>
          <h3>Course Organisation</h3>
          <p>Keep all your subjects in one place. Create courses, generate guides, and track everything you've studied.</p>
        </div>
        <div className="landing-feature-card">
          <div className="landing-feature-icon">✏️</div>
          <h3>Practice Questions</h3>
          <p>Every study guide comes with practice questions, hints, and full explanations to help you test yourself.</p>
        </div>
      </section>

      <section className="landing-cta-section">
        <h2>Ready to study better?</h2>
        <p>Join students already using Studyer Hub to ace their classes.</p>
        <Link to="/signin" className="landing-btn-primary landing-btn-lg">Create your free account →</Link>
      </section>

      <footer className="landing-footer">
        <span>© 2026 Studyer Hub. Free for all students.</span>
      </footer>
    </div>
  )
}
