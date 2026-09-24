import React, { useState, useRef, useEffect } from 'react';

// ─── Contact Data ──────────────────────────────────────────────────────────────
const UPWORK_URL = 'https://www.upwork.com/freelancers/~016a9de2e9c13c51b4';
const WA_NUMBER = '972597733750';
const WA_TEXT   = encodeURIComponent('Hi Yahya, I saw your portfolio and would like to discuss a project.');
const EMAIL     = 'me@yahya.click';
const TELEGRAM  = 'https://t.me/+970597733750';
const LINKEDIN  = 'https://www.linkedin.com/in/yahya-amoudi/';

// ─── Official Brand SVGs (all unified in cyan/blue #00BAE3) ───────────────────

function UpworkIcon() {
  return (
    <svg width="22" height="14" viewBox="82 172 346 220" fill="none" aria-hidden="true">
      <path
        d="M345.516 181.708c-42.168 0-65.774 27.481-72.532 55.773-7.658-14.416-13.335-33.698-17.75-51.628H196.94v72.531c0 26.31-11.984 45.772-35.41 45.772-23.427 0-36.852-19.462-36.852-45.772l.27-72.531H91.34v72.531c0 21.174 6.848 40.366 19.372 54.061 12.884 14.146 30.454 21.534 50.817 21.534 40.545 0 68.837-31.085 68.837-75.595V209.64c4.235 16.038 14.326 46.853 33.608 73.884l-18.02 102.625h34.148l11.893-72.712c3.875 3.244 8.02 6.127 12.434 8.74 11.443 7.208 24.508 11.263 38.023 11.713 0 0 2.073.09 3.154.09 41.807 0 75.054-32.346 75.054-76.045 0-43.7-33.337-76.226-75.144-76.226m0 122.358c-25.86 0-42.979-20.003-47.754-27.752 6.127-49.015 24.057-64.512 47.754-64.512 23.426 0 41.626 18.741 41.626 46.132 0 27.39-18.2 46.132-41.626 46.132"
        fill="#00BAE3"
        fillRule="nonzero"
      />
    </svg>
  );
}

function WhatsAppIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        fillRule="evenodd" clipRule="evenodd"
        d="M12.001 2C6.477 2 2.001 6.476 2.001 12c0 1.744.45 3.38 1.24 4.807L2 22l5.344-1.212A9.975 9.975 0 0 0 12.001 22C17.523 22 22 17.523 22 12c0-5.522-4.477-10-10-10Zm0 1.8A8.2 8.2 0 0 1 20.2 12a8.2 8.2 0 0 1-8.199 8.2 8.163 8.163 0 0 1-4.299-1.22l-.306-.19-3.168.72.753-3.088-.21-.319A8.161 8.161 0 0 1 3.8 12 8.2 8.2 0 0 1 12 3.8Zm-2.462 4.16c-.198-.44-.404-.45-.59-.46l-.503-.006c-.175 0-.46.066-.7.33-.24.264-.917.895-.917 2.182 0 1.286.94 2.53 1.07 2.705.132.176 1.822 2.896 4.477 3.943 2.214.873 2.655.698 3.134.654.48-.044 1.547-.632 1.766-1.242.22-.61.22-1.133.154-1.242-.066-.11-.242-.176-.505-.308-.264-.132-1.548-.763-1.788-.85-.24-.087-.414-.131-.588.132-.176.264-.68.851-.833 1.025-.153.176-.307.197-.57.066-.265-.132-1.118-.411-2.13-1.313-.787-.7-1.319-1.566-1.474-1.83-.154-.263-.016-.406.116-.537.117-.116.264-.307.396-.461.133-.153.177-.264.265-.44.088-.176.044-.33-.022-.462-.066-.132-.572-1.428-.788-1.955Z"
        fill="#00BAE3"
      />
    </svg>
  );
}

function TelegramIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 192 192" fill="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
      <path
        stroke="#00BAE3"
        strokeWidth="12"
        d="M23.073 88.132s65.458-26.782 88.16-36.212c8.702-3.772 38.215-15.843 38.215-15.843s13.621-5.28 12.486 7.544c-.379 5.281-3.406 23.764-6.433 43.756-4.54 28.291-9.459 59.221-9.459 59.221s-.756 8.676-7.188 10.185c-6.433 1.509-17.027-5.281-18.919-6.79-1.513-1.132-28.377-18.106-38.214-26.404-2.649-2.263-5.676-6.79.378-12.071 13.621-12.447 29.891-27.913 39.728-37.72 4.54-4.527 9.081-15.089-9.837-2.264-26.864 18.483-53.35 35.835-53.35 35.835s-6.053 3.772-17.404.377c-11.351-3.395-24.594-7.921-24.594-7.921s-9.08-5.659 6.433-11.693Z"
      />
    </svg>
  );
}

function LinkedInIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 382 382" fill="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
      <path
        fill="#00BAE3"
        d="M118.207,329.844c0,5.554-4.502,10.056-10.056,10.056H65.345c-5.554,0-10.056-4.502-10.056-10.056V150.403c0-5.554,4.502-10.056,10.056-10.056h42.806c5.554,0,10.056,4.502,10.056,10.056V329.844z M86.748,123.432c-22.459,0-40.666-18.207-40.666-40.666S64.289,42.1,86.748,42.1s40.666,18.207,40.666,40.666S109.208,123.432,86.748,123.432z M341.91,330.654c0,5.106-4.14,9.246-9.246,9.246H286.73c-5.106,0-9.246-4.14-9.246-9.246v-84.168c0-12.556,3.683-55.021-32.813-55.021c-28.309,0-34.051,29.066-35.204,42.11v97.079c0,5.106-4.139,9.246-9.246,9.246h-44.426c-5.106,0-9.246-4.14-9.246-9.246V149.593c0-5.106,4.14-9.246,9.246-9.246h44.426c5.106,0,9.246,4.14,9.246,9.246v15.655c10.497-15.753,26.097-27.912,59.312-27.912c73.552,0,73.131,68.716,73.131,106.472L341.91,330.654z"
      />
    </svg>
  );
}

function EmailIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="2" y="4" width="20" height="16" rx="3" fill="none" stroke="#00BAE3" strokeWidth="1.6" />
      <path
        d="M2 8l8.616 5.223a2.5 2.5 0 0 0 2.768 0L22 8"
        stroke="#00BAE3" strokeWidth="1.6" strokeLinecap="round"
      />
    </svg>
  );
}

// Helper: Detect if visitor arrived from an Upwork proposal or link (?ref=upwork, ?source=upwork, ?upwork)
function checkIsUpworkSource() {
  if (typeof window === 'undefined') return false;
  try {
    const params = new URLSearchParams(window.location.search);
    return params.get('ref') === 'upwork' ||
           params.get('source') === 'upwork' ||
           params.get('utm_source') === 'upwork' ||
           params.has('upwork');
  } catch {
    return false;
  }
}

// Helper: Detect if current URL points to /contact
function checkIsContactRoute() {
  if (typeof window === 'undefined') return false;
  const p = (window.location.pathname || '').toLowerCase().replace(/\/$/, '');
  const h = (window.location.hash || '').toLowerCase();
  const s = (window.location.search || '').toLowerCase();
  return p === '/contact' || h === '#contact' || s.includes('contact');
}

// ─── Main Component ────────────────────────────────────────────────────────────
export function ContactPanel({ onReturn, selectedTarget }) {
  const [open, setOpen] = useState(() => checkIsContactRoute());
  const [isUpwork] = useState(() => checkIsUpworkSource());
  const [showHint, setShowHint] = useState(() => {
    if (typeof window === 'undefined') return false;
    try {
      // Clean up previous stale keys that were set by earlier timers
      localStorage.removeItem('yahya_contact_hint_dismissed');
      sessionStorage.removeItem('yahya_contact_hint_seen');
      sessionStorage.removeItem('yahya_contact_hint_dismissed');
      return localStorage.getItem('yahya_contact_hint_closed') !== 'true';
    } catch {
      return true;
    }
  });
  const wrapRef = useRef(null);

  // Flag in localStorage ONLY when user explicitly clicks CONTACT or clicks X on the hint
  const dismissHint = () => {
    setShowHint(false);
    try {
      localStorage.setItem('yahya_contact_hint_closed', 'true');
    } catch {}
  };

  // Sync state with browser URL (/contact <-> /)
  const setOpenWithSync = (nextVal) => {
    setOpen((prev) => {
      const willOpen = typeof nextVal === 'function' ? nextVal(prev) : nextVal;
      if (willOpen && showHint) {
        dismissHint();
      }
      if (typeof window !== 'undefined') {
        const currentPath = (window.location.pathname || '').replace(/\/$/, '');
        if (willOpen) {
          if (currentPath !== '/contact') {
            window.history.pushState({ contactOpen: true }, '', '/contact');
          }
        } else {
          if (currentPath === '/contact') {
            window.history.pushState(null, '', '/');
          }
        }
      }
      return willOpen;
    });
  };

  // Listen for browser Back/Forward (popstate) and hashchange
  useEffect(() => {
    const handlePopState = () => {
      const active = checkIsContactRoute();
      setOpen(active);
      if (active) dismissHint();
    };
    window.addEventListener('popstate', handlePopState);
    window.addEventListener('hashchange', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('hashchange', handlePopState);
    };
  }, []);

  // Close on Escape or outside-click
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') setOpenWithSync(false);
    };
    const onClick = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpenWithSync(false);
      }
    };
    window.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onClick);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onClick);
    };
  }, [open]);

  const handleRowClick = (url) => {
    if (!open) return;
    window.open(url, '_blank', 'noopener,noreferrer');
    setOpenWithSync(false);
  };

  return (
    <div className="contact-wrap" ref={wrapRef}>
      {/* Trigger pill: Unified YAHYA.CLICK · CONTACT / UPWORK ▾ button */}
      <button
        id="contact-trigger-btn"
        className={`contact-trigger${open ? ' is-open' : ''}`}
        onClick={(e) => {
          e.stopPropagation();
          if (onReturn) onReturn();
          setOpenWithSync((v) => !v);
        }}
        aria-expanded={open}
        aria-haspopup="true"
        aria-label="Contact Yahya"
      >
        <span className="contact-dot" aria-hidden="true" />
        <span className="contact-brand">YAHYA.CLICK</span>
        <span className="contact-sep">·</span>
        <span className="contact-label">{isUpwork ? 'UPWORK' : 'CONTACT'}</span>
        <span className={`contact-chevron${open ? ' rotated' : ''}`} aria-hidden="true">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </span>
      </button>

      {/* Option 3: First-visit onboarding hint chip (suppressed when viewing a project) */}
      {showHint && !open && !selectedTarget && (
        <div
          className="contact-onboard-hint"
          onClick={() => {
            if (onReturn) onReturn();
            setOpenWithSync(true);
          }}
          role="status"
          aria-live="polite"
        >
          <span className="contact-hint-dot" aria-hidden="true" />
          <span>{isUpwork ? 'CLICK FOR UPWORK PROFILE' : 'CLICK TO GET IN TOUCH'}</span>
          <button
            type="button"
            className="contact-hint-close"
            onClick={(e) => {
              e.stopPropagation();
              dismissHint();
            }}
            aria-label="Dismiss hint"
          >
            ✕
          </button>
        </div>
      )}

      {/* Dropdown card */}
      <div
        className={`contact-dropdown${open ? ' open' : ''}`}
        role="menu"
        aria-label="Contact options"
        aria-hidden={!open}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <div className="contact-dropdown-header">
          {isUpwork ? 'UPWORK CLIENT PORTAL' : 'GET IN TOUCH'}
        </div>

        {/* Upwork Profile — Top Option */}
        <button
          className="contact-row contact-row-upwork"
          role="menuitem"
          onClick={() => handleRowClick(UPWORK_URL)}
          aria-label="Hire Yahya on Upwork"
        >
          <span className="contact-row-icon upwork-icon-box"><UpworkIcon /></span>
          <span className="contact-row-body">
            <span className="contact-row-text">
              UPWORK
              <span className="contact-verified-badge">VERIFIED</span>
            </span>
            <span className="contact-row-sub">Hire on Platform</span>
          </span>
          <span className="contact-row-arrow">&#8250;</span>
        </button>

        {/* Upwork TOS Compliance Notice when in Upwork Mode */}
        {isUpwork && (
          <div className="upwork-tos-notice" role="note">
            <span className="upwork-notice-icon">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#00BAE3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </span>
            <span>Per Upwork Terms of Service, all initial project inquiries, interviews, and contracts must remain on Upwork.</span>
          </div>
        )}

        {/* External contacts — Shown only for non-Upwork visitors */}
        {!isUpwork && (
          <>
            {/* WhatsApp */}
            <button
              className="contact-row"
              role="menuitem"
              onClick={() => handleRowClick(`https://wa.me/${WA_NUMBER}?text=${WA_TEXT}`)}
              aria-label="Message on WhatsApp"
            >
              <span className="contact-row-icon"><WhatsAppIcon /></span>
              <span className="contact-row-body">
                <span className="contact-row-text">WHATSAPP</span>
                <span className="contact-row-sub">+972 59-773-3750</span>
              </span>
              <span className="contact-row-arrow">&#8250;</span>
            </button>

            {/* Email — direct mailto */}
            <button
              className="contact-row"
              role="menuitem"
              onClick={() => {
                if (!open) return;
                window.location.href = `mailto:${EMAIL}`;
                setOpenWithSync(false);
              }}
              aria-label={`Send email to ${EMAIL}`}
            >
              <span className="contact-row-icon"><EmailIcon /></span>
              <span className="contact-row-body">
                <span className="contact-row-text">EMAIL</span>
                <span className="contact-row-sub">{EMAIL}</span>
              </span>
              <span className="contact-row-arrow">&#8250;</span>
            </button>

            {/* Telegram */}
            <button
              className="contact-row"
              role="menuitem"
              onClick={() => handleRowClick(TELEGRAM)}
              aria-label="Message on Telegram"
            >
              <span className="contact-row-icon"><TelegramIcon /></span>
              <span className="contact-row-body">
                <span className="contact-row-text">TELEGRAM</span>
                <span className="contact-row-sub">+970 597 733 750</span>
              </span>
              <span className="contact-row-arrow">&#8250;</span>
            </button>

            {/* LinkedIn */}
            <button
              className="contact-row"
              role="menuitem"
              onClick={() => handleRowClick(LINKEDIN)}
              aria-label="Connect on LinkedIn"
            >
              <span className="contact-row-icon"><LinkedInIcon /></span>
              <span className="contact-row-body">
                <span className="contact-row-text">LINKEDIN</span>
                <span className="contact-row-sub">yahya-amoudi</span>
              </span>
              <span className="contact-row-arrow">&#8250;</span>
            </button>
          </>
        )}

      </div>
    </div>
  );
}
