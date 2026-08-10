import React, { useEffect, useState } from 'react';

export function BatteryWarning() {
  const [showWarning, setShowWarning] = useState(false);

  useEffect(() => {
    // 1. Force show on /warning route for UI testing
    if (window.location.pathname === '/warning') {
      setShowWarning(true);
      return;
    }

    // 2. Check actual battery status
    if ('getBattery' in navigator) {
      navigator.getBattery().then((battery) => {
        const checkBattery = () => {
          // If the device is not charging and has a battery, show the warning
          if (!battery.charging) {
            setShowWarning(true);
          } else {
            setShowWarning(false);
          }
        };
        
        checkBattery(); // Initial check

        // Listen for when they plug/unplug the charger
        battery.addEventListener('chargingchange', checkBattery);
        return () => {
          battery.removeEventListener('chargingchange', checkBattery);
        };
      });
    }
  }, []);

  if (!showWarning) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, width: '100vw', height: '100vh',
      backgroundColor: 'rgba(7, 17, 36, 0.92)',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      color: 'var(--text-pure)',
      fontFamily: 'var(--font-mono)',
      textAlign: 'center',
      backdropFilter: 'blur(15px)',
      padding: '2rem'
    }}>
      <div style={{
        border: '1px solid #FF4500',
        padding: '3rem',
        borderRadius: '12px',
        background: 'rgba(255, 69, 0, 0.03)',
        boxShadow: '0 0 40px rgba(255, 69, 0, 0.15)',
        maxWidth: '550px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}>
        <div style={{ color: '#FF4500', fontSize: '3rem', marginBottom: '1.5rem', lineHeight: 1 }}>
          ⚠️
        </div>
        
        <h2 style={{ 
          fontFamily: 'var(--font-sans)', 
          fontSize: '1.6rem', 
          marginBottom: '1rem',
          letterSpacing: '0.1em',
          color: '#FF4500',
          textShadow: '0 0 10px rgba(255, 69, 0, 0.5)'
        }}>
          SYSTEM POWER LIMITED
        </h2>
        
        <p style={{ 
          fontSize: '0.85rem', 
          lineHeight: '1.8',
          color: 'rgba(252, 252, 252, 0.85)',
          marginBottom: '2.5rem',
          letterSpacing: '0.05em'
        }}>
          Your device is currently running on battery power. <br/><br/>
          Browsers and GPUs artificially restrict 3D performance to save battery.
          To experience this simulation at a smooth 60+ FPS, please plug in your charger.
        </p>
        
        <button 
          onClick={() => setShowWarning(false)}
          style={{
            background: 'transparent',
            border: '1px solid #FF4500',
            color: '#FF4500',
            padding: '0.75rem 2rem',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.75rem',
            letterSpacing: '0.15em',
            borderRadius: '999px',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            outline: 'none'
          }}
          onMouseOver={(e) => {
            e.target.style.background = '#FF4500';
            e.target.style.color = '#000';
            e.target.style.boxShadow = '0 0 20px #FF4500';
          }}
          onMouseOut={(e) => {
            e.target.style.background = 'transparent';
            e.target.style.color = '#FF4500';
            e.target.style.boxShadow = 'none';
          }}
        >
          [ CONTINUE ANYWAY ]
        </button>
      </div>
    </div>
  );
}
