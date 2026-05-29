import { signUp, signIn, getBearerUser } from './auth.js'
import { trackEvent, updateUserStats } from './analyticsStore.js'

export function registerAuthRoutes(app) {
  app.post('/api/auth/signup', async (req, res) => {
    try {
      const { email, password, name } = req.body || {}
      const result = await signUp({ email, password, name })
      res.json(result)
    } catch (err) {
      res.status(400).json({ error: err.message || 'Sign up failed' })
    }
  })

  app.post('/api/auth/signin', async (req, res) => {
    try {
      const { email, password } = req.body || {}
      const result = await signIn({ email, password })
      res.json(result)
    } catch (err) {
      res.status(401).json({ error: err.message || 'Sign in failed' })
    }
  })

  app.get('/api/auth/me', (req, res) => {
    const user = getBearerUser(req.headers.authorization)
    if (!user) return res.status(401).json({ error: 'Not signed in' })
    res.json({ user })
  })
}

export function requireAuth(req, res, next) {
  const user = getBearerUser(req.headers.authorization)
  if (!user) return res.status(401).json({ error: 'Sign in required' })
  if (user.role === 'admin') return res.status(403).json({ error: 'Use a student account for this feature' })
  req.user = user
  next()
}

export function registerAnalyticsRoutes(app) {
  app.post('/api/analytics/sync', (req, res) => {
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
    res.json({ ok: true })
  })
}
