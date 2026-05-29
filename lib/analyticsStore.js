import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const dataDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'data')
const analyticsPath = join(dataDir, 'analytics.json')

const MAX_EVENTS = 2000

function defaultStore() {
  return { events: [], userStats: {} }
}

function ensureStore() {
  if (!existsSync(dataDir)) mkdirSync(dataDir, { recursive: true })
  if (!existsSync(analyticsPath)) {
    writeFileSync(analyticsPath, JSON.stringify(defaultStore(), null, 2), 'utf8')
  }
}

function readStore() {
  ensureStore()
  try {
    const data = JSON.parse(readFileSync(analyticsPath, 'utf8'))
    return {
      events: Array.isArray(data.events) ? data.events : [],
      userStats: data.userStats && typeof data.userStats === 'object' ? data.userStats : {},
    }
  } catch {
    return defaultStore()
  }
}

function writeStore(data) {
  ensureStore()
  writeFileSync(analyticsPath, JSON.stringify(data, null, 2), 'utf8')
}

export function trackEvent(type, { userId, email, meta } = {}) {
  const store = readStore()
  store.events.unshift({
    id: crypto.randomUUID(),
    type,
    userId: userId || null,
    email: email || null,
    meta: meta || {},
    at: new Date().toISOString(),
  })
  if (store.events.length > MAX_EVENTS) {
    store.events = store.events.slice(0, MAX_EVENTS)
  }
  writeStore(store)
}

export function updateUserStats(userId, { email, name, courseCount, guideCount, courses }) {
  if (!userId) return
  const store = readStore()
  const prev = store.userStats[userId] || {}
  store.userStats[userId] = {
    email: email || prev.email,
    name: name || prev.name,
    courseCount: courseCount ?? prev.courseCount ?? 0,
    guideCount: guideCount ?? prev.guideCount ?? 0,
    courses: courses ?? prev.courses ?? [],
    lastSeen: new Date().toISOString(),
    firstSeen: prev.firstSeen || new Date().toISOString(),
  }
  writeStore(store)
}

export function getAnalyticsData() {
  const store = readStore()
  const now = Date.now()
  const day = 24 * 60 * 60 * 1000

  const eventsByType = {}
  for (const e of store.events) {
    eventsByType[e.type] = (eventsByType[e.type] || 0) + 1
  }

  const last7Days = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now - i * day)
    const key = d.toISOString().slice(0, 10)
    last7Days.push({ date: key, count: 0 })
  }
  const dayIndex = Object.fromEntries(last7Days.map((d, i) => [d.date, i]))

  for (const e of store.events) {
    const key = e.at.slice(0, 10)
    if (dayIndex[key] !== undefined) {
      last7Days[dayIndex[key]].count += 1
    }
  }

  const users = Object.entries(store.userStats).map(([id, s]) => ({
    id,
    email: s.email,
    name: s.name,
    courseCount: s.courseCount,
    guideCount: s.guideCount,
    courses: s.courses,
    firstSeen: s.firstSeen,
    lastSeen: s.lastSeen,
  }))

  users.sort((a, b) => new Date(b.lastSeen) - new Date(a.lastSeen))

  const activeToday = users.filter((u) => {
    const seen = new Date(u.lastSeen).getTime()
    return now - seen < day
  }).length

  return {
    summary: {
      totalUsers: users.length,
      activeToday,
      totalEvents: store.events.length,
      studyGuides: eventsByType.study_guide || 0,
      tutorMessages: eventsByType.tutor_message || 0,
      signups: eventsByType.signup || 0,
      signins: eventsByType.signin || 0,
      coursesCreated: eventsByType.course_created || 0,
    },
    eventsByType,
    activityLast7Days: last7Days,
    users,
    recentEvents: store.events.slice(0, 50),
  }
}
