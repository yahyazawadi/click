import React, { useState, useEffect, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { SYSTEM_CONFIG } from './config';
import { CosmicBackground } from './components/CosmicBackground';
import { SystemCore } from './components/SystemCore';
import { OrbitalPath } from './components/OrbitalPath';
import { PlanetNode } from './components/PlanetNode';
import { CameraController } from './components/CameraController';
import { SceneRotator } from './components/SceneRotator';
import { UIOverlay } from './components/UIOverlay';

export default function App() {
  const [selectedTarget, setSelectedTarget] = useState(null);
  const [targetPlanetPos, setTargetPlanetPos] = useState(null);
  const [activeTitles, setActiveTitles] = useState([]);
  const [zoomFactor, setZoomFactor] = useState(1.0);

  // Prevent double-click zoom across window
  useEffect(() => {
    const handleDblClick = (e) => {
      e.preventDefault();
    };
    window.addEventListener('dblclick', handleDblClick, { passive: false });
    return () => window.removeEventListener('dblclick', handleDblClick);
  }, []);

  // 2-Finger Touch Pinch to Zoom (Touch devices only)
  useEffect(() => {
    let initialDist = null;
    let initialZoom = 1.0;

    const getTouchDist = (touches) => {
      const dx = touches[0].clientX - touches[1].clientX;
      const dy = touches[0].clientY - touches[1].clientY;
      return Math.hypot(dx, dy);
    };

    const onTouchStart = (e) => {
      if (e.touches.length === 2) {
        initialDist = getTouchDist(e.touches);
        initialZoom = zoomFactor;
      }
    };

    const onTouchMove = (e) => {
      if (e.touches.length === 2 && initialDist !== null) {
        const currentDist = getTouchDist(e.touches);
        // Ratio > 1 means pinched inward (fingers moved closer = zoom out)
        const ratio = initialDist / currentDist;

        // Pinching inward while a planet/core is focused automatically zooms out to overview
        if (selectedTarget && ratio > 1.15) {
          setSelectedTarget(null);
          setTargetPlanetPos(null);
        }

        // Adjust camera zoom distance (range 0.75x to 2.2x overview distance)
        const newZoom = Math.min(Math.max(initialZoom * ratio, 0.75), 2.2);
        setZoomFactor(newZoom);
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
  }, [selectedTarget, zoomFactor]);

  // Randomly select 1 or 2 planet titles to display every few seconds
  useEffect(() => {
    const interval = setInterval(() => {
      const allIds = SYSTEM_CONFIG.projects.map(p => p.id);
      const numTitles = Math.floor(Math.random() * 2) + 1; // Pick 1 or 2
      const shuffled = allIds.sort(() => 0.5 - Math.random());
      setActiveTitles(shuffled.slice(0, numTitles));
    }, 4500); // Change every 4.5 seconds
    
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
        // Only return to orbit once the drag is RELEASED
        if (dx > 25 || dy > 25) {
          setSelectedTarget(null);
          setTargetPlanetPos(null);
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
      setSelectedTarget(null);
      setTargetPlanetPos(null);
    } else {
      setSelectedTarget(id);
    }
  };

  const handleReturn = () => {
    setSelectedTarget(null);
    setTargetPlanetPos(null);
  };

  const selectedProject = SYSTEM_CONFIG.projects.find((p) => p.id === selectedTarget);

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      {/* 3D WebGL Canvas Layer */}
      <div className="canvas-container">
        <Canvas
          camera={{ position: [0, 25, 55], fov: 45 }}
          gl={{ antialias: true, alpha: false }}
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

            {/* Manual Drag & Spin — SceneRotator uses spherical coords, no euler fighting */}
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
  );
}
