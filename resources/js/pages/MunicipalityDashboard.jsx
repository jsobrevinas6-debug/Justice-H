import { useState, useMemo, useEffect } from 'react';
import { LAGUNA_MUNICIPALITIES } from '../data/lagunaMunicipalities';
import './municipality-dashboard.css';

export default function MunicipalityDashboard({
  initialMunicipality = 'Santa Rosa City',
  officialName = 'Atty. Maria Santos',
  officialRole = 'City Legal Officer',
  initialCases = [],
  authUser = null,
}) {
  const [currentMunicipality, setCurrentMunicipality] = useState(initialMunicipality);
  const [incidents, setIncidents] = useState(initialCases);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [loading, setLoading] = useState(false);

  // Modal States
  const [logModalOpen, setLogModalOpen] = useState(false);
  const [broadcastModalOpen, setBroadcastModalOpen] = useState(false);
  const [activeBroadcast, setActiveBroadcast] = useState(
    'Free Barangay Legal Aid & Notarization Clinic is scheduled this Friday, 9:00 AM at the City Hall Ground Pavilion.'
  );

  // New Case Form
  const [newCase, setNewCase] = useState({
    citizen_name: '',
    phone: '',
    barangay: 'Brgy. Tagapo',
    category: 'Legal Assistance / Consultation',
    urgency: 'urgent',
    title: '',
    description: '',
    submitting: false,
  });

  // CSRF helper
  const getCsrfToken = () => {
    return document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
  };

  // Find current Laguna LGU details & hotlines
  const currentLgu = useMemo(() => {
    return (
      LAGUNA_MUNICIPALITIES.find((m) => m.name.toLowerCase() === currentMunicipality.toLowerCase()) ||
      LAGUNA_MUNICIPALITIES[0]
    );
  }, [currentMunicipality]);

  // Fetch cases from MySQL when municipality changes
  const fetchCasesForMunicipality = async (muniName) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/cases?municipality=${encodeURIComponent(muniName)}`);
      const data = await res.json();
      if (data.success) {
        setIncidents(data.cases);
      }
    } catch {
      // keep current state
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCasesForMunicipality(currentMunicipality);
  }, [currentMunicipality]);

  // Filtered incidents
  const filteredIncidents = useMemo(() => {
    return incidents.filter((item) => {
      const searchTarget = (
        (item.case_number || item.id || '') +
        ' ' +
        (item.citizen_name || item.citizenName || '') +
        ' ' +
        (item.title || '') +
        ' ' +
        (item.barangay || '')
      ).toLowerCase();

      const matchesSearch = searchTarget.includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
      const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;

      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [incidents, searchQuery, statusFilter, categoryFilter]);

  // Statistics
  const stats = useMemo(() => {
    return {
      total: incidents.length,
      urgent: incidents.filter((i) => i.urgency === 'urgent' && i.status !== 'resolved').length,
      underReview: incidents.filter((i) => i.status === 'under_review' || i.status === 'pending').length,
      resolved: incidents.filter((i) => i.status === 'resolved').length,
    };
  }, [incidents]);

  // Handle Status Change with MySQL Persistence
  const handleStatusChange = async (id, newStatus, assignedTo = null) => {
    // Optimistic UI update
    setIncidents((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: newStatus, assigned_to: assignedTo } : item))
    );

    try {
      await fetch(`/api/cases/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-CSRF-TOKEN': getCsrfToken(),
        },
        body: JSON.stringify({
          status: newStatus,
          assigned_to: assignedTo,
        }),
      });
    } catch {
      // Revert if error
      fetchCasesForMunicipality(currentMunicipality);
    }
  };

  // Handle Walk-in Case Submission
  const handleCreateCase = async (e) => {
    e.preventDefault();
    setNewCase((prev) => ({ ...prev, submitting: true }));

    const payload = {
      citizen_name: newCase.citizen_name,
      phone: newCase.phone,
      municipality: currentMunicipality,
      barangay: newCase.barangay,
      category: newCase.category,
      urgency: newCase.urgency,
      title: newCase.title,
      description: newCase.description,
      coordinates: `${currentLgu.lat}, ${currentLgu.lng}`,
    };

    try {
      const res = await fetch('/api/cases', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-CSRF-TOKEN': getCsrfToken(),
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success && data.case) {
        setIncidents([data.case, ...incidents]);
        setNewCase({
          citizen_name: '',
          phone: '',
          barangay: 'Brgy. Tagapo',
          category: 'Legal Assistance / Consultation',
          urgency: 'urgent',
          title: '',
          description: '',
          submitting: false,
        });
        setLogModalOpen(false);
      }
    } catch {
      setNewCase((prev) => ({ ...prev, submitting: false }));
    }
  };

  return (
    <div className="m-dashboard">
      {/* Top Command Bar */}
      <header className="m-topbar">
        <div className="m-topbar-left">
          <a href="/" className="m-brand" title="Back to JusticePH Portal">
            <span className="m-brand-mark">
              <span />
            </span>
            <span>
              Justice<span style={{ color: 'var(--m-green)' }}>PH</span>
            </span>
          </a>
          <span className="m-brand-badge">LAGUNA LGU COMMAND DESK</span>
        </div>

        <div className="m-topbar-center">
          <div className="m-muni-select-wrapper">
            <span className="m-muni-select-label">JURISDICTION:</span>
            <select
              className="m-muni-select"
              value={currentMunicipality}
              onChange={(e) => setCurrentMunicipality(e.target.value)}
            >
              {LAGUNA_MUNICIPALITIES.map((lgu) => (
                <option key={lgu.name} value={lgu.name}>
                  {lgu.name} ({lgu.type})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="m-topbar-right">
          <a href="/" className="m-btn m-btn-ghost">
            ← Public Portal
          </a>

          <button type="button" className="m-btn m-btn-primary" onClick={() => setLogModalOpen(true)}>
            <span>+</span> Log Incident
          </button>

          <div className="m-user-badge">
            <div className="m-user-avatar">
              {officialName ? officialName.charAt(0) : 'O'}
            </div>
            <div className="m-user-text">
              <span className="m-user-name">{officialName}</span>
              <span className="m-user-role">{officialRole}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="m-container">
        {/* Hero Banner */}
        <div className="m-hero-banner">
          <div className="m-banner-copy">
            <span className="m-stat-label">LAGUNA PROVINCIAL DISPATCH &amp; LEGAL DESK</span>
            <h1>{currentMunicipality} Operation Center</h1>
            <p>
              Real-time citizen legal distress intake, emergency dispatch coordination, and Public Attorney’s Office routing backed by MySQL.
            </p>
          </div>

          <div className="m-banner-status">
            <div className="m-live-indicator">
              <span className="m-dot-pulse" />
              <span>LIVE MYSQL STREAM</span>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <section className="m-stats-grid" aria-label="Key Performance Indicators">
          <div className="m-stat-card">
            <div className="m-stat-top">
              <span className="m-stat-label">TOTAL INCIDENTS</span>
              <span className="m-stat-icon">📋</span>
            </div>
            <div className="m-stat-val">{stats.total}</div>
            <div className="m-stat-delta">↑ Active municipality queue</div>
          </div>

          <div className="m-stat-card m-stat-card--urgent">
            <div className="m-stat-top">
              <span className="m-stat-label">URGENT CALLS</span>
              <span className="m-stat-icon">🚨</span>
            </div>
            <div className="m-stat-val">{stats.urgent}</div>
            <div className="m-stat-delta">Requires immediate dispatch</div>
          </div>

          <div className="m-stat-card">
            <div className="m-stat-top">
              <span className="m-stat-label">UNDER PAO REVIEW</span>
              <span className="m-stat-icon">⚖️</span>
            </div>
            <div className="m-stat-val">{stats.underReview}</div>
            <div className="m-stat-delta">Inquest &amp; legal aid drafting</div>
          </div>

          <div className="m-stat-card">
            <div className="m-stat-top">
              <span className="m-stat-label">RESOLVED CASES</span>
              <span className="m-stat-icon">✓</span>
            </div>
            <div className="m-stat-val">{stats.resolved}</div>
            <div className="m-stat-delta">Settled through conciliation</div>
          </div>
        </section>

        {/* Main Content Layout */}
        <div className="m-main-layout">
          {/* Incidents Board */}
          <section className="m-panel" aria-label="Incidents List">
            <div className="m-panel-header">
              <div className="m-panel-title-group">
                <h2>Incoming Distress &amp; Case Feed</h2>
                <p>
                  Showing {filteredIncidents.length} active records in <strong>{currentMunicipality}</strong>
                </p>
              </div>
              <button type="button" className="m-btn m-btn-ghost" onClick={() => setBroadcastModalOpen(true)}>
                📢 Post Advisory
              </button>
            </div>

            {/* Filter Bar */}
            <div className="m-filter-bar">
              <input
                type="text"
                className="m-search-input"
                placeholder="Search case ref, citizen name, barangay, or title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />

              <select
                className="m-filter-select"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="all">All Categories</option>
                <option value="Legal Assistance / Consultation">Legal Assistance</option>
                <option value="Domestic & Family Safety">Domestic &amp; VAWC</option>
                <option value="Labor & Wage Dispute">Labor &amp; Wages</option>
                <option value="Civil & Human Rights">Civil &amp; Human Rights</option>
                <option value="Barangay Dispute & Mediation">Barangay Dispute</option>
                <option value="Land & Tenancy Dispute">Land &amp; Tenancy</option>
              </select>

              <select
                className="m-filter-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending Dispatch</option>
                <option value="under_review">Under Review</option>
                <option value="assigned">Assigned to PAO</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>

            {/* Cases List */}
            <div className="m-cases-list">
              {loading ? (
                <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--m-muted)' }}>
                  Loading {currentMunicipality} cases from MySQL…
                </div>
              ) : filteredIncidents.length === 0 ? (
                <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--m-muted)' }}>
                  <p style={{ margin: '0 0 10px', fontSize: '15px', fontWeight: 600 }}>
                    No incident cases found for {currentMunicipality}
                  </p>
                  <p style={{ margin: 0, fontSize: '12px' }}>
                    Citizens filing for this municipality will automatically appear here.
                  </p>
                </div>
              ) : (
                filteredIncidents.map((incident) => {
                  const caseId = incident.case_number || incident.id;
                  const citizenName = incident.citizen_name || incident.citizenName;
                  const phone = incident.phone;

                  return (
                    <article key={incident.id || caseId} className="m-case-item">
                      <div className="m-case-header">
                        <div className="m-case-id-row">
                          <span className="m-case-id">{caseId}</span>
                          <span
                            className={`m-badge ${
                              incident.urgency === 'urgent'
                                ? 'm-badge-urgent'
                                : incident.urgency === 'high'
                                ? 'm-badge-crime'
                                : 'm-badge-legal'
                            }`}
                          >
                            {(incident.urgency || 'ROUTINE').toUpperCase()}
                          </span>
                          <span
                            className={`m-badge ${
                              incident.status === 'resolved'
                                ? 'm-badge-status-resolved'
                                : incident.status === 'assigned'
                                ? 'm-badge-status-assigned'
                                : 'm-badge-status-pending'
                            }`}
                          >
                            {(incident.status || 'pending').replace('_', ' ').toUpperCase()}
                          </span>
                        </div>
                        <span className="m-case-time">
                          {incident.created_at ? new Date(incident.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recent'}
                        </span>
                      </div>

                      <h3 className="m-case-title">{incident.title}</h3>
                      <p className="m-case-desc">{incident.description}</p>

                      <div className="m-case-footer">
                        <div className="m-case-meta">
                          <span className="m-case-location">📍 {incident.barangay}</span>
                          <span>👤 {citizenName}</span>
                          <span>🏷️ {incident.category}</span>
                        </div>

                        <div className="m-case-actions">
                          {phone && (
                            <a
                              href={`tel:${phone.replace(/[^0-9+]/g, '')}`}
                              className="m-btn-call"
                              title={`Direct call to ${citizenName}`}
                            >
                              📞 Call Citizen ({phone})
                            </a>
                          )}

                          {incident.status !== 'resolved' ? (
                            <button
                              type="button"
                              className="m-btn m-btn-ghost"
                              onClick={() => handleStatusChange(incident.id, 'resolved')}
                              title="Mark this case resolved"
                            >
                              ✓ Resolve
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="m-btn m-btn-ghost"
                              onClick={() => handleStatusChange(incident.id, 'under_review')}
                              title="Re-open this case for review"
                            >
                              Re-open
                            </button>
                          )}

                          {incident.status === 'pending' && (
                            <button
                              type="button"
                              className="m-btn m-btn-primary"
                              onClick={() =>
                                handleStatusChange(
                                  incident.id,
                                  'assigned',
                                  `PAO ${currentMunicipality} District Office`
                                )
                              }
                            >
                              Assign PAO →
                            </button>
                          )}
                        </div>
                      </div>
                    </article>
                  );
                })
              )}
            </div>
          </section>

          {/* Right Sidebar Widgets */}
          <aside className="m-sidebar">
            {/* Community Notice Card */}
            <div className="m-sidebar-card">
              <h3>
                <span>📢</span> Active LGU Advisory
              </h3>
              <div className="m-broadcast-box">
                <p>{activeBroadcast}</p>
                <span className="m-stat-label">BROADCASTED TO ALL {currentMunicipality.toUpperCase()} RESIDENTS</span>
              </div>
            </div>

            {/* Quick Hotline Directory for this Laguna LGU */}
            <div className="m-sidebar-card">
              <h3>
                <span>📞</span> {currentMunicipality} Hotlines
              </h3>
              <div className="m-hotlines-list">
                {currentLgu.hotlines.map((hotline) => (
                  <div key={hotline.name} className="m-hotline-row">
                    <div>
                      <div className="m-hotline-name">{hotline.name}</div>
                      <a href={`tel:${hotline.tel}`} className="m-hotline-num">
                        {hotline.number}
                      </a>
                    </div>
                    <a
                      href={`tel:${hotline.tel}`}
                      className="m-btn-call"
                      style={{ padding: '4px 8px', fontSize: '11px' }}
                    >
                      Call
                    </a>
                  </div>
                ))}
              </div>
            </div>

            {/* Protocol Checklist */}
            <div className="m-sidebar-card">
              <h3>
                <span>🛡️</span> Laguna PAO Inquest Protocol
              </h3>
              <div style={{ fontSize: '12px', color: '#c5d5cb', lineHeight: '1.6' }}>
                <p style={{ margin: '0 0 8px' }}>
                  <strong>Art. 125 RPC Custody Limits:</strong>
                </p>
                <ul style={{ margin: 0, paddingLeft: '18px' }}>
                  <li>Light offenses: 12 Hours</li>
                  <li>Correctional offenses: 18 Hours</li>
                  <li>Afflictive/Capital: 36 Hours</li>
                </ul>
                <p style={{ margin: '10px 0 0', fontSize: '11px', color: 'var(--m-muted)' }}>
                  If exceeding statutory duration without filing in court, immediate PAO release petition applies.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </main>

      {/* Log Incident Modal */}
      {logModalOpen && (
        <div className="m-modal-backdrop" role="dialog" aria-modal="true">
          <div className="m-modal-box">
            <div className="m-modal-header">
              <h3>Log Walk-In or Hotline Incident ({currentMunicipality})</h3>
              <button type="button" className="m-btn m-btn-ghost" onClick={() => setLogModalOpen(false)}>
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCase}>
              <label className="m-form-group">
                <span>Citizen Name</span>
                <input
                  type="text"
                  required
                  placeholder="e.g. Maria Clara Santos"
                  value={newCase.citizen_name}
                  onChange={(e) => setNewCase({ ...newCase, citizen_name: e.target.value })}
                />
              </label>

              <label className="m-form-group">
                <span>Citizen Contact Number</span>
                <input
                  type="tel"
                  required
                  placeholder="e.g. +63 917 123 4567"
                  value={newCase.phone}
                  onChange={(e) => setNewCase({ ...newCase, phone: e.target.value })}
                />
              </label>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <label className="m-form-group">
                  <span>Barangay</span>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Brgy. Tagapo"
                    value={newCase.barangay}
                    onChange={(e) => setNewCase({ ...newCase, barangay: e.target.value })}
                  />
                </label>

                <label className="m-form-group">
                  <span>Urgency Level</span>
                  <select
                    value={newCase.urgency}
                    onChange={(e) => setNewCase({ ...newCase, urgency: e.target.value })}
                  >
                    <option value="urgent">Urgent / Emergency</option>
                    <option value="high">High Priority</option>
                    <option value="routine">Routine</option>
                  </select>
                </label>
              </div>

              <label className="m-form-group">
                <span>Category</span>
                <select
                  value={newCase.category}
                  onChange={(e) => setNewCase({ ...newCase, category: e.target.value })}
                >
                  <option value="Legal Assistance / Consultation">Legal Assistance</option>
                  <option value="Domestic & Family Safety">Domestic &amp; VAWC</option>
                  <option value="Labor & Wage Dispute">Labor &amp; Wages</option>
                  <option value="Civil & Human Rights">Civil &amp; Human Rights</option>
                  <option value="Barangay Dispute & Mediation">Barangay Dispute</option>
                  <option value="Land & Tenancy Dispute">Land &amp; Tenancy</option>
                </select>
              </label>

              <label className="m-form-group">
                <span>Incident Summary / Title</span>
                <input
                  type="text"
                  required
                  placeholder="e.g. Eviction threat without barangay conciliation"
                  value={newCase.title}
                  onChange={(e) => setNewCase({ ...newCase, title: e.target.value })}
                />
              </label>

              <label className="m-form-group">
                <span>Details &amp; Initial Action Taken</span>
                <textarea
                  rows={3}
                  required
                  placeholder="Describe facts, citizen situation, and referral steps taken..."
                  value={newCase.description}
                  onChange={(e) => setNewCase({ ...newCase, description: e.target.value })}
                />
              </label>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
                <button type="button" className="m-btn m-btn-ghost" onClick={() => setLogModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="m-btn m-btn-primary" disabled={newCase.submitting}>
                  {newCase.submitting ? 'Saving to MySQL…' : 'Record & Dispatch →'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Advisory Broadcast Modal */}
      {broadcastModalOpen && (
        <div className="m-modal-backdrop" role="dialog" aria-modal="true">
          <div className="m-modal-box">
            <div className="m-modal-header">
              <h3>Update {currentMunicipality} Advisory</h3>
              <button type="button" className="m-btn m-btn-ghost" onClick={() => setBroadcastModalOpen(false)}>
                ✕
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                setBroadcastModalOpen(false);
              }}
            >
              <label className="m-form-group">
                <span>Community Bulletin Message</span>
                <textarea
                  rows={4}
                  required
                  value={activeBroadcast}
                  onChange={(e) => setActiveBroadcast(e.target.value)}
                />
              </label>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
                <button type="button" className="m-btn m-btn-ghost" onClick={() => setBroadcastModalOpen(false)}>
                  Close
                </button>
                <button type="submit" className="m-btn m-btn-primary">
                  Publish to Dashboard
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
