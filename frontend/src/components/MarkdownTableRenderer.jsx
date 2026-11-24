import React from "react";

export const MarkdownTableRenderer = ({ text }) => {
  if (!text) return null;

  const lines = text.split("\n");
  const renderedElements = [];
  let bufferTable = [];
  let inTable = false;

  const renderTableBlock = (tableLines, key) => {
    if (tableLines.length < 2) {
      return <pre key={key} className="plain-text-snippet">{tableLines.join("\n")}</pre>;
    }

    const headerLine = tableLines[0];
    const headers = headerLine
      .split("|")
      .map((c) => c.trim())
      .filter((c, idx, arr) => (idx === 0 && c === "" ? false : idx === arr.length - 1 && c === "" ? false : true));

    const bodyLines = tableLines.slice(2);

    return (
      <div key={key} className="table-responsive-wrapper">
        <table className="enterprise-markdown-table">
          <thead>
            <tr>
              {headers.map((h, hIdx) => (
                <th key={hIdx}>{h.replace(/\*\*/g, "")}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {bodyLines.map((rowLine, rIdx) => {
              const cells = rowLine
                .split("|")
                .map((c) => c.trim())
                .filter((c, idx, arr) => (idx === 0 && c === "" ? false : idx === arr.length - 1 && c === "" ? false : true));

              if (cells.length === 0) return null;

              return (
                <tr key={rIdx}>
                  {cells.map((cell, cIdx) => {
                    const cleanCell = cell.replace(/\*\*/g, "");
                    const isHigh = /HIGH|CRITICAL|DELAYED|RED/i.test(cleanCell);
                    const isMed = /MED|MEDIUM|AT RISK|AMBER|WARNING/i.test(cleanCell);
                    const isLow = /LOW|ON TRACK|GREEN|HEALTHY/i.test(cleanCell);

                    let badgeClass = "";
                    if (isHigh && cleanCell.length < 25) badgeClass = "badge-status-high";
                    else if (isMed && cleanCell.length < 25) badgeClass = "badge-status-med";
                    else if (isLow && cleanCell.length < 25) badgeClass = "badge-status-low";

                    return (
                      <td key={cIdx}>
                        {badgeClass ? (
                          <span className={`status-pill-badge ${badgeClass}`}>{cleanCell}</span>
                        ) : (
                          cleanCell
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  lines.forEach((line, index) => {
    const isTableLine = line.trim().startsWith("|") && line.trim().endsWith("|");

    if (isTableLine) {
      inTable = true;
      bufferTable.push(line.trim());
    } else {
      if (inTable) {
        renderedElements.push(renderTableBlock(bufferTable, `table-${index}`));
        bufferTable = [];
        inTable = false;
      }

      const trimmed = line.trim();
      if (trimmed.startsWith("### ")) {
        renderedElements.push(
          <h3 key={`h3-${index}`} className="doc-section-h3">
            {trimmed.replace("### ", "")}
          </h3>
        );
      } else if (trimmed.startsWith("## ")) {
        renderedElements.push(
          <h2 key={`h2-${index}`} className="doc-section-h2">
            {trimmed.replace("## ", "")}
          </h2>
        );
      } else if (trimmed.startsWith("# ")) {
        renderedElements.push(
          <h1 key={`h1-${index}`} className="doc-section-h1">
            {trimmed.replace("# ", "")}
          </h1>
        );
      } else if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
        renderedElements.push(
          <div key={`li-${index}`} className="doc-bullet-item">
            <span className="bullet-dot">•</span>
            <span>{trimmed.replace(/^[-*]\s*/, "").replace(/\*\*/g, "")}</span>
          </div>
        );
      } else if (trimmed.length > 0) {
        renderedElements.push(
          <p key={`p-${index}`} className="doc-paragraph">
            {trimmed.replace(/\*\*/g, "")}
          </p>
        );
      }
    }
  });

  if (inTable && bufferTable.length > 0) {
    renderedElements.push(renderTableBlock(bufferTable, `table-last`));
  }

  return <div className="rendered-markdown-article">{renderedElements}</div>;
};

export default MarkdownTableRenderer;
