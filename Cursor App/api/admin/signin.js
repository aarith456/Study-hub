import { adminSignIn } from '../../lib/auth.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  try {
    const { email, password } = req.body || {}
    const result = await adminSignIn({ email, password })
    res.status(200).json(result)
  } catch (err) {
    res.status(401).json({ error: err.message || 'Admin sign in failed' })
  }
}
