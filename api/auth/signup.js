import { signUp } from '../../lib/auth.js'
import { initDb } from '../../lib/db.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  try {
    await initDb()
    const { email, password, name } = req.body || {}
    const result = await signUp({ email, password, name })
    res.json(result)
  } catch (err) {
    res.status(400).json({ error: err.message || 'Sign up failed' })
  }
}
