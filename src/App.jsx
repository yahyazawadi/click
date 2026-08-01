import React, { useState, useEffect, useRef, Suspense } from 'react';
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

export default function App() {
  const [selectedTarget, setSelectedTarget] = useState(null);
  const [targetPlanetPos, setTargetPlanetPos] = useState(null);
  const [activeTitles, setActiveTitles] = useState([]);
  const [zoomFactor, setZoomFactor] = useState(1.0);
  const [currentScrollIndex, setCurrentScrollIndex] = useState(0);

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
      setTargetPlanetPos(null);
    } else if (index === 1) {
      setSelectedTarget('core');
      setTargetPlanetPos(null);
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
          setTargetPlanetPos(null);
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
          setTargetPlanetPos(null);
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
      // Toggle back to system overview (Index 0)
      setSelectedTarget(null);
      setTargetPlanetPos(null);
      scrollToPlanetIndex(0);
    } else if (id === 'core') {
      setSelectedTarget('core');
      scrollToPlanetIndex(1); // Core is Index 1
    } else {
      // Planet selected -> find index and scroll to it smoothly via Lenis
      setSelectedTarget(id);
      const index = SYSTEM_CONFIG.projects.findIndex((p) => p.id === id);
      if (index !== -1) {
        scrollToPlanetIndex(index + 2); // Index 0 = Overview, Index 1 = Core, Projects start at Index 2
      }
    }
  };

  const handleReturn = () => {
    setSelectedTarget(null);
    setTargetPlanetPos(null);
    scrollToPlanetIndex(0);
  };

  const selectedProject = SYSTEM_CONFIG.projects.find((p) => p.id === selectedTarget);

  return (
    <LenisScrollProvider onIndexChange={handleScrollIndexChange} totalIndices={totalIndices}>
      <div style={{ width: '100vw', height: '100vh', position: 'fixed', top: 0, left: 0 }}>
        {/* 3D WebGL Canvas Layer */}
        <div className="canvas-container">
          <Canvas
            dpr={[1, 1.5]}
            camera={{ position: [0, 25, 55], fov: 45 }}
            gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
            onDoubleClick={(e) => e.preventDefault()}
            onPointerMissed={handleReturn}
          >
            <color attach="background" args={[SYSTEM_CONFIG.colors.bgVoid]} />

            {/* Lighting */}
            <ambientLight intensity={0.6} />
            <pointLight position={[12, 12, 12]} intensity={1.8} color={SYSTEM_CONFIG.colors.primaryCyan} />
            <pointLight position={[-12, -12, -12]} intensity={0.6} color={SYSTEM_CONFIG.colors.deepShadow} />

            <Suspense fallback={null}>
              {/* Background Stars */}
              <CosmicBackground />

              {/* Manual Drag & Spin */}
              <SceneRotator disabled={!!selectedTarget}>
                {/* Central Sphere Core */}
                <SystemCore onSelect={handleSelect} />

                {/* Tilted Macro Orbital Rings */}
                {SYSTEM_CONFIG.rings.map((ring) => (
                  <OrbitalPath key={ring.id} {...ring} />
                ))}

                {/* Orbiting Project Planets */}
                {SYSTEM_CONFIG.projects.map((proj) => {
                  const ring = SYSTEM_CONFIG.rings[proj.ringIndex];
                  return (
                    <PlanetNode
                      key={proj.id}
                      project={proj}
                      ring={ring}
                      onSelect={handleSelect}
                      isSelected={selectedTarget === proj.id}
                      hasSelection={!!selectedTarget}
                      showTitle={activeTitles.includes(proj.id)}
                      onUpdatePosition={(pos) => setTargetPlanetPos(pos)}
                    />
                  );
                })}
              </SceneRotator>

              {/* Camera Zoom & Motion Controller */}
              <CameraController selectedTarget={selectedTarget} targetPosition={targetPlanetPos} zoomFactor={zoomFactor} />
            </Suspense>
          </Canvas>
        </div>

        {/* HTML Foreground UI Overlay Layer */}
        <UIOverlay
          selectedTarget={selectedTarget}
          selectedProject={selectedProject}
          onReturn={handleReturn}
        />
      </div>
    </LenisScrollProvider>
  );
}

