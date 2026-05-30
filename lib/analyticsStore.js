import { getDb } from './db.js'

export async function trackEvent(type, { userId, email, meta } = {}) {
  try {
    const sql = getDb()
    await sql`
      INSERT INTO events (id, type, user_id, email, meta)
      VALUES (${crypto.randomUUID()}, ${type}, ${userId || null}, ${email || null}, ${JSON.stringify(meta || {})})
    `
  } catch (e) {
    console.error('trackEvent error:', e.message)
  }
}

export async function updateUserStats(userId, { email, name, courseCount, guideCount, courses }) {
  if (!userId) return
  try {
    const sql = getDb()
    await sql`
      INSERT INTO user_stats (user_id, email, name, course_count, guide_count, courses, first_seen, last_seen)
      VALUES (${userId}, ${email || null}, ${name || null}, ${courseCount ?? 0}, ${guideCount ?? 0}, ${JSON.stringify(courses ?? [])}, NOW(), NOW())
      ON CONFLICT (user_id) DO UPDATE SET
        email = COALESCE(EXCLUDED.email, user_stats.email),
        name = COALESCE(EXCLUDED.name, user_stats.name),
        course_count = COALESCE(EXCLUDED.course_count, user_stats.course_count),
        guide_count = COALESCE(EXCLUDED.guide_count, user_stats.guide_count),
        courses = COALESCE(EXCLUDED.courses, user_stats.courses),
        last_seen = NOW()
    `
  } catch (e) {
    console.error('updateUserStats error:', e.message)
  }
}

export async function getAnalyticsData() {
  const sql = getDb()
  const now = Date.now()
  const day = 24 * 60 * 60 * 1000

  const [events, userStats] = await Promise.all([
    sql`SELECT * FROM events ORDER BY at DESC LIMIT 2000`,
    sql`SELECT * FROM user_stats ORDER BY last_seen DESC`,
  ])

  const eventsByType = {}
  for (const e of events) {
    eventsByType[e.type] = (eventsByType[e.type] || 0) + 1
  }

  const last7Days = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now - i * day)
    const key = d.toISOString().slice(0, 10)
    last7Days.push({ date: key, count: 0 })
  }
  const dayIndex = Object.fromEntries(last7Days.map((d, i) => [d.date, i]))
  for (const e of events) {
    const key = new Date(e.at).toISOString().slice(0, 10)
    if (dayIndex[key] !== undefined) last7Days[dayIndex[key]].count += 1
  }

  const users = userStats.map((s) => ({
    id: s.user_id,
    email: s.email,
    name: s.name,
    courseCount: s.course_count,
    guideCount: s.guide_count,
    courses: s.courses,
    firstSeen: s.first_seen,
    lastSeen: s.last_seen,
  }))

  const activeToday = users.filter((u) => now - new Date(u.lastSeen).getTime() < day).length

  return {
    summary: {
      totalUsers: users.length,
      activeToday,
      totalEvents: events.length,
      studyGuides: eventsByType.study_guide || 0,
      tutorMessages: eventsByType.tutor_message || 0,
      signups: eventsByType.signup || 0,
      signins: eventsByType.signin || 0,
      coursesCreated: eventsByType.course_created || 0,
    },
    eventsByType,
    activityLast7Days: last7Days,
    users,
    recentEvents: events.slice(0, 50),
  }
}
