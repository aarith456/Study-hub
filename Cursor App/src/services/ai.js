import { authHeaders } from './auth.js'

const API_URL = '/api/tutor'

/**
 * Get a tutor reply from the selected provider (OpenAI or Gemini).
 * Keys are held on the server; this client only calls the backend.
 * @param {'openai' | 'gemini'} provider
 * @param {Array<{role: string, text: string}>} history
 * @param {string} userMessage
 */
export async function getTutorResponse(provider, history, userMessage) {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ provider, history, userMessage }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(data.error || `Request failed: ${res.status}`)
  }
  if (data.reply == null) {
    throw new Error('No reply from tutor')
  }
  return data.reply
}
