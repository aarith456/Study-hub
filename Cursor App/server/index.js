import express from 'express'
import cors from 'cors'
import { loadEnv, hasGeminiKey } from '../lib/loadEnv.js'
import { registerAuthRoutes, registerAnalyticsRoutes, requireAuth } from '../lib/authRoutes.js'
import { registerAdminRoutes } from '../lib/adminRoutes.js'
import { trackEvent } from '../lib/analyticsStore.js'
import { getTutorResponse } from '../lib/tutorApi.js'
import { generateStudyGuide } from '../lib/studyGuideApi.js'

loadEnv()

const app = express()
app.use(cors())
app.use(express.json())

const PORT = process.env.PORT || 3001

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    hasGeminiKey: hasGeminiKey(),
  })
})

registerAuthRoutes(app)
registerAnalyticsRoutes(app)
registerAdminRoutes(app)

app.post('/api/tutor', requireAuth, async (req, res) => {
  try {
    const { provider, history, userMessage } = req.body
    if (!provider || !Array.isArray(history) || typeof userMessage !== 'string') {
      return res.status(400).json({ error: 'Missing provider, history, or userMessage' })
    }
    trackEvent('tutor_message', {
      userId: req.user.id,
      email: req.user.email,
      meta: { provider },
    })
    const reply = await getTutorResponse(provider, history, userMessage)
    res.json({ reply })
  } catch (err) {
    res.status(500).json({ error: err.message || 'Tutor request failed' })
  }
})

app.post('/api/study-guide', requireAuth, async (req, res) => {
  try {
    const { courseName, subject, topic, gradeLevel, notes } = req.body
    if (!courseName?.trim() || !topic?.trim()) {
      return res.status(400).json({ error: 'Course name and topic are required' })
    }
    trackEvent('study_guide', {
      userId: req.user.id,
      email: req.user.email,
      meta: { topic: topic.trim(), courseName: courseName.trim() },
    })
    const guide = await generateStudyGuide(process.env.GEMINI_API_KEY, {
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
})

app.listen(PORT, () => {
  console.log(`API running at http://localhost:${PORT}`)
})
