import { authHeaders } from './auth.js'
import { getUsageSnapshot } from '../utils/coursesStorage'

export async function syncUsage(name) {
  const snapshot = getUsageSnapshot()
  const res = await fetch('/api/analytics/sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ ...snapshot, name }),
  })
  if (!res.ok) return
  return res.json()
}
