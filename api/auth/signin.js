import { signIn } from '../../lib/auth.js'
import { initDb } from '../../lib/db.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  try {
    await initDb()
    const { email, password } = req.body || {}
    const result = await signIn({ email, password })
    res.json(result)
  } catch (err) {
    res.status(401).json({ error: err.message || 'Sign in failed' })
  }
}
