export function Header() {
  return (
    <header className="app-header">
      <div>
        <strong>Change Request Workbench</strong>
      </div>
      <div className="header-meta">
        <span className="environment-pill">Environment: {process.env.NODE_ENV}</span>
        <span className="user-badge" aria-label="Signed-in user">
          User
        </span>
      </div>
    </header>
  );
}
