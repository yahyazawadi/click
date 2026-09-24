import React, { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import * as THREE from 'three';
import { Canvas } from '@react-three/fiber';
import { SYSTEM_CONFIG, NEBULA_CONFIG, SECRET_LOVE_PROJECTS } from './config';
import { CosmicBackground } from './components/CosmicBackground';
import { SystemCore } from './components/SystemCore';
import { OrbitalPath } from './components/OrbitalPath';
import { PlanetNode } from './components/PlanetNode';
import { PlanetOrientationControls } from './components/PlanetOrientationControls';
import { CameraController } from './components/CameraController';
import { SceneRotator } from './components/SceneRotator';
import { UIOverlay } from './components/UIOverlay';
import { LenisScrollProvider, scrollToPlanetIndex } from './components/LenisScrollProvider';
import { FaviconAnimator } from './components/FaviconAnimator';
import { BatteryWarning } from './components/BatteryWarning';
import { PerformanceWarning } from './components/PerformanceWarning';
import { FpsProfilerOverlay } from './components/FpsProfilerOverlay';
import { ShaderWarmup } from './components/ShaderWarmup';
import { CosmicLoadingScreen } from './components/CosmicLoadingScreen';
import { fpsLogger } from './utils/fpsLogger';
import { tierToFloat } from './utils/detectGpuTier.js';

import { useFrame } from '@react-three/fiber';

// Notifies when WebGL canvas has drawn initial frames and is active
function CanvasReadyNotifier({ onReady }) {
  const frameCount = useRef(0);
  useFrame(() => {
    if (frameCount.current < 2) {
      frameCount.current += 1;
      if (frameCount.current === 2) {
        onReady();
      }
    }
  });
  return null;
}

// FPS-Stabilized Progressive Planet Unloader / Loader Controller & Telemetry Observer
function ProgressivePlanetController({ onUnlockNext, isMobile, onFpsUpdate, onMetricsUpdate, selectedTarget, unlockedCount, totalProjects = 8, gpuTier, onAutoDemoteTier, isAppLoaded = false }) {
  const stableTimer = useRef(0);
  const timeSinceLastUnlock = useRef(0);
  const lowFpsTimer = useRef(0);
  const fpsAcc = useRef(0);
  const frameCount = useRef(0);
  const frameDeltas = useRef(new Float32Array(300));
  const ringIdx = useRef(0);
  const sampleCount = useRef(0);
  const lastSnapshotTime = useRef(Date.now());
  const batteryRef = useRef({ charging: 'unknown', level: 'unknown' });

  // Battery status tracking for telemetry snapshots
  useEffect(() => {
    if ('getBattery' in navigator) {
      navigator.getBattery().then((b) => {
        batteryRef.current = { charging: b.charging, level: b.level };
        b.addEventListener('chargingchange', () => { batteryRef.current.charging = b.charging; });
        b.addEventListener('levelchange', () => { batteryRef.current.level = b.level; });
      }).catch(() => {});
    }
  }, []);

  // Clean accumulator reset on tab visibility change (instant wakeup without time-warp)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fpsAcc.current = 0;
        frameCount.current = 0;
        stableTimer.current = 0;
        timeSinceLastUnlock.current = 0;
        lowFpsTimer.current = 0;
        lastSnapshotTime.current = Date.now();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  useFrame((_state, delta) => {
    // Clamp delta to 0.1s max to prevent sudden leaps on tab blur/focus/wakeup
    const safeDelta = Math.min(delta, 0.1);
    const frameMs = safeDelta * 1000;
    
    // Ring buffer write — zero allocation, zero array shifting
    frameDeltas.current[ringIdx.current] = frameMs;
    ringIdx.current = (ringIdx.current + 1) % 300;
    if (sampleCount.current < 300) sampleCount.current += 1;

    const renderInfo = _state.gl?.info?.render ? {
      calls: _state.gl.info.render.calls,
      triangles: _state.gl.info.render.triangles,
    } : null;

    // Capture STUTTER_EVENT if single frame exceeds 33.3ms (below 30 FPS)
    if (safeDelta > 0.0333 && document.visibilityState !== 'hidden') {
      fpsLogger.logStutterEvent({
        frameDurationMs: frameMs,
        selectedTarget,
        unlockedCount,
        batteryStatus: batteryRef.current,
        isMobile,
        gpuTier,
        cameraPos: _state.camera.position,
        renderInfo,
      });
    }

    // Rule: On phone, FPS must stay MOSTLY above 30 FPS for 0.5 seconds to unlock the next planet.
    // On desktop, FPS must stay above 45 FPS for 0.25 seconds.
    // IMPORTANT: Uses decay on bad frames instead of hard-reset — a single shader-compile stutter
    // (common on phones every ~0.4s) was wiping the 2.0s accumulator, permanently blocking unlocks.
    const thresholdDelta = isMobile ? 0.034 : 0.022;
    const requiredDuration = isMobile ? 0.5 : 0.25;

    if (safeDelta <= thresholdDelta) {
      // Good frame — accumulate
      stableTimer.current += safeDelta;
    } else {
      // Bad frame — decay slowly instead of hard reset
      // A single stutter should not erase 1.8s of proven stability
      stableTimer.current = Math.max(0, stableTimer.current - safeDelta * 0.3);
    }

    // Performance Safety Net: If FPS average stays below 25 FPS for 2.0s on active tab, demote GPU tier.
    // Uses an EMA so a single lucky 38ms frame does NOT reset the 1.5s accumulator.
    // Ignore when tab is hidden or when delta > 0.25s (tab switch / background throttle)
    const isTabActive = typeof document !== 'undefined' && !document.hidden && document.visibilityState !== 'hidden';
    if (isAppLoaded && isTabActive && safeDelta < 0.25) {
      timeSinceLastUnlock.current += safeDelta;
      if (gpuTier !== 'low') {
        if (safeDelta >= 0.040) {
          // Frame below 25 FPS — accumulate
          lowFpsTimer.current += safeDelta;
        } else {
          // Frame above 25 FPS — only decay slowly (don't fully reset on a single fast frame)
          lowFpsTimer.current = Math.max(0, lowFpsTimer.current - safeDelta * 0.5);
        }
        if (lowFpsTimer.current >= 2.0) {
          lowFpsTimer.current = 0;
          if (typeof onAutoDemoteTier === 'function') {
            onAutoDemoteTier();
          }
        }
      }
    } else if (!isTabActive || safeDelta >= 0.25) {
      lowFpsTimer.current = 0;
      timeSinceLastUnlock.current = 0;
    }

    fpsAcc.current += safeDelta;
    frameCount.current += 1;

    // Every 0.3s: calculate live FPS & 1% lows
    if (fpsAcc.current >= 0.3) {
      const liveFps = Math.round(frameCount.current / fpsAcc.current);
      
      // Calculate 1% Low FPS — zero allocation ring buffer scan
      let worstFrameMs = 16.6;
      const count = sampleCount.current;
      const deltas = frameDeltas.current;
      for (let k = 0; k < count; k++) {
        if (deltas[k] > worstFrameMs) worstFrameMs = deltas[k];
      }
      const onePercentLow = Math.round(1000 / worstFrameMs);

      if (typeof onFpsUpdate === 'function') {
        onFpsUpdate(liveFps);
      }
      if (typeof onMetricsUpdate === 'function') {
        onMetricsUpdate({
          onePercentLow,
          stutterCount: fpsLogger.stutterEvents?.length || 0
        });
      }

      fpsAcc.current = 0;
      frameCount.current = 0;
    }

    // Every 1.0s: log snapshot to telemetry buffer
    const now = Date.now();
    if (now - lastSnapshotTime.current >= 1000) {
      const count = sampleCount.current;
      let sumMs = 0;
      let maxMs = 16.6;
      const deltas = frameDeltas.current;
      for (let i = 0; i < count; i++) {
        const val = deltas[i];
        sumMs += val;
        if (val > maxMs) maxMs = val;
      }
      const avgMs = count > 0 ? sumMs / count : 16.6;
      const liveFps = Math.round(1000 / avgMs);

      fpsLogger.logSnapshot({
        fps: liveFps,
        onePercentLow: Math.round(1000 / maxMs),
        avgFrameTimeMs: avgMs,
        maxFrameTimeMs: maxMs,
        selectedTarget,
        unlockedCount,
        batteryStatus: batteryRef.current,
        isMobile,
        gpuTier,
        cameraPos: _state.camera.position,
        renderInfo,
      });

      lastSnapshotTime.current = now;
    }

    // Unlock next planet once FPS has stayed continuously stable for requiredDuration
    // OR if fallback duration (2.5s on mobile, 3.0s on desktop) elapses so budget/throttled devices never get stuck
    const fallbackDuration = isMobile ? 2.5 : 3.0;
    const isUnlockedByFps = stableTimer.current >= requiredDuration;
    const isUnlockedByFallback = isAppLoaded && isTabActive && timeSinceLastUnlock.current >= fallbackDuration;

    if (unlockedCount < totalProjects && (isUnlockedByFps || isUnlockedByFallback)) {
      stableTimer.current = 0;
      timeSinceLastUnlock.current = 0;
      onUnlockNext();
    }
  });

  return null;
}

export default function App({ gpuTier: initialGpuTier = 'high', perfTierFloat: initialPerfTierFloat = 0.0 }) {
  const [selectedTarget, setSelectedTarget] = useState(null);
  const targetPlanetPosRef = useRef(new THREE.Vector3());
  const targetPlanetQuatRef = useRef(new THREE.Quaternion());
  const [activeTitles, setActiveTitles] = useState([]);
  const [zoomFactor, setZoomFactor] = useState(1.0);
  const [currentScrollIndex, setCurrentScrollIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [unlockedCount, setUnlockedCount] = useState(2);
  const [currentFps, setCurrentFps] = useState(60);
  const [metrics, setMetrics] = useState({ onePercentLow: 60, stutterCount: 0 });
  const [isFaviconEnabled, setIsFaviconEnabled] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('yahya_favicon_enabled');
      return saved !== null ? saved === 'true' : true;
    }
    return true;
  });
  const [isNebulaEnabled, setIsNebulaEnabled] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('yahya_nebula_enabled');
      return saved !== null ? saved === 'true' : true;
    }
    return true;
  });
  const [isBottomHintEnabled, setIsBottomHintEnabled] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('yahya_bottom_hint_enabled');
      return saved !== null ? saved === 'true' : true;
    }
    return true;
  });
  const [isMobileDualNebula, setIsMobileDualNebula] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('yahya_mobile_dual_nebula');
      return saved !== null ? saved === 'true' : false;
    }
    return false;
  });

  const handleToggleFavicon = () => {
    setIsFaviconEnabled((prev) => {
      const next = !prev;
      if (typeof window !== 'undefined') {
        localStorage.setItem('yahya_favicon_enabled', String(next));
      }
      return next;
    });
  };

  const handleToggleNebula = () => {
    setIsNebulaEnabled((prev) => {
      const next = !prev;
      if (typeof window !== 'undefined') {
        localStorage.setItem('yahya_nebula_enabled', String(next));
      }
      return next;
    });
  };

  const handleToggleBottomHint = () => {
    setIsBottomHintEnabled((prev) => {
      const next = !prev;
      if (typeof window !== 'undefined') {
        localStorage.setItem('yahya_bottom_hint_enabled', String(next));
      }
      return next;
    });
  };

  const handleToggleMobileDualNebula = () => {
    setIsMobileDualNebula((prev) => {
      const next = !prev;
      if (typeof window !== 'undefined') {
        localStorage.setItem('yahya_mobile_dual_nebula', String(next));
      }
      return next;
    });
  };
  // Centralized Nebula Configuration System — Independent per-nebula config from src/config.js!
  const [nebulaPath1, setNebulaPath1] = useState(NEBULA_CONFIG.nebula1.path);
  const [nebulaPath2, setNebulaPath2] = useState(NEBULA_CONFIG.nebula2.path);
  // GPU tier — starts from benchmark result but can be overridden via profiler HUD
  const [gpuTier, setGpuTier] = useState(initialGpuTier);
  const [perfTierFloat, setPerfTierFloat] = useState(initialPerfTierFloat);
  // Manual override lock — once user clicks a tier manually, NEVER auto-demote!
  const [isTierManuallyLocked, setIsTierManuallyLocked] = useState(false);
  // Real-time 3D Planet Pitch/Yaw Orientation (controlled via slim HUD sliders)
  const [planetOrientation, setPlanetOrientation] = useState({ pitch: 0, yaw: 0 });

  // WebGL Warmup & Loading Curtain Synchronization
  const [isCanvasReady, setIsCanvasReady] = useState(false);
  const [isAppLoaded, setIsAppLoaded] = useState(false);

  // Secret URL trigger detection (?love or #love or /love)
  const [isLoveMode, setIsLoveMode] = useState(() => {
    if (typeof window === 'undefined') return false;
    const s = (window.location.search || '').toLowerCase();
    const h = (window.location.hash || '').toLowerCase();
    const p = (window.location.pathname || '').toLowerCase();
    return s.includes('love') || h.includes('love') || p.includes('love');
  });

  useEffect(() => {
    const checkLovePath = () => {
      if (typeof window === 'undefined') return;
      const s = (window.location.search || '').toLowerCase();
      const h = (window.location.hash || '').toLowerCase();
      const p = (window.location.pathname || '').toLowerCase();
      if (s.includes('love') || h.includes('love') || p.includes('love')) {
        setIsLoveMode(true);
      }
    };
    checkLovePath();
    window.addEventListener('popstate', checkLovePath);
    window.addEventListener('hashchange', checkLovePath);
    return () => {
      window.removeEventListener('popstate', checkLovePath);
      window.removeEventListener('hashchange', checkLovePath);
    };
  }, []);

  const activeProjects = React.useMemo(() => {
    return isLoveMode
      ? [...SYSTEM_CONFIG.projects, ...SECRET_LOVE_PROJECTS]
      : SYSTEM_CONFIG.projects;
  }, [isLoveMode]);

  // Telemetry profiler overlay visibility (open via clicking FPS badge or pressing ~)
  const [isProfilerOpen, setIsProfilerOpen] = useState(() => {
    return typeof window !== 'undefined' && 
      (window.location.search.includes('debug=fps') || window.location.search.includes('profiler=true'));
  });

  const handleToggleProfiler = () => {
    fpsLogger.logInteraction({ type: 'TOGGLE_PROFILER', target: selectedTarget, details: { isOpen: !isProfilerOpen } });
    setIsProfilerOpen((prev) => !prev);
  };

  const handleSetTier = (tier) => {
    setIsTierManuallyLocked(true); // User manual choice — lock state permanently!
    fpsLogger.logTierChange({ from: gpuTier, to: tier, reason: 'User HUD override (manual lock)' });
    setGpuTier(tier);
    setPerfTierFloat(tierToFloat(tier));
  };

  const handleAutoDemoteTier = () => {
    if (isTierManuallyLocked) return; // User manually selected tier — NEVER auto-demote!
    if (gpuTier === 'high') {
      fpsLogger.logTierChange({ from: 'high', to: 'med', reason: 'Automatic performance demotion (live FPS < 25 FPS for 1.5s)' });
      setGpuTier('med');
      setPerfTierFloat(tierToFloat('med'));
    } else if (gpuTier === 'med') {
      fpsLogger.logTierChange({ from: 'med', to: 'low', reason: 'Automatic performance demotion (live FPS < 25 FPS for 1.5s)' });
      setGpuTier('low');
      setPerfTierFloat(tierToFloat('low'));
    }
  };
  
  // Track if any warning was dismissed this session to prevent spamming
  const [warningDismissed, setWarningDismissed] = useState(() => 
    sessionStorage.getItem('yahya_warning_dismissed') === 'true'
  );

  const handleDismissWarning = () => {
    sessionStorage.setItem('yahya_warning_dismissed', 'true');
    setWarningDismissed(true);
  };

  const handleUnlockNext = () => {
    setUnlockedCount((prev) => {
      if (prev >= activeProjects.length) return prev;
      const nextCount = prev + 1;
      const unlockedProject = activeProjects[nextCount - 1];
      if (unlockedProject) {
        fpsLogger.logUnlock({ planetId: unlockedProject.id, unlockedCount: nextCount });
      }
      return nextCount;
    });
  };

  // Mobile detection for targeted performance scaling
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768 || ('ontouchstart' in window && window.innerWidth < 1024));
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Total indices = 1 (Overview) + 1 (Core) + Projects = Total positions
  const totalIndices = 2 + activeProjects.length;

  // Sync scroll index change from Lenis / Wheel
  // Index 0: Overview Orbit
  // Index 1: System Core Focused
  // Index 2..N: Planet Projects
  const handleScrollIndexChange = (index) => {
    setCurrentScrollIndex(index);
    if (index === 0) {
      setSelectedTarget(null);
    } else if (index === 1) {
      setSelectedTarget('core');
    } else {
      const proj = activeProjects[index - 2];
      if (proj) {
        setSelectedTarget(proj.id);
      }
    }
  };

  // Prevent double-click zoom across window
  useEffect(() => {
    const handleDblClick = (e) => {
      e.preventDefault();
    };
    window.addEventListener('dblclick', handleDblClick, { passive: false });
    return () => window.removeEventListener('dblclick', handleDblClick);
  }, []);

  const zoomFactorRef = useRef(1.0);

  // Keep zoomFactorRef in sync
  useEffect(() => {
    zoomFactorRef.current = zoomFactor;
  }, [zoomFactor]);

  // Desktop Ctrl + Mouse Wheel Zoom (Desktop Only)
  useEffect(() => {
    const handleWheelZoom = (e) => {
      // Desktop only and Ctrl key must be pressed (or pinch gesture on desktop trackpad)
      if (isMobile || !e.ctrlKey) return;
      e.preventDefault();

      const zoomDelta = e.deltaY * 0.0015;
      setZoomFactor((prevZoom) => {
        const nextZoom = Math.min(Math.max(prevZoom + zoomDelta, 0.4), 2.5);
        return isFinite(nextZoom) ? nextZoom : prevZoom;
      });
    };

    window.addEventListener('wheel', handleWheelZoom, { passive: false });
    return () => window.removeEventListener('wheel', handleWheelZoom);
  }, [isMobile]);

  // 2-Finger Touch Pinch to Zoom (Touch devices only)
  useEffect(() => {
    let initialDist = null;
    let startZoom = 1.0;

    const getTouchDist = (touches) => {
      const dx = touches[0].clientX - touches[1].clientX;
      const dy = touches[0].clientY - touches[1].clientY;
      return Math.hypot(dx, dy);
    };

    const onTouchStart = (e) => {
      if (e.touches.length === 2) {
        initialDist = getTouchDist(e.touches);
        startZoom = zoomFactorRef.current;
      }
    };

    const onTouchMove = (e) => {
      if (e.touches.length === 2 && initialDist && initialDist > 0) {
        const currentDist = getTouchDist(e.touches);
        if (!currentDist || currentDist <= 0) return;
        const ratio = initialDist / currentDist;
        if (!isFinite(ratio)) return;

        if (ratio > 1.2) {
          setSelectedTarget(null);
          scrollToPlanetIndex(0);
        }

        const newZoom = Math.min(Math.max(startZoom * ratio, 0.4), 2.5);
        if (isFinite(newZoom)) {
          setZoomFactor(newZoom);
        }
      }
    };

    const onTouchEnd = (e) => {
      if (e.touches.length < 2) {
        initialDist = null;
      }
    };

    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, []);

  // Randomly select 1 or 2 planet titles to display every few seconds
  useEffect(() => {
    const interval = setInterval(() => {
      const allIds = activeProjects.map(p => p.id);
      const numTitles = Math.floor(Math.random() * 2) + 1;
      const shuffled = allIds.sort(() => 0.5 - Math.random());
      setActiveTitles(shuffled.slice(0, numTitles));
    }, 4500);
    
    return () => clearInterval(interval);
  }, [activeProjects]);

  // Detect manual dragging to break focus ON RELEASE
  useEffect(() => {
    let isDown = false;
    let startX = 0;
    let startY = 0;
    let currentX = 0;
    let currentY = 0;

    const onPointerDown = (e) => {
      isDown = true;
      startX = e.clientX;
      startY = e.clientY;
      currentX = e.clientX;
      currentY = e.clientY;
    };

    const onPointerMove = (e) => {
      if (!isDown) return;
      currentX = e.clientX;
      currentY = e.clientY;
    };

    const onPointerUp = () => {
      if (!isDown) return;
      isDown = false;

      if (selectedTarget) {
        const dx = Math.abs(currentX - startX);
        const dy = Math.abs(currentY - startY);
        if (dx > 25 || dy > 25) {
          setSelectedTarget(null);
          scrollToPlanetIndex(0);
        }
      }
    };

    window.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);

    return () => {
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };
  }, [selectedTarget]);

  const handleSelect = (id) => {
    setPlanetOrientation({ pitch: 0, yaw: 0 });
    if (selectedTarget === id) {
      fpsLogger.logInteraction({ type: 'DESELECT_RETURN_TO_ORBIT', target: 'OVERVIEW', details: { previousTarget: id } });
      setSelectedTarget(null);
      scrollToPlanetIndex(0);
    } else if (id === 'core') {
      fpsLogger.logInteraction({ type: 'SELECT_CORE', target: 'core', details: {} });
      setSelectedTarget('core');
      scrollToPlanetIndex(1); // Core is Index 1
    } else {
      fpsLogger.logInteraction({ type: 'SELECT_PLANET', target: id, details: {} });
      setSelectedTarget(id);
      const index = activeProjects.findIndex((p) => p.id === id);
      if (index !== -1) {
        scrollToPlanetIndex(index + 2); // Index 0 = Overview, Index 1 = Core, Projects start at Index 2
      }
    }
  };

  const handleReturn = () => {
    setPlanetOrientation({ pitch: 0, yaw: 0 });
    fpsLogger.logInteraction({ type: 'CLICK_RETURN_TO_ORBIT', target: 'OVERVIEW', details: { previousTarget: selectedTarget } });
    setSelectedTarget(null);
    scrollToPlanetIndex(0);
  };

  const handleAppLoaded = useCallback(() => {
    setIsAppLoaded(true);
  }, []);

  const selectedProject = activeProjects.find((p) => p.id === selectedTarget);

  // On mobile, enforce at least 'med' tier (0.5) to prevent heavy HIGH-tier shaders on phones.
  // If the phone was auto-demoted to 'low' (1.0), respect that and don't clamp back to 0.5.
  const effectivePerfTierFloat = isMobile ? Math.max(perfTierFloat, 0.5) : perfTierFloat;

  return (
    <LenisScrollProvider onIndexChange={handleScrollIndexChange} totalIndices={totalIndices}>
      <div style={{ width: '100vw', height: '100vh', position: 'fixed', top: 0, left: 0 }}>
        {/* 3D WebGL Canvas Layer */}
        <div className="canvas-container">
          <Canvas
            dpr={isMobile
              // Mobile: cap DPR at 1.5 — delivers clean silhouette curvature while avoiding high native fill rates (e.g. 2.75x)
              ? [1, Math.min(typeof window !== 'undefined' ? window.devicePixelRatio : 1.0, 1.5)]
              : (gpuTier === 'low' ? [1, 1.25] : [1, 1.75])}
            camera={{ position: [0, 120, 300], fov: 45 }}
            gl={{
              // Hardware MSAA for smooth polygon and sphere silhouettes
              antialias: true,
              alpha: false,
              powerPreference: 'high-performance',
              localClippingEnabled: false,
              stencil: false
            }}
            onDoubleClick={(e) => e.preventDefault()}
            onPointerMissed={handleReturn}
          >
            <color attach="background" args={[SYSTEM_CONFIG.colors.bgVoid]} />

            {/* Lighting */}
            <ambientLight intensity={0.6} />
            <pointLight position={[12, 12, 12]} intensity={1.8} color={SYSTEM_CONFIG.colors.primaryCyan} />
            <pointLight position={[-12, -12, -12]} intensity={0.6} color={SYSTEM_CONFIG.colors.deepShadow} />

            <Suspense fallback={null}>
              {/* Notifier to sync loading screen when initial frames are rendered */}
              <CanvasReadyNotifier onReady={() => setIsCanvasReady(true)} />

              {/* Pre-compile heavy custom GLSL shaders gradually after page load */}
              <ShaderWarmup perfTierFloat={effectivePerfTierFloat} />

              {/* Dynamic FPS-Stabilized Progressive Planet Unlocker & Telemetry Observer */}
              <ProgressivePlanetController
                onUnlockNext={handleUnlockNext}
                isMobile={isMobile}
                onFpsUpdate={setCurrentFps}
                onMetricsUpdate={setMetrics}
                selectedTarget={selectedTarget}
                unlockedCount={unlockedCount}
                totalProjects={activeProjects.length}
                gpuTier={gpuTier}
                onAutoDemoteTier={handleAutoDemoteTier}
                isAppLoaded={isAppLoaded}
              />

              {/* Manual Drag & Spin (Rotates system + background together) */}
              <SceneRotator disabled={!!selectedTarget}>
                {/* Background Nebulae & Stars */}
                <CosmicBackground isMobile={isMobile} isMobileDualNebula={isMobileDualNebula} enabled={isNebulaEnabled} perfTierFloat={effectivePerfTierFloat} nebulaPath1={nebulaPath1} nebulaPath2={nebulaPath2} />

                {/* Central Sphere Core */}
                <SystemCore isMobile={isMobile} onSelect={handleSelect} perfTierFloat={effectivePerfTierFloat} isSelected={selectedTarget === 'core'} />

                {/* Tilted Macro Orbital Rings */}
                {SYSTEM_CONFIG.rings.map((ring) => (
                  <OrbitalPath key={ring.id} {...ring} />
                ))}

                {/* Orbiting Project Planets — Progressively Unlocked as FPS Stabilizes */}
                {activeProjects.map((proj, idx) => {
                  const ring = SYSTEM_CONFIG.rings[proj.ringIndex];
                  // Priority 1: Initial planets start unlocked immediately from frame 1
                  const isPriorityPlanet = idx < 2 || proj.id.includes('heart');
                  const isUnlocked = isPriorityPlanet || idx < unlockedCount;

                  return (
                    <PlanetNode
                      key={proj.id}
                      project={proj}
                      ring={ring}
                      isMobile={isMobile}
                      isUnlocked={isUnlocked}
                      onSelect={handleSelect}
                      isSelected={selectedTarget === proj.id}
                      hasSelection={!!selectedTarget}
                      showTitle={activeTitles.includes(proj.id)}
                      targetPlanetPosRef={targetPlanetPosRef}
                      targetPlanetQuatRef={targetPlanetQuatRef}
                      perfTierFloat={effectivePerfTierFloat}
                      planetOrientation={planetOrientation}
                    />
                  );
                })}
              </SceneRotator>

              {/* Camera Zoom & Motion Controller */}
              <CameraController
                selectedTarget={selectedTarget}
                targetPlanetPosRef={targetPlanetPosRef}
                targetPlanetQuatRef={targetPlanetQuatRef}
                zoomFactor={zoomFactor}
                isMobile={isMobile}
              />
            </Suspense>
          </Canvas>
        </div>

        {/* Minimalist Dual Planet Orientation Sliders (Left: Pitch, Bottom: Yaw) */}
        <PlanetOrientationControls
          visible={!!selectedTarget && selectedTarget !== 'core'}
          orientation={planetOrientation}
          onChange={setPlanetOrientation}
          isMobile={isMobile}
        />

        {/* HTML Foreground UI Overlay Layer */}
        <UIOverlay
          selectedTarget={selectedTarget}
          selectedProject={selectedProject}
          activeProjects={activeProjects}
          onReturn={handleReturn}
          onSelectTarget={handleSelect}
          currentFps={currentFps}
          isMobile={isMobile}
          onToggleProfiler={handleToggleProfiler}
          isBottomHintEnabled={isBottomHintEnabled}
        />

        {/* Dynamic Canvas Favicon Animator (Brave / Chromium compatible) */}
        <FaviconAnimator isMobile={isMobile} enabled={isFaviconEnabled} />

        {/* Real-Time FPS Profiler & 1-Click JSON/CSV Exporter HUD */}
        <FpsProfilerOverlay
          currentFps={currentFps}
          onePercentLow={metrics.onePercentLow}
          stutterCount={metrics.stutterCount}
          isMobile={isMobile}
          selectedTarget={selectedTarget}
          unlockedCount={unlockedCount}
          isFaviconEnabled={isFaviconEnabled}
          isNebulaEnabled={isNebulaEnabled}
          isBottomHintEnabled={isBottomHintEnabled}
          isMobileDualNebula={isMobileDualNebula}
          onToggleFavicon={handleToggleFavicon}
          onToggleNebula={handleToggleNebula}
          onToggleBottomHint={handleToggleBottomHint}
          onToggleMobileDualNebula={handleToggleMobileDualNebula}
          gpuTier={gpuTier}
          onSetTier={handleSetTier}
          isOpen={isProfilerOpen}
          onToggle={handleToggleProfiler}
        />

        {/* Battery / Low Power Warning UI */}
        <BatteryWarning isMobile={isMobile} isDismissed={warningDismissed} onDismiss={handleDismissWarning} />
        <PerformanceWarning currentFps={currentFps} isMobile={isMobile} isDismissed={warningDismissed} onDismiss={handleDismissWarning} />

        {/* Cosmic Warmup Curtain & Loading Sequence */}
        <CosmicLoadingScreen
          isReady={isCanvasReady}
          onFinished={handleAppLoaded}
        />

      </div>
    </LenisScrollProvider>
  );
}

