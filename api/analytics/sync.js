import { getBearerUser } from '../../lib/auth.js'
import { trackEvent, updateUserStats } from '../../lib/analyticsStore.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const user = getBearerUser(req.headers.authorization)
  if (!user || user.role === 'admin') {
    return res.status(401).json({ error: 'Sign in required' })
  }
  const { courseCount, guideCount, courses, name } = req.body || {}
  updateUserStats(user.id, {
    email: user.email,
    name: name || user.name,
    courseCount: Number(courseCount) || 0,
    guideCount: Number(guideCount) || 0,
    courses: Array.isArray(courses) ? courses : [],
  })
  trackEvent('usage_sync', { userId: user.id, email: user.email, meta: { courseCount, guideCount } })
  res.status(200).json({ ok: true })
}
