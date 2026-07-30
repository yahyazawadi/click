import React, { useState, useEffect, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { PresentationControls } from '@react-three/drei';
import { SYSTEM_CONFIG } from './config';
import { CosmicBackground } from './components/CosmicBackground';
import { SystemCore } from './components/SystemCore';
import { OrbitalPath } from './components/OrbitalPath';
import { PlanetNode } from './components/PlanetNode';
import { CameraController } from './components/CameraController';
import { UIOverlay } from './components/UIOverlay';

export default function App() {
  const [selectedTarget, setSelectedTarget] = useState(null);
  const [targetPlanetPos, setTargetPlanetPos] = useState(null);

  // Prevent double-click zoom across window
  useEffect(() => {
    const handleDblClick = (e) => {
      e.preventDefault();
    };
    window.addEventListener('dblclick', handleDblClick, { passive: false });
    return () => window.removeEventListener('dblclick', handleDblClick);
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
          camera={{ position: [0, 6, 14], fov: 45 }}
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

            {/* Manual Drag & Spin Wrapper for the Solar System */}
            <PresentationControls
              global={true} // Allow dragging anywhere on the screen (even empty space)
              cursor={true}
              snap={false} // Keep rotation when let go
              speed={1.5}
              zoom={1}
              polar={[-Math.PI / 4, Math.PI / 4]} // Vertical tilt limits
              azimuth={[-Infinity, Infinity]} // Endless horizontal spinning
            >
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
                    onUpdatePosition={(pos) => setTargetPlanetPos(pos)}
                  />
                );
              })}
            </PresentationControls>

            {/* Camera Zoom & Motion Controller */}
            <CameraController selectedTarget={selectedTarget} targetPosition={targetPlanetPos} />
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
