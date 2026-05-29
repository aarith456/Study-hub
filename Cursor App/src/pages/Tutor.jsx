import { useState, useRef, useEffect } from 'react'
import { getTutorResponse } from '../services/ai'
import ErrorBoundary from '../components/ErrorBoundary'

const INITIAL_MESSAGE = {
  role: 'tutor',
  text: "Hi. I'm your tutor. Choose OpenAI or Gemini above, then ask me anything—math, science, writing, or how to study.",
}

function TutorPage() {
  const [provider, setProvider] = useState('openai')
  const [messages, setMessages] = useState([INITIAL_MESSAGE])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const endRef = useRef(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  async function send() {
    const text = input.trim()
    if (!text || loading) return
    setInput('')
    setError(null)
    setMessages((m) => [...m, { role: 'user', text }])
    setLoading(true)
    try {
      const history = messages
      const reply = await getTutorResponse(provider, history, text)
      setMessages((m) => [...m, { role: 'tutor', text: reply }])
    } catch (e) {
      const msg = e.message || 'Something went wrong.'
      const friendly = /fetch|failed|network|connection|refused|unreachable/i.test(msg)
        ? "Can't reach the tutor. Check your connection and that the server is running, then try again."
        : msg
      setError(friendly)
      setMessages((m) => [...m, { role: 'tutor', text: `Error: ${friendly}` }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="tutor">
      <h2 className="tutor-page-title">Tutor</h2>
      <div className="tutor-bar">
        <label className="tutor-label">Use</label>
        <select
          value={provider}
          onChange={(e) => { setProvider(e.target.value); setError(null); }}
          className="tutor-select"
          disabled={loading}
        >
          <option value="openai">OpenAI (GPT)</option>
          <option value="gemini">Gemini</option>
        </select>
        <span className="tutor-hint">Run <code>npm run server</code> in another terminal for replies.</span>
      </div>
      {error && (
        <div className="tutor-error" role="alert">
          {error}
        </div>
      )}
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
      <form
        className="tutor-form"
        onSubmit={(e) => {
          e.preventDefault()
          send()
        }}
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question..."
          className="tutor-input"
          disabled={loading}
          autoFocus
        />
        <button type="submit" className="tutor-send" disabled={loading}>
          Send
        </button>
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
