import { useState, useRef } from 'react'
import { authHeaders } from '../services/auth'

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result.split(',')[1])
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function Section({ title, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="smax-section">
      <button className="smax-section-header" onClick={() => setOpen(o => !o)}>
        <span>{title}</span>
        <span className="smax-chevron">{open ? '▲' : '▼'}</span>
      </button>
      {open && <div className="smax-section-body">{children}</div>}
    </div>
  )
}

function FlashCard({ card }) {
  const [flipped, setFlipped] = useState(false)
  return (
    <div className={`smax-flashcard ${flipped ? 'flipped' : ''}`} onClick={() => setFlipped(f => !f)}>
      <div className="smax-flashcard-inner">
        <div className="smax-flashcard-front"><p>{card.front}</p></div>
        <div className="smax-flashcard-back"><p>{card.back}</p></div>
      </div>
      <span className="smax-flashcard-hint">{flipped ? 'Click to see question' : 'Click to flip'}</span>
    </div>
  )
}

export default function StudyMax() {
  const [step, setStep] = useState('upload')
  const [file, setFile] = useState(null)
  const [subject, setSubject] = useState('')
  const [deadline, setDeadline] = useState('')
  const [extraNotes, setExtraNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [results, setResults] = useState(null)
  const [activeTab, setActiveTab] = useState('summary')
  const fileRef = useRef()

  function handleDrop(e) {
    e.preventDefault()
    const f = e.dataTransfer.files[0]
    if (f) setFile(f)
  }

  async function analyze() {
    if (!file) return setError('Please upload your notes first.')
    if (!subject.trim()) return setError('Please enter the subject.')
    setError(null)
    setLoading(true)
    setStep('processing')

    try {
      const base64 = await fileToBase64(file)
      let notesContent = ''
      if (file.type === 'text/plain') {
        notesContent = atob(base64)
      } else {
        notesContent = `[Student uploaded file: ${file.name}. Assume these are notes on ${subject} and generate a full study package based on that subject.]`
      }

      const prompt = `You are an expert study coach. A student has uploaded their notes on "${subject}".
${deadline ? 'Their exam/deadline is: ' + deadline + '.' : ''}
${extraNotes ? 'Additional context: ' + extraNotes : ''}

Notes content:
${notesContent.slice(0, 3000)}

Return ONLY a valid JSON object with this structure (no markdown, no extra text):
{
  "subject": "${subject}",
  "summary": "A clear 3-4 paragraph summary of the key content",
  "keyTopics": ["topic1", "topic2", "topic3", "topic4", "topic5"],
  "gaps": ["gap 1", "gap 2", "gap 3"],
  "studyPlan": [
    { "day": "Day 1", "focus": "Topic", "tasks": ["Task 1", "Task 2", "Task 3"], "duration": "2 hours" },
    { "day": "Day 2", "focus": "Topic", "tasks": ["Task 1", "Task 2"], "duration": "1.5 hours" },
    { "day": "Day 3", "focus": "Topic", "tasks": ["Task 1", "Task 2"], "duration": "2 hours" },
    { "day": "Day 4", "focus": "Topic", "tasks": ["Task 1", "Task 2"], "duration": "1 hour" },
    { "day": "Day 5", "focus": "Review", "tasks": ["Review all", "Practice questions"], "duration": "1 hour" }
  ],
  "flashcards": [
    { "front": "Question?", "back": "Answer" },
    { "front": "Question?", "back": "Answer" },
    { "front": "Question?", "back": "Answer" },
    { "front": "Question?", "back": "Answer" },
    { "front": "Question?", "back": "Answer" },
    { "front": "Question?", "back": "Answer" },
    { "front": "Question?", "back": "Answer" },
    { "front": "Question?", "back": "Answer" }
  ],
  "studyGuide": {
    "title": "Guide title",
    "overview": "2 paragraph overview",
    "keyConcepts": [{ "term": "term", "definition": "definition with example" }],
    "sections": [{ "title": "section", "content": "detailed explanation" }],
    "studyTips": ["tip 1", "tip 2", "tip 3"],
    "practiceQuestions": [{ "question": "question?", "hint": "hint", "answer": "full answer" }]
  }
}`

      const res = await fetch('/api/tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ history: [], userMessage: prompt }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Analysis failed')

      const text = data.reply
      const clean = text.replace(/```json|```/g, '').trim()
      const start = clean.indexOf('{')
      const parsed = JSON.parse(clean.slice(start))
      setResults(parsed)
      setStep('results')
    } catch (e) {
      setError(e.message || 'Something went wrong. Please try again.')
      setStep('upload')
    } finally {
      setLoading(false)
    }
  }

  if (step === 'processing') return (
    <div className="smax-processing">
      <div className="quiz-spinner" style={{ width: 48, height: 48, borderWidth: 4 }} />
      <h3>Analysing your notes…</h3>
      <p>Creating your summary, study plan, flashcards and study guide.</p>
    </div>
  )

  if (step === 'results' && results) return (
    <div className="smax">
      <div className="smax-results-header">
        <div>
          <h2 className="smax-title">Study Max</h2>
          <p className="smax-subtitle">{results.subject}</p>
        </div>
        <button className="quiz-btn quiz-btn-secondary" onClick={() => { setStep('upload'); setFile(null); setResults(null) }}>
          ← New Analysis
        </button>
      </div>

      <div className="smax-tabs">
        {[
          { id: 'summary', label: '📋 Summary' },
          { id: 'plan', label: '📅 Study Plan' },
          { id: 'flashcards', label: '🃏 Flashcards' },
          { id: 'guide', label: '📚 Study Guide' },
        ].map(t => (
          <button key={t.id} className={`smax-tab ${activeTab === t.id ? 'active' : ''}`} onClick={() => setActiveTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'summary' && (
        <div className="smax-tab-content">
          <Section title="Summary">
            <p className="smax-body">{results.summary}</p>
          </Section>
          <Section title="Key Topics Covered">
            <div className="smax-tags">
              {results.keyTopics?.map((t, i) => <span key={i} className="smax-tag">{t}</span>)}
            </div>
          </Section>
          <Section title="⚠️ Gaps and Areas to Focus On">
            <ul className="smax-list">
              {results.gaps?.map((g, i) => <li key={i}>{g}</li>)}
            </ul>
          </Section>
        </div>
      )}

      {activeTab === 'plan' && (
        <div className="smax-tab-content">
          <Section title="Your Personalised Study Plan">
            <div className="smax-plan">
              {results.studyPlan?.map((day, i) => (
                <div key={i} className="smax-plan-day">
                  <div className="smax-plan-day-header">
                    <span className="smax-plan-day-label">{day.day}</span>
                    <span className="smax-plan-duration">⏱ {day.duration}</span>
                  </div>
                  <p className="smax-plan-focus">{day.focus}</p>
                  <ul className="smax-list">
                    {day.tasks?.map((t, j) => <li key={j}>{t}</li>)}
                  </ul>
                </div>
              ))}
            </div>
          </Section>
        </div>
      )}

      {activeTab === 'flashcards' && (
        <div className="smax-tab-content">
          <p className="smax-hint">Click a card to flip it!</p>
          <div className="smax-flashcards-grid">
            {results.flashcards?.map((card, i) => (
              <FlashCard key={i} card={card} />
            ))}
          </div>
        </div>
      )}

      {activeTab === 'guide' && results.studyGuide && (
        <div className="smax-tab-content">
          <Section title="Overview">
            <p className="smax-body">{results.studyGuide.overview}</p>
          </Section>
          {results.studyGuide.keyConcepts?.length > 0 && (
            <Section title="Key Concepts">
              <dl className="concept-list">
                {results.studyGuide.keyConcepts.map((c, i) => (
                  <div key={i} className="concept-card">
                    <dt>{c.term}</dt>
                    <dd>{c.definition}</dd>
                  </div>
                ))}
              </dl>
            </Section>
          )}
          {results.studyGuide.sections?.map((s, i) => (
            <Section key={i} title={s.title} defaultOpen={i === 0}>
              <p className="smax-body">{s.content}</p>
            </Section>
          ))}
          {results.studyGuide.studyTips?.length > 0 && (
            <Section title="Study Tips">
              <ul className="smax-list">
                {results.studyGuide.studyTips.map((t, i) => <li key={i}>{t}</li>)}
              </ul>
            </Section>
          )}
          {results.studyGuide.practiceQuestions?.length > 0 && (
            <Section title="Practice Questions">
              <ol className="practice-list">
                {results.studyGuide.practiceQuestions.map((q, i) => (
                  <li key={i} className="practice-item">
                    <p className="practice-q">{q.question}</p>
                    {q.hint && <p className="practice-hint"><strong>Hint:</strong> {q.hint}</p>}
                    <details className="practice-answer">
                      <summary>Show answer</summary>
                      <p>{q.answer}</p>
                    </details>
                  </li>
                ))}
              </ol>
            </Section>
          )}
        </div>
      )}
    </div>
  )

  return (
    <div className="smax">
      <h2 className="smax-title">Study Max ⚡</h2>
      <p className="smax-subtitle">Upload your notes and get a full study package — summary, plan, flashcards and study guide.</p>

      {error && <div className="tutor-error">{error}</div>}

      <div
        className={`smax-dropzone ${file ? 'smax-dropzone--filled' : ''}`}
        onDragOver={e => e.preventDefault()}
        onDrop={handleDrop}
        onClick={() => fileRef.current?.click()}
      >
        <input
          ref={fileRef}
          type="file"
          accept=".txt,.pdf,image/*"
          style={{ display: 'none' }}
          onChange={e => setFile(e.target.files[0])}
        />
        {file ? (
          <div className="smax-file-info">
            <span className="smax-file-icon">📄</span>
            <span className="smax-file-name">{file.name}</span>
            <button className="smax-file-remove" onClick={e => { e.stopPropagation(); setFile(null) }}>✕</button>
          </div>
        ) : (
          <>
            <span className="smax-drop-icon">⬆️</span>
            <p className="smax-drop-text">Drop your notes here or click to upload</p>
            <p className="smax-drop-hint">Supports .txt, .pdf, and images</p>
          </>
        )}
      </div>

      <div className="smax-form">
        <div className="smax-field">
          <label className="smax-label">Subject *</label>
          <input
            type="text"
            className="tutor-input"
            placeholder="e.g. World War 2, Calculus, Biology..."
            value={subject}
            onChange={e => setSubject(e.target.value)}
          />
        </div>
        <div className="smax-field">
          <label className="smax-label">Exam / Deadline (optional)</label>
          <input
            type="text"
            className="tutor-input"
            placeholder="e.g. Friday, June 30th..."
            value={deadline}
            onChange={e => setDeadline(e.target.value)}
          />
        </div>
        <div className="smax-field">
          <label className="smax-label">Extra context (optional)</label>
          <textarea
            className="tutor-input smax-textarea"
            placeholder="e.g. I struggle with dates and names, focus on causes and effects..."
            value={extraNotes}
            onChange={e => setExtraNotes(e.target.value)}
            rows={3}
          />
        </div>
        <button className="quiz-btn" style={{ width: '100%', padding: '0.85rem' }} onClick={analyze} disabled={!file || !subject.trim()}>
          ⚡ Analyse My Notes
        </button>
      </div>
    </div>
  )
}
