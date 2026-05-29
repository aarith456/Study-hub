import { getBearerUser } from '../lib/auth.js'
import { trackEvent } from '../lib/analyticsStore.js'
import { getTutorResponse } from '../lib/tutorApi.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }
  const user = getBearerUser(req.headers.authorization)
  if (!user) return res.status(401).json({ error: 'Sign in required' })
  if (user.role === 'admin') return res.status(403).json({ error: 'Use a student account for this feature' })
  try {
    const { provider, history, userMessage } = req.body || {}
    trackEvent('tutor_message', { userId: user.id, email: user.email, meta: { provider } })
    if (!provider || !Array.isArray(history) || typeof userMessage !== 'string') {
      return res.status(400).json({ error: 'Missing provider, history, or userMessage' })
    }
    const reply = await getTutorResponse(provider, history, userMessage)
    res.status(200).json({ reply })
  } catch (err) {
    res.status(500).json({ error: err.message || 'Tutor request failed' })
  }
}
