import { useState } from 'react'

export const AskQuestion = ({
  question,
  setQuestion,
  onRunAnalysis,
  isQuerying,
  queryError,
  qaResult,
  hasDocs
}) => {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    if (!qaResult?.answer) return
    navigator.clipboard.writeText(qaResult.answer)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <section className="ask-question-section">
      <div className="section-title-bar">
        <div>
          <h2 className="section-title">Ask the Question</h2>
          <p className="section-desc">
            Inquire about project deliverables, dependency bottlenecks, milestone delays, and risk severity.
          </p>
        </div>
      </div>

      <div className="query-cockpit">
        <div className="search-bar-wrapper">
          <div className="search-input-box">
            <span className="search-icon">💬</span>
            <input
              type="text"
              className="search-input"
              placeholder="Ask a question (e.g., What are the key schedule risks and dependency bottlenecks?)"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && onRunAnalysis()}
              disabled={isQuerying}
            />
            <button
              type="button"
              className="btn-gold"
              onClick={() => onRunAnalysis()}
              disabled={isQuerying || !question.trim()}
            >
              {isQuerying ? "Analyzing..." : "🔍 Ask Question"}
            </button>
          </div>

          <div className="quick-triggers">
            <span className="triggers-label">Suggested Questions:</span>
            <button
              type="button"
              className="trigger-chip"
              onClick={() => onRunAnalysis("Perform full risk detection and delivery forecasting based on uploaded documents.")}
              disabled={isQuerying}
            >
              ⚡ Full Risk & Delivery Forecast
            </button>
            <button
              type="button"
              className="trigger-chip"
              onClick={() => onRunAnalysis("Identify critical path schedule bottlenecks and delays.")}
              disabled={isQuerying}
            >
              ⏱️ Schedule Bottlenecks
            </button>
            <button
              type="button"
              className="trigger-chip"
              onClick={() => onRunAnalysis("Summarize key risk mitigations and phased delivery strategy.")}
              disabled={isQuerying}
            >
              🛡️ Mitigation Strategies
            </button>
          </div>
        </div>

        {!hasDocs && (
          <div className="banner-alert notice">
            ℹ️ <strong>Tip:</strong> Upload project PDFs in the repository above before asking questions to query indexed documents.
          </div>
        )}

        {queryError && (
          <div className="banner-alert error">
            ⚠️ <strong>Error:</strong> {queryError}
          </div>
        )}
      </div>

      {qaResult && (
        <div className="qa-response-card">
          <div className="qa-card-header">
            <div className="qa-query-tag">
              <span className="qa-icon">❓</span>
              <strong className="qa-query-text">{qaResult.question}</strong>
            </div>
            <button
              type="button"
              className="copy-btn btn-sm"
              onClick={handleCopy}
            >
              {copied ? "✓ Copied!" : "📋 Copy Answer"}
            </button>
          </div>

          <div className="qa-card-body">
            <div className="qa-answer-badge">
              <span className="badge-sparkle">★</span> AI Intelligence Response
            </div>
            <div className="qa-answer-text">
              {qaResult.answer.split('\n\n').map((paragraph, pIdx) => {
                if (paragraph.startsWith('- ') || paragraph.startsWith('* ')) {
                  return (
                    <ul key={pIdx} className="qa-answer-list">
                      {paragraph.split('\n').map((item, iIdx) => (
                        <li key={iIdx}>
                          {item.replace(/^[-*•]\s*/, '').replace(/\*\*(.*?)\*\*/g, '$1')}
                        </li>
                      ))}
                    </ul>
                  )
                }
                return (
                  <p key={pIdx} className="qa-answer-paragraph">
                    {paragraph.replace(/\*\*(.*?)\*\*/g, '$1')}
                  </p>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

export default AskQuestion
