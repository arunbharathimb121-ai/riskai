import { useMemo } from 'react'
import { parseAISummary } from '../utils/summaryParser'

const CARD_PALETTES = [
  {
    headerBg: '#f5c400',
    headerText: '#0a0a0a',
    borderColor: '#e0b000',
    leftColBg: '#fffae6',
    gridBorder: '#f5c400'
  },
  {
    headerBg: '#ffe033',
    headerText: '#0a0a0a',
    borderColor: '#f5c400',
    leftColBg: '#fff8cc',
    gridBorder: '#ffe033'
  },
  {
    headerBg: '#1a1a1a',
    headerText: '#f5c400',
    borderColor: '#f5c400',
    leftColBg: '#f7f6ee',
    gridBorder: '#e0b000'
  },
  {
    headerBg: '#e0b000',
    headerText: '#0a0a0a',
    borderColor: '#c89a00',
    leftColBg: '#fffbdd',
    gridBorder: '#e0b000'
  },
  {
    headerBg: '#111111',
    headerText: '#ffe033',
    borderColor: '#f5c400',
    leftColBg: '#fdfdf3',
    gridBorder: '#f5c400'
  }
]

export const ArtifactsManager = ({
  documents,
  selected,
  onPickFiles,
  onRemoveFile,
  onUploadFiles,
  onClearAll,
  isUploading,
  uploadError
}) => {
  const parsedDocs = useMemo(() => {
    return documents.map((doc, idx) => {
      const palette = CARD_PALETTES[idx % CARD_PALETTES.length]
      return {
        ...doc,
        palette,
        details: parseAISummary(doc.summary, doc.name)
      }
    })
  }, [documents])

  return (
    <section className="artifacts-section">
      <div className="section-title-bar">
        <div>
          <h2 className="section-title">Project Risk Intelligence &amp; Artifacts Repository</h2>
          <p className="section-desc">
            Upload project PDF(s) to automatically generate neat side-by-side risk, scope, deliverables, and mitigation comparison tables.
          </p>
        </div>
        {documents.length > 0 && (
          <button type="button" className="clear-btn" onClick={onClearAll}>
            🗑️ Clear Uploads ({documents.length})
          </button>
        )}
      </div>

      {/* Upload Zone */}
      <div className="upload-controls-container">
        <div className="upload-box-classic">
          <input
            id="file-upload"
            type="file"
            accept=".pdf"
            multiple
            onChange={onPickFiles}
            disabled={isUploading}
            style={{ display: 'none' }}
          />
          <label htmlFor="file-upload" className="drop-target">
            <span className="upload-icon-graphic">📄</span>
            <span className="upload-primary-prompt">Click to Select Project PDF(s)</span>
            <span className="upload-note">
              Supports multi-file upload. Each PDF generates a dedicated comparison table.
            </span>
          </label>

          {selected.length > 0 && (
            <div className="staged-files">
              <div className="staged-count">
                Selected ({selected.length}) file(s) ready to generate tables:
              </div>
              <div className="staged-tags">
                {selected.map((f) => (
                  <span key={f.name} className="staged-tag">
                    📄 {f.name}
                    <button
                      type="button"
                      onClick={() => onRemoveFile(f.name)}
                      title="Remove file"
                    >
                      ✕
                    </button>
                  </span>
                ))}
              </div>
              <button
                type="button"
                className="btn-gold w-full"
                onClick={onUploadFiles}
                disabled={isUploading}
              >
                {isUploading
                  ? "⏳ AI Agents Analysing PDFs..."
                  : `🚀 Upload & Analyse (${selected.length} PDF${selected.length > 1 ? 's' : ''})`}
              </button>
            </div>
          )}

          {uploadError && <div className="banner-alert error">{uploadError}</div>}
        </div>
      </div>

      {/* Dynamic Tables Generated Based on Uploaded PDFs */}
      <div className="project-tables-section">
        <div className="table-header-meta">
          <h3 className="repository-table-title">
            📋 Project Scope, Risk &amp; Mitigation Analysis
          </h3>
          <span className="doc-count-badge">
            {documents.length} PDF{documents.length !== 1 ? 's' : ''} Uploaded
          </span>
        </div>

        {parsedDocs.length === 0 ? (
          <div className="empty-repository-state">
            <div className="empty-icon">📂</div>
            <h4 className="empty-title">No Project Tables Generated Yet</h4>
            <p className="empty-sub">
              The table is currently empty. Upload one or more project PDFs above to generate neat risk intelligence tables side-by-side.
            </p>
          </div>
        ) : (
          <div
            className={`project-tables-comparison-grid ${
              parsedDocs.length === 1 ? 'single-table' : 'multi-tables'
            }`}
          >
            {parsedDocs.map((doc, idx) => {
              const { details, palette } = doc
              const isHighRisk = details.riskStatus.includes('HIGH') || details.riskStatus.includes('CRIT')
              const isMedRisk = details.riskStatus.includes('MED') || details.riskStatus.includes('AT RISK')

              return (
                <div
                  key={doc.name || idx}
                  className="project-risk-card"
                  style={{
                    borderColor: palette.borderColor
                  }}
                >
                  {/* Card Header matching screenshot color theme */}
                  <div
                    className="project-card-header"
                    style={{
                      backgroundColor: palette.headerBg,
                      color: palette.headerText
                    }}
                  >
                    <h3 className="project-card-title">{details.projectName}</h3>
                    {doc.name && (
                      <div className="project-card-filename-meta">
                        <span>📄 {doc.name}</span>
                        {doc.chunks !== undefined && (
                          <span className="meta-chunk-pill">{doc.chunks} chunks</span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* 2-Column Table Body */}
                  <table
                    className="project-risk-table"
                    style={{
                      borderColor: palette.gridBorder
                    }}
                  >
                    <tbody>
                      {/* Row 1: Project Scope & Deliverables */}
                      <tr style={{ borderColor: palette.gridBorder }}>
                        <th
                          className="table-row-label"
                          style={{
                            backgroundColor: palette.leftColBg,
                            borderColor: palette.gridBorder
                          }}
                        >
                          Project Scope &amp; Deliverables
                        </th>
                        <td
                          className="table-row-content"
                          style={{ borderColor: palette.gridBorder }}
                        >
                          <div className="scope-description-text">
                            {details.scope}
                          </div>

                          {details.deliverables && details.deliverables.length > 0 && (
                            <div className="deliverables-block">
                              <strong className="deliverables-header">Deliverables:</strong>
                              <ul className="deliverables-list">
                                {details.deliverables.map((item, dIdx) => (
                                  <li key={dIdx}>{item}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Delivery Forecast Status Box */}
                          <div
                            className={`delivery-forecast-box status-${details.forecastStatusClass}`}
                          >
                            <span className="forecast-label">Delivery Forecast Status: </span>
                            <strong className="forecast-val">
                              {details.deliveryForecastStatus}
                            </strong>
                          </div>
                        </td>
                      </tr>

                      {/* Row 2: Key Risks & Impact */}
                      <tr style={{ borderColor: palette.gridBorder }}>
                        <th
                          className="table-row-label"
                          style={{
                            backgroundColor: palette.leftColBg,
                            borderColor: palette.gridBorder
                          }}
                        >
                          Key Risks &amp; Impact
                        </th>
                        <td
                          className="table-row-content"
                          style={{ borderColor: palette.gridBorder }}
                        >
                          <div className="risks-numbered-container">
                            {details.risks.map((risk, rIdx) => {
                              const sevClass = risk.severity.toLowerCase()
                              return (
                                <div key={rIdx} className="risk-numbered-item">
                                  <div className="risk-numbered-title">
                                    <span className="risk-num">{rIdx + 1}. </span>
                                    <strong>{risk.title}</strong>
                                  </div>
                                  <ul className="risk-details-bullets">
                                    <li>
                                      <span className="bullet-label">
                                        Severity{risk.type ? '/Type' : ''}:{' '}
                                      </span>
                                      <span className={`severity-highlight ${sevClass}`}>
                                        {risk.severity}
                                      </span>
                                      {risk.type && (
                                        <span className="risk-type-text"> / {risk.type}</span>
                                      )}
                                    </li>
                                    <li>
                                      <span className="bullet-label">Impact: </span>
                                      <span className="risk-impact-text">{risk.impact}</span>
                                    </li>
                                  </ul>
                                </div>
                              )
                            })}
                          </div>
                        </td>
                      </tr>

                      {/* Row 3: Risk Status */}
                      <tr style={{ borderColor: palette.gridBorder }}>
                        <th
                          className="table-row-label"
                          style={{
                            backgroundColor: palette.leftColBg,
                            borderColor: palette.gridBorder
                          }}
                        >
                          Risk Status
                        </th>
                        <td
                          className={`table-row-content risk-status-cell ${
                            isHighRisk ? 'status-high-risk' : isMedRisk ? 'status-med-risk' : 'status-on-track'
                          }`}
                          style={{ borderColor: palette.gridBorder }}
                        >
                          <div className="overall-risk-title">
                            {details.riskStatus}
                          </div>
                          {details.riskStatusSub && (
                            <div className="overall-risk-subtitle">
                              {details.riskStatusSub}
                            </div>
                          )}
                        </td>
                      </tr>

                      {/* Row 4: Mitigation Recommendations */}
                      <tr style={{ borderColor: palette.gridBorder }}>
                        <th
                          className="table-row-label"
                          style={{
                            backgroundColor: palette.leftColBg,
                            borderColor: palette.gridBorder
                          }}
                        >
                          Mitigation Recommendations
                        </th>
                        <td
                          className="table-row-content mitigations-content-cell"
                          style={{ borderColor: palette.gridBorder }}
                        >
                          <ul className="mitigations-clean-list">
                            {details.mitigations.map((mit, mIdx) => (
                              <li key={mIdx}>
                                {typeof mit === 'string'
                                  ? mit
                                  : mit.desc
                                  ? `${mit.title}: ${mit.desc}`
                                  : mit.title}
                              </li>
                            ))}
                          </ul>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}

export default ArtifactsManager
