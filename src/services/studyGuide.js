import { authHeaders } from './auth.js'

const API_URL = '/api/study-guide'

/**
 * Generate a study guide with Gemini (server-side key).
 * @param {{ courseName: string, subject?: string, topic: string, gradeLevel?: string, notes?: string }} params
 */
export async function generateStudyGuide(params) {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(params),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(data.error || `Request failed: ${res.status}`)
  }
  if (!data.guide) {
    throw new Error('No study guide returned')
  }
  return data.guide
}
