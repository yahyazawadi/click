import React, { useState, useEffect, useRef } from 'react';
import { fpsLogger } from '../utils/fpsLogger';
import { 
  NEBULA_CONFIG, 
  CORE_CONFIG, 
  RINGS_CONFIG, 
  DEFAULT_CORE_CONFIG, 
  DEFAULT_RINGS_CONFIG, 
  DEFAULT_NEBULA_CONFIG 
} from '../config';

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

  // Main Category Tab: 'core' | 'rings' | 'nebula'
  const [activeMainTab, setActiveMainTab] = useState('core');

  // Sub-tabs for each section
  const [activeCoreSubTab, setActiveCoreSubTab] = useState('surface'); // 'surface' | 'dynamics' | 'lighting' | 'innerRings'
  const [activeCoreRing, setActiveCoreRing] = useState('ring1'); // 'ring1' | 'ring2'
  const [activeOrbitRingTab, setActiveOrbitRingTab] = useState(0); // 0 | 1 | 2 | 'global'
  const [activeNebulaTab, setActiveNebulaTab] = useState('nebula1'); // 'nebula1' | 'nebula2'

  const [, setRerender] = useState(0);

  // Copy / Paste / Reset / Generate notification states
  const [copiedStatus, setCopiedStatus] = useState(false);
  const [pastedStatus, setPastedStatus] = useState(false);
  const [resetStatus, setResetStatus] = useState(false);
  const [generatedStatus, setGeneratedStatus] = useState(false);

  // Recursive deep merge helper to ensure nested properties never get overwritten incorrectly
  const deepMerge = (target, source) => {
    if (!source || typeof source !== 'object') return target;
    for (const key of Object.keys(source)) {
      if (Array.isArray(source[key])) {
        if (!Array.isArray(target[key])) target[key] = [];
        source[key].forEach((item, idx) => {
          if (typeof item === 'object' && item !== null) {
            target[key][idx] = deepMerge(target[key][idx] || {}, item);
          } else {
            target[key][idx] = item;
          }
        });
      } else if (typeof source[key] === 'object' && source[key] !== null) {
        if (!target[key] || typeof target[key] !== 'object') target[key] = {};
        deepMerge(target[key], source[key]);
      } else if (source[key] !== undefined) {
        target[key] = source[key];
      }
    }
    return target;
  };

  // Deep clone helper
  const getSystemSnapshot = () => ({
    nebula: JSON.parse(JSON.stringify(NEBULA_CONFIG)),
    core: JSON.parse(JSON.stringify(CORE_CONFIG)),
    rings: JSON.parse(JSON.stringify(RINGS_CONFIG)),
  });

  // Undo / Redo history stacks
  const [historyStack, setHistoryStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);

  const pushHistorySnapshot = () => {
    const currentSnapshot = getSystemSnapshot();
    setHistoryStack((prev) => [...prev.slice(-40), currentSnapshot]);
    setRedoStack([]);
  };

  const applySnapshot = (snapshot) => {
    if (!snapshot) return;
    if (snapshot.nebula) deepMerge(NEBULA_CONFIG, snapshot.nebula);
    if (snapshot.core) deepMerge(CORE_CONFIG, snapshot.core);
    if (snapshot.rings) deepMerge(RINGS_CONFIG, snapshot.rings);

    if (snapshot.NEBULA_CONFIG) deepMerge(NEBULA_CONFIG, snapshot.NEBULA_CONFIG);
    if (snapshot.CORE_CONFIG) deepMerge(CORE_CONFIG, snapshot.CORE_CONFIG);
    if (snapshot.RINGS_CONFIG) deepMerge(RINGS_CONFIG, snapshot.RINGS_CONFIG);

    saveToStorage();
    setRerender((v) => v + 1);
  };

  const handleUndo = () => {
    if (historyStack.length === 0) return;
    const previousState = historyStack[historyStack.length - 1];
    const currentState = getSystemSnapshot();

    setRedoStack((prev) => [...prev, currentState]);
    setHistoryStack((prev) => prev.slice(0, -1));

    applySnapshot(previousState);
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const nextState = redoStack[redoStack.length - 1];
    const currentState = getSystemSnapshot();

    setHistoryStack((prev) => [...prev, currentState]);
    setRedoStack((prev) => prev.slice(0, -1));

    applySnapshot(nextState);
  };

  const handleResetToInitial = () => {
    pushHistorySnapshot();

    if (activeMainTab === 'core') {
      deepMerge(CORE_CONFIG, JSON.parse(JSON.stringify(DEFAULT_CORE_CONFIG)));
    } else if (activeMainTab === 'rings') {
      deepMerge(RINGS_CONFIG, JSON.parse(JSON.stringify(DEFAULT_RINGS_CONFIG)));
    } else if (activeMainTab === 'nebula') {
      deepMerge(NEBULA_CONFIG, JSON.parse(JSON.stringify(DEFAULT_NEBULA_CONFIG)));
    } else {
      deepMerge(CORE_CONFIG, JSON.parse(JSON.stringify(DEFAULT_CORE_CONFIG)));
      deepMerge(RINGS_CONFIG, JSON.parse(JSON.stringify(DEFAULT_RINGS_CONFIG)));
      deepMerge(NEBULA_CONFIG, JSON.parse(JSON.stringify(DEFAULT_NEBULA_CONFIG)));
    }

    saveToStorage();
    setResetStatus(true);
    setRerender((v) => v + 1);
    setTimeout(() => setResetStatus(false), 2000);
  };

  const toggleVisibility = () => {
    if (onToggle) {
      onToggle();
    } else {
      setInternalVisible((prev) => !prev);
    }
  };

  // Keyboard shortcut listener (~ Tilde, Ctrl+Z Undo, Ctrl+Y Redo, Ctrl+Shift+R / Alt+R Re-Roll Seeds)
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignore global hotkeys if the user is actively typing in a text field or textarea
      if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) {
        return;
      }
      if (e.key === '`' || e.key === '~') {
        toggleVisibility();
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'z' || e.key === 'Z' || e.code === 'KeyZ') && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      }
      if ((e.ctrlKey || e.metaKey) && ((e.key === 'y' || e.key === 'Y' || e.code === 'KeyY') || (e.shiftKey && (e.key === 'z' || e.key === 'Z' || e.code === 'KeyZ')))) {
        e.preventDefault();
        handleRedo();
      }
      // Re-roll procedural nebula seeds: Ctrl+Shift+R OR Alt+R
      const isR = e.key === 'r' || e.key === 'R' || e.code === 'KeyR';
      if (((e.ctrlKey || e.metaKey) && e.shiftKey && isR) || (e.altKey && isR)) {
        e.preventDefault();
        e.stopPropagation();
        if (typeof e.stopImmediatePropagation === 'function') {
          e.stopImmediatePropagation();
        }
        handleGenerateNewNebula();
      }
    };
    window.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => window.removeEventListener('keydown', handleKeyDown, { capture: true });
  }, [onToggle, historyStack, redoStack]);

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

  // --- PARAMETER UPDATE HELPERS ---

  const saveToStorage = () => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem('yahya_core_config', JSON.stringify(CORE_CONFIG));
      localStorage.setItem('yahya_rings_config', JSON.stringify(RINGS_CONFIG));
      localStorage.setItem('yahya_nebula_config', JSON.stringify(NEBULA_CONFIG));
    } catch (e) {
      console.warn('LocalStorage save error:', e);
    }
  };

  const updateCoreParam = (section, key, value, isNumeric = true) => {
    if (section === 'root') {
      CORE_CONFIG[key] = isNumeric ? parseFloat(value) : value;
    } else if (section === 'colors') {
      CORE_CONFIG.colors[key] = value;
    } else {
      CORE_CONFIG[section][key] = isNumeric ? parseFloat(value) : value;
    }
    saveToStorage();
    setRerender((v) => v + 1);
  };

  const updateCoreRingParam = (ringKey, key, value, isNumeric = true) => {
    if (!CORE_CONFIG.innerRings[ringKey]) return;
    if (key === 'enabled') {
      CORE_CONFIG.innerRings[ringKey].enabled = value;
    } else if (key === 'color' || key === 'emissive') {
      CORE_CONFIG.innerRings[ringKey][key] = value;
    } else {
      CORE_CONFIG.innerRings[ringKey][key] = isNumeric ? parseFloat(value) : value;
    }
    saveToStorage();
    setRerender((v) => v + 1);
  };

  const updateOrbitRingParam = (ringIndex, key, value, isNumeric = true) => {
    const ring = RINGS_CONFIG.rings[ringIndex];
    if (!ring) return;
    if (key === 'enabled') {
      ring.enabled = value;
    } else if (key === 'color') {
      ring.color = value;
    } else {
      ring[key] = isNumeric ? parseFloat(value) : value;
    }
    saveToStorage();
    setRerender((v) => v + 1);
  };

  const updateGlobalRingParam = (key, value, isNumeric = true) => {
    if (key === 'enabled') {
      RINGS_CONFIG.global.enabled = value;
    } else {
      RINGS_CONFIG.global[key] = isNumeric ? parseFloat(value) : value;
    }
    saveToStorage();
    setRerender((v) => v + 1);
  };

  const updateNebulaParam = (nebulaKey, paramKey, value) => {
    if (paramKey.startsWith('color_')) {
      const colorField = paramKey.replace('color_', '');
      NEBULA_CONFIG[nebulaKey].colors[colorField] = value;
    } else {
      const parsed = parseFloat(value);
      NEBULA_CONFIG[nebulaKey][paramKey] = isNaN(parsed) ? 0 : parsed;
    }
    saveToStorage();
    setRerender((v) => v + 1);
  };

  const handleGenerateNewNebula = () => {
    pushHistorySnapshot();

    // Generate independent procedural seeds for BOTH nebulae simultaneously
    // ALL user parameters, sliders, speed, and colors remain 100% UNTOUCHED!
    if (NEBULA_CONFIG.nebula1) {
      NEBULA_CONFIG.nebula1.seedX = +(Math.floor(Math.random() * 80 + 5) * (Math.random() > 0.5 ? 1 : -1)).toFixed(1);
      NEBULA_CONFIG.nebula1.seedY = +(Math.floor(Math.random() * 80 + 5) * (Math.random() > 0.5 ? 1 : -1)).toFixed(1);
    }
    if (NEBULA_CONFIG.nebula2) {
      NEBULA_CONFIG.nebula2.seedX = +(Math.floor(Math.random() * 80 + 5) * (Math.random() > 0.5 ? 1 : -1)).toFixed(1);
      NEBULA_CONFIG.nebula2.seedY = +(Math.floor(Math.random() * 80 + 5) * (Math.random() > 0.5 ? 1 : -1)).toFixed(1);
    }

    saveToStorage();
    setGeneratedStatus(true);
    setRerender((v) => v + 1);
    setTimeout(() => setGeneratedStatus(false), 1500);
  };

  const copyTextToClipboard = async (text) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch (e) {
      console.warn('Clipboard API write failed, falling back:', e);
    }
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      return true;
    } catch (e2) {
      console.warn('Fallback copy failed:', e2);
      return false;
    }
  };

  const cleanAndParseConfig = (text) => {
    let cleaned = text.trim();
    // 1. Strip ES module export wrappers: "export const CORE_CONFIG = { ... };"
    cleaned = cleaned.replace(/^export\s+(const|let|var)\s+\w+\s*=\s*/m, '');
    cleaned = cleaned.replace(/^const\s+\w+\s*=\s*/m, '');
    cleaned = cleaned.replace(/;\s*$/, '');
    // 2. Strip single and multiline comments
    cleaned = cleaned.replace(/\/\/.*$/gm, '');
    cleaned = cleaned.replace(/\/\*[\s\S]*?\*\//g, '');
    cleaned = cleaned.trim();

    try {
      return JSON.parse(cleaned);
    } catch (e) {
      // 3. If standard JSON.parse fails (e.g. unquoted JS keys or single quotes), use Function evaluator
      try {
        const fn = new Function(`return (${cleaned});`);
        return fn();
      } catch (e2) {
        throw new Error('Could not parse configuration data as JSON or JS object.');
      }
    }
  };

  const copyConfigJson = async () => {
    let payload = {};
    if (activeMainTab === 'core') {
      payload = { CORE_CONFIG: JSON.parse(JSON.stringify(CORE_CONFIG)) };
    } else if (activeMainTab === 'rings') {
      payload = { RINGS_CONFIG: JSON.parse(JSON.stringify(RINGS_CONFIG)) };
    } else if (activeMainTab === 'nebula') {
      payload = { NEBULA_CONFIG: JSON.parse(JSON.stringify(NEBULA_CONFIG)) };
    } else {
      payload = {
        CORE_CONFIG: JSON.parse(JSON.stringify(CORE_CONFIG)),
        RINGS_CONFIG: JSON.parse(JSON.stringify(RINGS_CONFIG)),
        NEBULA_CONFIG: JSON.parse(JSON.stringify(NEBULA_CONFIG)),
      };
    }

    const formatted = JSON.stringify(payload, null, 2);
    await copyTextToClipboard(formatted);
    setCopiedStatus(true);
    setTimeout(() => setCopiedStatus(false), 2000);
  };

  const pasteConfigJson = async () => {
    try {
      let text = '';
      if (navigator.clipboard && navigator.clipboard.readText) {
        try {
          text = await navigator.clipboard.readText();
        } catch (e) {
          console.warn('Clipboard read error:', e);
        }
      }
      if (!text) {
        text = prompt('Paste your JSON or JS config here:');
      }
      if (!text) return;

      const parsed = cleanAndParseConfig(text);
      if (!parsed || typeof parsed !== 'object') {
        alert('Invalid configuration format.');
        return;
      }

      pushHistorySnapshot();

      // Master bundles
      if (parsed.CORE_CONFIG || parsed.core) {
        deepMerge(CORE_CONFIG, parsed.CORE_CONFIG || parsed.core);
      }
      if (parsed.RINGS_CONFIG || parsed.ringsConfig) {
        deepMerge(RINGS_CONFIG, parsed.RINGS_CONFIG || parsed.ringsConfig);
      }
      if (parsed.NEBULA_CONFIG || parsed.nebulaConfig) {
        deepMerge(NEBULA_CONFIG, parsed.NEBULA_CONFIG || parsed.nebulaConfig);
      }

      // Direct section objects
      if (parsed.colors || parsed.clouds || parsed.continents || parsed.atmosphere || parsed.lighting || parsed.innerRings) {
        deepMerge(CORE_CONFIG, parsed);
      } else if (parsed.radius !== undefined || parsed.rotationSpeed !== undefined) {
        deepMerge(CORE_CONFIG, parsed);
      }

      if (parsed.ring1 || parsed.ring2) {
        deepMerge(CORE_CONFIG.innerRings, parsed);
      }

      // Macro Rings array or object
      if (Array.isArray(parsed)) {
        parsed.forEach((r, i) => {
          if (RINGS_CONFIG.rings[i]) deepMerge(RINGS_CONFIG.rings[i], r);
        });
      } else if (parsed.rings && Array.isArray(parsed.rings)) {
        parsed.rings.forEach((r, i) => {
          if (RINGS_CONFIG.rings[i]) deepMerge(RINGS_CONFIG.rings[i], r);
        });
        if (parsed.global) deepMerge(RINGS_CONFIG.global, parsed.global);
      }

      // Nebulae
      if (parsed.nebula1 || parsed.nebula2) {
        if (parsed.nebula1) deepMerge(NEBULA_CONFIG.nebula1, parsed.nebula1);
        if (parsed.nebula2) deepMerge(NEBULA_CONFIG.nebula2, parsed.nebula2);
      }

      // Single Ring payload pasted directly
      if (parsed.radius !== undefined && parsed.tiltX !== undefined && typeof activeOrbitRingTab === 'number') {
        deepMerge(RINGS_CONFIG.rings[activeOrbitRingTab], parsed);
      }

      // Single Inner Ring payload pasted directly
      if ((parsed.radiusMultiplier !== undefined || parsed.tubeRadius !== undefined) && activeCoreRing) {
        if (CORE_CONFIG.innerRings[activeCoreRing]) {
          deepMerge(CORE_CONFIG.innerRings[activeCoreRing], parsed);
        }
      }

      saveToStorage();
      setPastedStatus(true);
      setRerender((v) => v + 1);
      setTimeout(() => setPastedStatus(false), 2000);
    } catch (err) {
      console.warn('Clipboard paste error or invalid config:', err);
      alert('Could not paste config: ' + err.message);
    }
  };

  const currentNebula = NEBULA_CONFIG[activeNebulaTab];
  const currentRing = RINGS_CONFIG.rings[activeOrbitRingTab];
  const currentCoreRing = CORE_CONFIG.innerRings[activeCoreRing];

  return (
    <div 
      ref={overlayRef}
      className="telemetry-profiler-container"
      style={{
        position: 'fixed',
        top: '12px',
        right: '12px',
        width: '360px',
        maxHeight: '92vh',
        zIndex: 9999,
        background: 'rgba(7, 17, 36, 0.97)',
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontWeight: 'bold', color: 'var(--primary-cyan)', letterSpacing: '0.05em' }}>
            TELEMETRY & LIVE TUNER
          </span>
          <span style={{ fontSize: '0.52rem', background: 'rgba(0, 255, 170, 0.15)', color: '#00ffaa', padding: '1px 4px', borderRadius: '3px', border: '1px solid rgba(0, 255, 170, 0.3)' }}>
            AUTO-SAVED
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={handleGenerateNewNebula}
            title="Generate new procedural nebula seeds for both clouds (Ctrl+Shift+R | Ctrl+Z to undo)"
            style={{
              background: 'transparent',
              border: 'none',
              color: generatedStatus ? '#00ffaa' : '#888',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '2px',
              transition: 'color 0.2s ease, transform 0.35s ease',
              transform: generatedStatus ? 'rotate(180deg)' : 'rotate(0deg)',
            }}
            onMouseEnter={(e) => { if (!generatedStatus) e.currentTarget.style.color = 'var(--primary-cyan)'; }}
            onMouseLeave={(e) => { if (!generatedStatus) e.currentTarget.style.color = '#888'; }}
          >
            <svg 
              width="13" 
              height="13" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2.2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
            </svg>
          </button>
          <button 
            onClick={toggleVisibility}
            title="Close overlay"
            style={{ 
              background: 'transparent', 
              border: 'none', 
              color: '#888', 
              cursor: 'pointer', 
              fontSize: '0.9rem', 
              padding: '0 2px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              lineHeight: 1,
              transition: 'color 0.2s ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#ff4444'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = '#888'; }}
          >
            ✕
          </button>
        </div>
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
        <canvas ref={canvasRef} width={320} height={45} style={{ borderRadius: '4px', border: '1px solid rgba(0,186,227,0.2)', maxWidth: '100%', display: 'block' }} />
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

      {/* ─────────────────────────────────────────────────────────────
          MASTER INSPECTOR / TUNER SECTION
      ───────────────────────────────────────────────────────────── */}
      <div style={{
        marginTop: '0.4rem',
        paddingTop: '0.5rem',
        borderTop: '1px solid rgba(0, 186, 227, 0.3)',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem'
      }}>
        {/* Main Category Header & History Actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: 'bold', color: 'var(--primary-cyan)', fontSize: '0.68rem', letterSpacing: '0.04em' }}>
            LIVE TUNER CONTROLS
          </span>
          <div style={{ display: 'flex', gap: '0.2rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            <button
              onClick={handleUndo}
              disabled={historyStack.length === 0}
              title="Undo (Ctrl+Z)"
              style={{
                background: historyStack.length > 0 ? 'rgba(0, 186, 227, 0.2)' : 'transparent',
                color: historyStack.length > 0 ? 'var(--primary-cyan)' : '#555',
                border: '1px solid ' + (historyStack.length > 0 ? 'var(--primary-cyan)' : '#444'),
                padding: '0.2rem 0.3rem',
                fontSize: '0.58rem',
                fontFamily: 'var(--font-mono)',
                borderRadius: '4px',
                cursor: historyStack.length > 0 ? 'pointer' : 'default',
                fontWeight: 'bold',
              }}
            >
              UNDO
            </button>

            <button
              onClick={handleRedo}
              disabled={redoStack.length === 0}
              title="Redo (Ctrl+Y)"
              style={{
                background: redoStack.length > 0 ? 'rgba(0, 186, 227, 0.2)' : 'transparent',
                color: redoStack.length > 0 ? 'var(--primary-cyan)' : '#555',
                border: '1px solid ' + (redoStack.length > 0 ? 'var(--primary-cyan)' : '#444'),
                padding: '0.2rem 0.3rem',
                fontSize: '0.58rem',
                fontFamily: 'var(--font-mono)',
                borderRadius: '4px',
                cursor: redoStack.length > 0 ? 'pointer' : 'default',
                fontWeight: 'bold',
              }}
            >
              REDO
            </button>

            <button
              onClick={handleResetToInitial}
              title={`Reset active ${activeMainTab.toUpperCase()} configuration to factory code defaults`}
              style={{
                background: resetStatus ? '#00ffaa' : 'rgba(0, 186, 227, 0.15)',
                color: resetStatus ? '#000' : 'var(--secondary-blue)',
                border: '1px solid ' + (resetStatus ? '#00ffaa' : 'rgba(93, 186, 225, 0.4)'),
                padding: '0.2rem 0.3rem',
                fontSize: '0.58rem',
                fontFamily: 'var(--font-mono)',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: 'bold',
                transition: 'all 0.15s ease',
              }}
            >
              {resetStatus ? 'RESET!' : 'RESET'}
            </button>

            <button
              onClick={copyConfigJson}
              title="Copy active configuration JSON to clipboard"
              style={{
                background: copiedStatus ? '#00ffaa' : 'rgba(0, 186, 227, 0.2)',
                color: copiedStatus ? '#000' : 'var(--primary-cyan)',
                border: '1px solid var(--primary-cyan)',
                padding: '0.2rem 0.3rem',
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
              title="Paste configuration JSON from clipboard"
              style={{
                background: pastedStatus ? '#00ffaa' : 'rgba(0, 186, 227, 0.2)',
                color: pastedStatus ? '#000' : 'var(--primary-cyan)',
                border: '1px solid var(--primary-cyan)',
                padding: '0.2rem 0.3rem',
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

        {/* Master Category Tabs (CORE PLANET | ORBIT RINGS | NEBULA) */}
        <div style={{ display: 'flex', gap: '0.3rem' }}>
          {[
            { key: 'core', label: '🪐 CORE PLANET', color: '#00BAE3' },
            { key: 'rings', label: '⭕ ORBIT RINGS', color: '#5DBAE1' },
            { key: 'nebula', label: '🌌 NEBULA', color: '#ff3550' },
          ].map(({ key, label, color }) => {
            const isActive = activeMainTab === key;
            return (
              <button
                key={key}
                onClick={() => setActiveMainTab(key)}
                style={{
                  flex: 1,
                  padding: '0.4rem 0.2rem',
                  fontSize: '0.62rem',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: isActive ? 'bold' : 'normal',
                  border: `1px solid ${isActive ? color : '#444'}`,
                  background: isActive ? `${color}25` : 'transparent',
                  color: isActive ? color : '#888',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  boxShadow: isActive ? `0 0 10px ${color}33` : 'none',
                }}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* ═══════════════════════════════════════════════════════════
            TAB 1: CORE PLANET INSPECTOR
        ═══════════════════════════════════════════════════════════ */}
        {activeMainTab === 'core' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
            {/* Core Sub-Tabs in a clean 2x2 Grid so NEAR RINGS is instantly visible! */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.3rem' }}>
              {[
                { key: 'surface', label: '🎨 SURFACE & COLORS' },
                { key: 'innerRings', label: '💫 NEAR / INNER RINGS' },
                { key: 'dynamics', label: '🌪️ DYNAMICS & LAND' },
                { key: 'lighting', label: '✨ ATMOSPHERE & LIGHT' },
              ].map(({ key, label }) => {
                const isActive = activeCoreSubTab === key;
                return (
                  <button
                    key={key}
                    onClick={() => setActiveCoreSubTab(key)}
                    style={{
                      padding: '0.35rem 0.25rem',
                      fontSize: '0.58rem',
                      fontFamily: 'var(--font-mono)',
                      border: '1px solid ' + (isActive ? 'var(--primary-cyan)' : '#333'),
                      background: isActive ? 'rgba(0, 186, 227, 0.25)' : 'rgba(0, 0, 0, 0.3)',
                      color: isActive ? 'var(--primary-cyan)' : '#888',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontWeight: isActive ? 'bold' : 'normal',
                      boxShadow: isActive ? '0 0 8px rgba(0, 186, 227, 0.3)' : 'none',
                    }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            {/* Sub-Tab: Surface & Colors */}
            {activeCoreSubTab === 'surface' && (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.4rem',
                background: 'rgba(0, 50, 104, 0.15)',
                padding: '0.5rem',
                borderRadius: '6px',
                border: '1px solid rgba(0, 186, 227, 0.15)'
              }}>
                {/* Physical Sliders */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.6rem', color: '#ccc' }}>
                    <span>CORE RADIUS:</span>
                    <span style={{ color: 'var(--primary-cyan)', fontWeight: 'bold' }}>{CORE_CONFIG.radius}</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="5.0"
                    step="0.05"
                    value={CORE_CONFIG.radius}
                    onMouseDown={pushHistorySnapshot}
                    onTouchStart={pushHistorySnapshot}
                    onChange={(e) => updateCoreParam('root', 'radius', e.target.value)}
                    style={{ width: '100%', accentColor: 'var(--primary-cyan)', cursor: 'pointer' }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.6rem', color: '#ccc' }}>
                    <span>ROTATION SPEED:</span>
                    <span style={{ color: 'var(--primary-cyan)', fontWeight: 'bold' }}>{CORE_CONFIG.rotationSpeed}</span>
                  </div>
                  <input
                    type="range"
                    min="-1.0"
                    max="1.0"
                    step="0.01"
                    value={CORE_CONFIG.rotationSpeed}
                    onMouseDown={pushHistorySnapshot}
                    onTouchStart={pushHistorySnapshot}
                    onChange={(e) => updateCoreParam('root', 'rotationSpeed', e.target.value)}
                    style={{ width: '100%', accentColor: 'var(--primary-cyan)', cursor: 'pointer' }}
                  />
                </div>

                {/* Color Palette Grid */}
                <div style={{ marginTop: '0.2rem', paddingTop: '0.3rem', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
                  <div style={{ fontSize: '0.62rem', color: 'var(--secondary-blue)', fontWeight: 'bold', marginBottom: '0.3rem' }}>
                    SURFACE COLOR PALETTE:
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.35rem' }}>
                    {[
                      { label: 'DEEP OCEAN', key: 'deepOcean' },
                      { label: 'MID OCEAN', key: 'midOcean' },
                      { label: 'CLOUD BELT', key: 'cloudBand' },
                      { label: 'STORM HIGHLIGHT', key: 'stormHighlight' },
                      { label: 'ATMOSPHERE GLOW', key: 'atmosphere' },
                      { label: 'CONTINENT LAND', key: 'continentColor' },
                      { label: 'COASTAL SHELF', key: 'coastColor' },
                    ].map(({ label, key }) => {
                      const hexVal = CORE_CONFIG.colors[key];
                      return (
                        <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <span style={{ fontSize: '0.56rem', color: '#aaa' }}>{label}:</span>
                          <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                            <input
                              type="color"
                              value={hexVal}
                              onMouseDown={pushHistorySnapshot}
                              onChange={(e) => updateCoreParam('colors', key, e.target.value, false)}
                              style={{ width: '22px', height: '22px', border: 'none', background: 'transparent', cursor: 'pointer' }}
                            />
                            <input
                              type="text"
                              value={hexVal}
                              onFocus={pushHistorySnapshot}
                              onChange={(e) => updateCoreParam('colors', key, e.target.value, false)}
                              style={{
                                width: '100%',
                                background: 'rgba(0, 0, 0, 0.4)',
                                border: '1px solid #444',
                                color: '#fff',
                                fontSize: '0.56rem',
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
            )}

            {/* Sub-Tab: Dynamics & Land */}
            {activeCoreSubTab === 'dynamics' && (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.4rem',
                background: 'rgba(0, 50, 104, 0.15)',
                padding: '0.5rem',
                borderRadius: '6px',
                border: '1px solid rgba(0, 186, 227, 0.15)'
              }}>
                <div style={{ fontSize: '0.62rem', color: 'var(--secondary-blue)', fontWeight: 'bold' }}>
                  ATMOSPHERIC CLOUD & BELT DYNAMICS:
                </div>
                {[
                  { label: 'CLOUD DRIFT SPEED', section: 'clouds', key: 'driftSpeed', min: -1.0, max: 1.0, step: 0.01 },
                  { label: 'CLOUD SCALE', section: 'clouds', key: 'scale', min: 0.5, max: 8.0, step: 0.1 },
                  { label: 'BAND FREQUENCY', section: 'clouds', key: 'bandFrequency', min: 2.0, max: 40.0, step: 0.5 },
                  { label: 'BAND WARP', section: 'clouds', key: 'bandWarp', min: 0.0, max: 0.8, step: 0.01 },
                  { label: 'STORM INTENSITY', section: 'clouds', key: 'stormIntensity', min: 0.0, max: 3.0, step: 0.05 },
                ].map(({ label, section, key, min, max, step }) => {
                  const val = CORE_CONFIG[section][key];
                  return (
                    <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.58rem', color: '#ccc' }}>
                        <span>{label}:</span>
                        <span style={{ color: 'var(--primary-cyan)', fontWeight: 'bold' }}>{val}</span>
                      </div>
                      <input
                        type="range"
                        min={min}
                        max={max}
                        step={step}
                        value={val}
                        onMouseDown={pushHistorySnapshot}
                        onTouchStart={pushHistorySnapshot}
                        onChange={(e) => updateCoreParam(section, key, e.target.value)}
                        style={{ width: '100%', accentColor: 'var(--primary-cyan)', cursor: 'pointer' }}
                      />
                    </div>
                  );
                })}

                <div style={{ marginTop: '0.3rem', paddingTop: '0.3rem', borderTop: '1px solid rgba(255, 255, 255, 0.1)', fontSize: '0.62rem', color: 'var(--secondary-blue)', fontWeight: 'bold' }}>
                  CONTINENTAL TECTONICS:
                </div>
                {[
                  { label: 'CONTINENT DRIFT', section: 'continents', key: 'driftSpeed', min: -0.5, max: 0.5, step: 0.005 },
                  { label: 'CONTINENT SCALE', section: 'continents', key: 'scale', min: 0.2, max: 4.0, step: 0.05 },
                  { label: 'SEA LEVEL ELEVATION', section: 'continents', key: 'seaLevel', min: -0.80, max: 0.80, step: 0.02 },
                ].map(({ label, section, key, min, max, step }) => {
                  const val = CORE_CONFIG[section][key];
                  return (
                    <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.58rem', color: '#ccc' }}>
                        <span>{label}:</span>
                        <span style={{ color: 'var(--primary-cyan)', fontWeight: 'bold' }}>{val}</span>
                      </div>
                      <input
                        type="range"
                        min={min}
                        max={max}
                        step={step}
                        value={val}
                        onMouseDown={pushHistorySnapshot}
                        onTouchStart={pushHistorySnapshot}
                        onChange={(e) => updateCoreParam(section, key, e.target.value)}
                        style={{ width: '100%', accentColor: 'var(--primary-cyan)', cursor: 'pointer' }}
                      />
                    </div>
                  );
                })}
              </div>
            )}

            {/* Sub-Tab: Atmosphere & Lighting */}
            {activeCoreSubTab === 'lighting' && (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.4rem',
                background: 'rgba(0, 50, 104, 0.15)',
                padding: '0.5rem',
                borderRadius: '6px',
                border: '1px solid rgba(0, 186, 227, 0.15)'
              }}>
                <div style={{ fontSize: '0.62rem', color: 'var(--secondary-blue)', fontWeight: 'bold' }}>
                  ATMOSPHERE LIMB GLOW (FRESNEL):
                </div>
                {[
                  { label: 'FRESNEL POWER', section: 'atmosphere', key: 'fresnelPower', min: 0.5, max: 8.0, step: 0.1 },
                  { label: 'FRESNEL INTENSITY', section: 'atmosphere', key: 'fresnelIntensity', min: 0.0, max: 3.0, step: 0.05 },
                ].map(({ label, section, key, min, max, step }) => {
                  const val = CORE_CONFIG[section][key];
                  return (
                    <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.58rem', color: '#ccc' }}>
                        <span>{label}:</span>
                        <span style={{ color: 'var(--primary-cyan)', fontWeight: 'bold' }}>{val}</span>
                      </div>
                      <input
                        type="range"
                        min={min}
                        max={max}
                        step={step}
                        value={val}
                        onMouseDown={pushHistorySnapshot}
                        onTouchStart={pushHistorySnapshot}
                        onChange={(e) => updateCoreParam(section, key, e.target.value)}
                        style={{ width: '100%', accentColor: 'var(--primary-cyan)', cursor: 'pointer' }}
                      />
                    </div>
                  );
                })}

                <div style={{ marginTop: '0.3rem', paddingTop: '0.3rem', borderTop: '1px solid rgba(255, 255, 255, 0.1)', fontSize: '0.62rem', color: 'var(--secondary-blue)', fontWeight: 'bold' }}>
                  WORLD LIGHTING & SPECULAR HIGHLIGHTS:
                </div>
                {[
                  { label: 'SPECULAR INTENSITY', section: 'lighting', key: 'specularIntensity', min: 0.0, max: 2.0, step: 0.05 },
                  { label: 'SPECULAR SHININESS', section: 'lighting', key: 'specularShininess', min: 4.0, max: 128.0, step: 2.0 },
                  { label: 'AMBIENT LIGHT FLOOR', section: 'lighting', key: 'ambientLight', min: 0.0, max: 1.0, step: 0.02 },
                  { label: 'DIFFUSE LIGHT', section: 'lighting', key: 'diffuseLight', min: 0.0, max: 2.0, step: 0.05 },
                  { label: 'POLAR DARKENING FADE', section: 'lighting', key: 'polarFade', min: 0.0, max: 1.0, step: 0.05 },
                ].map(({ label, section, key, min, max, step }) => {
                  const val = CORE_CONFIG[section][key];
                  return (
                    <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.58rem', color: '#ccc' }}>
                        <span>{label}:</span>
                        <span style={{ color: 'var(--primary-cyan)', fontWeight: 'bold' }}>{val}</span>
                      </div>
                      <input
                        type="range"
                        min={min}
                        max={max}
                        step={step}
                        value={val}
                        onMouseDown={pushHistorySnapshot}
                        onTouchStart={pushHistorySnapshot}
                        onChange={(e) => updateCoreParam(section, key, e.target.value)}
                        style={{ width: '100%', accentColor: 'var(--primary-cyan)', cursor: 'pointer' }}
                      />
                    </div>
                  );
                })}
              </div>
            )}

            {/* Sub-Tab: Inner Concentric Rings */}
            {activeCoreSubTab === 'innerRings' && (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.4rem',
                background: 'rgba(0, 50, 104, 0.15)',
                padding: '0.5rem',
                borderRadius: '6px',
                border: '1px solid rgba(0, 186, 227, 0.15)'
              }}>
                <div style={{ display: 'flex', gap: '0.3rem' }}>
                  {['ring1', 'ring2'].map((ringKey) => {
                    const isActive = activeCoreRing === ringKey;
                    return (
                      <button
                        key={ringKey}
                        onClick={() => setActiveCoreRing(ringKey)}
                        style={{
                          flex: 1,
                          padding: '0.3rem',
                          fontSize: '0.6rem',
                          fontFamily: 'var(--font-mono)',
                          border: '1px solid ' + (isActive ? 'var(--primary-cyan)' : '#444'),
                          background: isActive ? 'rgba(0, 186, 227, 0.2)' : 'transparent',
                          color: isActive ? 'var(--primary-cyan)' : '#888',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontWeight: isActive ? 'bold' : 'normal'
                        }}
                      >
                        {ringKey === 'ring1' ? 'INNER RING 1' : 'OUTER RING 2'}
                      </button>
                    );
                  })}
                </div>

                {/* Active Core Ring Controls */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.2rem' }}>
                  <span style={{ fontSize: '0.62rem', color: '#ccc' }}>RING STATUS:</span>
                  <button
                    onClick={() => {
                      pushHistorySnapshot();
                      updateCoreRingParam(activeCoreRing, 'enabled', currentCoreRing.enabled === false);
                    }}
                    style={{
                      padding: '0.2rem 0.5rem',
                      fontSize: '0.58rem',
                      fontFamily: 'var(--font-mono)',
                      borderRadius: '3px',
                      cursor: 'pointer',
                      border: '1px solid ' + (currentCoreRing.enabled !== false ? '#00ffaa' : '#ff4444'),
                      background: currentCoreRing.enabled !== false ? 'rgba(0, 255, 170, 0.2)' : 'rgba(255, 68, 68, 0.2)',
                      color: currentCoreRing.enabled !== false ? '#00ffaa' : '#ff4444',
                      fontWeight: 'bold',
                    }}
                  >
                    {currentCoreRing.enabled !== false ? 'ENABLED' : 'DISABLED'}
                  </button>
                </div>

                {/* Radius, Tube & Opacity */}
                {[
                  { label: 'RADIUS MULTIPLIER', key: 'radiusMultiplier', min: 1.0, max: 4.0, step: 0.05 },
                  { label: 'TUBE THICKNESS', key: 'tubeRadius', min: 0.005, max: 0.1, step: 0.002 },
                  { label: 'OPACITY', key: 'opacity', min: 0.0, max: 1.0, step: 0.05 },
                  { label: 'EMISSIVE INTENSITY', key: 'emissiveIntensity', min: 0.0, max: 3.0, step: 0.05 },
                ].map(({ label, key, min, max, step }) => {
                  const val = currentCoreRing[key] ?? (key === 'opacity' ? 1.0 : key === 'emissiveIntensity' ? 0.8 : 1.5);
                  return (
                    <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.58rem', color: '#ccc' }}>
                        <span>{label}:</span>
                        <span style={{ color: 'var(--primary-cyan)', fontWeight: 'bold' }}>{val}</span>
                      </div>
                      <input
                        type="range"
                        min={min}
                        max={max}
                        step={step}
                        value={val}
                        onMouseDown={pushHistorySnapshot}
                        onTouchStart={pushHistorySnapshot}
                        onChange={(e) => updateCoreRingParam(activeCoreRing, key, e.target.value)}
                        style={{ width: '100%', accentColor: 'var(--primary-cyan)', cursor: 'pointer' }}
                      />
                    </div>
                  );
                })}

                {/* 3D Gyroscopic Spin Speeds */}
                <div style={{ marginTop: '0.2rem', paddingTop: '0.2rem', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
                  <div style={{ fontSize: '0.58rem', color: 'var(--secondary-blue)', fontWeight: 'bold', marginBottom: '2px' }}>
                    3D GYROSCOPIC SPIN SPEEDS:
                  </div>
                  {[
                    { label: 'SPIN SPEED (X - PITCH)', key: 'speedX', def: 0.25 },
                    { label: 'SPIN SPEED (Y - YAW)', key: 'speedY', def: 0.35 },
                    { label: 'SPIN SPEED (Z - ROLL)', key: 'speedZ', def: 0.15 },
                  ].map(({ label, key, def }) => {
                    const val = currentCoreRing[key] ?? def;
                    return (
                      <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.58rem', color: '#ccc' }}>
                          <span>{label}:</span>
                          <span style={{ color: 'var(--primary-cyan)', fontWeight: 'bold' }}>{val}</span>
                        </div>
                        <input
                          type="range"
                          min="-2.0"
                          max="2.0"
                          step="0.05"
                          value={val}
                          onMouseDown={pushHistorySnapshot}
                          onTouchStart={pushHistorySnapshot}
                          onChange={(e) => updateCoreRingParam(activeCoreRing, key, e.target.value)}
                          style={{ width: '100%', accentColor: 'var(--primary-cyan)', cursor: 'pointer' }}
                        />
                      </div>
                    );
                  })}
                </div>

                {/* 3D Base Tilts */}
                <div style={{ marginTop: '0.2rem', paddingTop: '0.2rem', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
                  <div style={{ fontSize: '0.58rem', color: 'var(--secondary-blue)', fontWeight: 'bold', marginBottom: '2px' }}>
                    3D BASE TILT ORIENTATION:
                  </div>
                  {[
                    { label: 'TILT X (PITCH)', key: 'tiltX', def: activeCoreRing === 'ring1' ? 0.785 : -1.047 },
                    { label: 'TILT Y (YAW)', key: 'tiltY', def: activeCoreRing === 'ring1' ? 0 : 0.523 },
                    { label: 'TILT Z (ROLL)', key: 'tiltZ', def: 0 },
                  ].map(({ label, key, def }) => {
                    const val = currentCoreRing[key] ?? def;
                    return (
                      <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.58rem', color: '#ccc' }}>
                          <span>{label}:</span>
                          <span style={{ color: 'var(--primary-cyan)', fontWeight: 'bold' }}>{val}</span>
                        </div>
                        <input
                          type="range"
                          min="-3.14"
                          max="3.14"
                          step="0.05"
                          value={val}
                          onMouseDown={pushHistorySnapshot}
                          onTouchStart={pushHistorySnapshot}
                          onChange={(e) => updateCoreRingParam(activeCoreRing, key, e.target.value)}
                          style={{ width: '100%', accentColor: 'var(--primary-cyan)', cursor: 'pointer' }}
                        />
                      </div>
                    );
                  })}
                </div>

                {/* Ring Colors */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.35rem', marginTop: '0.2rem' }}>
                  {[
                    { label: 'BASE COLOR', key: 'color' },
                    { label: 'EMISSIVE GLOW', key: 'emissive' },
                  ].map(({ label, key }) => {
                    const hexVal = currentCoreRing[key] || '#FF0A2B';
                    return (
                      <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <span style={{ fontSize: '0.56rem', color: '#aaa' }}>{label}:</span>
                        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                          <input
                            type="color"
                            value={hexVal}
                            onMouseDown={pushHistorySnapshot}
                            onChange={(e) => updateCoreRingParam(activeCoreRing, key, e.target.value, false)}
                            style={{ width: '22px', height: '22px', border: 'none', background: 'transparent', cursor: 'pointer' }}
                          />
                          <input
                            type="text"
                            value={hexVal}
                            onFocus={pushHistorySnapshot}
                            onChange={(e) => updateCoreRingParam(activeCoreRing, key, e.target.value, false)}
                            style={{
                              width: '100%',
                              background: 'rgba(0, 0, 0, 0.4)',
                              border: '1px solid #444',
                              color: '#fff',
                              fontSize: '0.56rem',
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
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════
            TAB 2: ORBITAL RINGS / CIRCLES INSPECTOR
        ═══════════════════════════════════════════════════════════ */}
        {activeMainTab === 'rings' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
            {/* Ring Selector Sub-Tabs */}
            <div style={{ display: 'flex', gap: '0.25rem' }}>
              {[0, 1, 2, 'global'].map((tabKey) => {
                const isActive = activeOrbitRingTab === tabKey;
                const label = tabKey === 'global' ? 'GLOBAL' : `RING ${tabKey}`;
                return (
                  <button
                    key={String(tabKey)}
                    onClick={() => setActiveOrbitRingTab(tabKey)}
                    style={{
                      flex: 1,
                      padding: '0.3rem 0.2rem',
                      fontSize: '0.6rem',
                      fontFamily: 'var(--font-mono)',
                      border: '1px solid ' + (isActive ? 'var(--secondary-blue)' : '#444'),
                      background: isActive ? 'rgba(93, 186, 225, 0.2)' : 'transparent',
                      color: isActive ? 'var(--secondary-blue)' : '#888',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontWeight: isActive ? 'bold' : 'normal'
                    }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            {/* Individual Ring Settings */}
            {activeOrbitRingTab !== 'global' && currentRing && (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.4rem',
                background: 'rgba(0, 50, 104, 0.15)',
                padding: '0.5rem',
                borderRadius: '6px',
                border: '1px solid rgba(0, 186, 227, 0.15)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.62rem', color: '#ccc' }}>RING {activeOrbitRingTab} STATUS:</span>
                  <button
                    onClick={() => {
                      pushHistorySnapshot();
                      updateOrbitRingParam(activeOrbitRingTab, 'enabled', currentRing.enabled === false);
                    }}
                    style={{
                      padding: '0.2rem 0.5rem',
                      fontSize: '0.58rem',
                      fontFamily: 'var(--font-mono)',
                      borderRadius: '3px',
                      cursor: 'pointer',
                      border: '1px solid ' + (currentRing.enabled !== false ? '#00ffaa' : '#ff4444'),
                      background: currentRing.enabled !== false ? 'rgba(0, 255, 170, 0.2)' : 'rgba(255, 68, 68, 0.2)',
                      color: currentRing.enabled !== false ? '#00ffaa' : '#ff4444',
                      fontWeight: 'bold',
                    }}
                  >
                    {currentRing.enabled !== false ? 'VISIBLE' : 'HIDDEN'}
                  </button>
                </div>

                {/* Orbit Sliders */}
                {[
                  { label: 'ORBIT RADIUS', key: 'radius', min: 2.0, max: 20.0, step: 0.1 },
                  { label: 'ORBIT SPEED', key: 'speed', min: -0.5, max: 0.5, step: 0.005 },
                  { label: 'TILT X (PITCH)', key: 'tiltX', min: -3.14, max: 3.14, step: 0.05 },
                  { label: 'TILT Y (YAW)', key: 'tiltY', min: -3.14, max: 3.14, step: 0.05 },
                  { label: 'TILT Z (ROLL)', key: 'tiltZ', min: -3.14, max: 3.14, step: 0.05 },
                  { label: 'RING OPACITY', key: 'opacity', min: 0.05, max: 1.0, step: 0.02 },
                ].map(({ label, key, min, max, step }) => {
                  const val = currentRing[key] ?? (key === 'opacity' ? 0.35 : 0);
                  return (
                    <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.58rem', color: '#ccc' }}>
                        <span>{label}:</span>
                        <span style={{ color: 'var(--primary-cyan)', fontWeight: 'bold' }}>{val}</span>
                      </div>
                      <input
                        type="range"
                        min={min}
                        max={max}
                        step={step}
                        value={val}
                        onMouseDown={pushHistorySnapshot}
                        onTouchStart={pushHistorySnapshot}
                        onChange={(e) => updateOrbitRingParam(activeOrbitRingTab, key, e.target.value)}
                        style={{ width: '100%', accentColor: 'var(--primary-cyan)', cursor: 'pointer' }}
                      />
                    </div>
                  );
                })}

                {/* Ring Color */}
                <div style={{ marginTop: '0.2rem', paddingTop: '0.3rem', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
                  <div style={{ fontSize: '0.58rem', color: '#aaa', marginBottom: '3px' }}>RING COLOR:</div>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <input
                      type="color"
                      value={currentRing.color || '#00BAE3'}
                      onMouseDown={pushHistorySnapshot}
                      onChange={(e) => updateOrbitRingParam(activeOrbitRingTab, 'color', e.target.value, false)}
                      style={{ width: '24px', height: '24px', border: 'none', background: 'transparent', cursor: 'pointer' }}
                    />
                    <input
                      type="text"
                      value={currentRing.color || '#00BAE3'}
                      onFocus={pushHistorySnapshot}
                      onChange={(e) => updateOrbitRingParam(activeOrbitRingTab, 'color', e.target.value, false)}
                      style={{
                        flex: 1,
                        background: 'rgba(0, 0, 0, 0.4)',
                        border: '1px solid #444',
                        color: '#fff',
                        fontSize: '0.6rem',
                        fontFamily: 'var(--font-mono)',
                        borderRadius: '3px',
                        padding: '2px 4px'
                      }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Global Rings Settings */}
            {activeOrbitRingTab === 'global' && (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.4rem',
                background: 'rgba(0, 50, 104, 0.15)',
                padding: '0.5rem',
                borderRadius: '6px',
                border: '1px solid rgba(0, 186, 227, 0.15)'
              }}>
                <div style={{ fontSize: '0.62rem', color: 'var(--secondary-blue)', fontWeight: 'bold' }}>
                  GLOBAL ORBIT SYSTEM MULTIPLIERS:
                </div>
                {[
                  { label: 'GLOBAL SPEED MULTIPLIER', key: 'speedMultiplier', min: 0.0, max: 3.0, step: 0.05 },
                  { label: 'GLOBAL OPACITY MULTIPLIER', key: 'opacityMultiplier', min: 0.0, max: 2.0, step: 0.05 },
                ].map(({ label, key, min, max, step }) => {
                  const val = RINGS_CONFIG.global[key] ?? 1.0;
                  return (
                    <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.58rem', color: '#ccc' }}>
                        <span>{label}:</span>
                        <span style={{ color: 'var(--primary-cyan)', fontWeight: 'bold' }}>{val}</span>
                      </div>
                      <input
                        type="range"
                        min={min}
                        max={max}
                        step={step}
                        value={val}
                        onMouseDown={pushHistorySnapshot}
                        onTouchStart={pushHistorySnapshot}
                        onChange={(e) => updateGlobalRingParam(key, e.target.value)}
                        style={{ width: '100%', accentColor: 'var(--primary-cyan)', cursor: 'pointer' }}
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════
            TAB 3: NEBULA LIVE SHAPE TUNER (100% PRESERVED)
        ═══════════════════════════════════════════════════════════ */}
        {activeMainTab === 'nebula' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
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

            {/* Refresh / Generate New Nebula Button */}
            <button
              onClick={handleGenerateNewNebula}
              title="Generate a brand-new unique procedural cosmic cloud shape"
              style={{
                padding: '0.45rem 0.6rem',
                fontSize: '0.65rem',
                fontFamily: 'var(--font-mono)',
                fontWeight: 'bold',
                background: generatedStatus ? 'rgba(0, 255, 170, 0.25)' : 'rgba(0, 186, 227, 0.15)',
                color: generatedStatus ? '#00ffaa' : 'var(--primary-cyan)',
                border: '1px solid ' + (generatedStatus ? '#00ffaa' : 'var(--primary-cyan)'),
                borderRadius: '5px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                letterSpacing: '0.04em',
                transition: 'all 0.15s ease',
                boxShadow: generatedStatus ? '0 0 10px rgba(0, 255, 170, 0.4)' : 'none',
              }}
            >
              <span style={{ fontSize: '0.75rem' }}>{generatedStatus ? '✨' : '🔄'}</span>
              <span>{generatedStatus ? 'NEW NEBULA GENERATED!' : 'GENERATE NEW NEBULA'}</span>
            </button>

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
                { label: 'GRADIENT SOFTNESS', key: 'gradientSoftness', min: 0.1, max: 2.5, step: 0.05 },
                { label: 'MOVEMENT SPEED', key: 'speed', min: 0.0, max: 0.50, step: 0.005 },
                { label: 'ALPHA', key: 'alpha', min: 0.0, max: 1.0, step: 0.02 },
              ].map(({ label, key, min, max, step }) => {
                const val = currentNebula[key] ?? (key === 'gradientSoftness' ? 1.0 : (key === 'speed' ? 0.0 : undefined));
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
                      onMouseDown={pushHistorySnapshot}
                      onTouchStart={pushHistorySnapshot}
                      onChange={(e) => updateNebulaParam(activeNebulaTab, key, e.target.value)}
                      style={{ width: '100%', accentColor: 'var(--primary-cyan)', cursor: 'pointer' }}
                    />
                  </div>
                );
              })}

              {/* Procedural Seed Input Section */}
              <div style={{
                marginTop: '0.2rem',
                paddingTop: '0.35rem',
                borderTop: '1px solid rgba(0, 186, 227, 0.25)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.35rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.62rem', color: 'var(--primary-cyan)', fontWeight: 'bold' }}>
                    🎲 PROCEDURAL SEED:
                  </span>
                  <button
                    onClick={() => {
                      pushHistorySnapshot();
                      const current = NEBULA_CONFIG[activeNebulaTab];
                      if (!current) return;
                      current.seedX = +(Math.floor(Math.random() * 120 + 5) * (Math.random() > 0.5 ? 1 : -1)).toFixed(1);
                      current.seedY = +(Math.floor(Math.random() * 120 + 5) * (Math.random() > 0.5 ? 1 : -1)).toFixed(1);
                      saveToStorage();
                      setRerender((v) => v + 1);
                    }}
                    title="Reroll seed for this nebula only"
                    style={{
                      background: 'rgba(0, 186, 227, 0.2)',
                      border: '1px solid var(--primary-cyan)',
                      color: 'var(--primary-cyan)',
                      borderRadius: '3px',
                      padding: '1px 6px',
                      fontSize: '0.55rem',
                      fontFamily: 'var(--font-mono)',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                    }}
                  >
                    REROLL THIS
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <span style={{ fontSize: '0.56rem', color: '#aaa' }}>SEED X:</span>
                    <input
                      type="number"
                      step="0.1"
                      value={currentNebula.seedX ?? 0.0}
                      onFocus={pushHistorySnapshot}
                      onChange={(e) => updateNebulaParam(activeNebulaTab, 'seedX', e.target.value)}
                      style={{
                        background: 'rgba(7, 17, 36, 0.9)',
                        border: '1px solid rgba(0, 186, 227, 0.4)',
                        borderRadius: '3px',
                        color: '#00ffaa',
                        padding: '2px 5px',
                        fontSize: '0.65rem',
                        fontFamily: 'var(--font-mono)',
                        fontWeight: 'bold',
                        width: '100%',
                      }}
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <span style={{ fontSize: '0.56rem', color: '#aaa' }}>SEED Y:</span>
                    <input
                      type="number"
                      step="0.1"
                      value={currentNebula.seedY ?? 0.0}
                      onFocus={pushHistorySnapshot}
                      onChange={(e) => updateNebulaParam(activeNebulaTab, 'seedY', e.target.value)}
                      style={{
                        background: 'rgba(7, 17, 36, 0.9)',
                        border: '1px solid rgba(0, 186, 227, 0.4)',
                        borderRadius: '3px',
                        color: '#00ffaa',
                        padding: '2px 5px',
                        fontSize: '0.65rem',
                        fontFamily: 'var(--font-mono)',
                        fontWeight: 'bold',
                        width: '100%',
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Multi-Core & Lava Lamp Convection Section */}
              <div style={{
                marginTop: '0.3rem',
                paddingTop: '0.35rem',
                borderTop: '1px solid rgba(255, 119, 0, 0.3)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.35rem'
              }}>
                <div style={{ fontSize: '0.62rem', color: '#ff9933', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span>🌋</span>
                  <span>MULTI-CORE / LAVA LAMP DYNAMICS:</span>
                </div>
                {[
                  { label: '🔥 HOTSPOT INTENSITY', key: 'multiCoreStrength', min: 0.0, max: 2.0, step: 0.05, fallback: 0.0 },
                  { label: '🌐 CONVECTION SCALE', key: 'multiCoreScale', min: 0.5, max: 5.0, step: 0.1, fallback: 1.8 },
                  { label: '🫧 VOID PINCH (METABALLS)', key: 'voidPinch', min: 0.0, max: 1.0, step: 0.05, fallback: 0.0 },
                ].map(({ label, key, min, max, step, fallback }) => {
                  const val = currentNebula[key] ?? fallback;
                  return (
                    <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.58rem', color: '#ddd' }}>
                        <span>{label}:</span>
                        <span style={{ color: '#ffaa33', fontWeight: 'bold' }}>{val}</span>
                      </div>
                      <input
                        type="range"
                        min={min}
                        max={max}
                        step={step}
                        value={val}
                        onMouseDown={pushHistorySnapshot}
                        onTouchStart={pushHistorySnapshot}
                        onChange={(e) => updateNebulaParam(activeNebulaTab, key, e.target.value)}
                        style={{ width: '100%', accentColor: '#ff9933', cursor: 'pointer' }}
                      />
                    </div>
                  );
                })}
              </div>

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
                            onMouseDown={pushHistorySnapshot}
                            onChange={(e) => updateNebulaParam(activeNebulaTab, key, e.target.value)}
                            style={{ width: '22px', height: '22px', border: 'none', background: 'transparent', cursor: 'pointer' }}
                          />
                          <input
                            type="text"
                            value={hexVal}
                            onFocus={pushHistorySnapshot}
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
        )}
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
