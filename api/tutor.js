import { getBearerUser } from '../lib/auth.js'
import { getTutorResponse } from '../lib/tutorApi.js'
import { trackEvent } from '../lib/analyticsStore.js'
import { initDb } from '../lib/db.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  try {
    await initDb()
    const user = await getBearerUser(req.headers.authorization)
    if (!user) return res.status(401).json({ error: 'Sign in required' })
    if (user.role === 'admin') return res.status(403).json({ error: 'Use a student account' })
    const { history, userMessage } = req.body
    if (!Array.isArray(history) || typeof userMessage !== 'string') {
      return res.status(400).json({ error: 'Missing history or userMessage' })
    }
    await trackEvent('tutor_message', { userId: user.id, email: user.email })
    const reply = await getTutorResponse('openrouter', history, userMessage)
    res.json({ reply })
  } catch (err) {
    res.status(500).json({ error: err.message || 'Tutor request failed' })
  }
}
