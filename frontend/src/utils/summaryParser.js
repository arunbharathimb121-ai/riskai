export function formatProjectTitle(docName = "") {
  if (!docName) return "Project Overview"
  let clean = docName.replace(/\.[^/.]+$/, "")
  clean = clean.replace(/[-_]+/g, " ").trim()
  if (clean === clean.toLowerCase() || clean === clean.toUpperCase()) {
    clean = clean
      .split(" ")
      .map((w) => (w.length > 0 ? w[0].toUpperCase() + w.slice(1).toLowerCase() : ""))
      .join(" ")
  }
  return clean
}

export function parseAISummary(raw = "", docName = "") {
  const defaultTitle = formatProjectTitle(docName)

  if (!raw || typeof raw !== "string") {
    return {
      projectName: defaultTitle,
      scope: "",
      deliverables: [],
      deliveryForecastStatus: "",
      forecastStatusClass: "on-track",
      risks: [],
      riskStatus: "ON TRACK",
      riskStatusClass: "on-track",
      riskStatusSub: "",
      mitigations: [],
      raw: ""
    }
  }

  const text = String(raw).trim()

  let projectName = defaultTitle
  const titleMatch = text.match(/(?:Target Document|Project Title|Project Name|Project):\s*([^\n*]+)/i)
  if (titleMatch && titleMatch[1].trim()) {
    projectName = titleMatch[1].trim()
  }

  let scope = ""
  const scopeMatch =
    text.match(/(?:Project Scope:|Scope:)\s*([^\n*]+)/i) ||
    text.match(/(?:\*\*Project Scope:\*\*|Project Scope:)\s*([^*]+?)(?=\*\*(?:Deliverables|Key Risks|Delivery Forecast)|Deliverables:|Key Risks:|Delivery Forecast:|$)/i)
  if (scopeMatch) {
    scope = scopeMatch[1].trim().replace(/\.$/, "")
  }

  let deliverables = []
  const delivMatch = text.match(
    /(?:Deliverables:)\s*([\s\S]*?)(?=Delivery Forecast Status|Key Risks|Risk Status|Mitigation|Schedule|$)/i
  )
  if (delivMatch) {
    const rawDeliv = delivMatch[1].trim()
    deliverables = rawDeliv
      .split(/\n/)
      .map((s) => s.replace(/^[-*•\d.]+\s*/, "").trim())
      .filter(
        (s) =>
          s.length > 0 &&
          !/^Delivery Forecast/i.test(s) &&
          !/^Key Risks/i.test(s)
      )
  }

  let deliveryForecastStatus = ""
  const forecastMatch = text.match(/(?:Delivery Forecast Status:|Forecast Status:)\s*([^\n]+)/i)
  if (forecastMatch) {
    const fRaw = forecastMatch[1].trim().toUpperCase()
    if (fRaw.includes("AT RISK")) deliveryForecastStatus = "AT RISK"
    else if (fRaw.includes("DELAY")) deliveryForecastStatus = "DELAYED"
    else if (fRaw.includes("MED")) deliveryForecastStatus = "MED RISK"
    else if (fRaw.includes("HIGH")) deliveryForecastStatus = "AT RISK"
    else if (fRaw.includes("ON TRACK")) deliveryForecastStatus = "ON TRACK"
    else deliveryForecastStatus = forecastMatch[1].trim()
  }

  let risks = []
  const risksBlockMatch = text.match(
    /(?:Key Risks & Impact:|Key Risks:|Identified Risks:|2\. Identified Risks:)\s*([\s\S]*?)(?=Risk Status|Recommended Mitigations|Mitigation Recommendations|Mitigations|3\. Schedule|$)/i
  )
  if (risksBlockMatch) {
    const block = risksBlockMatch[1].trim()
    const riskChunks = block.split(/(?:^|\n)(?=\d+\.\s*)/).filter((c) => c.trim().length > 0)

    for (const chunk of riskChunks) {
      const lines = chunk
        .split("\n")
        .map((l) => l.trim())
        .filter((l) => l.length > 0)
      if (lines.length === 0) continue

      const firstLine = lines[0].replace(/^\d+\.\s*/, "").replace(/^[-*•]\s*/, "")
      let title = firstLine
      let severity = "Med"
      let impact = ""

      const sevParenMatch = firstLine.match(/\((High|Med|Low|Medium)\)/i)
      if (sevParenMatch) {
        severity = sevParenMatch[1].slice(0, 1).toUpperCase() + sevParenMatch[1].slice(1, 4).toLowerCase()
        if (severity === "Med" || severity === "Medium") severity = "Med"
        title = firstLine.replace(/\((High|Med|Low|Medium)\)/i, "").trim()
      }

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i]
        const impMatch = line.match(/(?:Potential Impact|Impact):\s*(.+)/i)
        if (impMatch) impact = impMatch[1].trim()
        const sevMatch = line.match(/(?:Severity):\s*(High|Med|Low|Medium)/i)
        if (sevMatch) {
          severity = sevMatch[1].slice(0, 1).toUpperCase() + sevMatch[1].slice(1, 4).toLowerCase()
          if (severity === "Med" || severity === "Medium") severity = "Med"
        }
      }

      if (title) {
        risks.push({
          title,
          severity,
          impact: impact || "Potential milestone delay",
          type: ""
        })
      }
    }
  }

  let riskStatus = ""
  const statusMatch = text.match(/(?:Risk Status:|Overall Risk Status:)\s*([^\n(]+)/i)
  if (statusMatch) {
    const sRaw = statusMatch[1].trim().toUpperCase()
    if (sRaw.includes("HIGH")) riskStatus = "HIGH RISK"
    else if (sRaw.includes("MED")) riskStatus = "MED RISK"
    else if (sRaw.includes("LOW")) riskStatus = "LOW RISK"
    else if (sRaw.includes("ON TRACK")) riskStatus = "ON TRACK"
  }

  if (!riskStatus) {
    if (risks.some((r) => r.severity === "High") || text.toUpperCase().includes("HIGH RISK")) {
      riskStatus = "HIGH RISK"
    } else if (
      risks.some((r) => r.severity === "Med") ||
      text.toUpperCase().includes("MED RISK") ||
      text.toUpperCase().includes("AT RISK")
    ) {
      riskStatus = "MED RISK"
    } else {
      riskStatus = "ON TRACK"
    }
  }

  if (!deliveryForecastStatus) {
    if (riskStatus === "HIGH RISK") deliveryForecastStatus = "AT RISK"
    else if (riskStatus === "MED RISK") deliveryForecastStatus = "MED RISK"
    else deliveryForecastStatus = "ON TRACK"
  }

  const riskStatusSub = ""

  let mitigations = []
  const mitBlockMatch = text.match(
    /(?:Mitigation Recommendations:|Recommended Mitigations:|Mitigations:|4\. Recommended Mitigations:)\s*([\s\S]*?)$/i
  )
  if (mitBlockMatch) {
    const rawMit = mitBlockMatch[1].trim()
    mitigations = rawMit
      .split(/\n/)
      .map((s) => s.replace(/^[-*•\d.]+\s*/, "").replace(/\*\*/g, "").trim())
      .filter((s) => s.length > 0 && !/^Mitigation/i.test(s))
  }

  const forecastStatusClass = deliveryForecastStatus.toLowerCase().replace(/\s+/g, "-")
  const riskStatusClass = riskStatus.toLowerCase().replace(/\s+/g, "-")

  return {
    projectName,
    scope,
    deliverables,
    deliveryForecastStatus,
    forecastStatusClass,
    risks,
    riskStatus,
    riskStatusClass,
    riskStatusSub,
    mitigations,
    raw: text
  }
}
