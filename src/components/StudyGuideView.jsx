const RESOURCE_ICONS = {
  video: '▶',
  article: '📄',
  book: '📚',
  practice: '✏',
  website: '🔗',
}

function resourceHref(r) {
  if (r.url?.trim()) return r.url.trim()
  if (r.searchQuery?.trim()) {
    return `https://www.google.com/search?q=${encodeURIComponent(r.searchQuery.trim())}`
  }
  return null
}

export default function StudyGuideView({ guide, topic }) {
  return (
    <article className="guide-view">
      <header className="guide-header">
        <h1>{guide.title}</h1>
        {topic && <p className="guide-topic">Topic: {topic}</p>}
      </header>

      <section className="guide-section">
        <h2>Overview</h2>
        <p className="guide-overview">{guide.overview}</p>
      </section>

      {guide.keyConcepts?.length > 0 && (
        <section className="guide-section">
          <h2>Key concepts</h2>
          <dl className="concept-list">
            {guide.keyConcepts.map((c, i) => (
              <div key={i} className="concept-card">
                <dt>{c.term}</dt>
                <dd>{c.definition}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      {guide.sections?.map((s, i) => (
        <section key={i} className="guide-section">
          <h2>{s.title}</h2>
          <p className="guide-body">{s.content}</p>
        </section>
      ))}

      {guide.studyTips?.length > 0 && (
        <section className="guide-section">
          <h2>Study tips</h2>
          <ul className="tips-list">
            {guide.studyTips.map((tip, i) => (
              <li key={i}>{tip}</li>
            ))}
          </ul>
        </section>
      )}

      {guide.practiceQuestions?.length > 0 && (
        <section className="guide-section">
          <h2>Practice questions</h2>
          <ol className="practice-list">
            {guide.practiceQuestions.map((q, i) => (
              <li key={i} className="practice-item">
                <p className="practice-q">{q.question}</p>
                {q.hint && (
                  <p className="practice-hint">
                    <strong>Hint:</strong> {q.hint}
                  </p>
                )}
                <details className="practice-answer">
                  <summary>Show answer</summary>
                  <p>{q.answer}</p>
                </details>
              </li>
            ))}
          </ol>
        </section>
      )}

      {guide.resources?.length > 0 && (
        <section className="guide-section">
          <h2>Resources</h2>
          <ul className="resource-list">
            {guide.resources.map((r, i) => {
              const href = resourceHref(r)
              return (
                <li key={i} className="resource-card">
                  <span className="resource-type" title={r.type}>
                    {RESOURCE_ICONS[r.type] || '🔗'}
                  </span>
                  <div className="resource-body">
                    {href ? (
                      <a href={href} target="_blank" rel="noopener noreferrer">
                        {r.title}
                      </a>
                    ) : (
                      <span>{r.title}</span>
                    )}
                    <p>{r.description}</p>
                  </div>
                </li>
              )
            })}
          </ul>
        </section>
      )}
    </article>
  )
}
