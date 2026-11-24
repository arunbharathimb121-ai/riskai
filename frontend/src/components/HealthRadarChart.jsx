import { useMemo, useState } from "react";

const DIMS = [
  { key: "schedule", label: "Schedule",  icon: "📅", regex: /schedule|timeline|sprint/i,          weight: "25%" },
  { key: "risk",     label: "Risk",      icon: "⚠️", regex: /risk|defect/i,                       weight: "25%" },
  { key: "scope",    label: "Scope",     icon: "🎯", regex: /scope|deliverable|requirement/i,     weight: "20%" },
  { key: "blockers", label: "Blockers",  icon: "🚧", regex: /blocker|impediment|resolution/i,     weight: "15%" },
  { key: "quality",  label: "Quality",   icon: "💎", regex: /quality|compliance|qa|test/i,        weight: "15%" },
];
const N = DIMS.length;
const CX = 190, CY = 175, R = 130;
const GRID_LEVELS = [20, 40, 60, 80, 100];

function polar(value, idx, total, cx, cy, radius) {
  const angle = -Math.PI / 2 + (2 * Math.PI * idx) / total;
  const r     = radius * (Math.max(0, Math.min(100, value)) / 100);
  return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
}

function gridPolygon(pct, cx, cy, radius, total) {
  return Array.from({ length: total }, (_, i) => {
    const angle = -Math.PI / 2 + (2 * Math.PI * i) / total;
    const r = radius * (pct / 100);
    return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`;
  }).join(" ");
}

function polyPoints(scores, cx, cy, radius) {
  return scores.map((s, i) => {
    const p = polar(s, i, scores.length, cx, cy, radius);
    return `${p.x.toFixed(2)},${p.y.toFixed(2)}`;
  }).join(" ");
}

function scoreColor(v) {
  if (v >= 80) return "#199499";
  if (v >= 60) return "#d97706";
  return "#ef4444";
}

function scoreLabel(v) {
  if (v >= 80) return "Healthy";
  if (v >= 60) return "At Risk";
  return "Critical";
}

function parseRadarScores(healthText) {
  const found = {};
  if (healthText) {
    for (const rawLine of healthText.split("\n")) {
      const line = rawLine.trim();
      if (!line || /:---|===/i.test(line)) continue;
      const cells = line.split(/[|\t]/).map(c => c.trim().replace(/\*\*/g, "")).filter(Boolean);
      if (cells.length < 2) continue;
      const fname = cells[0].toLowerCase();
      if (/overall.*health|overall.*score|current.*highest|factor/i.test(fname)) continue;

      for (const dim of DIMS) {
        if (!found[dim.key] && dim.regex.test(fname)) {
          let scoreVal = null;
          for (let i = 1; i < cells.length; i++) {
            const sm = cells[i].match(/^(\d+(?:\.\d+)?)(?:\/100)?$/);
            if (sm && !cells[i].includes("%")) {
              scoreVal = parseFloat(sm[1]);
              break;
            }
          }
          if (scoreVal !== null) {
            const score = scoreVal > 100 ? Math.round((scoreVal / 25) * 100) : Math.min(100, Math.round(scoreVal));
            let exposure = "Monitored";
            for (let i = cells.length - 1; i >= 1; i--) {
              if (isNaN(parseFloat(cells[i])) && !cells[i].includes("%") && cells[i].length > 3) {
                exposure = cells[i];
                break;
              }
            }
            found[dim.key] = { score, exposure };
          }
        }
      }
    }
  }

  return DIMS.map(dim => {
    if (found[dim.key]) return { ...dim, ...found[dim.key] };
    return { ...dim, score: 0, exposure: "Not reported in document" };
  });
}

function axisLabelPos(idx, total, cx, cy, r, padding = 26) {
  const angle = -Math.PI / 2 + (2 * Math.PI * idx) / total;
  return {
    x: cx + (r + padding) * Math.cos(angle),
    y: cy + (r + padding) * Math.sin(angle),
    angle,
  };
}

export default function HealthRadarChart({ healthData, riskData, healthBoxes, onRequestGenerate }) {
  const [activeIdx, setActiveIdx] = useState(null);

  const dims = useMemo(
    () => parseRadarScores(healthData),
    [healthData]
  );

  const scores       = dims.map(d => d.score);
  const dataPoints   = polyPoints(scores, CX, CY, R);
  const validScores  = scores.filter(s => s > 0);
  const avgScore     = validScores.length > 0 ? Math.round(validScores.reduce((a, b) => a + b, 0) / validScores.length) : 0;
  const weakest      = [...dims].sort((a, b) => a.score - b.score)[0] || dims[0];
  const strongest    = [...dims].sort((a, b) => b.score - a.score)[0] || dims[0];

  if (!healthData) {
    return (
      <div style={{
        background: "var(--bg-surface)", border: "2px dashed var(--border-medium)",
        borderRadius: "var(--radius-md)", padding: "32px 24px", textAlign: "center",
        marginBottom: "20px"
      }}>
        <div style={{ fontSize: "2.4rem", marginBottom: "10px" }}>📊</div>
        <div style={{ fontSize: "1rem", fontWeight: 700, color: "var(--navy-dark)", marginBottom: "6px" }}>
          Health Risk Radar Chart
        </div>
        <p style={{ color: "var(--navy-subtle)", fontSize: "0.85rem", margin: "0 0 16px" }}>
          Generate the Health Scorecard to populate the interactive radar graph.
        </p>
        {onRequestGenerate && (
          <button
            onClick={onRequestGenerate}
            style={{
              background: "var(--teal-primary)", color: "#fff", border: "none",
              borderRadius: "var(--radius-sm)", padding: "9px 20px",
              fontWeight: 700, fontSize: "0.85rem", cursor: "pointer"
            }}
          >
            Compute Health Scorecard
          </button>
        )}
      </div>
    );
  }

  return (
    <div style={{
      background: "var(--bg-surface)", border: "1px solid var(--border-medium)",
      borderRadius: "var(--radius-md)", padding: "20px 22px", marginBottom: "22px"
    }}>
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        flexWrap: "wrap", gap: "10px", marginBottom: "16px"
      }}>
        <div>
          <span style={{ fontSize: "1.05rem", fontWeight: 800, color: "var(--navy-dark)", display: "flex", alignItems: "center", gap: "7px" }}>
            🕸️ Project Dimension Radar
          </span>
          <div style={{ fontSize: "0.78rem", color: "var(--navy-subtle)", marginTop: "3px" }}>
            Factor-wise health scores extracted from document tables • Click any dimension to inspect
          </div>
        </div>

        <div>
          <span style={{
            background: `${scoreColor(avgScore)}18`, border: `1px solid ${scoreColor(avgScore)}`,
            color: scoreColor(avgScore), borderRadius: "9999px", padding: "4px 12px",
            fontSize: "0.75rem", fontWeight: 800
          }}>
            Factor Avg: {avgScore}/100 · {scoreLabel(avgScore)}
          </span>
        </div>
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: "minmax(0,1.1fr) minmax(0,1fr)",
        gap: "22px",
        alignItems: "start"
      }}>
        <div style={{
          background: "var(--bg-page)", border: "1px solid var(--border-soft)",
          borderRadius: "var(--radius-md)", padding: "14px 10px",
          display: "flex", flexDirection: "column", alignItems: "center"
        }}>
          <svg
            viewBox={`0 0 ${CX * 2} ${CY * 2 + 10}`}
            style={{ width: "100%", maxWidth: 420, overflow: "visible", userSelect: "none" }}
          >
            {GRID_LEVELS.map(pct => (
              <polygon
                key={pct}
                points={gridPolygon(pct, CX, CY, R, N)}
                fill="none"
                stroke={pct === 100 ? "var(--border-medium)" : "var(--border-soft)"}
                strokeWidth={pct === 100 ? 1.4 : 0.8}
              />
            ))}

            {GRID_LEVELS.map(pct => {
              const gy = CY - R * (pct / 100) - 4;
              return (
                <text key={`lbl-${pct}`} x={CX + 4} y={gy}
                  fontSize="8" fill="var(--navy-subtle)" fontFamily="'JetBrains Mono', monospace"
                >
                  {pct}
                </text>
              );
            })}

            {DIMS.map((_, i) => {
              const p = polar(100, i, N, CX, CY, R);
              return (
                <line
                  key={`spoke-${i}`}
                  x1={CX} y1={CY} x2={p.x} y2={p.y}
                  stroke="var(--border-soft)" strokeWidth="1" strokeDasharray="2 3"
                />
              );
            })}

            <polygon
              points={dataPoints}
              fill="rgba(25, 148, 153, 0.22)"
              stroke="var(--teal-deep)"
              strokeWidth="2.4"
              strokeLinejoin="round"
            />

            {scores.map((s, i) => {
              const p = polar(s, i, N, CX, CY, R);
              const color = scoreColor(s);
              const isSelected = activeIdx === i;
              return (
                <g key={`pt-${i}`} style={{ cursor: "pointer" }} onClick={() => setActiveIdx(activeIdx === i ? null : i)}>
                  {isSelected && (
                    <circle cx={p.x} cy={p.y} r="10" fill={color} opacity="0.25" />
                  )}
                  <circle
                    cx={p.x} cy={p.y}
                    r={isSelected ? 6 : 4}
                    fill={color}
                    stroke="#ffffff"
                    strokeWidth="2"
                  />
                  <text
                    x={p.x} y={p.y - 8}
                    textAnchor="middle"
                    fontSize="9"
                    fontWeight="800"
                    fontFamily="'JetBrains Mono', monospace"
                    fill={color}
                  >
                    {s}
                  </text>
                </g>
              );
            })}

            {DIMS.map((dim, i) => {
              const { x, y } = axisLabelPos(i, N, CX, CY, R, 24);
              const isActive = activeIdx === i;
              const textAnchor = Math.abs(x - CX) < 10 ? "middle" : (x > CX ? "start" : "end");
              return (
                <text
                  key={`lbl-dim-${dim.key}`}
                  x={x} y={y + 4}
                  textAnchor={textAnchor}
                  fontSize={isActive ? "10.5" : "9.5"}
                  fontWeight={isActive ? "800" : "600"}
                  fill={isActive ? scoreColor(dims[i].score) : "var(--navy-dark)"}
                  fontFamily="'Plus Jakarta Sans', sans-serif"
                  style={{ cursor: "pointer", transition: "font-size 0.2s, fill 0.2s" }}
                  onClick={() => setActiveIdx(activeIdx === i ? null : i)}
                >
                  {dim.icon} {dim.label}
                </text>
              );
            })}

            <text x={CX} y={CY - 9} textAnchor="middle"
              fontSize="22" fontWeight="900"
              fill={scoreColor(avgScore)}
              fontFamily="'JetBrains Mono', monospace"
            >
              {avgScore}
            </text>
            <text x={CX} y={CY + 10} textAnchor="middle"
              fontSize="8.5" fill="var(--navy-subtle)"
              fontFamily="'Plus Jakarta Sans', sans-serif"
            >
              factor avg
            </text>
          </svg>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "9px" }}>
          {dims.map((dim, i) => {
            const color = scoreColor(dim.score);
            const isActive = activeIdx === i;
            return (
              <div
                key={dim.key}
                onClick={() => setActiveIdx(activeIdx === i ? null : i)}
                style={{
                  background: isActive ? "var(--bg-surface)" : "var(--bg-page)",
                  border: `1.5px solid ${isActive ? color : "var(--border-soft)"}`,
                  borderRadius: "var(--radius-sm)",
                  padding: "10px 14px",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  transform: isActive ? "translateX(3px)" : "none",
                  boxShadow: isActive ? `0 3px 10px ${color}22` : "none"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                  <span style={{ fontSize: "0.84rem", fontWeight: 700, color: "var(--navy-dark)", display: "flex", alignItems: "center", gap: "5px" }}>
                    {dim.icon} {dim.label}
                  </span>
                  <span style={{ fontSize: "0.72rem", fontWeight: 600, color: "var(--navy-subtle)", background: "var(--bg-surface)", padding: "2px 6px", borderRadius: 4, border: "1px solid var(--border-soft)" }}>
                    {dim.weight}
                  </span>
                </div>

                <div style={{ width: "100%", height: 6, background: "#e2dbd2", borderRadius: 4, overflow: "hidden", marginBottom: 6 }}>
                  <div style={{
                    height: "100%", width: `${dim.score}%`,
                    background: color, borderRadius: 4,
                    transition: "width 0.5s ease"
                  }} />
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.73rem" }}>
                  <span style={{ color: "var(--navy-muted)", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {dim.exposure}
                  </span>
                  <span style={{ fontWeight: 800, fontFamily: "'JetBrains Mono', monospace", color }}>
                    {dim.score}/100
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{
        display: "grid", gridTemplateColumns: "repeat(4, 1fr)",
        gap: "12px", marginTop: "18px",
        paddingTop: "16px", borderTop: "1px solid var(--border-soft)"
      }}>
        {[
          { label: "Overall Health", val: healthBoxes?.healthScore || `${avgScore}/100`, color: scoreColor(avgScore) },
          { label: "Highest Open Risk", val: healthBoxes?.riskScore || "—", color: "var(--navy-dark)" },
          { label: "Weakest Dimension", val: `${weakest.icon} ${weakest.label}`, color: scoreColor(weakest.score) },
          { label: "Strongest Dimension", val: `${strongest.icon} ${strongest.label}`, color: scoreColor(strongest.score) },
        ].map(({ label, val, color }) => (
          <div key={label} style={{
            background: "var(--bg-page)", border: "1px solid var(--border-soft)",
            borderRadius: "var(--radius-sm)", padding: "10px 12px"
          }}>
            <div style={{ fontSize: "0.68rem", fontWeight: 700, textTransform: "uppercase", color: "var(--navy-subtle)", letterSpacing: "0.03em", marginBottom: 4 }}>
              {label}
            </div>
            <div style={{ fontSize: "0.95rem", fontWeight: 800, color, fontFamily: "'JetBrains Mono', monospace", lineHeight: 1.2 }}>
              {val}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
