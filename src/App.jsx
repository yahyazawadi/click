import React, { useState, useEffect, useRef, Suspense } from 'react';
import * as THREE from 'three';
import { Canvas } from '@react-three/fiber';
import { SYSTEM_CONFIG } from './config';
import { CosmicBackground } from './components/CosmicBackground';
import { SystemCore } from './components/SystemCore';
import { OrbitalPath } from './components/OrbitalPath';
import { PlanetNode } from './components/PlanetNode';
import { CameraController } from './components/CameraController';
import { SceneRotator } from './components/SceneRotator';
import { UIOverlay } from './components/UIOverlay';
import { LenisScrollProvider, scrollToPlanetIndex } from './components/LenisScrollProvider';
import { FaviconAnimator } from './components/FaviconAnimator';
import { BatteryWarning } from './components/BatteryWarning';
import { PerformanceWarning } from './components/PerformanceWarning';
import { FpsProfilerOverlay } from './components/FpsProfilerOverlay';
import { ShaderWarmup } from './components/ShaderWarmup';
import { fpsLogger } from './utils/fpsLogger';
import { tierToFloat } from './utils/detectGpuTier.js';

import { useFrame } from '@react-three/fiber';

// FPS-Stabilized Progressive Planet Unloader / Loader Controller & Telemetry Observer
function ProgressivePlanetController({ onUnlockNext, isMobile, onFpsUpdate, onMetricsUpdate, selectedTarget, unlockedCount, gpuTier, onAutoDemoteTier }) {
  const stableTimer = useRef(0);
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

  useFrame((_state, delta) => {
    const frameMs = delta * 1000;
    
    // Ring buffer write — zero allocation, zero array shifting
    frameDeltas.current[ringIdx.current] = frameMs;
    ringIdx.current = (ringIdx.current + 1) % 300;
    if (sampleCount.current < 300) sampleCount.current += 1;

    const renderInfo = _state.gl?.info?.render ? {
      calls: _state.gl.info.render.calls,
      triangles: _state.gl.info.render.triangles,
    } : null;

    // Capture STUTTER_EVENT if single frame exceeds 33.3ms (below 30 FPS)
    if (delta > 0.0333) {
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

    // Rule: On phone, FPS must stay above 30 FPS (delta <= 0.034s) continuously for 2.0 seconds
    // On desktop, FPS must stay above 45 FPS (delta <= 0.022s) continuously for 0.25 seconds
    const thresholdDelta = isMobile ? 0.034 : 0.022;
    const requiredDuration = isMobile ? 2.0 : 0.25;

    if (delta <= thresholdDelta) {
      stableTimer.current += delta;
    } else {
      stableTimer.current = 0;
    }

    // Performance Safety Net: If FPS is continuously below 25 FPS (delta >= 0.040s) for 1.5s, demote GPU tier automatically!
    if (delta >= 0.040 && gpuTier !== 'low') {
      lowFpsTimer.current += delta;
      if (lowFpsTimer.current >= 1.5) {
        lowFpsTimer.current = 0;
        if (typeof onAutoDemoteTier === 'function') {
          onAutoDemoteTier();
        }
      }
    } else {
      lowFpsTimer.current = 0;
    }

    fpsAcc.current += delta;
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
    if (stableTimer.current >= requiredDuration) {
      stableTimer.current = 0;
      onUnlockNext();
    }
  });

  return null;
}

export default function App({ gpuTier: initialGpuTier = 'high', perfTierFloat: initialPerfTierFloat = 0.0 }) {
  const [selectedTarget, setSelectedTarget] = useState(null);
  const targetPlanetPosRef = useRef(new THREE.Vector3());
  const [activeTitles, setActiveTitles] = useState([]);
  const [zoomFactor, setZoomFactor] = useState(1.0);
  const [currentScrollIndex, setCurrentScrollIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [unlockedCount, setUnlockedCount] = useState(2);
  const [currentFps, setCurrentFps] = useState(60);
  const [metrics, setMetrics] = useState({ onePercentLow: 60, stutterCount: 0 });
  const [isFaviconEnabled, setIsFaviconEnabled] = useState(true);
  const [isNebulaEnabled, setIsNebulaEnabled] = useState(true);
  // DEV: independent path per nebula (1=Deep Ocean for red, 3=Plasma Filaments for teal)
  const [nebulaPath1, setNebulaPath1] = useState(1);
  const [nebulaPath2, setNebulaPath2] = useState(3);
  // GPU tier — starts from benchmark result but can be overridden via profiler HUD
  const [gpuTier, setGpuTier] = useState(initialGpuTier);
  const [perfTierFloat, setPerfTierFloat] = useState(initialPerfTierFloat);

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
    fpsLogger.logTierChange({ from: gpuTier, to: tier, reason: 'User HUD override' });
    setGpuTier(tier);
    setPerfTierFloat(tierToFloat(tier));
  };

  const handleAutoDemoteTier = () => {
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
      const nextCount = Math.min(SYSTEM_CONFIG.projects.length, prev + 1);
      const unlockedProject = SYSTEM_CONFIG.projects[nextCount - 1];
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

  // Total indices = 1 (Overview) + 1 (Core) + 8 Projects = 10 total positions
  const totalIndices = 2 + SYSTEM_CONFIG.projects.length;

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
      const proj = SYSTEM_CONFIG.projects[index - 2];
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
      const allIds = SYSTEM_CONFIG.projects.map(p => p.id);
      const numTitles = Math.floor(Math.random() * 2) + 1;
      const shuffled = allIds.sort(() => 0.5 - Math.random());
      setActiveTitles(shuffled.slice(0, numTitles));
    }, 4500);
    
    return () => clearInterval(interval);
  }, []);

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
      const index = SYSTEM_CONFIG.projects.findIndex((p) => p.id === id);
      if (index !== -1) {
        scrollToPlanetIndex(index + 2); // Index 0 = Overview, Index 1 = Core, Projects start at Index 2
      }
    }
  };

  const handleReturn = () => {
    fpsLogger.logInteraction({ type: 'CLICK_RETURN_TO_ORBIT', target: 'OVERVIEW', details: { previousTarget: selectedTarget } });
    setSelectedTarget(null);
    scrollToPlanetIndex(0);
  };

  const selectedProject = SYSTEM_CONFIG.projects.find((p) => p.id === selectedTarget);

  return (
    <LenisScrollProvider onIndexChange={handleScrollIndexChange} totalIndices={totalIndices}>
      <div style={{ width: '100vw', height: '100vh', position: 'fixed', top: 0, left: 0 }}>
        {/* 3D WebGL Canvas Layer */}
        <div className="canvas-container">
          <Canvas
            dpr={gpuTier === 'low' ? [0.75, 0.85] : [1, 1.25]}
            camera={{ position: [0, 25, 55], fov: 45 }}
            gl={{ antialias: gpuTier !== 'low' && !isMobile, alpha: false, powerPreference: 'high-performance' }}
            onDoubleClick={(e) => e.preventDefault()}
            onPointerMissed={handleReturn}
          >
            <color attach="background" args={[SYSTEM_CONFIG.colors.bgVoid]} />

            {/* Lighting */}
            <ambientLight intensity={0.6} />
            <pointLight position={[12, 12, 12]} intensity={1.8} color={SYSTEM_CONFIG.colors.primaryCyan} />
            <pointLight position={[-12, -12, -12]} intensity={0.6} color={SYSTEM_CONFIG.colors.deepShadow} />

            <Suspense fallback={null}>
              {/* Pre-compile heavy custom GLSL shaders gradually after page load */}
              <ShaderWarmup perfTierFloat={perfTierFloat} />

              {/* Dynamic FPS-Stabilized Progressive Planet Unlocker & Telemetry Observer */}
              <ProgressivePlanetController
                onUnlockNext={handleUnlockNext}
                isMobile={isMobile}
                onFpsUpdate={setCurrentFps}
                onMetricsUpdate={setMetrics}
                selectedTarget={selectedTarget}
                unlockedCount={unlockedCount}
                gpuTier={gpuTier}
                onAutoDemoteTier={handleAutoDemoteTier}
              />

              {/* Manual Drag & Spin (Rotates system + background together) */}
              <SceneRotator disabled={!!selectedTarget}>
                {/* Background Nebulae & Stars */}
                <CosmicBackground isMobile={isMobile} enabled={isNebulaEnabled} perfTierFloat={perfTierFloat} nebulaPath1={nebulaPath1} nebulaPath2={nebulaPath2} />

                {/* Central Sphere Core */}
                <SystemCore isMobile={isMobile} onSelect={handleSelect} perfTierFloat={perfTierFloat} isSelected={selectedTarget === 'core'} />

                {/* Tilted Macro Orbital Rings */}
                {SYSTEM_CONFIG.rings.map((ring) => (
                  <OrbitalPath key={ring.id} {...ring} />
                ))}

                {/* Orbiting Project Planets — Progressively Unlocked as FPS Stabilizes */}
                {SYSTEM_CONFIG.projects.map((proj, idx) => {
                  const ring = SYSTEM_CONFIG.rings[proj.ringIndex];
                  // Priority 1: Initial planets start unlocked immediately from frame 1
                  const isPriorityPlanet = idx < 2;
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
                      perfTierFloat={perfTierFloat}
                    />
                  );
                })}
              </SceneRotator>

              {/* Camera Zoom & Motion Controller */}
              <CameraController selectedTarget={selectedTarget} targetPlanetPosRef={targetPlanetPosRef} zoomFactor={zoomFactor} isMobile={isMobile} />
            </Suspense>
          </Canvas>
        </div>

        {/* HTML Foreground UI Overlay Layer */}
        <UIOverlay
          selectedTarget={selectedTarget}
          selectedProject={selectedProject}
          onReturn={handleReturn}
          currentFps={currentFps}
          isMobile={isMobile}
          onToggleProfiler={handleToggleProfiler}
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
          onToggleFavicon={() => setIsFaviconEnabled((prev) => !prev)}
          onToggleNebula={() => setIsNebulaEnabled((prev) => !prev)}
          gpuTier={gpuTier}
          onSetTier={handleSetTier}
          isOpen={isProfilerOpen}
          onToggle={handleToggleProfiler}
        />

        {/* Battery / Low Power Warning UI */}
        <BatteryWarning isDismissed={warningDismissed} onDismiss={handleDismissWarning} />
        <PerformanceWarning currentFps={currentFps} isMobile={isMobile} isDismissed={warningDismissed} onDismiss={handleDismissWarning} />

        {/* Nebula Lab — Path Switcher (floating, bottom-left, always visible) */}
        {(
          <div style={{
            position: 'fixed', bottom: 18, left: 18, zIndex: 9999,
            display: 'flex', flexDirection: 'column', gap: 10,
            fontFamily: 'monospace', fontSize: 11,
          }}>
            {[
              {
                label: '● NEBULA 1 · RED',
                color: 'rgba(200,60,120,0.7)',
                active: nebulaPath1,
                setFn: setNebulaPath1,
                activeColor: { border: 'rgba(200,100,180,0.9)', bg: 'rgba(140,30,90,0.55)', text: '#ffb8e0' },
              },
              {
                label: '● NEBULA 2 · TEAL',
                color: 'rgba(0,200,220,0.7)',
                active: nebulaPath2,
                setFn: setNebulaPath2,
                activeColor: { border: 'rgba(0,200,220,0.9)', bg: 'rgba(0,80,100,0.55)', text: '#a0f4ff' },
              },
            ].map(({ label, color, active, setFn, activeColor }) => (
              <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ color, letterSpacing: 1 }}>{label}</span>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
                  {[
                    [0, 'Silky Wisps'],
                    [1, 'Deep Ocean'],
                    [2, 'Orion Ribbon'],
                    [3, 'Plasma Threads'],
                    [4, 'Ion. Cavern'],
                    [5, 'Tarantula Web'],
                    [6, 'Turb. Cascade'],
                    [7, 'Shock Front'],
                  ].map(([id, name]) => (
                    <button key={id} onClick={() => setFn(id)} style={{
                      padding: '3px 7px', borderRadius: 4, textAlign: 'left', cursor: 'pointer',
                      backdropFilter: 'blur(8px)', transition: 'all 0.12s',
                      border: active === id ? `1px solid ${activeColor.border}` : '1px solid rgba(255,255,255,0.10)',
                      background: active === id ? activeColor.bg : 'rgba(0,0,0,0.42)',
                      color: active === id ? activeColor.text : 'rgba(255,255,255,0.4)',
                      fontSize: 10,
                    }}><span style={{ opacity: 0.55 }}>{id}·</span> {name}</button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </LenisScrollProvider>
  );
}

