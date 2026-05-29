import { generateGeminiContent, extractGeminiText } from './geminiClient.js'

const STUDY_GUIDE_RESPONSE_SCHEMA = {
  type: 'OBJECT',
  required: [
    'title',
    'overview',
    'keyConcepts',
    'sections',
    'studyTips',
    'practiceQuestions',
    'resources',
  ],
  properties: {
    title: { type: 'STRING' },
    overview: { type: 'STRING' },
    keyConcepts: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        required: ['term', 'definition'],
        properties: {
          term: { type: 'STRING' },
          definition: { type: 'STRING' },
        },
      },
    },
    sections: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        required: ['title', 'content'],
        properties: {
          title: { type: 'STRING' },
          content: { type: 'STRING' },
        },
      },
    },
    studyTips: { type: 'ARRAY', items: { type: 'STRING' } },
    practiceQuestions: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        required: ['question', 'answer'],
        properties: {
          question: { type: 'STRING' },
          hint: { type: 'STRING' },
          answer: { type: 'STRING' },
        },
      },
    },
    resources: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        required: ['title', 'type', 'description'],
        properties: {
          title: { type: 'STRING' },
          type: { type: 'STRING' },
          description: { type: 'STRING' },
          url: { type: 'STRING' },
          searchQuery: { type: 'STRING' },
        },
      },
    },
  },
}

function buildStudyGuidePrompt({ courseName, subject, topic, gradeLevel, notes }) {
  return `Create a school study guide as JSON.

Course: ${courseName}
Subject: ${subject || 'General'}
Topic: ${topic}
Grade: ${gradeLevel || 'general'}
Notes: ${notes || 'none'}

Write clear, accurate content for a student. Overview should be 2 short paragraphs. Include 5 key concepts, 4 sections, 4 study tips, 5 practice questions (with hints), and 6 learning resources.`
}

function buildRepairPrompt({ courseName, topic }) {
  return `Return ONLY one JSON object for a study guide on "${topic}" in course "${courseName}".
Fields: title, overview (string), keyConcepts [{term, definition}], sections [{title, content}], studyTips [strings], practiceQuestions [{question, hint, answer}], resources [{title, type, description, url, searchQuery}].
No markdown. No extra text.`
}

function stripJsonFences(text) {
  let s = text.trim()
  if (s.startsWith('```')) {
    s = s.replace(/^```(?:json)?\s*/i, '').replace(/\s*```[\s\S]*$/, '')
  }
  return s.trim()
}

/** Pull the outermost JSON object from model output and fix common issues. */
export function extractJsonFromText(raw) {
  let s = stripJsonFences(raw)
  const start = s.indexOf('{')
  if (start === -1) throw new SyntaxError('No JSON object in response')
  s = s.slice(start)

  const attempts = [
    s,
    s.replace(/,\s*([}\]])/g, '$1'),
    repairTruncatedJson(s),
  ]

  let lastErr
  for (const candidate of attempts) {
    try {
      return JSON.parse(candidate)
    } catch (e) {
      lastErr = e
    }
  }
  throw lastErr
}

function repairTruncatedJson(s) {
  let trimmed = s.replace(/,\s*([}\]])/g, '$1')
  const opens = (trimmed.match(/{/g) || []).length
  const closes = (trimmed.match(/}/g) || []).length
  const openBrackets = (trimmed.match(/\[/g) || []).length
  const closeBrackets = (trimmed.match(/]/g) || []).length
  for (let i = 0; i < openBrackets - closeBrackets; i++) trimmed += ']'
  for (let i = 0; i < opens - closes; i++) trimmed += '}'
  return trimmed.replace(/,\s*([}\]])/g, '$1')
}

function normalizeGuide(parsed, fallbackTopic) {
  const title = parsed.title || parsed.name || fallbackTopic
  const overview =
    parsed.overview || parsed.summary || parsed.introduction || parsed.description
  if (!title || !overview) {
    throw new Error('Study guide JSON is missing required fields')
  }
  return {
    title: String(title),
    overview: String(overview),
    keyConcepts: Array.isArray(parsed.keyConcepts) ? parsed.keyConcepts : [],
    sections: Array.isArray(parsed.sections) ? parsed.sections : [],
    studyTips: Array.isArray(parsed.studyTips) ? parsed.studyTips : [],
    practiceQuestions: Array.isArray(parsed.practiceQuestions) ? parsed.practiceQuestions : [],
    resources: Array.isArray(parsed.resources) ? parsed.resources : [],
  }
}

export function parseStudyGuideJson(raw, fallbackTopic = 'Study guide') {
  const parsed = extractJsonFromText(raw)
  return normalizeGuide(parsed, fallbackTopic)
}

async function requestStudyGuide(apiKey, prompt, useSchema) {
  const generationConfig = {
    temperature: 0.3,
    maxOutputTokens: 8192,
    responseMimeType: 'application/json',
  }
  if (useSchema) {
    generationConfig.responseSchema = STUDY_GUIDE_RESPONSE_SCHEMA
  }

  const { data } = await generateGeminiContent(apiKey, {
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig,
  })

  return extractGeminiText(data)
}

export async function generateStudyGuide(apiKey, params) {
  const attempts = [
    { prompt: buildStudyGuidePrompt(params), useSchema: true },
    { prompt: buildRepairPrompt(params), useSchema: true },
    { prompt: buildRepairPrompt(params), useSchema: false },
  ]

  let lastError
  for (const { prompt, useSchema } of attempts) {
    try {
      const text = await requestStudyGuide(apiKey, prompt, useSchema)
      return parseStudyGuideJson(text, params.topic)
    } catch (err) {
      lastError = err
    }
  }

  const msg = lastError?.message || 'Unknown error'
  if (/quota|rate.?limit/i.test(msg)) throw lastError
  throw new Error(
    'Could not build a valid study guide. Wait a moment and try again with a shorter or simpler topic.'
  )
}
