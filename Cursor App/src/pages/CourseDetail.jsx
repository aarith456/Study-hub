import { useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { getCourse, addGuideToCourse } from '../utils/coursesStorage'
import { generateStudyGuide } from '../services/studyGuide'
import { syncUsage } from '../services/analytics'
import { useAuth } from '../context/AuthContext'
import ErrorBoundary from '../components/ErrorBoundary'

function CourseDetailPage() {
  const { user } = useAuth()
  const { courseId } = useParams()
  const navigate = useNavigate()
  const [course, setCourse] = useState(() => getCourse(courseId))
  const [topic, setTopic] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  if (!course) {
    return (
      <div className="empty-state card">
        <p>Course not found.</p>
        <Link to="/courses">Back to courses</Link>
      </div>
    )
  }

  function refresh() {
    setCourse(getCourse(courseId))
  }

  async function handleGenerate(e) {
    e.preventDefault()
    const trimmedTopic = topic.trim()
    if (!trimmedTopic || loading) return

    setLoading(true)
    setError(null)
    try {
      const guideContent = await generateStudyGuide({
        courseName: course.name,
        subject: course.subject,
        topic: trimmedTopic,
        gradeLevel: course.gradeLevel,
        notes: notes.trim(),
      })
      const guide = addGuideToCourse(courseId, { topic: trimmedTopic, content: guideContent })
      setTopic('')
      setNotes('')
      refresh()
      syncUsage(user?.name).catch(() => {})
      if (guide) navigate(`/courses/${courseId}/guides/${guide.id}`)
    } catch (err) {
      const msg = err.message || 'Something went wrong.'
      let friendly = msg
      if (/fetch|failed|network|connection|refused|unreachable/i.test(msg)) {
        friendly =
          'Cannot reach the API server. Close everything, double-click start-app.bat, and keep the "Study Hub - API" window open. You need both API and App windows running.'
      } else if (/gemini api key is missing/i.test(msg)) {
        friendly =
          'GEMINI_API_KEY is missing. Open the .env file in the project folder, paste your key from https://aistudio.google.com/app/apikey, save, then restart start-app.bat.'
      } else if (/quota|rate.?limit|free tier/i.test(msg)) {
        friendly = msg
      }
      setError(friendly)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="course-detail">
      <Link to="/courses" className="back-link">← Courses</Link>
      <header className="page-head">
        <div>
          <h1>{course.name}</h1>
          <p className="page-sub">
            {[course.subject, course.gradeLevel].filter(Boolean).join(' · ') || 'Generate a study guide for any topic'}
          </p>
        </div>
      </header>

      <form className="card form-card generate-form" onSubmit={handleGenerate}>
        <h2 className="form-title">New study guide</h2>
        <p className="form-hint">Gemini will build an overview, key concepts, sections, practice questions, and curated resources.</p>
        <label>
          Topic to study
          <input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g. Photosynthesis, World War II causes, Quadratic equations"
            required
            disabled={loading}
          />
        </label>
        <label>
          Focus notes <span className="optional">(optional)</span>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. focus on exam-style problems, include formulas"
            rows={3}
            disabled={loading}
          />
        </label>
        {error && <div className="alert alert-error" role="alert">{error}</div>}
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Generating with Gemini…' : 'Generate study guide'}
        </button>
        {loading && <p className="loading-note">This may take 15–30 seconds.</p>}
      </form>

      <section className="guides-section">
        <h2>Saved guides</h2>
        {course.guides.length === 0 ? (
          <p className="muted">No guides yet. Generate one above.</p>
        ) : (
          <ul className="guide-links">
            {course.guides.map((g) => (
              <li key={g.id}>
                <Link to={`/courses/${courseId}/guides/${g.id}`} className="card guide-link-card">
                  <span className="guide-link-title">{g.content?.title || g.topic}</span>
                  <span className="guide-link-meta">
                    {g.topic} · {new Date(g.createdAt).toLocaleDateString()}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

export default function CourseDetail() {
  return (
    <ErrorBoundary>
      <CourseDetailPage />
    </ErrorBoundary>
  )
}
