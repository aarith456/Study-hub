import { getBearerUser } from '../lib/auth.js'
import { generateStudyGuide } from '../lib/studyGuideApi.js'
import { trackEvent } from '../lib/analyticsStore.js'
import { initDb } from '../lib/db.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  try {
    await initDb()
    const user = await getBearerUser(req.headers.authorization)
    if (!user) return res.status(401).json({ error: 'Sign in required' })
    if (user.role === 'admin') return res.status(403).json({ error: 'Use a student account' })
    const { courseName, subject, topic, gradeLevel, notes } = req.body
    if (!courseName?.trim() || !topic?.trim()) {
      return res.status(400).json({ error: 'Course name and topic are required' })
    }
    await trackEvent('study_guide', { userId: user.id, email: user.email, meta: { topic, courseName } })
    const guide = await generateStudyGuide(process.env.OPENROUTER_API_KEY, {
      courseName: courseName.trim(),
      subject: subject?.trim() || '',
      topic: topic.trim(),
      gradeLevel: gradeLevel?.trim() || '',
      notes: notes?.trim() || '',
    })
    res.json({ guide })
  } catch (err) {
    res.status(500).json({ error: err.message || 'Study guide request failed' })
  }
}
