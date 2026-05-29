import { adminSignIn, getBearerUser } from './auth.js'
import { getAnalyticsData } from './analyticsStore.js'

export function registerAdminRoutes(app) {
  app.post('/api/admin/signin', async (req, res) => {
    try {
      const { email, password } = req.body || {}
      const result = await adminSignIn({ email, password })
      res.json(result)
    } catch (err) {
      res.status(401).json({ error: err.message || 'Admin sign in failed' })
    }
  })

  app.get('/api/admin/analytics', requireAdmin, (_req, res) => {
    res.json(getAnalyticsData())
  })
}

export function requireAdmin(req, res, next) {
  const user = getBearerUser(req.headers.authorization)
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' })
  }
  req.user = user
  next()
}
