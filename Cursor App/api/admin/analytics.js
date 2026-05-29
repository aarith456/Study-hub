import { getBearerUser } from '../../lib/auth.js'
import { getAnalyticsData } from '../../lib/analyticsStore.js'

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })
  const user = getBearerUser(req.headers.authorization)
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' })
  }
  res.status(200).json(getAnalyticsData())
}
