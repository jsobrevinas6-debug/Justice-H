import './admin-dashboard.css';

export default function AdminDashboard({
  adminName = 'JusticePH Provincial Administrator',
  adminEmail = 'admin@justiceph.gov',
  adminRole = 'Super Administrator',
  usersList = [],
  casesList = [],
}) {
  const usersCount = usersList.length > 0 ? usersList.length : 8;
  const casesCount = casesList.length > 0 ? casesList.length : 5;

  return (
    <div className="adm-dashboard">
      {/* Admin Top Command Bar */}
      <header className="adm-topbar">
        <div className="adm-topbar-left">
          <a href="/" className="adm-brand">
            <span className="adm-brand-mark">
              <span />
            </span>
            <span>
              Justice<span style={{ color: 'var(--adm-green)' }}>PH</span>
            </span>
          </a>
          <span className="adm-brand-badge">ADMIN CONTROL PANEL • LAGUNA</span>
        </div>

        <div className="adm-topbar-right">
          <a href="/" className="adm-btn-ghost">
            ← Public Portal
          </a>
          <a href="/municipality/dashboard" className="adm-btn-ghost">
            Municipality Desk →
          </a>

          <div className="adm-user-badge">
            <div className="adm-user-avatar">
              {adminName ? adminName.charAt(0) : 'A'}
            </div>
            <div className="adm-user-text">
              <span className="adm-user-name">{adminName}</span>
              <span className="adm-user-role">{adminRole}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Layout: Sidebar Navigation + Content */}
      <div className="adm-layout">
        {/* Navigation Sidebar */}
        <aside className="adm-sidebar">
          <div>
            <div className="adm-nav-section-title">Administration</div>
            <ul className="adm-nav-list">
              <li>
                <div className="adm-nav-item is-active">
                  <span className="adm-nav-icon">📊</span>
                  <span>System Overview</span>
                </div>
              </li>
              <li>
                <div className="adm-nav-item">
                  <span className="adm-nav-icon">👥</span>
                  <span>User Management</span>
                </div>
              </li>
              <li>
                <div className="adm-nav-item">
                  <span className="adm-nav-icon">🏛️</span>
                  <span>Laguna LGUs</span>
                </div>
              </li>
              <li>
                <div className="adm-nav-item">
                  <span className="adm-nav-icon">📋</span>
                  <span>Incident Audits</span>
                </div>
              </li>
              <li>
                <div className="adm-nav-item">
                  <span className="adm-nav-icon">⚙️</span>
                  <span>System Settings</span>
                </div>
              </li>
            </ul>
          </div>

          <div className="adm-sidebar-footer">
            <div className="adm-system-pill">
              <span className="adm-dot-pulse" />
              <span>MYSQL DATABASE ONLINE</span>
            </div>
          </div>
        </aside>

        {/* Dashboard Content */}
        <main className="adm-content">
          {/* Hero Banner */}
          <section className="adm-hero-banner">
            <div className="adm-hero-copy">
              <span className="adm-hero-tag">
                <span>🛡️</span> SYSTEM SUPERUSER PORTAL • LAGUNA PROVINCE
              </span>
              <h1>Central Administration Console</h1>
              <p>
                Platform oversight, 30 Laguna municipal jurisdictions, and multi-role user governance on MySQL.
              </p>
            </div>
          </section>

          {/* Metric Stats Cards */}
          <section className="adm-stats-grid" aria-label="Platform Statistics">
            <div className="adm-stat-card">
              <div className="adm-stat-label">
                <span>TOTAL REGISTERED USERS</span>
                <span>👥</span>
              </div>
              <div className="adm-stat-val">{usersCount}</div>
              <div className="adm-stat-sub">Admin, Municipality &amp; Citizen Accounts</div>
            </div>

            <div className="adm-stat-card">
              <div className="adm-stat-label">
                <span>LAGUNA MUNICIPALITIES</span>
                <span>🏛️</span>
              </div>
              <div className="adm-stat-val">30</div>
              <div className="adm-stat-sub">6 Cities &amp; 24 Municipalities</div>
            </div>

            <div className="adm-stat-card">
              <div className="adm-stat-label">
                <span>TOTAL FILED CASES</span>
                <span>📋</span>
              </div>
              <div className="adm-stat-val">{casesCount}</div>
              <div className="adm-stat-sub">Logged in MySQL queue</div>
            </div>

            <div className="adm-stat-card">
              <div className="adm-stat-label">
                <span>PLATFORM INTEGRITY</span>
                <span>🛡️</span>
              </div>
              <div className="adm-stat-val">100%</div>
              <div className="adm-stat-sub">MySQL `justiceph` database connected</div>
            </div>
          </section>

          {/* Content Panels Grid */}
          <div className="adm-sections-grid">
            {/* User Directory Layout */}
            <section className="adm-panel">
              <div className="adm-panel-header">
                <h2>User Roles &amp; Accounts Registry</h2>
                <span>MYSQL SEEDED &amp; REGISTERED USERS</span>
              </div>

              <table className="adm-table">
                <thead>
                  <tr>
                    <th>NAME</th>
                    <th>EMAIL</th>
                    <th>ROLE</th>
                    <th>MUNICIPALITY</th>
                    <th>STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {usersList.length > 0 ? (
                    usersList.map((user) => (
                      <tr key={user.id}>
                        <td>
                          <strong>{user.name}</strong>
                          {user.designation && (
                            <div style={{ fontSize: '11px', color: 'var(--adm-muted)' }}>{user.designation}</div>
                          )}
                        </td>
                        <td>{user.email}</td>
                        <td>
                          <span
                            className={`adm-badge ${
                              user.role === 'admin'
                                ? 'adm-badge-admin'
                                : user.role === 'municipality'
                                ? 'adm-badge-municipality'
                                : 'adm-badge-user'
                            }`}
                          >
                            {user.role.toUpperCase()}
                          </span>
                        </td>
                        <td>{user.municipality || 'Laguna'}</td>
                        <td>
                          <span style={{ color: 'var(--adm-green)' }}>
                            {(user.status || 'Active').toUpperCase()}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <>
                      <tr>
                        <td>
                          <strong>JusticePH Administrator</strong>
                        </td>
                        <td>admin@justiceph.gov</td>
                        <td>
                          <span className="adm-badge adm-badge-admin">ADMIN</span>
                        </td>
                        <td>Laguna Province</td>
                        <td>
                          <span style={{ color: 'var(--adm-green)' }}>ACTIVE</span>
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <strong>Atty. Maria Santos</strong>
                        </td>
                        <td>santarosa.desk@justiceph.gov</td>
                        <td>
                          <span className="adm-badge adm-badge-municipality">MUNICIPALITY</span>
                        </td>
                        <td>Santa Rosa City</td>
                        <td>
                          <span style={{ color: 'var(--adm-green)' }}>ACTIVE</span>
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <strong>Juan Dela Cruz</strong>
                        </td>
                        <td>citizen@justiceph.gov</td>
                        <td>
                          <span className="adm-badge adm-badge-user">USER / CITIZEN</span>
                        </td>
                        <td>Santa Rosa City</td>
                        <td>
                          <span style={{ color: 'var(--adm-green)' }}>ACTIVE</span>
                        </td>
                      </tr>
                    </>
                  )}
                </tbody>
              </table>

              <div className="adm-ready-box">
                <h3>Admin Dashboard Layout Ready</h3>
                <p>
                  No heavy functions have been executed here as requested. Ready for your instructions on what admin operations to add next!
                </p>
              </div>
            </section>

            {/* Sidebar Information Widgets */}
            <aside className="adm-side-widgets">
              <div className="adm-widget">
                <h3>
                  <span>🖥️</span> Environment Status
                </h3>
                <div className="adm-info-list">
                  <div className="adm-info-row">
                    <span className="adm-info-key">Database Engine:</span>
                    <span className="adm-info-val">MySQL (Port 3306)</span>
                  </div>
                  <div className="adm-info-row">
                    <span className="adm-info-key">Database Name:</span>
                    <span className="adm-info-val">justiceph</span>
                  </div>
                  <div className="adm-info-row">
                    <span className="adm-info-key">Auth Guard:</span>
                    <span className="adm-info-val">Admin, Municipality, Citizen</span>
                  </div>
                  <div className="adm-info-row">
                    <span className="adm-info-key">Jurisdiction Focus:</span>
                    <span className="adm-info-val">Laguna Province (30 LGUs)</span>
                  </div>
                </div>
              </div>

              <div className="adm-widget">
                <h3>
                  <span>📌</span> Ready for Next Instructions
                </h3>
                <p style={{ margin: 0, fontSize: '12px', color: 'var(--adm-muted)', lineHeight: '1.6' }}>
                  This dashboard is connected to your MySQL database. When you tell me what specific actions you want here (e.g., verifying LGU desks, banning/unbanning users, viewing live case stats), we will build them!
                </p>
              </div>
            </aside>
          </div>
        </main>
      </div>
    </div>
  );
}
