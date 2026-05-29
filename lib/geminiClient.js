/** Models that work on Gemini free tier (tried in order). */
const FALLBACK_MODELS = ['gemini-2.5-flash', 'gemini-2.0-flash-lite', 'gemini-1.5-flash']

export function getGeminiModels() {
  const preferred = process.env.GEMINI_MODEL?.trim()
  if (preferred) {
    return [preferred, ...FALLBACK_MODELS.filter((m) => m !== preferred)]
  }
  return FALLBACK_MODELS
}

function isQuotaOrUnavailable(message) {
  return /quota|rate.?limit|429|resource.?exhausted|limit:\s*0/i.test(message)
}

function friendlyQuotaMessage() {
  return (
    'Gemini free tier limit reached for this model. Wait about a minute and try again. ' +
    'You can also add GEMINI_MODEL=gemini-2.5-flash to your .env file and restart the API window.'
  )
}

/**
 * Call Gemini generateContent with automatic model fallback on quota errors.
 */
export async function generateGeminiContent(apiKey, requestBody) {
  if (!apiKey?.trim()) {
    throw new Error('Gemini API key is missing. Set GEMINI_API_KEY on the server.')
  }

  const models = getGeminiModels()
  let lastMessage = 'Gemini request failed'

  for (let i = 0; i < models.length; i++) {
    const model = models[i]
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    })

    if (res.ok) {
      return { data: await res.json(), model }
    }

    const err = await res.json().catch(() => ({}))
    lastMessage = err.error?.message || `Gemini error: ${res.status}`

    const canTryNext = isQuotaOrUnavailable(lastMessage) && i < models.length - 1
    if (!canTryNext) break
  }

  if (isQuotaOrUnavailable(lastMessage)) {
    throw new Error(friendlyQuotaMessage())
  }
  throw new Error(lastMessage)
}

export function extractGeminiText(data) {
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text
  if (text == null) throw new Error('No text in Gemini response')
  return text.trim()
}
