import React, { useEffect, useState, useRef } from 'react';

// Returns true if we're on the /warning-performance preview route
const isPreviewRoute = () => window.location.pathname.replace(/\/$/, '') === '/warning-performance';

export function PerformanceWarning({ currentFps = 60, isMobile = false, isDismissed = false, onDismiss = () => {} }) {
  const [showWarning, setShowWarning] = useState(() => isPreviewRoute());
  const mountTimeRef = useRef(Date.now());
  const onDismissRef = useRef(onDismiss);

  useEffect(() => {
    onDismissRef.current = onDismiss;
  }, [onDismiss]);

  // Auto-dismiss after 5 seconds when visible (stable timer - no parent re-render resets)
  useEffect(() => {
    if (!showWarning || isDismissed) return;

    const timer = setTimeout(() => {
      setShowWarning(false);
      if (typeof onDismissRef.current === 'function') {
        onDismissRef.current();
      }
    }, 7000);

    return () => clearTimeout(timer);
  }, [showWarning, isDismissed]);

  useEffect(() => {
    // If preview route or already dismissed or on mobile, skip logic
    if (isPreviewRoute() || isDismissed || isMobile) return;

    // Grace period: ignore initial 6 seconds of page startup (shader compile / asset loading spikes)
    if (Date.now() - mountTimeRef.current < 6000) return;

    // If FPS recovers to >= 50, automatically hide warning
    if (currentFps >= 50 && showWarning) {
      setShowWarning(false);
      return;
    }

    // Only trigger if FPS falls below 35 after grace period
    if (currentFps < 35 && !showWarning) {
      setShowWarning(true);
    }
  }, [currentFps, isDismissed, isMobile, showWarning]);

  // Desktop only & requires active warning state
  if (isMobile || !showWarning || isDismissed) return null;

  return (
    <>
      <style>{`
        @keyframes toastProgressBar {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>

      <div style={{
        position: 'fixed',
        top: '24px',
        left: '24px',
        width: '360px',
        maxWidth: 'calc(100vw - 48px)',
        zIndex: 9998,
        fontFamily: 'var(--font-mono)',
        pointerEvents: 'auto',
        borderRadius: '10px',
        overflow: 'hidden',
        border: '1px solid rgba(0, 186, 227, 0.5)',
        background: 'rgba(7, 17, 36, 0.92)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), 0 0 20px rgba(0, 186, 227, 0.15)',
        padding: '1.25rem 1.25rem 1.5rem 1.25rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.6rem',
        color: 'var(--text-pure)',
      }}>
        {/* Header with Title and Close Button */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{
            fontFamily: 'var(--font-sans)',
            fontSize: '0.85rem',
            fontWeight: 700,
            letterSpacing: '0.08em',
            color: 'var(--primary-cyan)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem'
          }}>
            <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#ff4d4d' }}></span>
            FPS DEGRADATION DETECTED
          </span>

          <button
            onClick={() => { setShowWarning(false); onDismiss(); }}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'rgba(252, 252, 252, 0.5)',
              cursor: 'pointer',
              fontSize: '0.9rem',
              padding: '0 0.2rem',
              lineHeight: 1,
            }}
            onMouseOver={(e) => e.target.style.color = '#fff'}
            onMouseOut={(e) => e.target.style.color = 'rgba(252, 252, 252, 0.5)'}
          >
            ✕
          </button>
        </div>

        {/* Description Text */}
        <p style={{
          margin: 0,
          fontSize: '0.75rem',
          lineHeight: '1.5',
          color: 'rgba(252, 252, 252, 0.8)',
          letterSpacing: '0.02em'
        }}>
          Frame rate is currently low ({currentFps} FPS). If on a laptop, plug in your charger for full 3D performance.
        </p>

        {/* 5-Second Shrinking Progress Bar at Bottom of Card */}
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          width: '100%',
          height: '3px',
          backgroundColor: 'rgba(0, 186, 227, 0.2)',
        }}>
          <div style={{
            height: '100%',
            backgroundColor: 'var(--primary-cyan)',
            boxShadow: '0 0 8px var(--primary-cyan)',
            animation: 'toastProgressBar 7s linear forwards',
          }} />
        </div>
      </div>
    </>
  );
}
