import { useState } from "react";
import "./App.css";
import MarkdownTableRenderer from "./components/MarkdownTableRenderer";
import HealthRadarChart from "./components/HealthRadarChart";

const API_BASE_URL = "http://localhost:8012";

const App = () => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [totalChunks, setTotalChunks] = useState(0);
  const [activeTab, setActiveTab] = useState("chunks");
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const [scopeData, setScopeData] = useState(null);
  const [riskData, setRiskData] = useState(null);
  const [blockerData, setBlockerData] = useState(null);
  const [docsData, setDocsData] = useState(null);
  const [healthData, setHealthData] = useState(null);

  const [questionInput, setQuestionInput] = useState("");
  const [qaHistory, setQaHistory] = useState([]);

  const handleFileSelection = (e) => {
    const incoming = Array.from(e.target.files || []);
    if (incoming.length === 0) return;

    setSelectedFiles((prev) => {
      const existingNames = new Set(prev.map((f) => f.name));
      const filtered = incoming.filter((f) => !existingNames.has(f.name));
      return [...prev, ...filtered];
    });

    e.target.value = null;
  };

  const removeStagedFile = (name) => {
    setSelectedFiles((prev) => prev.filter((f) => f.name !== name));
  };

  const uploadAllFiles = async () => {
    if (selectedFiles.length === 0) return;
    const formData = new FormData();
    for (const f of selectedFiles) {
      formData.append("files", f);
    }

    try {
      setLoading(true);
      setLoadingMsg("Ingesting & building unified project knowledge base (PDF, DOCX, XLSX, CSV, TXT)...");
      setErrorMsg("");

      const res = await fetch(`${API_BASE_URL}/upload`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Upload failed");

      setUploadedFiles(data.files || []);
      setTotalChunks(data.total_chunks || 0);
      setSelectedFiles([]);
      setActiveTab("chunks");
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
      setLoadingMsg("");
    }
  };

  const triggerAgent = async (agentKey) => {
    if (uploadedFiles.length === 0 && selectedFiles.length === 0) {
      setErrorMsg("Please upload project files first.");
      return;
    }

    setActiveTab(agentKey);
    if (agentKey === "chunks") return;

    setLoading(true);
    setErrorMsg("");

    const endpointMap = {
      scope: { url: "/scope", setter: setScopeData, key: "scope", title: "Synthesizing Scope & Deliverables Tables..." },
      risk: { url: "/risk", setter: setRiskData, key: "risks", title: "Forecasting Delivery & Schedule Risk Tables..." },
      blockers: { url: "/blockers", setter: setBlockerData, key: "blockers", title: "Extracting Blockers & Action Items Tables..." },
      documentation: { url: "/documentation", setter: setDocsData, key: "documentation", title: "Generating User Stories & Documentation Tables..." },
      health: { url: "/health", setter: setHealthData, key: "health", title: "Computing Dimension-Wise Health Scorecard Tables..." },
    };

    const target = endpointMap[agentKey];
    if (!target) return;

    setLoadingMsg(target.title);

    try {
      const res = await fetch(`${API_BASE_URL}${target.url}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || `Agent execution failed for ${agentKey}`);
      target.setter(data[target.key]);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
      setLoadingMsg("");
    }
  };

  const askAssistant = async (queryText) => {
    const q = queryText || questionInput;
    if (!q.trim()) return;

    setLoading(true);
    setLoadingMsg("Assistant searching indexed project knowledge base...");
    setErrorMsg("");

    try {
      const res = await fetch(`${API_BASE_URL}/question?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Query failed");

      setQaHistory((prev) => [{ question: data.question, answer: data.answer }, ...prev]);
      setQuestionInput("");
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
      setLoadingMsg("");
    }
  };

  const resetProject = async () => {
    try {
      setLoading(true);
      await fetch(`${API_BASE_URL}/reset`, { method: "DELETE" });
      setSelectedFiles([]);
      setUploadedFiles([]);
      setTotalChunks(0);
      setScopeData(null);
      setRiskData(null);
      setBlockerData(null);
      setDocsData(null);
      setHealthData(null);
      setQaHistory([]);
      setErrorMsg("");
      setActiveTab("chunks");
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const parseHealthScorecardBoxes = (hText, rText) => {
    if (!hText) return null;

    let healthScore = null;
    const lines = hText.split("\n");
    for (const rawLine of lines) {
      if (/Overall.*Health.*Score|Overall.*Score/i.test(rawLine)) {
        const cells = rawLine.split(/[|\t]/).map(c => c.trim().replace(/\*\*/g, "")).filter(Boolean);
        for (let i = 1; i < cells.length; i++) {
          const m = cells[i].match(/(\d+(?:\.\d+)?)/);
          if (m) {
            const val = parseFloat(m[1]);
            if (val > 0 && val <= 100 && !cells[i].includes("%")) {
              healthScore = `${val}/100`;
              break;
            }
          }
        }
      }
      if (healthScore) break;
    }

    if (!healthScore) {
      const fallbackM = hText.match(/(\d+(?:\.\d+)?)\s*\/\s*100/);
      if (fallbackM) healthScore = `${fallbackM[1]}/100`;
      else healthScore = "--/100";
    }

    let riskScore = "--/25";
    const combined = (rText || "") + "\n" + hText;

    const rLines = combined.split("\n");
    const openScores = [];
    let inRiskSection = false;

    for (const l of rLines) {
      if (/(?:Highest.*Open.*Risk|Risk.*Register|Current.*Highest)/i.test(l)) {
        inRiskSection = true;
        const m = l.match(/(\d{1,2})\s*\/\s*25/);
        if (m) {
          openScores.push(parseInt(m[1], 10));
        }
      }

      if (inRiskSection && /^[|\t\s]*(?:R-?\d{1,2}|TC-?\d+)/i.test(l)) {
        const cells = l.split(/[|\t]/).map(c => c.trim().replace(/\*\*/g, "")).filter(Boolean);
        for (let i = 1; i < cells.length; i++) {
          const val = parseInt(cells[i], 10);
          if (!isNaN(val) && val >= 1 && val <= 25 && !cells[i].includes("%") && !cells[i].includes(".")) {
            openScores.push(val);
            break;
          }
        }
      }

      if (/open|active|in-progress|controls pending|control required/i.test(l) && !/closed|resolved/i.test(l)) {
        const m = l.match(/[|\t:]\s*(\d{1,2})\s*(?:\/25)?[|\t]/);
        if (m) {
          const val = parseInt(m[1], 10);
          if (val >= 1 && val <= 25) openScores.push(val);
        }
      }
    }

    if (openScores.length > 0) {
      riskScore = `${Math.max(...openScores)}/25`;
    } else {
      const any25 = combined.match(/(\d{1,2})\s*\/\s*25/);
      if (any25) riskScore = `${any25[1]}/25`;
    }

    let criticality = "--";
    let badgeClass = "badge-status-low";

    const rNum = parseInt(riskScore, 10);
    if (!isNaN(rNum)) {
      if (rNum >= 20) {
        criticality = "CRITICAL";
        badgeClass = "badge-status-high";
      } else if (rNum >= 15) {
        criticality = "HIGH";
        badgeClass = "badge-status-high";
      } else if (rNum >= 8) {
        criticality = "MEDIUM";
        badgeClass = "badge-status-med";
      } else {
        criticality = "LOW";
        badgeClass = "badge-status-low";
      }
    }

    return { healthScore, riskScore, criticality, badgeClass };
  };

  const healthBoxes = parseHealthScorecardBoxes(healthData, riskData);

  return (
    <div className="advisor-app-container">
      <header className="advisor-top-header">
        <div className="brand-group">
          <div className="brand-logo-hex">🛡️</div>
          <div>
            <h1 className="brand-main-title">AI Project Intelligence &amp; Risk Advisor</h1>
            <p className="brand-tagline">Multi-Extension Unified Project RAG • Tabular Risk &amp; Governance Suite</p>
          </div>
        </div>
        <div className="header-status-badge">
          <span className="live-dot"></span>
          <span>{uploadedFiles.length > 0 ? `Indexed: ${uploadedFiles.length} Artifacts (${totalChunks} Total Chunks)` : "Ready for Ingestion"}</span>
          {uploadedFiles.length > 0 && (
            <button className="reset-action-btn" onClick={resetProject}>
              Clear Project
            </button>
          )}
        </div>
      </header>

      <main className="advisor-main-layout">
        <section className="ingestion-cockpit-card">
          <div className="card-header-bar">
            <h2>📁 Multi-Artifact Project Ingestion</h2>
            <span className="file-pill-tag">PDF • DOCX • XLSX • CSV • TXT</span>
          </div>

          <div className="upload-dropzone-styled">
            <input
              id="multi-file-input"
              type="file"
              multiple
              accept=".pdf,.docx,.xlsx,.csv,.txt,.md"
              onChange={handleFileSelection}
              disabled={loading}
              className="hidden-file-input"
            />
            <label htmlFor="multi-file-input" className="file-input-label">
              <span className="upload-icon-large">📂</span>
              <strong>Choose files one-by-one or select all together</strong>
              <small>Click to add files (.pdf, .docx, .xlsx, .csv, .txt) — you can select multiple times</small>
            </label>
          </div>

          {selectedFiles.length > 0 && (
            <div className="selected-staged-panel">
              <div className="staged-label">
                Staged Files ({selectedFiles.length}) — Click '✕' to remove or upload all together:
              </div>
              <div className="staged-tags-row">
                {selectedFiles.map((f, idx) => (
                  <span key={idx} className="file-chip-badge">
                    📄 {f.name}
                    <button
                      type="button"
                      className="chip-remove-btn"
                      onClick={() => removeStagedFile(f.name)}
                      title="Remove file"
                    >
                      ✕
                    </button>
                  </span>
                ))}
              </div>
              <button className="execute-ingest-btn" onClick={uploadAllFiles} disabled={loading}>
                🚀 Ingest &amp; Index ({selectedFiles.length}) Staged File{selectedFiles.length > 1 ? "s" : ""}
              </button>
            </div>
          )}

          {uploadedFiles.length > 0 && (
            <div className="indexed-manifest-panel">
              <strong>Active Ingested Artifacts in Knowledge Base ({uploadedFiles.length}):</strong>
              <div className="manifest-chips">
                {uploadedFiles.map((fileObj, idx) => (
                  <span key={idx} className="manifest-chip">
                    ✓ {fileObj.name} ({fileObj.chunks} chunks)
                  </span>
                ))}
              </div>
            </div>
          )}

          {loading && (
            <div className="loading-indicator-banner">
              <span className="spinner-orbit"></span>
              <span>{loadingMsg || "Analyzing project data..."}</span>
            </div>
          )}

          {errorMsg && <div className="error-alert-banner">⚠️ {errorMsg}</div>}
        </section>

        <section className="agents-cockpit-card">
          <div className="agent-tabs-header">
            <button
              className={`agent-tab-btn ${activeTab === "chunks" ? "active" : ""}`}
              onClick={() => setActiveTab("chunks")}
            >
              🧩 Chunks Overview ({totalChunks})
            </button>
            <button
              className={`agent-tab-btn ${activeTab === "scope" ? "active" : ""}`}
              onClick={() => triggerAgent("scope")}
            >
              🎯 Scope &amp; Deliverables
            </button>
            <button
              className={`agent-tab-btn ${activeTab === "risk" ? "active" : ""}`}
              onClick={() => triggerAgent("risk")}
            >
              ⚠️ Risk &amp; Forecasting
            </button>
            <button
              className={`agent-tab-btn ${activeTab === "blockers" ? "active" : ""}`}
              onClick={() => triggerAgent("blockers")}
            >
              🚧 Blockers &amp; Action Items
            </button>
            <button
              className={`agent-tab-btn ${activeTab === "documentation" ? "active" : ""}`}
              onClick={() => triggerAgent("documentation")}
            >
              📝 User Stories &amp; Docs
            </button>
            <button
              className={`agent-tab-btn ${activeTab === "health" ? "active" : ""}`}
              onClick={() => triggerAgent("health")}
            >
              📊 Health Scorecard
            </button>
          </div>

          <div className="agent-display-canvas">
            {activeTab === "chunks" && (
              <div className="agent-view-block">
                <div className="chunks-header-row">
                  <h3>🧩 Ingested Knowledge Base Chunks Summary</h3>
                  {uploadedFiles.length > 0 && (
                    <span className="chunks-stat-pill">
                      Total Uploaded Artifacts: {uploadedFiles.length} | Overall Project Chunks: {totalChunks}
                    </span>
                  )}
                </div>

                {uploadedFiles.length === 0 ? (
                  <p className="placeholder-text">
                    No files indexed yet. Select your project documents above (.pdf, .docx, .xlsx, .csv, .txt) and click '🚀 Ingest &amp; Index' to generate and view the chunks count per file and overall total!
                  </p>
                ) : (
                  <div className="table-responsive-wrapper">
                    <table className="enterprise-markdown-table">
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Uploaded Document Name</th>
                          <th>File Format</th>
                          <th>Generated Chunks</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {uploadedFiles.map((fileObj, idx) => {
                          const ext = fileObj.name.includes(".") ? fileObj.name.split(".").pop().toUpperCase() : "TXT";
                          return (
                            <tr key={idx}>
                              <td>{idx + 1}</td>
                              <td><strong>📄 {fileObj.name}</strong></td>
                              <td><span className="file-chip-badge">{ext}</span></td>
                              <td><strong style={{ color: "var(--teal-primary)" }}>{fileObj.chunks} Chunks</strong></td>
                              <td><span className="status-pill-badge badge-status-low">✓ Indexed</span></td>
                            </tr>
                          );
                        })}
                        <tr style={{ background: "var(--bg-teal-subtle)", fontWeight: "bold" }}>
                          <td colSpan="3" style={{ textAlign: "right" }}>OVERALL TOTAL INDEXED CHUNKS:</td>
                          <td colSpan="2"><span style={{ color: "var(--teal-deep)", fontSize: "1rem" }}>{totalChunks} Chunks</span></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {activeTab === "scope" && (
              <div className="agent-view-block">
                <h3>🎯 Scope and Deliverable Extraction Agent</h3>
                {scopeData ? <MarkdownTableRenderer text={scopeData} /> : <p className="placeholder-text">Click "Scope &amp; Deliverables" to generate the table.</p>}
              </div>
            )}

            {activeTab === "risk" && (
              <div className="agent-view-block">
                <h3>⚠️ Risk Detection and Delivery Forecasting Agent</h3>
                {riskData ? <MarkdownTableRenderer text={riskData} /> : <p className="placeholder-text">Click "Risk &amp; Forecasting" to generate the table.</p>}
              </div>
            )}

            {activeTab === "blockers" && (
              <div className="agent-view-block">
                <h3>🚧 Blocker and Action Item Identification Agent</h3>
                {blockerData ? <MarkdownTableRenderer text={blockerData} /> : <p className="placeholder-text">Click "Blockers &amp; Action Items" to generate the table.</p>}
              </div>
            )}

            {activeTab === "documentation" && (
              <div className="agent-view-block">
                <h3>📝 Documentation Generation Agent</h3>
                {docsData ? <MarkdownTableRenderer text={docsData} /> : <p className="placeholder-text">Click "User Stories &amp; Docs" to generate the table.</p>}
              </div>
            )}

            {activeTab === "health" && (
              <div className="agent-view-block">
                <h3>📊 Project Health Scoring Module</h3>

                {healthBoxes && (
                  <div className="health-scorecard-boxes-grid">
                    <div className="health-stat-box">
                      <div className="stat-box-title">📊 Overall Health Score</div>
                      <div className="stat-box-value" style={{ color: "var(--teal-deep)" }}>
                        {healthBoxes.healthScore}
                      </div>
                      <div className="stat-box-sub">Weighted factor score (0–100 scale)</div>
                    </div>

                    <div className="health-stat-box">
                      <div className="stat-box-title">⚠️ Highest Open Risk (L × I)</div>
                      <div className="stat-box-value" style={{ color: "var(--navy-dark)" }}>
                        {healthBoxes.riskScore}
                      </div>
                      <div className="stat-box-sub">Highest active open risk (1–25 scale)</div>
                    </div>

                    <div className="health-stat-box">
                      <div className="stat-box-title">🛡️ Criticality Level</div>
                      <div className="stat-box-value">
                        <span className={`status-pill-badge ${healthBoxes.badgeClass}`}>
                          {healthBoxes.criticality}
                        </span>
                      </div>
                      <div className="stat-box-sub">Active threat posture for open risks</div>
                    </div>
                  </div>
                )}

                <HealthRadarChart
                  healthData={healthData}
                  riskData={riskData}
                  healthBoxes={healthBoxes}
                  onRequestGenerate={() => triggerAgent("health")}
                />

                {healthData ? (
                  <MarkdownTableRenderer text={healthData} />
                ) : (
                  <p className="placeholder-text">Click "Health Scorecard" to generate the table.</p>
                )}
              </div>
            )}
          </div>
        </section>

        <section className="assistant-cockpit-card">
          <div className="assistant-header-bar">
            <h2>💬 Conversational Project Intelligence Assistant</h2>
            <p>RAG-powered conversational engine grounded strictly in uploaded project documents.</p>
          </div>

          <div className="assistant-input-row">
            <input
              type="text"
              className="assistant-text-field"
              placeholder="e.g., Show me a table of open risks and owners? Are we on track?"
              value={questionInput}
              onChange={(e) => setQuestionInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && askAssistant()}
              disabled={loading}
            />
            <button className="assistant-submit-btn" onClick={() => askAssistant()} disabled={loading || !questionInput.trim()}>
              Ask Assistant
            </button>
          </div>

          <div className="assistant-quick-prompts">
            <span className="quick-label">Instant Queries:</span>
            <button onClick={() => askAssistant("Show the sprint and milestone breakdown with goals, dates, planned vs actual velocity, and status.")}>
              🏃 Sprint Timeline
            </button>
            <button onClick={() => askAssistant("List all user stories identified in the documents with Epic, MoSCoW priority, Assignee, and Status.")}>
              📋 User Stories &amp; MoSCoW
            </button>
            <button onClick={() => askAssistant("Show the defects log with Defect ID, module, severity, resolution, and current status.")}>
              🐞 Quality &amp; Defect Log
            </button>
            <button onClick={() => askAssistant("Show the complete risk register with Risk ID, Threat, Likelihood, Impact, Score, Mitigation, Owner, and Status.")}>
              ⚠️ Risk Register
            </button>
            <button onClick={() => askAssistant("Summarize key blockers, unresolved issues, and recent retrospective action items.")}>
              🔄 Impediments &amp; Actions
            </button>
          </div>

          <div className="qa-history-stream">
            {qaHistory.map((item, idx) => (
              <div key={idx} className="qa-bubble-card">
                <div className="qa-question-line">
                  <span className="qa-tag-q">Q</span>
                  <strong>{item.question}</strong>
                </div>
                <div className="qa-answer-line">
                  <span className="qa-tag-a">AI</span>
                  <div className="qa-answer-text">
                    <MarkdownTableRenderer text={item.answer} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="advisor-footer">
        <span>AI Project Intelligence &amp; Risk Advisor • Enterprise RAG System</span>
        <span>Supports .pdf, .docx, .xlsx, .csv, .txt, .md</span>
      </footer>
    </div>
  );
};

export default App;
