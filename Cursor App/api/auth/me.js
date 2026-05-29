import { getBearerUser } from '../../lib/auth.js'

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })
  const user = getBearerUser(req.headers.authorization)
  if (!user) return res.status(401).json({ error: 'Not signed in' })
  res.status(200).json({ user })
}
