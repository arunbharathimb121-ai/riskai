export const StrategicAdvisory = ({ advisoryText }) => {
  return (
    <section className="strategic-advisory-card">
      <div className="advisory-header">
        <div className="advisory-title-wrap">
          <span className="gold-seal">★</span>
          <div>
            <h2 className="advisory-title">
              Recommendation for Full Risk Detection and Delivery Forecasting
            </h2>
            <p className="advisory-caption">
              Strategic framework for systematic risk mitigation, dependency tracking, and delivery assurance
            </p>
          </div>
        </div>
      </div>

      <div className="advisory-content">
        {advisoryText ? (
          <div className="dynamic-advisory-block">
            <div className="advisory-badge-pill">AI Real-Time Delivery Advisory</div>
            <p className="advisory-lead-text">{advisoryText}</p>
          </div>
        ) : (
          <p className="advisory-lead-text">
            To ensure robust delivery predictability and mitigate critical-path constraints across enterprise workstreams, adopt a structured phased delivery approach. Partition high-risk project components into verifiable milestones, establish automated dependency alerts, and enforce cross-functional synchronization between engineering and governance teams.
          </p>
        )}

        <div className="strategy-pillars">
          <div className="pillar-item">
            <div className="pillar-num">01</div>
            <div className="pillar-content">
              <strong>Phased Delivery Segments</strong>
              <span>Partition complex migrations and deliverables into micro-milestones with independent testing before full deployment.</span>
            </div>
          </div>

          <div className="pillar-item">
            <div className="pillar-num">02</div>
            <div className="pillar-content">
              <strong>Cross-Functional Synchronization</strong>
              <span>Establish proactive status sync channels between technical leads, infrastructure architects, and project stakeholders.</span>
            </div>
          </div>

          <div className="pillar-item">
            <div className="pillar-num">03</div>
            <div className="pillar-content">
              <strong>Continuous Dependency Audits</strong>
              <span>Conduct weekly sprint audits to recalibrate timelines, prevent scope creep, and resolve inter-team blockers early.</span>
            </div>
          </div>

          <div className="pillar-item">
            <div className="pillar-num">04</div>
            <div className="pillar-content">
              <strong>Automated Risk & Bottleneck Detection</strong>
              <span>Continuously ingest project artifacts into the vector repository to identify delivery variance before milestone cut-offs.</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default StrategicAdvisory
