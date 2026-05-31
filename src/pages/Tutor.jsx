import { useState, useRef, useEffect } from 'react'
import { getTutorResponse } from '../services/ai'
import ErrorBoundary from '../components/ErrorBoundary'

const INITIAL_MESSAGE = {
  role: 'tutor',
  text: "Hi! I'm your AI tutor. Ask me anything — or hit Quiz Me to test your knowledge on any topic!",
}

function parseQuiz(text) {
  try {
    const clean = text.replace(/```json|```/g, '').trim()
    const start = clean.indexOf('{')
    if (start === -1) return null
    return JSON.parse(clean.slice(start))
  } catch {
    return null
  }
}

function QuizMode({ topic, onExit }) {
  const [phase, setPhase] = useState('loading')
  const [questions, setQuestions] = useState([])
  const [current, setCurrent] = useState(0)
  const [selected, setSelected] = useState(null)
  const [answers, setAnswers] = useState([])
  const [report, setReport] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function loadQuiz() {
      try {
        const prompt = `Generate a quiz with exactly 5 multiple choice questions about: "${topic}".
Return ONLY valid JSON in this exact format:
{
  "topic": "${topic}",
  "questions": [
    {
      "question": "Question text here?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct": 0,
      "explanation": "Why this answer is correct"
    }
  ]
}
correct is the index (0-3) of the correct option. Return JSON only, no other text.`
        const reply = await getTutorResponse('openrouter', [], prompt)
        const quiz = parseQuiz(reply)
        if (!quiz || !quiz.questions?.length) throw new Error('Could not generate quiz')
        setQuestions(quiz.questions)
        setPhase('quiz')
      } catch (e) {
        setError(e.message || 'Failed to generate quiz')
        setPhase('error')
      }
    }
    loadQuiz()
  }, [topic])

  function selectAnswer(idx) {
    if (selected !== null) return
    setSelected(idx)
  }

  function next() {
    const q = questions[current]
    const newAnswers = [...answers, { question: q.question, selected, correct: q.correct, topic: q.topic || topic }]
    setAnswers(newAnswers)
    setSelected(null)
    if (current + 1 < questions.length) {
      setCurrent(current + 1)
    } else {
      generateReport(newAnswers)
    }
  }

  async function generateReport(allAnswers) {
    setPhase('analyzing')
    const score = allAnswers.filter(a => a.selected === a.correct).length
    const wrong = allAnswers.filter(a => a.selected !== a.correct).map(a => a.question)
    try {
      const prompt = `A student just took a quiz on "${topic}". They got ${score}/${allAnswers.length} correct.
Wrong questions: ${wrong.length > 0 ? wrong.join('; ') : 'none'}.
Give a short 2-3 sentence analysis: what they did well, what they need to work on most, and one specific study tip. Be encouraging but honest.`
      const analysis = await getTutorResponse('openrouter', [], prompt)
      setReport({ score, total: allAnswers.length, analysis, answers: allAnswers })
      setPhase('report')
    } catch {
      setReport({ score, total: allAnswers.length, analysis: null, answers: allAnswers })
      setPhase('report')
    }
  }

  if (phase === 'loading') return (
    <div className="quiz-loading">
      <div className="quiz-spinner" />
      <p>Generating your quiz on <strong>{topic}</strong>…</p>
    </div>
  )

  if (phase === 'error') return (
    <div className="quiz-error">
      <p>{error}</p>
      <button className="quiz-btn" onClick={onExit}>Back to Tutor</button>
    </div>
  )

  if (phase === 'analyzing') return (
    <div className="quiz-loading">
      <div className="quiz-spinner" />
      <p>Analysing your results…</p>
    </div>
  )

  if (phase === 'report') {
    const pct = Math.round((report.score / report.total) * 100)
    const grade = pct >= 80 ? '🎉' : pct >= 60 ? '👍' : '📚'
    return (
      <div className="quiz-report">
        <div className="quiz-report-score">
          <span className="quiz-report-emoji">{grade}</span>
          <span className="quiz-report-num">{report.score}/{report.total}</span>
          <span className="quiz-report-pct">{pct}%</span>
        </div>
        {report.analysis && (
          <div className="quiz-report-analysis">
            <h3>Where to focus</h3>
            <p>{report.analysis}</p>
          </div>
        )}
        <div className="quiz-report-review">
          <h3>Review answers</h3>
          {report.answers.map((a, i) => {
            const q = questions[i]
            const correct = a.selected === a.correct
            return (
              <div key={i} className={`quiz-review-item ${correct ? 'quiz-review-correct' : 'quiz-review-wrong'}`}>
                <p className="quiz-review-q"><strong>Q{i+1}:</strong> {a.question}</p>
                <p className="quiz-review-a">
                  {correct ? '✓' : '✗'} Your answer: <strong>{q.options[a.selected]}</strong>
                  {!correct && <span> · Correct: <strong>{q.options[a.correct]}</strong></span>}
                </p>
                {!correct && q.explanation && (
                  <p className="quiz-review-exp">{q.explanation}</p>
                )}
              </div>
            )
          })}
        </div>
        <div className="quiz-report-actions">
          <button className="quiz-btn quiz-btn-secondary" onClick={() => { setCurrent(0); setAnswers([]); setSelected(null); setPhase('loading') }}>Retake Quiz</button>
          <button className="quiz-btn" onClick={onExit}>Back to Tutor</button>
        </div>
      </div>
    )
  }

  const q = questions[current]
  return (
    <div className="quiz-container">
      <div className="quiz-header">
        <span className="quiz-topic">{topic}</span>
        <span className="quiz-progress">{current + 1} / {questions.length}</span>
      </div>
      <div className="quiz-progress-bar">
        <div className="quiz-progress-fill" style={{ width: `${((current) / questions.length) * 100}%` }} />
      </div>
      <div className="quiz-question">
        <p>{q.question}</p>
      </div>
      <div className="quiz-options">
        {q.options.map((opt, i) => {
          let cls = 'quiz-option'
          if (selected !== null) {
            if (i === q.correct) cls += ' quiz-option-correct'
            else if (i === selected) cls += ' quiz-option-wrong'
            else cls += ' quiz-option-dim'
          }
          return (
            <button key={i} className={cls} onClick={() => selectAnswer(i)} disabled={selected !== null && i !== selected && i !== q.correct}>
              <span className="quiz-option-letter">{['A','B','C','D'][i]}</span>
              <span>{opt}</span>
            </button>
          )
        })}
      </div>
      {selected !== null && (
        <div className="quiz-feedback">
          {selected === q.correct
            ? <p className="quiz-feedback-correct">✓ Correct!</p>
            : <p className="quiz-feedback-wrong">✗ Not quite — the correct answer is highlighted above.</p>
          }
          {q.explanation && <p className="quiz-feedback-exp">{q.explanation}</p>}
          <button className="quiz-btn" onClick={next}>
            {current + 1 < questions.length ? 'Next Question →' : 'See Results →'}
          </button>
        </div>
      )}
    </div>
  )
}

function QuizPrompt({ onStart, onCancel }) {
  const [topic, setTopic] = useState('')
  return (
    <div className="quiz-prompt">
      <h3>What topic do you want to be quizzed on?</h3>
      <input
        type="text"
        className="tutor-input"
        placeholder="e.g. World War 2, Photosynthesis, Algebra..."
        value={topic}
        onChange={e => setTopic(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && topic.trim() && onStart(topic.trim())}
        autoFocus
      />
      <div className="quiz-prompt-btns">
        <button className="quiz-btn quiz-btn-secondary" onClick={onCancel}>Cancel</button>
        <button className="quiz-btn" onClick={() => topic.trim() && onStart(topic.trim())} disabled={!topic.trim()}>
          Start Quiz →
        </button>
      </div>
    </div>
  )
}

function TutorPage() {
  const [messages, setMessages] = useState([INITIAL_MESSAGE])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [quizState, setQuizState] = useState('off')
  const [quizTopic, setQuizTopic] = useState('')
  const endRef = useRef(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  async function send() {
    const text = input.trim()
    if (!text || loading) return
    setInput('')
    setError(null)
    setMessages(m => [...m, { role: 'user', text }])
    setLoading(true)
    try {
      const reply = await getTutorResponse('openrouter', messages, text)
      setMessages(m => [...m, { role: 'tutor', text: reply }])
    } catch (e) {
      const msg = e.message || 'Something went wrong.'
      const friendly = /fetch|failed|network|connection|refused|unreachable/i.test(msg)
        ? "Can't reach the tutor. Check your connection and try again."
        : msg
      setError(friendly)
      setMessages(m => [...m, { role: 'tutor', text: `Error: ${friendly}` }])
    } finally {
      setLoading(false)
    }
  }

  if (quizState === 'prompt') return (
    <div className="tutor">
      <h2 className="tutor-page-title">Quiz Mode</h2>
      <QuizPrompt onStart={t => { setQuizTopic(t); setQuizState('active') }} onCancel={() => setQuizState('off')} />
    </div>
  )

  if (quizState === 'active') return (
    <div className="tutor">
      <h2 className="tutor-page-title">Quiz Mode</h2>
      <QuizMode topic={quizTopic} onExit={() => setQuizState('off')} />
    </div>
  )

  return (
    <div className="tutor">
      <div className="tutor-header-row">
        <h2 className="tutor-page-title">Tutor</h2>
        <button className="quiz-activate-btn" onClick={() => setQuizState('prompt')}>
          ⚡ Quiz Me
        </button>
      </div>
      {error && <div className="tutor-error" role="alert">{error}</div>}
      <div className="tutor-messages">
        {messages.map((msg, i) => (
          <div key={i} className={`tutor-msg tutor-msg--${msg.role}`}>
            <span className="tutor-msg-label">{msg.role === 'user' ? 'You' : 'Tutor'}</span>
            <p>{msg.text}</p>
          </div>
        ))}
        {loading && (
          <div className="tutor-msg tutor-msg--tutor tutor-msg--loading">
            <span className="tutor-msg-label">Tutor</span>
            <p>Thinking…</p>
          </div>
        )}
        <div ref={endRef} />
      </div>
      <form className="tutor-form" onSubmit={e => { e.preventDefault(); send() }}>
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Ask a question..."
          className="tutor-input"
          disabled={loading}
          autoFocus
        />
        <button type="submit" className="tutor-send" disabled={loading}>Send</button>
      </form>
    </div>
  )
}

export default function Tutor() {
  return (
    <ErrorBoundary>
      <TutorPage />
    </ErrorBoundary>
  )
}
