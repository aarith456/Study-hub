import { callOpenRouter } from './openrouterClient.js'

const STUDY_GUIDE_SYSTEM = 'You are an expert teacher creating engaging lesson-style study guides. Always respond with valid JSON only — no markdown, no code fences, no extra text.'

function buildStudyGuidePrompt({ courseName, subject, topic, gradeLevel, notes }) {
  return (
    'Create an engaging, lesson-style study guide that TEACHES the topic step by step. Write it as a teacher explaining to a student, not just listing facts.\n\n' +
    'Course: ' + courseName + '\n' +
    'Subject: ' + (subject || 'General') + '\n' +
    'Topic: ' + topic + '\n' +
    'Grade: ' + (gradeLevel || 'general') + '\n' +
    'Notes: ' + (notes || 'none') + '\n\n' +
    'Return ONLY a JSON object with these exact fields:\n' +
    '{\n' +
    '  "title": "string",\n' +
    '  "overview": "A friendly 2-paragraph intro explaining WHY this topic matters, written like a teacher speaking to a student",\n' +
    '  "keyConcepts": [{ "term": "string", "definition": "string — explain using an everyday analogy a student can relate to" }],\n' +
    '  "sections": [{ "title": "string", "content": "string — teach step by step with examples and analogies, written directly to the student" }],\n' +
    '  "studyTips": ["string — practical tips for learning and remembering this topic"],\n' +
    '  "practiceQuestions": [{ "question": "string", "hint": "string — a nudge to help the student think it through", "answer": "string — fully explain why this is the answer" }],\n' +
    '  "resources": [{ "title": "string", "type": "string", "description": "string", "url": "string", "searchQuery": "string" }]\n' +
    '}\n\n' +
    'Include 5 key concepts with relatable definitions, 4 lesson-style sections that build on each other, 4 study tips, 5 practice questions with explanatory answers, and 6 resources.'
  )
}

function stripJsonFences(text) {
  let s = text.trim()
  const fence = '```'
  if (s.startsWith(fence)) {
    s = s.replace(/^```(?:json)?\s*/i, '').replace(/\s*```[\s\S]*$/, '')
  }
  return s.trim()
}

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
  const overview = parsed.overview || parsed.summary || parsed.introduction || parsed.description
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

export async function generateStudyGuide(apiKey, params) {
  const messages = [
    { role: 'system', content: STUDY_GUIDE_SYSTEM },
    { role: 'user', content: buildStudyGuidePrompt(params) },
  ]

  let lastError
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const text = await callOpenRouter(process.env.OPENROUTER_API_KEY, messages)
      return parseStudyGuideJson(text, params.topic)
    } catch (err) {
      lastError = err
    }
  }

  throw new Error(
    lastError?.message || 'Could not build a valid study guide. Try again with a shorter or simpler topic.'
  )
}
