import { getBearerUser } from '../../lib/auth.js'
import { initDb } from '../../lib/db.js'

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })
  try {
    await initDb()
    const user = await getBearerUser(req.headers.authorization)
    if (!user) return res.status(401).json({ error: 'Not signed in' })
    res.json({ user })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}
