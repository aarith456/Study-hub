const OPENROUTER_MODEL = 'qwen/qwen3-8b:free'

export async function callOpenRouter(apiKey, messages) {
  if (!apiKey?.trim()) {
    throw new Error('OpenRouter API key is missing. Set OPENROUTER_API_KEY in your .env file.')
  }

  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': 'https://studyhub.app',
      'X-Title': 'Study Hub',
    },
    body: JSON.stringify({
      model: OPENROUTER_MODEL,
      messages,
      temperature: 0.7,
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error?.message || `OpenRouter error: ${res.status}`)
  }

  const data = await res.json()
  const content = data.choices?.[0]?.message?.content
  if (content == null) throw new Error('No reply from OpenRouter')
  return content
}
