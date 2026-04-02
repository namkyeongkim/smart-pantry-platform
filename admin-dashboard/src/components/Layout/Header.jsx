function Header() {
  return (
    <header className="top-header">
      <div>
        <h2 className="header-title">Admin Dashboard</h2>
        <p className="header-subtitle">
          Monitor system activity and pantry insights
        </p>
      </div>

      <div className="header-actions">
        <span className="status-badge">Live</span>
        <button
          className="refresh-button"
          onClick={() => window.location.reload()}
        >
          Refresh
        </button>
      </div>
    </header>
  );
}

export default Header;