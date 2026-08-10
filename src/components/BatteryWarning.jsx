import React, { useEffect, useState } from 'react';

// Returns true if we're on the /warning preview route
const isPreviewRoute = () => window.location.pathname.replace(/\/$/, '') === '/warning';

export function BatteryWarning({ currentFps = 60, isMobile = false }) {
  // Initialize directly from pathname — no async race, always correct on frame 1
  const [showWarning, setShowWarning] = useState(() => isPreviewRoute());
  const [hasDismissed, setHasDismissed] = useState(false);

  // Fallback for Brave/Firefox/Safari which block navigator.getBattery for anti-fingerprinting
  useEffect(() => {
    if (isPreviewRoute() || hasDismissed || isMobile) return;
    
    // If we're on desktop and FPS drops consistently below 35 after initial load
    const checkFps = setInterval(() => {
      if (currentFps < 35) {
        setShowWarning(true);
      }
    }, 5000); // Check every 5 seconds to avoid initial load spikes

    return () => clearInterval(checkFps);
  }, [currentFps, hasDismissed, isMobile]);

  useEffect(() => {
    // If we're on the /warning preview route, always show — skip battery API
    if (isPreviewRoute() || hasDismissed) return;

    // Check actual battery status on real devices
    if ('getBattery' in navigator) {
      navigator.getBattery().then((battery) => {
        const checkBattery = () => {
          if (!battery.charging) setShowWarning(true);
        };

        checkBattery(); // Initial check

        // Reactively update when they plug/unplug the charger
        battery.addEventListener('chargingchange', checkBattery);
        return () => battery.removeEventListener('chargingchange', checkBattery);
      });
    }
  }, [hasDismissed]);

  if (!showWarning || hasDismissed) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, width: '100vw', height: '100vh',
      backgroundColor: 'rgba(7, 17, 36, 0.95)',
      zIndex: 9999,
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
          SYSTEM POWER LIMITED
        </h2>
        
        <p style={{ 
          fontSize: '0.8rem', 
          lineHeight: '1.7',
          color: 'rgba(252, 252, 252, 0.75)',
          letterSpacing: '0.03em'
        }}>
          Your device is running on battery power. Browsers restrict GPU performance to save power — 
          plug in your charger to experience this simulation at 60+ FPS.
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
