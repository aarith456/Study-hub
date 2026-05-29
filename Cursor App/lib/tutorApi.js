import { generateGeminiContent, extractGeminiText } from './geminiClient.js'

const TUTOR_SYSTEM = 'You are a helpful, patient tutor. Explain things clearly and encourage the student. Keep answers focused and not too long.'

function toOpenAIMessages(history, userMessage) {
  return [
    { role: 'system', content: TUTOR_SYSTEM },
    ...history.map((m) => ({
      role: m.role === 'tutor' ? 'assistant' : 'user',
      content: m.text,
    })),
    { role: 'user', content: userMessage },
  ]
}

function toGeminiContents(history, userMessage) {
  const contents = []
  let i = 0
  while (i < history.length && history[i].role === 'tutor') i++
  for (; i < history.length; i++) {
    const m = history[i]
    contents.push({
      role: m.role === 'tutor' ? 'model' : 'user',
      parts: [{ text: m.text }],
    })
  }
  contents.push({ role: 'user', parts: [{ text: userMessage }] })
  return contents
}

export async function getOpenAIResponse(apiKey, history, userMessage) {
  if (!apiKey?.trim()) {
    throw new Error('OpenAI API key is missing. Set OPENAI_API_KEY on the server.')
  }
  const messages = toOpenAIMessages(history, userMessage)
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages,
      temperature: 0.7,
    }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error?.message || `OpenAI error: ${res.status}`)
  }
  const data = await res.json()
  const content = data.choices?.[0]?.message?.content
  if (content == null) throw new Error('No reply from OpenAI')
  return content
}

export async function getGeminiResponse(apiKey, history, userMessage) {
  const contents = toGeminiContents(history, userMessage)
  const { data } = await generateGeminiContent(apiKey, {
    contents,
    systemInstruction: { parts: [{ text: TUTOR_SYSTEM }] },
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 1024,
    },
  })
  return extractGeminiText(data)
}

export async function getTutorResponse(provider, history, userMessage) {
  const openaiKey = process.env.OPENAI_API_KEY
  const geminiKey = process.env.GEMINI_API_KEY

  if (provider === 'openai') {
    return getOpenAIResponse(openaiKey, history, userMessage)
  }
  if (provider === 'gemini') {
    return getGeminiResponse(geminiKey, history, userMessage)
  }
  throw new Error('Unknown provider')
}
