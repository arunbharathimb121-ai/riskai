export const Navbar = ({ backendStatus }) => {
  return (
    <header className="risk-navbar">
      <div className="navbar-brand">
        <div className="brand-logo">
          <span className="logo-shield">🛡️</span>
        </div>
        <div>
          <div className="brand-title">RiskAI Enterprise</div>
          <div className="brand-tagline">Project Risk & Delivery Forecaster</div>
        </div>
      </div>

      <div className="navbar-actions">
        <div className={`status-pill ${backendStatus}`}>
          <span className="status-dot"></span>
          {backendStatus === "connected" ? "AI Engine Connected" : "Backend Offline"}
        </div>
      </div>
    </header>
  )
}

export default Navbar
