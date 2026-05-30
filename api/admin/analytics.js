import { getBearerUser } from '../../lib/auth.js'
import { getAnalyticsData } from '../../lib/analyticsStore.js'
import { initDb } from '../../lib/db.js'

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })
  try {
    await initDb()
    const user = await getBearerUser(req.headers.authorization)
    if (!user || user.role !== 'admin') return res.status(403).json({ error: 'Admin access required' })
    res.json(await getAnalyticsData())
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to get analytics' })
  }
}
