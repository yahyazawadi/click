import React, { useState, useEffect, useRef } from 'react';
import { fpsLogger } from '../utils/fpsLogger';
import { NEBULA_CONFIG } from '../config';

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

  // Active nebula tab state ('nebula1' or 'nebula2')
  const [activeNebulaTab, setActiveNebulaTab] = useState('nebula1');
  const [, setRerender] = useState(0);

  // Copy notification state
  const [copiedStatus, setCopiedStatus] = useState(false);
  const [pastedStatus, setPastedStatus] = useState(false);

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
  const overlayRef = useRef(null);

  // Prevent wheel scroll event from propagating to Lenis smooth scroll or background page
  useEffect(() => {
    const el = overlayRef.current;
    if (!el || !visible) return;

    const preventPageScroll = (e) => {
      e.stopPropagation();
      const { scrollTop, scrollHeight, clientHeight } = el;
      const isScrollable = scrollHeight > clientHeight;
      if (isScrollable) {
        const isAtTop = scrollTop <= 0 && e.deltaY < 0;
        const isAtBottom = Math.abs(scrollHeight - clientHeight - scrollTop) <= 2 && e.deltaY > 0;
        if (isAtTop || isAtBottom) {
          e.preventDefault();
        }
      } else {
        e.preventDefault();
      }
    };

    el.addEventListener('wheel', preventPageScroll, { passive: false });
    el.addEventListener('touchmove', preventPageScroll, { passive: false });

    return () => {
      el.removeEventListener('wheel', preventPageScroll);
      el.removeEventListener('touchmove', preventPageScroll);
    };
  }, [visible]);

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

  if (!visible) {
    return null;
  }

  // Update a parameter directly on NEBULA_CONFIG and trigger state re-render
  const updateNebulaParam = (nebulaKey, paramKey, value) => {
    if (paramKey.startsWith('color_')) {
      const colorField = paramKey.replace('color_', '');
      NEBULA_CONFIG[nebulaKey].colors[colorField] = value;
    } else {
      NEBULA_CONFIG[nebulaKey][paramKey] = parseFloat(value);
    }
    setRerender((v) => v + 1);
  };

  const copyConfigJson = () => {
    const configStr = JSON.stringify(NEBULA_CONFIG, null, 2);
    navigator.clipboard.writeText(configStr);
    setCopiedStatus(true);
    setTimeout(() => setCopiedStatus(false), 2000);
  };

  const pasteConfigJson = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (!text) return;
      const parsed = JSON.parse(text);
      if (parsed.nebula1 || parsed.nebula2) {
        if (parsed.nebula1) Object.assign(NEBULA_CONFIG.nebula1, parsed.nebula1);
        if (parsed.nebula2) Object.assign(NEBULA_CONFIG.nebula2, parsed.nebula2);
      } else if (parsed.scale !== undefined || parsed.brightness !== undefined) {
        Object.assign(NEBULA_CONFIG[activeNebulaTab], parsed);
      } else {
        return;
      }
      setPastedStatus(true);
      setRerender((v) => v + 1);
      setTimeout(() => setPastedStatus(false), 2000);
    } catch (err) {
      console.warn("Clipboard paste error or invalid JSON", err);
    }
  };

  const currentNebula = NEBULA_CONFIG[activeNebulaTab];

  return (
    <div 
      ref={overlayRef}
      className="telemetry-profiler-container"
      style={{
        position: 'fixed',
        top: '12px',
        right: '12px',
        width: '340px',
        maxHeight: '92vh',
        zIndex: 9999,
        background: 'rgba(7, 17, 36, 0.96)',
        border: '1px solid var(--primary-cyan)',
        boxShadow: '0 0 25px rgba(0, 186, 227, 0.3)',
        borderRadius: '10px',
        padding: '0.85rem',
        fontFamily: 'var(--font-mono)',
        color: 'var(--text-pure)',
        fontSize: '0.72rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.65rem',
        overflowX: 'hidden',
        overflowY: 'auto'
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(0,186,227,0.3)', paddingBottom: '0.4rem' }}>
        <span style={{ fontWeight: 'bold', color: 'var(--primary-cyan)', letterSpacing: '0.05em' }}>
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
          FRAME TIME GRAPH (ms) - 16.6ms target
        </div>
        <canvas ref={canvasRef} width={300} height={45} style={{ borderRadius: '4px', border: '1px solid rgba(0,186,227,0.2)', maxWidth: '100%', display: 'block' }} />
      </div>

      {/* GPU Tier Switcher */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
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

      {/* NEBULA LIVE PARAMETER TUNER */}
      <div style={{
        marginTop: '0.4rem',
        paddingTop: '0.5rem',
        borderTop: '1px solid rgba(0, 186, 227, 0.3)',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: 'bold', color: 'var(--primary-cyan)', fontSize: '0.68rem', letterSpacing: '0.04em' }}>
            NEBULA SHAPE TUNER
          </span>
          <div style={{ display: 'flex', gap: '0.3rem' }}>
            <button
              onClick={copyConfigJson}
              style={{
                background: copiedStatus ? '#00ffaa' : 'rgba(0, 186, 227, 0.2)',
                color: copiedStatus ? '#000' : 'var(--primary-cyan)',
                border: '1px solid var(--primary-cyan)',
                padding: '0.2rem 0.35rem',
                fontSize: '0.58rem',
                fontFamily: 'var(--font-mono)',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: 'bold',
              }}
            >
              {copiedStatus ? 'COPIED!' : 'COPY'}
            </button>

            <button
              onClick={pasteConfigJson}
              style={{
                background: pastedStatus ? '#00ffaa' : 'rgba(0, 186, 227, 0.2)',
                color: pastedStatus ? '#000' : 'var(--primary-cyan)',
                border: '1px solid var(--primary-cyan)',
                padding: '0.2rem 0.35rem',
                fontSize: '0.58rem',
                fontFamily: 'var(--font-mono)',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: 'bold',
              }}
            >
              {pastedStatus ? 'PASTED!' : 'PASTE'}
            </button>
          </div>
        </div>

        {/* Tab Selection */}
        <div style={{ display: 'flex', gap: '0.3rem' }}>
          <button
            onClick={() => setActiveNebulaTab('nebula1')}
            style={{
              flex: 1,
              padding: '0.35rem',
              fontSize: '0.63rem',
              fontFamily: 'var(--font-mono)',
              border: '1px solid ' + (activeNebulaTab === 'nebula1' ? '#ff3550' : '#444'),
              background: activeNebulaTab === 'nebula1' ? 'rgba(255, 53, 80, 0.2)' : 'transparent',
              color: activeNebulaTab === 'nebula1' ? '#ff3550' : '#888',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: activeNebulaTab === 'nebula1' ? 'bold' : 'normal'
            }}
          >
            NEBULA 1 (RED)
          </button>

          <button
            onClick={() => setActiveNebulaTab('nebula2')}
            style={{
              flex: 1,
              padding: '0.35rem',
              fontSize: '0.63rem',
              fontFamily: 'var(--font-mono)',
              border: '1px solid ' + (activeNebulaTab === 'nebula2' ? '#00bae3' : '#444'),
              background: activeNebulaTab === 'nebula2' ? 'rgba(0, 186, 227, 0.2)' : 'transparent',
              color: activeNebulaTab === 'nebula2' ? '#00bae3' : '#888',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: activeNebulaTab === 'nebula2' ? 'bold' : 'normal'
            }}
          >
            NEBULA 2 (BLUE)
          </button>
        </div>

        {/* Sliders Grid */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.4rem',
          background: 'rgba(0, 50, 104, 0.15)',
          padding: '0.5rem',
          borderRadius: '6px',
          border: '1px solid rgba(0, 186, 227, 0.15)'
        }}>
          {[
            { label: 'SCALE', key: 'scale', min: 1.0, max: 10.0, step: 0.1 },
            { label: 'WARP', key: 'warp', min: 0.0, max: 10.0, step: 0.1 },
            { label: 'BRIGHTNESS', key: 'brightness', min: 0.1, max: 6.0, step: 0.1 },
            { label: 'DUST STRENGTH', key: 'dustStrength', min: 0.0, max: 1.0, step: 0.02 },
            { label: 'PILLAR STRENGTH', key: 'pillarStrength', min: 0.0, max: 1.0, step: 0.02 },
            { label: 'MASK RADIUS', key: 'maskRadius', min: 0.05, max: 0.90, step: 0.01 },
            { label: 'EDGE WARP', key: 'edgeWarp', min: 0.0, max: 1.0, step: 0.02 },
            { label: 'CORE RADIUS', key: 'coreRadius', min: 0.02, max: 0.60, step: 0.01 },
            { label: 'ALPHA', key: 'alpha', min: 0.0, max: 1.0, step: 0.02 },
          ].map(({ label, key, min, max, step }) => {
            const val = currentNebula[key];
            return (
              <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.6rem', color: '#ccc' }}>
                  <span>{label}:</span>
                  <span style={{ color: 'var(--primary-cyan)', fontWeight: 'bold' }}>{val}</span>
                </div>
                <input
                  type="range"
                  min={min}
                  max={max}
                  step={step}
                  value={val}
                  onChange={(e) => updateNebulaParam(activeNebulaTab, key, e.target.value)}
                  style={{ width: '100%', accentColor: 'var(--primary-cyan)', cursor: 'pointer' }}
                />
              </div>
            );
          })}

          {/* Color Palette Controls */}
          <div style={{ marginTop: '0.3rem', paddingTop: '0.3rem', borderTop: '1px solid rgba(255, 255, 255, 0.1)', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
            <div style={{ fontSize: '0.62rem', color: 'var(--secondary-blue)', fontWeight: 'bold' }}>
              COLOR PALETTE (HEX):
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.3rem' }}>
              {[
                { label: 'SII (WISPS)', key: 'color_sii' },
                { label: 'HA (MID)', key: 'color_ha' },
                { label: 'OIII (VOID)', key: 'color_oiii' },
                { label: 'CORE', key: 'color_core' },
              ].map(({ label, key }) => {
                const colorField = key.replace('color_', '');
                const hexVal = currentNebula.colors[colorField];
                return (
                  <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <span style={{ fontSize: '0.58rem', color: '#aaa' }}>{label}:</span>
                    <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                      <input
                        type="color"
                        value={hexVal}
                        onChange={(e) => updateNebulaParam(activeNebulaTab, key, e.target.value)}
                        style={{ width: '22px', height: '22px', border: 'none', background: 'transparent', cursor: 'pointer' }}
                      />
                      <input
                        type="text"
                        value={hexVal}
                        onChange={(e) => updateNebulaParam(activeNebulaTab, key, e.target.value)}
                        style={{
                          width: '100%',
                          background: 'rgba(0, 0, 0, 0.4)',
                          border: '1px solid #444',
                          color: '#fff',
                          fontSize: '0.58rem',
                          fontFamily: 'var(--font-mono)',
                          borderRadius: '3px',
                          padding: '2px 4px'
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
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
            padding: '0.4rem',
            fontWeight: 'bold',
            borderRadius: '6px',
            fontSize: '0.65rem',
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
            padding: '0.4rem',
            fontWeight: 'bold',
            borderRadius: '6px',
            fontSize: '0.65rem',
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
