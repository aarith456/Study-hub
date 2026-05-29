import { Link, useParams, useNavigate } from 'react-router-dom'
import { getGuide, deleteGuide } from '../utils/coursesStorage'
import StudyGuideView from '../components/StudyGuideView'

export default function GuideView() {
  const { courseId, guideId } = useParams()
  const navigate = useNavigate()
  const result = getGuide(courseId, guideId)

  if (!result) {
    return (
      <div className="empty-state card">
        <p>Study guide not found.</p>
        <Link to={`/courses/${courseId}`}>Back to course</Link>
      </div>
    )
  }

  const { course, guide } = result

  function handleDelete() {
    if (!window.confirm('Delete this study guide?')) return
    deleteGuide(courseId, guideId)
    navigate(`/courses/${courseId}`)
  }

  return (
    <div className="guide-page">
      <div className="guide-toolbar">
        <Link to={`/courses/${courseId}`} className="back-link">← {course.name}</Link>
        <button type="button" className="btn btn-ghost btn-sm" onClick={handleDelete}>
          Delete guide
        </button>
      </div>
      <StudyGuideView guide={guide.content} topic={guide.topic} />
    </div>
  )
}
