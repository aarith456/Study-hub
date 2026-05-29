const LEGACY_KEY = 'school-app-courses'

let activeUserId = null

export function setCoursesUserId(userId) {
  activeUserId = userId || null
  if (userId) migrateLegacyCourses(userId)
}

function storageKey() {
  if (!activeUserId) return `${LEGACY_KEY}-guest`
  return `${LEGACY_KEY}-${activeUserId}`
}

function migrateLegacyCourses(userId) {
  const legacy = localStorage.getItem(LEGACY_KEY)
  const userKey = `${LEGACY_KEY}-${userId}`
  if (!legacy || localStorage.getItem(userKey)) return
  localStorage.setItem(userKey, legacy)
}

function load() {
  try {
    const raw = localStorage.getItem(storageKey())
    if (!raw) return { courses: [] }
    const data = JSON.parse(raw)
    return { courses: Array.isArray(data.courses) ? data.courses : [] }
  } catch {
    return { courses: [] }
  }
}

function save(data) {
  localStorage.setItem(storageKey(), JSON.stringify(data))
}

export function getCourses() {
  return load().courses
}

export function getCourse(id) {
  return getCourses().find((c) => c.id === id) ?? null
}

export function getUsageSnapshot() {
  const courses = getCourses()
  return {
    courseCount: courses.length,
    guideCount: courses.reduce((n, c) => n + (c.guides?.length || 0), 0),
    courses: courses.map((c) => ({
      name: c.name,
      subject: c.subject,
      guideCount: c.guides?.length || 0,
    })),
  }
}

export function createCourse({ name, subject, gradeLevel }) {
  const course = {
    id: crypto.randomUUID(),
    name: name.trim(),
    subject: subject?.trim() || '',
    gradeLevel: gradeLevel?.trim() || '',
    guides: [],
    createdAt: new Date().toISOString(),
  }
  const data = load()
  data.courses.unshift(course)
  save(data)
  return course
}

export function deleteCourse(id) {
  const data = load()
  data.courses = data.courses.filter((c) => c.id !== id)
  save(data)
}

export function addGuideToCourse(courseId, { topic, content }) {
  const data = load()
  const course = data.courses.find((c) => c.id === courseId)
  if (!course) return null

  const guide = {
    id: crypto.randomUUID(),
    topic: topic.trim(),
    content,
    createdAt: new Date().toISOString(),
  }
  course.guides.unshift(guide)
  save(data)
  return guide
}

export function getGuide(courseId, guideId) {
  const course = getCourse(courseId)
  if (!course) return null
  const guide = course.guides.find((g) => g.id === guideId)
  if (!guide) return null
  return { course, guide }
}

export function deleteGuide(courseId, guideId) {
  const data = load()
  const course = data.courses.find((c) => c.id === courseId)
  if (!course) return
  course.guides = course.guides.filter((g) => g.id !== guideId)
  save(data)
}
