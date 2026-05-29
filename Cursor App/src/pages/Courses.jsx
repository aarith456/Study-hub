import { useState } from 'react'
import { Link } from 'react-router-dom'
import { getCourses, createCourse, deleteCourse } from '../utils/coursesStorage'
import { syncUsage } from '../services/analytics'
import { useAuth } from '../context/AuthContext'

export default function Courses() {
  const { user } = useAuth()
  const [courses, setCourses] = useState(() => getCourses())
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [subject, setSubject] = useState('')
  const [gradeLevel, setGradeLevel] = useState('')

  function refresh() {
    setCourses(getCourses())
  }

  function handleCreate(e) {
    e.preventDefault()
    if (!name.trim()) return
    createCourse({ name, subject, gradeLevel })
    setName('')
    setSubject('')
    setGradeLevel('')
    setShowForm(false)
    refresh()
    syncUsage(user?.name).catch(() => {})
  }

  function handleDelete(id, courseName) {
    if (!window.confirm(`Delete "${courseName}" and all its study guides?`)) return
    deleteCourse(id)
    refresh()
    syncUsage(user?.name).catch(() => {})
  }

  return (
    <div className="courses-page">
      <div className="page-head">
        <div>
          <h1>My courses</h1>
          <p className="page-sub">Add a course, then generate Gemini study guides for any topic.</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={() => setShowForm((v) => !v)}>
          {showForm ? 'Cancel' : '+ New course'}
        </button>
      </div>

      {showForm && (
        <form className="card form-card" onSubmit={handleCreate}>
          <label>
            Course name
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. AP Biology"
              required
            />
          </label>
          <label>
            Subject
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Science"
            />
          </label>
          <label>
            Grade level
            <input
              value={gradeLevel}
              onChange={(e) => setGradeLevel(e.target.value)}
              placeholder="e.g. 10th grade"
            />
          </label>
          <button type="submit" className="btn btn-primary">Create course</button>
        </form>
      )}

      {courses.length === 0 ? (
        <div className="empty-state card">
          <p>No courses yet. Create one to start building study guides.</p>
        </div>
      ) : (
        <ul className="course-list">
          {courses.map((c) => (
            <li key={c.id} className="card course-card">
              <Link to={`/courses/${c.id}`} className="course-card-link">
                <h2>{c.name}</h2>
                <p className="course-meta">
                  {[c.subject, c.gradeLevel].filter(Boolean).join(' · ') || 'General'}
                  {' · '}
                  {c.guides.length} guide{c.guides.length === 1 ? '' : 's'}
                </p>
              </Link>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => handleDelete(c.id, c.name)}
                aria-label={`Delete ${c.name}`}
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
