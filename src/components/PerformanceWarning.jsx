import React, { useEffect, useState } from 'react';

// Returns true if we're on the /warning-performance preview route
const isPreviewRoute = () => window.location.pathname.replace(/\/$/, '') === '/warning-performance';

export function PerformanceWarning({ currentFps = 60, isMobile = false }) {
  const [showWarning, setShowWarning] = useState(() => isPreviewRoute());
  const [hasDismissed, setHasDismissed] = useState(false);
  const [isBatteryKnown, setIsBatteryKnown] = useState(false);

  useEffect(() => {
    // Determine if we confidently know the battery status. 
    // Firefox blocks it entirely (getBattery is undefined or throws).
    // Brave spoofs it (always returns charging: true, level: 1).
    // It's hard to detect spoofing perfectly, but we know if it's completely missing.
    if (!('getBattery' in navigator)) {
      setIsBatteryKnown(false);
    } else {
      navigator.getBattery().then(b => {
        setIsBatteryKnown(true);
      }).catch(() => {
        setIsBatteryKnown(false);
      });
    }
  }, []);

  useEffect(() => {
    // If preview route or already dismissed, do nothing
    if (isPreviewRoute() || hasDismissed) return;
    
    // Only target Desktops/Laptops. 
    if (isMobile) return;

    // Check FPS drops continuously for a few seconds
    const checkFps = setInterval(() => {
      // If FPS drops below 35 AND we either don't know the battery status 
      // (or we assume we might be in a spoofed browser like Brave where the Battery API is useless)
      if (currentFps < 35) {
        setShowWarning(true);
      }
    }, 5000);

    return () => clearInterval(checkFps);
  }, [currentFps, hasDismissed, isMobile, isBatteryKnown]);

  if (!showWarning || hasDismissed) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, width: '100vw', height: '100vh',
      backgroundColor: 'rgba(7, 17, 36, 0.95)',
      zIndex: 9998,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      fontFamily: 'var(--font-mono)',
      textAlign: 'center',
      padding: '2rem'
    }}>
      <div style={{
        border: '1px solid rgba(0, 186, 227, 0.5)',
        padding: '2rem 2.5rem',
        borderRadius: '12px',
        background: 'rgba(0, 50, 104, 0.25)',
        boxShadow: '0 0 40px rgba(0, 186, 227, 0.12)',
        maxWidth: '480px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '1rem'
      }}>

        <h2 style={{ 
          fontFamily: 'var(--font-sans)', 
          fontSize: '1.3rem', 
          letterSpacing: '0.1em',
          color: 'var(--text-pure)',
        }}>
          FPS DEGRADATION DETECTED
        </h2>
        
        <p style={{ 
          fontSize: '0.8rem', 
          lineHeight: '1.7',
          color: 'rgba(252, 252, 252, 0.75)',
          letterSpacing: '0.03em'
        }}>
          Your system is struggling to render this simulation smoothly ({currentFps} FPS). <br/><br/>
          If you are on a laptop, <strong>please plug in your charger</strong>. 
          Some browsers (like Brave) block battery detection, but hardware often severely throttles 3D graphics on battery power.
        </p>
        
        <button 
          onClick={() => setHasDismissed(true)}
          style={{
            marginTop: '0.25rem',
            background: 'transparent',
            border: '1px solid var(--primary-cyan)',
            color: 'var(--primary-cyan)',
            padding: '0.55rem 1.75rem',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.7rem',
            letterSpacing: '0.15em',
            borderRadius: '999px',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            outline: 'none'
          }}
          onMouseOver={(e) => {
            e.target.style.background = 'var(--primary-cyan)';
            e.target.style.color = '#000';
            e.target.style.boxShadow = '0 0 20px var(--primary-cyan)';
          }}
          onMouseOut={(e) => {
            e.target.style.background = 'transparent';
            e.target.style.color = 'var(--primary-cyan)';
            e.target.style.boxShadow = 'none';
          }}
        >
          [ CONTINUE ANYWAY ]
        </button>
      </div>
    </div>
  );
}
