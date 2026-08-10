import React, { useState, useEffect, useRef } from 'react';
import { fpsLogger } from '../utils/fpsLogger';

const TIER_COLORS = {
  high: '#00ffaa',
  med:  '#ffbb00',
  low:  '#ff4444',
};

export function FpsProfilerOverlay({ 
  currentFps = 60, 
  onePercentLow = 60, 
  stutterCount = 0, 
  isMobile = false,
  selectedTarget = null,
  unlockedCount = 2,
  onToggleFavicon,
  onToggleNebula,
  isFaviconEnabled = true,
  isNebulaEnabled = true,
  // GPU tier props
  gpuTier = 'high',
  onSetTier,
  // Visibility control props
  isOpen,
  onToggle,
}) {
  // Check if URL has ?debug=fps or ?profiler=true
  const isDebugUrl = typeof window !== 'undefined' && 
    (window.location.search.includes('debug=fps') || window.location.search.includes('profiler=true'));

  const [internalVisible, setInternalVisible] = useState(() => isDebugUrl);

  const visible = isOpen !== undefined ? isOpen : internalVisible;

  const toggleVisibility = () => {
    if (onToggle) {
      onToggle();
    } else {
      setInternalVisible((prev) => !prev);
    }
  };

  // Keyboard shortcut listener (~ Tilde or Shift+D)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === '`' || e.key === '~') {
        toggleVisibility();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onToggle]);

  const [frameHistory, setFrameHistory] = useState([]);
  const canvasRef = useRef(null);

  // Update mini frame time graph
  useEffect(() => {
    if (!visible) return;
    const interval = setInterval(() => {
      if (fpsLogger.logs.length > 0) {
        const lastLogs = fpsLogger.logs.slice(-30);
        setFrameHistory(lastLogs);
      }
    }, 500);
    return () => clearInterval(interval);
  }, [visible]);

  // Draw frame time canvas graph
  useEffect(() => {
    if (!visible || !canvasRef.current || frameHistory.length === 0) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    // Background grid
    ctx.fillStyle = 'rgba(7, 17, 36, 0.85)';
    ctx.fillRect(0, 0, w, h);

    // Target 60 FPS line (16.6ms) & 30 FPS line (33.3ms)
    const y60 = h - (16.6 / 60) * h;
    const y30 = h - (33.3 / 60) * h;

    ctx.strokeStyle = 'rgba(0, 186, 227, 0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, y60); ctx.lineTo(w, y60);
    ctx.moveTo(0, y30); ctx.lineTo(w, y30);
    ctx.stroke();

    // Plot frame times
    const step = w / Math.max(frameHistory.length - 1, 1);
    ctx.beginPath();
    frameHistory.forEach((log, idx) => {
      const x = idx * step;
      const ms = Math.min(log.maxFrameTimeMs, 60);
      const y = h - (ms / 60) * h;
      if (idx === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });

    ctx.strokeStyle = '#00BAE3';
    ctx.lineWidth = 2;
    ctx.stroke();
  }, [visible, frameHistory]);

  // Completely hide when not active — no bottom-right button!
  if (!visible) {
    return null;
  }

  return (
    <div style={{
      position: 'fixed',
      top: '12px',
      right: '12px',
      width: '320px',
      zIndex: 9999,
      background: 'rgba(7, 17, 36, 0.95)',
      border: '1px solid var(--primary-cyan)',
      boxShadow: '0 0 25px rgba(0, 186, 227, 0.25)',
      borderRadius: '10px',
      padding: '1rem',
      fontFamily: 'var(--font-mono)',
      color: 'var(--text-pure)',
      fontSize: '0.72rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.65rem'
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(0,186,227,0.3)', paddingBottom: '0.4rem' }}>
        <span style={{ fontWeight: 'bold', color: 'var(--primary-cyan)' }}>
          TELEMETRY PROFILER
        </span>
        <button 
          onClick={toggleVisibility}
          style={{ background: 'transparent', border: 'none', color: '#888', cursor: 'pointer', fontSize: '0.9rem' }}
        >
          X
        </button>
      </div>

      {/* Metrics Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem', background: 'rgba(0, 50, 104, 0.2)', padding: '0.5rem', borderRadius: '6px' }}>
        <div>LIVE FPS: <strong style={{ color: currentFps >= 45 ? '#00ffaa' : '#ff4444' }}>{currentFps}</strong></div>
        <div>1% LOW: <strong style={{ color: onePercentLow >= 30 ? '#00ffaa' : '#ffbb00' }}>{onePercentLow}</strong></div>
        <div>STUTTERS: <strong style={{ color: stutterCount === 0 ? '#00ffaa' : '#ff4444' }}>{stutterCount}</strong></div>
        <div>UNLOCKED: <strong>{unlockedCount}/8</strong></div>
        <div style={{ gridColumn: '1 / -1' }}>
          GPU TIER: <strong style={{ color: TIER_COLORS[gpuTier] ?? '#888' }}>{gpuTier.toUpperCase()}</strong>
        </div>
      </div>

      {/* Frame Time Mini Graph */}
      <div>
        <div style={{ fontSize: '0.65rem', color: 'var(--secondary-blue)', marginBottom: '2px' }}>
          FRAME TIME GRAPH (ms) — 16.6ms target
        </div>
        <canvas ref={canvasRef} width={288} height={50} style={{ borderRadius: '4px', border: '1px solid rgba(0,186,227,0.2)' }} />
      </div>

      {/* GPU Tier Switcher */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
        <div style={{ fontSize: '0.65rem', color: 'var(--secondary-blue)' }}>GPU TIER OVERRIDE:</div>
        <div style={{ display: 'flex', gap: '0.4rem' }}>
          {['high', 'med', 'low'].map((tier) => {
            const isActive = gpuTier === tier;
            const col = TIER_COLORS[tier];
            return (
              <button
                key={tier}
                onClick={() => onSetTier && onSetTier(tier)}
                style={{
                  flex: 1,
                  padding: '0.35rem',
                  fontSize: '0.63rem',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: isActive ? 'bold' : 'normal',
                  border: `1px solid ${isActive ? col : '#444'}`,
                  background: isActive ? `${col}22` : 'transparent',
                  color: isActive ? col : '#666',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  boxShadow: isActive ? `0 0 8px ${col}44` : 'none',
                  letterSpacing: '0.04em',
                }}
              >
                {tier.toUpperCase()}
              </button>
            );
          })}
        </div>
      </div>

      {/* Diagnostic Toggles */}
      <div style={{ display: 'flex', gap: '0.4rem', flexDirection: 'column' }}>
        <div style={{ fontSize: '0.65rem', color: 'var(--secondary-blue)' }}>DIAGNOSTIC ISOLATION TOGGLES:</div>
        <div style={{ display: 'flex', gap: '0.4rem' }}>
          <button 
            onClick={onToggleFavicon}
            style={{
              flex: 1,
              padding: '0.35rem',
              fontSize: '0.63rem',
              fontFamily: 'var(--font-mono)',
              border: '1px solid ' + (isFaviconEnabled ? '#00BAE3' : '#555'),
              background: isFaviconEnabled ? 'rgba(0, 186, 227, 0.15)' : 'transparent',
              color: isFaviconEnabled ? '#00BAE3' : '#888',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            FAVICON: {isFaviconEnabled ? 'ON' : 'OFF'}
          </button>

          <button 
            onClick={onToggleNebula}
            style={{
              flex: 1,
              padding: '0.35rem',
              fontSize: '0.63rem',
              fontFamily: 'var(--font-mono)',
              border: '1px solid ' + (isNebulaEnabled ? '#00BAE3' : '#555'),
              background: isNebulaEnabled ? 'rgba(0, 186, 227, 0.15)' : 'transparent',
              color: isNebulaEnabled ? '#00BAE3' : '#888',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            NEBULA: {isNebulaEnabled ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>

      {/* Download Action Buttons */}
      <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.2rem' }}>
        <button 
          onClick={() => fpsLogger.exportAsJson()}
          style={{
            flex: 1,
            background: 'var(--primary-cyan)',
            color: '#000',
            border: 'none',
            padding: '0.5rem',
            fontWeight: 'bold',
            borderRadius: '6px',
            fontSize: '0.68rem',
            fontFamily: 'var(--font-mono)',
            cursor: 'pointer',
            boxShadow: '0 0 12px rgba(0, 186, 227, 0.4)'
          }}
        >
          LOG (.JSON)
        </button>

        <button 
          onClick={() => fpsLogger.exportAsCsv()}
          style={{
            flex: 1,
            background: 'transparent',
            color: 'var(--primary-cyan)',
            border: '1px solid var(--primary-cyan)',
            padding: '0.5rem',
            fontWeight: 'bold',
            borderRadius: '6px',
            fontSize: '0.68rem',
            fontFamily: 'var(--font-mono)',
            cursor: 'pointer'
          }}
        >
          LOG (.CSV)
        </button>
      </div>
    </div>
  );
}
