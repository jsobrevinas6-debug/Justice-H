import { useEffect, useState } from 'react';
import Radar from '../Components/Radar';
import StarBorder from '../Components/StarBorder';
import { LAGUNA_MUNICIPALITIES, findNearestLagunaMunicipality } from '../data/lagunaMunicipalities';
import './home.css';

const navigation = [
  { label: 'How it works', href: '#how-it-works' },
  { label: 'About', href: '#about' },
  { label: 'Municipality Desk', href: '/municipality/dashboard' },
];

export default function Home({ authUser: initialAuthUser = null }) {
  const [currentUser, setCurrentUser] = useState(initialAuthUser);
  const [menuOpen, setMenuOpen] = useState(false);
  const [locationModalOpen, setLocationModalOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'signup'
  const [authGateNotice, setAuthGateNotice] = useState('');
  const [pendingFileCase, setPendingFileCase] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  // Selected or detected Laguna Municipality
  const [selectedLagunaMuni, setSelectedLagunaMuni] = useState(LAGUNA_MUNICIPALITIES[0]);

  // Auth Form State
  const [authForm, setAuthForm] = useState({
    name: '',
    email: '',
    role: 'user', // 'user' | 'municipality'
    municipality: 'Santa Rosa City',
    designation: 'City Legal Officer',
    phone: '',
    password: '',
    confirmPassword: '',
    submitting: false,
    message: '',
    success: false,
  });

  // Modal Step in Need Help
  const [modalStep, setModalStep] = useState('location'); // 'location' | 'choices' | 'contacts' | 'report'

  // Location State
  const [locationState, setLocationState] = useState({
    status: 'idle', // 'idle' | 'requesting' | 'granted' | 'denied' | 'unsupported'
    coords: null,
    message: '',
  });

  // Case Filing Form State
  const [caseForm, setCaseForm] = useState({
    citizen_name: '',
    phone: '',
    municipality: 'Santa Rosa City',
    barangay: '',
    category: 'Legal Assistance / Consultation',
    urgency: 'routine',
    title: '',
    description: '',
    submitting: false,
    error: '',
  });

  // Result of newly submitted case
  const [filedCaseResult, setFiledCaseResult] = useState(null);

  // Synchronize currentUser from prop if updated
  useEffect(() => {
    if (initialAuthUser) {
      setCurrentUser(initialAuthUser);
    }
  }, [initialAuthUser]);

  // Pre-fill case form if user logs in
  useEffect(() => {
    if (currentUser) {
      setCaseForm((prev) => ({
        ...prev,
        citizen_name: prev.citizen_name || currentUser.name || '',
        phone: prev.phone || currentUser.phone || '',
        municipality: currentUser.municipality || prev.municipality || 'Santa Rosa City',
      }));
    }
  }, [currentUser]);

  // Keyboard navigation & modal closing
  useEffect(() => {
    if (!locationModalOpen && !authModalOpen) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setLocationModalOpen(false);
        setAuthModalOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [locationModalOpen, authModalOpen]);

  // Helper to fetch CSRF token from meta tag
  const getCsrfToken = () => {
    return document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
  };

  // Open Auth Modal
  const openAuthModal = (mode = 'login', notice = '') => {
    setAuthMode(mode);
    setAuthGateNotice(notice);
    setAuthForm({
      name: '',
      email: '',
      role: 'user',
      municipality: 'Santa Rosa City',
      designation: 'City Legal Officer',
      phone: '',
      password: '',
      confirmPassword: '',
      submitting: false,
      message: '',
      success: false,
    });
    setAuthModalOpen(true);
  };

  // Handle Login / Sign Up Submit
  const handleAuthSubmit = async (event) => {
    event.preventDefault();
    setAuthForm((prev) => ({ ...prev, submitting: true, message: '' }));

    if (authMode === 'signup' && authForm.password !== authForm.confirmPassword) {
      setAuthForm((prev) => ({
        ...prev,
        submitting: false,
        message: 'Passwords do not match. Please verify and try again.',
      }));
      return;
    }

    const endpoint = authMode === 'signup' ? '/auth/signup' : '/auth/login';
    const payload =
      authMode === 'signup'
        ? {
            name: authForm.name,
            email: authForm.email,
            password: authForm.password,
            password_confirmation: authForm.confirmPassword,
            role: authForm.role,
            municipality: authForm.role === 'municipality' ? authForm.municipality : null,
            designation: authForm.role === 'municipality' ? authForm.designation : null,
            phone: authForm.phone,
          }
        : {
            email: authForm.email,
            password: authForm.password,
          };

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-CSRF-TOKEN': getCsrfToken(),
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        const errorMsg =
          data.message || (data.errors ? Object.values(data.errors).flat().join(' ') : 'Authentication failed.');
        setAuthForm((prev) => ({ ...prev, submitting: false, message: errorMsg }));
        return;
      }

      // Success
      setCurrentUser(data.user);
      setAuthForm((prev) => ({
        ...prev,
        submitting: false,
        success: true,
        message: data.message || 'Authenticated successfully.',
      }));

      // If municipality official or admin, redirect accordingly
      if (data.user.role === 'admin') {
        window.location.href = '/admin/dashboard';
        return;
      }

      if (data.user.role === 'municipality') {
        const muni = encodeURIComponent(data.user.municipality || 'Santa Rosa City');
        const role = encodeURIComponent(data.user.designation || 'City Legal Officer');
        window.location.href = `/municipality/dashboard?municipality=${muni}&name=${encodeURIComponent(data.user.name)}&role=${role}`;
        return;
      }

      // If user had pending filing action, open report step automatically
      if (pendingFileCase) {
        setPendingFileCase(false);
        setAuthModalOpen(false);
        setModalStep('report');
        setLocationModalOpen(true);
      } else {
        setTimeout(() => {
          setAuthModalOpen(false);
        }, 800);
      }
    } catch {
      setAuthForm((prev) => ({
        ...prev,
        submitting: false,
        message: 'Network error occurred. Please check your connection.',
      }));
    }
  };

  // Handle Logout
  const handleLogout = async () => {
    try {
      await fetch('/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-CSRF-TOKEN': getCsrfToken(),
        },
      });
      setCurrentUser(null);
      window.location.href = '/';
    } catch {
      setCurrentUser(null);
    }
  };

  // Start "Need Help" Prompt
  const openLocationPrompt = () => {
    setModalStep('location');
    setLocationState({ status: 'idle', coords: null, message: '' });
    setFiledCaseResult(null);
    setLocationModalOpen(true);
  };

  // Geolocation Request Handler
  const handleRequestLocation = () => {
    if (!('geolocation' in navigator)) {
      setLocationState({
        status: 'unsupported',
        coords: null,
        message: 'Geolocation is not supported by your browser.',
      });
      return;
    }

    setLocationState({
      status: 'requesting',
      coords: null,
      message: 'Requesting permission from your browser…',
    });

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        // Auto-detect closest Laguna Municipality
        const nearestMuni = findNearestLagunaMunicipality(lat, lng);
        setSelectedLagunaMuni(nearestMuni);
        setCaseForm((prev) => ({ ...prev, municipality: nearestMuni.name }));

        setLocationState({
          status: 'granted',
          coords: {
            latitude: lat.toFixed(4),
            longitude: lng.toFixed(4),
          },
          message: `Location access granted. Nearest LGU: ${nearestMuni.name}, Laguna.`,
        });
      },
      (error) => {
        const deniedMessage =
          error.code === error.PERMISSION_DENIED
            ? 'Location permission was denied. You can still select your Laguna municipality manually.'
            : 'Unable to retrieve your location right now. You can pick your Laguna municipality below.';
        setLocationState({
          status: 'denied',
          coords: null,
          message: deniedMessage,
        });
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Case Filing Login Check Gatekeeper
  const handleInitiateCaseFiling = () => {
    if (!currentUser) {
      setPendingFileCase(true);
      setLocationModalOpen(false);
      openAuthModal(
        'login',
        'Kailangan munang mag-login o gumawa ng account upang opisyal na mai-file ang iyong kaso at ma-track ang progreso nito.'
      );
      return;
    }

    setModalStep('report');
  };

  // Handle Case Filing Submission
  const handleCaseSubmit = async (event) => {
    event.preventDefault();
    setCaseForm((prev) => ({ ...prev, submitting: true, error: '' }));

    const payload = {
      citizen_name: caseForm.citizen_name,
      phone: caseForm.phone,
      municipality: caseForm.municipality,
      barangay: caseForm.barangay || 'Poblacion',
      category: caseForm.category,
      urgency: caseForm.urgency,
      title: caseForm.title,
      description: caseForm.description,
      coordinates: locationState.coords
        ? `${locationState.coords.latitude}, ${locationState.coords.longitude}`
        : null,
    };

    try {
      const response = await fetch('/api/cases', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-CSRF-TOKEN': getCsrfToken(),
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setCaseForm((prev) => ({
          ...prev,
          submitting: false,
          error: data.message || 'Failed to submit case. Please verify all fields.',
        }));
        return;
      }

      setCaseForm((prev) => ({ ...prev, submitting: false, error: '' }));
      setFiledCaseResult(data.case);
    } catch {
      setCaseForm((prev) => ({
        ...prev,
        submitting: false,
        error: 'Network error. Please try again.',
      }));
    }
  };

  // Copy number helper
  const handleCopy = (id, text) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  return (
    <main className="justice-page">
      <header className="site-header">
        <a className="brand" href="#top" aria-label="JusticePH home">
          <span className="brand-mark" aria-hidden="true">
            <span />
          </span>
          <span>
            Justice<span className="brand-accent">PH</span>
          </span>
        </a>

        <button
          className="menu-toggle"
          type="button"
          aria-label={menuOpen ? 'Close navigation' : 'Open navigation'}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <span />
          <span />
        </button>

        <nav className={menuOpen ? 'main-nav is-open' : 'main-nav'} aria-label="Main navigation">
          {navigation.map((item) => (
            <a key={item.href} href={item.href} onClick={() => setMenuOpen(false)}>
              {item.label}
            </a>
          ))}

          {currentUser ? (
            <div className="nav-auth-group">
              <div className="nav-user-chip">
                <span className="nav-user-avatar">{currentUser.name.charAt(0)}</span>
                <span className="nav-user-name">{currentUser.name}</span>
                <span className="nav-user-role-tag">{currentUser.role.toUpperCase()}</span>
                <button
                  type="button"
                  className="nav-btn-logout"
                  onClick={handleLogout}
                  title="Sign Out"
                >
                  Log Out
                </button>
              </div>

              {currentUser.role === 'municipality' && (
                <a
                  href={`/municipality/dashboard?municipality=${encodeURIComponent(
                    currentUser.municipality || 'Santa Rosa City'
                  )}`}
                  className="nav-btn nav-btn-signup"
                >
                  Desk Board →
                </a>
              )}

              {currentUser.role === 'admin' && (
                <a href="/admin/dashboard" className="nav-btn nav-btn-signup">
                  Admin Console →
                </a>
              )}
            </div>
          ) : (
            <div className="nav-auth-group">
              <button
                type="button"
                className="nav-btn nav-btn-login"
                onClick={() => {
                  setMenuOpen(false);
                  openAuthModal('login');
                }}
              >
                Log In
              </button>
              <button
                type="button"
                className="nav-btn nav-btn-signup"
                onClick={() => {
                  setMenuOpen(false);
                  openAuthModal('signup');
                }}
              >
                Sign Up <span aria-hidden="true">↗</span>
              </button>
            </div>
          )}
        </nav>
      </header>

      {/* Hero Section */}
      <section className="hero" id="top" aria-labelledby="hero-title">
        <div className="hero-copy">
          <p className="eyebrow">
            <span className="status-dot" /> A clearer path forward • Laguna Province
          </p>
          <h1 id="hero-title">
            Scroll Down a little bit <em>if you need help</em>
          </h1>
          <p className="hero-intro">
            JusticePH connects citizens directly with local Laguna municipality legal desks, Public Attorney’s Office
            (PAO) units, and emergency first-responders.
          </p>
          <p className="hero-caption">
            <span className="caption-rule" /> Clear legal aid information. Instant distress calling. Verified next step.{' '}
            <span className="caption-rule" />
          </p>
        </div>

        <div className="hero-visual" aria-label="Animated radar visualization">
          <div className="visual-label visual-label-top">
            <span className="status-dot" /> JUSTICEPH / LAGUNA RADAR SIGNAL 01
          </div>
          <div className="radar-frame">
            <Radar
              color="#9bf35b"
              mode="sweep"
              speed={0.7}
              trail={0.38}
              scale={0.88}
              ringCount={5}
              spokeCount={8}
              targets={5}
              clutter={0.22}
              glow={1.15}
              mouseInteraction={true}
              grain={0.018}
              className="hero-radar"
            />
            <div className="radar-crosshair" aria-hidden="true" />
            <div className="radar-center-action">
              <StarBorder
                color="#9bf35b"
                trailColor="#ffffff"
                duration={3.2}
                direction="clockwise"
                stars={2}
                trailLength={0.4}
                thickness={2}
                radius={999}
                glow={0.95}
                hover="lap"
                sparkle={true}
                clickPulse
                theme="dark"
                backgroundColor="rgba(11, 26, 21, 0.92)"
                textColor="#f2f1e9"
                borderColor="rgba(155, 243, 91, 0.55)"
                className="ask-help-btn"
                onClick={openLocationPrompt}
              >
                <span className="ask-help-dot" aria-hidden="true" />
                <span>Ask For Help</span>
                <span className="ask-help-arrow" aria-hidden="true">
                  →
                </span>
              </StarBorder>
            </div>
          </div>
          <div className="visual-label visual-label-bottom">
            <span>01</span> LAGUNA COORDINATES
            <span className="visual-coordinate">14° 17′ N / 121° 14′ E</span>
          </div>
        </div>

        <div className="hero-index" aria-hidden="true">
          JPH—LAGUNA
        </div>
      </section>

      {/* Signal Strip */}
      <section className="signal-strip" aria-label="Project principles">
        <p>
          <span>01</span> AUTOMATIC LAGUNA LGU DETECTION
        </p>
        <p>
          <span>02</span> ONE-TAP DIRECT HOTLINE CALLING
        </p>
        <p>
          <span>03</span> TRACKED OFFICIAL CASE FILING
        </p>
      </section>

      {/* How it Works */}
      <section className="info-section" id="how-it-works">
        <div className="section-kicker">
          <span>01 / THE APPROACH</span>
          <span>LAGUNA LEGAL DISPATCH</span>
        </div>
        <div className="info-grid">
          <h2>Immediate help when and where you need it.</h2>
          <div className="info-copy">
            <p>
              JusticePH provides geolocation-aware assistance throughout Laguna Province. Whether you need immediate
              emergency police intervention, free Public Attorney’s Office (PAO) counsel, or a formal barangay case
              conciliation docket, our platform connects you instantly.
            </p>
            <a className="underlined-link" href="#next-step">
              Learn more about legal coverage <span aria-hidden="true">↗</span>
            </a>
          </div>
        </div>
        <div className="steps-row">
          <article className="step-card">
            <span className="step-number">01</span>
            <h3>Automatic Municipality Detection</h3>
            <p>Allow location access or pick your Laguna city/town to load local hotlines and legal aid desks.</p>
          </article>
          <article className="step-card">
            <span className="step-number">02</span>
            <h3>One-Tap Call or Official Filing</h3>
            <p>Directly call CDRRMO rescue and PNP stations, or securely log your formal legal complaint.</p>
          </article>
          <article className="step-card">
            <span className="step-number">03</span>
            <h3>Tracked Case Resolution</h3>
            <p>Receive your official Laguna case reference number to track PAO endorsement and barangay action.</p>
          </article>
        </div>
      </section>

      {/* About Section */}
      <section className="closing-section" id="about">
        <div className="closing-orbit" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <div className="closing-copy">
          <p className="eyebrow">
            <span className="status-dot" /> PROVINCIAL LEGAL NETWORK
          </p>
          <h2>
            Serving all 30 cities and municipalities  
            across <em>Laguna Province.</em>
          </h2>
          <p id="next-step">
            From San Pedro and Biñan in the west, to Santa Cruz and Siniloan in the east, JusticePH ensures justice is accessible to every Filipino.
          </p>
          <button type="button" className="button button-primary" onClick={openLocationPrompt}>
            Access Laguna Help Portal <span aria-hidden="true">→</span>
          </button>
        </div>
      </section>

      {/* Site Footer */}
      <footer className="site-footer">
        <a className="brand footer-brand" href="#top">
          <span className="brand-mark" aria-hidden="true">
            <span />
          </span>
          <span>
            Justice<span className="brand-accent">PH</span>
          </span>
        </a>
        <p>
          © {new Date().getFullYear()} JusticePH <span>— Laguna Legal Aid & Emergency Dispatch</span>
        </p>
        <a href="#top">Back to top ↑</a>
      </footer>

      {/* Location / Need Help Modal */}
      {locationModalOpen && (
        <div
          className="location-modal-backdrop"
          role="presentation"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              setLocationModalOpen(false);
            }
          }}
        >
          <div className="location-modal" role="dialog" aria-modal="true" aria-labelledby="location-modal-title">
            <div className="location-modal-header">
              <p className="eyebrow location-modal-eyebrow">
                <span className="status-dot" />
                {modalStep === 'location' && ' LOCATION PERMISSION'}
                {modalStep === 'choices' && ' SELECT NEXT STEP'}
                {modalStep === 'contacts' && ` LAGUNA HOTLINES • ${selectedLagunaMuni.name.toUpperCase()}`}
                {modalStep === 'report' && ' OFFICIAL CASE FILING'}
              </p>
              <button
                type="button"
                className="location-modal-close"
                aria-label="Close pop-up"
                onClick={() => setLocationModalOpen(false)}
              >
                ✕
              </button>
            </div>

            {/* Step 1: Location Prompt */}
            {modalStep === 'location' && (
              <>
                <div className="location-modal-icon" aria-hidden="true">
                  <span className="location-pin-ring" />
                  <span className="location-pin-dot" />
                </div>

                <h2 id="location-modal-title">Allow JusticePH to detect your Laguna location?</h2>
                <p id="location-modal-desc" className="location-modal-copy">
                  We use your location to automatically match you with the emergency command center, PNP police station,
                  and Public Attorney’s Office (PAO) of your specific Laguna municipality.
                </p>

                {locationState.status !== 'idle' && (
                  <div className={`location-status location-status--${locationState.status}`} role="status">
                    <span>{locationState.message}</span>
                    {locationState.coords && (
                      <strong className="location-coords">
                        {locationState.coords.latitude}° N, {locationState.coords.longitude}° E
                      </strong>
                    )}
                  </div>
                )}

                <div className="location-modal-actions">
                  {locationState.status !== 'granted' ? (
                    <>
                      <button
                        type="button"
                        className="button button-primary location-allow-btn"
                        onClick={handleRequestLocation}
                        disabled={locationState.status === 'requesting'}
                      >
                        {locationState.status === 'requesting' ? 'Detecting Location…' : 'Allow Laguna Location Access'}
                        <span aria-hidden="true">→</span>
                      </button>
                      {(locationState.status === 'denied' || locationState.status === 'unsupported') && (
                        <button type="button" className="location-dismiss-btn" onClick={() => setModalStep('choices')}>
                          Select Laguna Town Manually →
                        </button>
                      )}
                      <button
                        type="button"
                        className="location-dismiss-btn"
                        onClick={() => setLocationModalOpen(false)}
                      >
                        Close
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      className="button button-primary location-allow-btn"
                      onClick={() => setModalStep('choices')}
                    >
                      Continue with {selectedLagunaMuni.name} <span aria-hidden="true">→</span>
                    </button>
                  )}
                </div>
              </>
            )}

            {/* Step 2: Choose between Calling Hotlines or Filing a Case */}
            {modalStep === 'choices' && (
              <>
                <div className="detected-location-pill">
                  <span className="status-dot" />
                  <span>
                    Detected / Selected LGU:{' '}
                    <strong>{selectedLagunaMuni.name}, Laguna</strong>
                  </span>
                </div>

                <h2 id="location-modal-title">How would you like us to help?</h2>
                <p className="location-modal-copy">
                  Choose an option below to immediately call local Laguna responders or formally file an incident case with your local legal desk.
                </p>

                <div className="help-choices-grid">
                  <button type="button" className="help-choice-card" onClick={() => setModalStep('contacts')}>
                    <span className="help-choice-badge">01 / IMMEDIATE EMERGENCY</span>
                    <div className="help-choice-title-row">
                      <h3>Ask for Help / Call Hotlines</h3>
                      <span aria-hidden="true">→</span>
                    </div>
                    <p>View emergency rescue, PNP police, and PAO legal aid numbers with one-tap calling.</p>
                  </button>

                  <button type="button" className="help-choice-card" onClick={handleInitiateCaseFiling}>
                    <span className="help-choice-badge">02 / DOCUMENTATION</span>
                    <div className="help-choice-title-row">
                      <h3>File a Report / Case</h3>
                      <span aria-hidden="true">→</span>
                    </div>
                    <p>
                      {currentUser
                        ? 'Submit a formal case to your Laguna municipality desk for review.'
                        : 'Sign in to file and track your official incident case with your municipality desk.'}
                    </p>
                  </button>
                </div>
              </>
            )}

            {/* Step 3: Local Hotlines for Detected / Selected Laguna Municipality */}
            {modalStep === 'contacts' && (
              <>
                <h2 id="location-modal-title">Local Hotlines • {selectedLagunaMuni.name}</h2>
                <p className="location-modal-copy">
                  Tap <strong>📞 Call</strong> to instantly dial on your phone, or tap <strong>📋 Copy</strong> to copy the number.
                </p>

                {/* Laguna Municipality Switcher / Override Bar */}
                <div className="muni-override-bar">
                  <span className="muni-override-label">
                    <span>📍</span> Showing numbers for:
                  </span>
                  <select
                    className="muni-override-select"
                    value={selectedLagunaMuni.name}
                    onChange={(e) => {
                      const found = LAGUNA_MUNICIPALITIES.find((m) => m.name === e.target.value);
                      if (found) {
                        setSelectedLagunaMuni(found);
                        setCaseForm((prev) => ({ ...prev, municipality: found.name }));
                      }
                    }}
                  >
                    {LAGUNA_MUNICIPALITIES.map((muni) => (
                      <option key={muni.name} value={muni.name}>
                        {muni.name} ({muni.type})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="contacts-list">
                  {selectedLagunaMuni.hotlines.map((contact, idx) => (
                    <div key={contact.name} className="contact-item">
                      <div className="contact-info">
                        <h3>{contact.name}</h3>
                        <p>{contact.desc}</p>
                        <span className="contact-number">{contact.number}</span>
                      </div>
                      <div className="contact-actions">
                        <a
                          href={`tel:${contact.tel}`}
                          className="button button-primary contact-call-btn"
                          aria-label={`Call ${contact.name} at ${contact.number}`}
                        >
                          <span>📞 Call</span>
                        </a>
                        <button
                          type="button"
                          className={`button-copy ${copiedId === idx ? 'is-copied' : ''}`}
                          onClick={() => handleCopy(idx, contact.number)}
                          title="Copy number to clipboard"
                        >
                          {copiedId === idx ? '✓ Copied' : '📋 Copy'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="location-modal-actions modal-footer-nav" style={{ marginTop: '16px' }}>
                  <button type="button" className="location-dismiss-btn" onClick={() => setModalStep('choices')}>
                    ← Back to options
                  </button>
                  <button type="button" className="button button-primary" onClick={handleInitiateCaseFiling}>
                    File a Formal Case Instead →
                  </button>
                </div>
              </>
            )}

            {/* Step 4: Case Filing Form & Confirmation Slip */}
            {modalStep === 'report' && (
              <>
                <h2 id="location-modal-title">File an Official Incident Case</h2>
                <p className="location-modal-copy">
                  Your case will be logged directly into the <strong>MySQL</strong> database and dispatched to the legal desk of your chosen Laguna municipality.
                </p>

                {filedCaseResult ? (
                  <div className="case-receipt-card" role="status">
                    <div className="case-receipt-header">
                      <span className="case-receipt-title">Official Filing Receipt • JusticePH</span>
                      <span className="ref-badge">{filedCaseResult.case_number}</span>
                    </div>

                    <div style={{ color: 'var(--green)', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>
                      ✓ Case Registered in Municipality Dispatch Queue
                    </div>
                    <p style={{ margin: 0, fontSize: '12px', color: '#c5d5cb', lineHeight: '1.5' }}>
                      Your report has been successfully recorded for <strong>{filedCaseResult.municipality}</strong>. A legal officer will review the facts and coordinate with the local Barangay and PAO office.
                    </p>

                    <div className="case-receipt-details">
                      <div>
                        <div className="receipt-field-label">TRACKING REFERENCE</div>
                        <div className="receipt-field-val" style={{ color: 'var(--green)', fontFamily: 'var(--mono)' }}>
                          {filedCaseResult.case_number}
                        </div>
                      </div>
                      <div>
                        <div className="receipt-field-label">JURISDICTION</div>
                        <div className="receipt-field-val">{filedCaseResult.municipality}</div>
                      </div>
                      <div>
                        <div className="receipt-field-label">CATEGORY</div>
                        <div className="receipt-field-val">{filedCaseResult.category}</div>
                      </div>
                      <div>
                        <div className="receipt-field-label">STATUS</div>
                        <div className="receipt-field-val" style={{ color: '#facc15' }}>
                          PENDING INTAKE
                        </div>
                      </div>
                    </div>

                    <div className="location-modal-actions" style={{ marginTop: '18px' }}>
                      <button
                        type="button"
                        className="button button-primary"
                        onClick={() => handleCopy('receipt-ref', filedCaseResult.case_number)}
                      >
                        {copiedId === 'receipt-ref' ? '✓ Reference Number Copied' : '📋 Copy Reference Number'}
                      </button>
                      <button
                        type="button"
                        className="location-dismiss-btn"
                        onClick={() => {
                          setFiledCaseResult(null);
                          setModalStep('contacts');
                        }}
                      >
                        View Local Emergency Hotlines →
                      </button>
                    </div>
                  </div>
                ) : (
                  <form className="report-form" onSubmit={handleCaseSubmit}>
                    {caseForm.error && (
                      <div className="location-status location-status--denied">
                        <span>{caseForm.error}</span>
                      </div>
                    )}

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <label className="report-field">
                        <span>Citizen Name</span>
                        <input
                          type="text"
                          required
                          placeholder="Juan Dela Cruz"
                          value={caseForm.citizen_name}
                          onChange={(e) => setCaseForm({ ...caseForm, citizen_name: e.target.value })}
                        />
                      </label>

                      <label className="report-field">
                        <span>Contact Number</span>
                        <input
                          type="tel"
                          required
                          placeholder="+63 917 123 4567"
                          value={caseForm.phone}
                          onChange={(e) => setCaseForm({ ...caseForm, phone: e.target.value })}
                        />
                      </label>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <label className="report-field">
                        <span>Laguna Municipality / City</span>
                        <select
                          value={caseForm.municipality}
                          onChange={(e) => setCaseForm({ ...caseForm, municipality: e.target.value })}
                        >
                          {LAGUNA_MUNICIPALITIES.map((muni) => (
                            <option key={muni.name} value={muni.name}>
                              {muni.name} ({muni.type})
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className="report-field">
                        <span>Barangay / Sitio</span>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Brgy. Tagapo"
                          value={caseForm.barangay}
                          onChange={(e) => setCaseForm({ ...caseForm, barangay: e.target.value })}
                        />
                      </label>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '10px' }}>
                      <label className="report-field">
                        <span>Legal Category</span>
                        <select
                          value={caseForm.category}
                          onChange={(e) => setCaseForm({ ...caseForm, category: e.target.value })}
                        >
                          <option value="Legal Assistance / Consultation">Legal Assistance / Consultation</option>
                          <option value="Domestic & Family Safety">Domestic & Family Safety (VAWC)</option>
                          <option value="Labor & Wage Dispute">Labor & Wage Dispute</option>
                          <option value="Civil & Human Rights">Civil & Human Rights</option>
                          <option value="Barangay Dispute & Mediation">Barangay Dispute & Mediation</option>
                          <option value="Land & Tenancy Dispute">Land & Tenancy Dispute</option>
                        </select>
                      </label>

                      <label className="report-field">
                        <span>Urgency</span>
                        <select
                          value={caseForm.urgency}
                          onChange={(e) => setCaseForm({ ...caseForm, urgency: e.target.value })}
                        >
                          <option value="routine">Routine</option>
                          <option value="high">High Priority</option>
                          <option value="urgent">Urgent / Emergency</option>
                        </select>
                      </label>
                    </div>

                    <label className="report-field">
                      <span>Case Summary / Incident Title</span>
                      <input
                        type="text"
                        required
                        placeholder="Brief title of incident or assistance request..."
                        value={caseForm.title}
                        onChange={(e) => setCaseForm({ ...caseForm, title: e.target.value })}
                      />
                    </label>

                    <label className="report-field">
                      <span>Full Description of Facts</span>
                      <textarea
                        rows={4}
                        required
                        placeholder="State clearly the timeline of events, persons involved, and relief requested..."
                        value={caseForm.description}
                        onChange={(e) => setCaseForm({ ...caseForm, description: e.target.value })}
                      />
                    </label>

                    <div className="location-modal-actions" style={{ marginTop: '12px' }}>
                      <button
                        type="submit"
                        className="button button-primary location-allow-btn"
                        disabled={caseForm.submitting}
                      >
                        {caseForm.submitting ? 'Submitting to Database…' : 'Submit Case to Municipality Desk'}
                        <span aria-hidden="true">→</span>
                      </button>
                      <button type="button" className="location-dismiss-btn" onClick={() => setModalStep('choices')}>
                        Cancel
                      </button>
                    </div>
                  </form>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Auth Modal (Log In / Sign Up) with Gatekeeper Notice */}
      {authModalOpen && (
        <div
          className="location-modal-backdrop"
          role="presentation"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              setAuthModalOpen(false);
            }
          }}
        >
          <div className="location-modal" role="dialog" aria-modal="true" aria-labelledby="auth-modal-title">
            <div className="location-modal-header">
              <div className="auth-tab-switch">
                <button
                  type="button"
                  className={`auth-tab-btn ${authMode === 'login' ? 'is-active' : ''}`}
                  onClick={() => {
                    setAuthMode('login');
                    setAuthForm((prev) => ({ ...prev, message: '', success: false }));
                  }}
                >
                  <span className="status-dot" /> Log In
                </button>
                <button
                  type="button"
                  className={`auth-tab-btn ${authMode === 'signup' ? 'is-active' : ''}`}
                  onClick={() => {
                    setAuthMode('signup');
                    setAuthForm((prev) => ({ ...prev, message: '', success: false }));
                  }}
                >
                  <span className="status-dot" /> Sign Up
                </button>
              </div>
              <button
                type="button"
                className="location-modal-close"
                aria-label="Close pop-up"
                onClick={() => setAuthModalOpen(false)}
              >
                ✕
              </button>
            </div>

            {authGateNotice && (
              <div className="auth-gate-notice">
                <span className="auth-gate-notice-icon">🛡️</span>
                <div className="auth-gate-notice-text">
                  <h4>Authentication Required</h4>
                  <p>{authGateNotice}</p>
                </div>
              </div>
            )}

            <h2 id="auth-modal-title">
              {authMode === 'login' ? 'Welcome Back to JusticePH' : 'Create Your JusticePH Account'}
            </h2>
            <p className="location-modal-copy">
              {authMode === 'login'
                ? 'Sign in to access your cases, track submitted reports, and view official LGU dispatches.'
                : 'Join JusticePH Laguna to file formal complaints, request PAO legal counsel, and track cases.'}
            </p>

            {authForm.message && (
              <div
                className={`location-status ${
                  authForm.success ? 'location-status--granted' : 'location-status--denied'
                }`}
                role="status"
              >
                <span>{authForm.message}</span>
              </div>
            )}

            <form className="report-form" onSubmit={handleAuthSubmit}>
              {authMode === 'signup' && (
                <>
                  <div className="role-picker">
                    <span className="role-picker-label">Select Account Role</span>
                    <div className="role-options-grid">
                      <button
                        type="button"
                        className={`role-option-card ${authForm.role === 'user' ? 'is-selected' : ''}`}
                        onClick={() => setAuthForm((prev) => ({ ...prev, role: 'user' }))}
                      >
                        <span className="role-option-title">
                          <span>👥</span> Citizen
                        </span>
                        <span className="role-option-subtitle">File cases, track reports, access Laguna hotlines</span>
                      </button>

                      <button
                        type="button"
                        className={`role-option-card ${authForm.role === 'municipality' ? 'is-selected' : ''}`}
                        onClick={() => setAuthForm((prev) => ({ ...prev, role: 'municipality' }))}
                      >
                        <span className="role-option-title">
                          <span>🏛️</span> Municipality
                        </span>
                        <span className="role-option-subtitle">LGU Command, PAO intake, incident dispatch desk</span>
                      </button>
                    </div>
                  </div>

                  <label className="report-field">
                    <span>{authForm.role === 'municipality' ? 'Official / Officer Name' : 'Full Name'}</span>
                    <input
                      type="text"
                      required
                      placeholder={authForm.role === 'municipality' ? 'Atty. Maria Santos' : 'Juan Dela Cruz'}
                      value={authForm.name}
                      onChange={(e) => setAuthForm((prev) => ({ ...prev, name: e.target.value }))}
                    />
                  </label>

                  {authForm.role === 'municipality' && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <label className="report-field">
                        <span>Laguna Municipality / City</span>
                        <select
                          value={authForm.municipality}
                          onChange={(e) => setAuthForm((prev) => ({ ...prev, municipality: e.target.value }))}
                        >
                          {LAGUNA_MUNICIPALITIES.map((city) => (
                            <option key={city.name} value={city.name}>
                              {city.name} ({city.type})
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className="report-field">
                        <span>Designation / Department</span>
                        <select
                          value={authForm.designation}
                          onChange={(e) => setAuthForm((prev) => ({ ...prev, designation: e.target.value }))}
                        >
                          <option value="City Legal Officer">City Legal Officer</option>
                          <option value="Barangay Justice Desk Coordinator">Barangay Justice Desk</option>
                          <option value="PAO Intake Officer">PAO Intake Officer</option>
                          <option value="Crisis Response Dispatcher">Crisis Response Dispatcher</option>
                          <option value="MDRRMO Legal Liaison">MDRRMO Legal Liaison</option>
                        </select>
                      </label>
                    </div>
                  )}

                  <label className="report-field">
                    <span>Contact Number</span>
                    <input
                      type="tel"
                      required
                      placeholder="+63 917 123 4567"
                      value={authForm.phone}
                      onChange={(e) => setAuthForm((prev) => ({ ...prev, phone: e.target.value }))}
                    />
                  </label>
                </>
              )}

              <label className="report-field">
                <span>Email Address</span>
                <input
                  type="email"
                  required
                  placeholder="juan@example.com"
                  value={authForm.email}
                  onChange={(e) => setAuthForm((prev) => ({ ...prev, email: e.target.value }))}
                />
              </label>

              <label className="report-field">
                <span>Password</span>
                <input
                  type="password"
                  required
                  minLength={8}
                  placeholder="Enter your password"
                  value={authForm.password}
                  onChange={(e) => setAuthForm((prev) => ({ ...prev, password: e.target.value }))}
                />
              </label>

              {authMode === 'signup' && (
                <label className="report-field">
                  <span>Confirm Password</span>
                  <input
                    type="password"
                    required
                    minLength={8}
                    placeholder="Re-type your password"
                    value={authForm.confirmPassword}
                    onChange={(e) => setAuthForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                  />
                </label>
              )}

              <div className="location-modal-actions" style={{ marginTop: '10px' }}>
                <button
                  type="submit"
                  className="button button-primary location-allow-btn"
                  disabled={authForm.submitting}
                >
                  {authForm.submitting
                    ? 'Processing…'
                    : authMode === 'login'
                    ? 'Sign In to JusticePH'
                    : 'Create Account'}{' '}
                  <span aria-hidden="true">→</span>
                </button>
                <button
                  type="button"
                  className="location-dismiss-btn"
                  onClick={() => {
                    const next = authMode === 'login' ? 'signup' : 'login';
                    setAuthMode(next);
                    setAuthForm((prev) => ({ ...prev, message: '' }));
                  }}
                >
                  {authMode === 'login' ? 'Need an account? Sign Up' : 'Already have an account? Log In'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
