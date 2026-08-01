import React, { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

export function CameraController({ selectedTarget, targetPlanetPosRef, zoomFactor = 1.0 }) {
  const { camera, pointer } = useThree();
  const currentLookAt = useRef(new THREE.Vector3(0, 0, 0));
  
  // Track the camera's angle so we can pull straight back when deselecting
  const macroAngle = useRef(Math.PI / 2); // Default front view (Z is positive)

  // Pre-allocate tracking vectors
  const targetCamPos = useRef(new THREE.Vector3());
  const targetLookAt = useRef(new THREE.Vector3());
  const normal = useRef(new THREE.Vector3());
  const upOffset = useRef(new THREE.Vector3(0, 0.5, 0));

  useFrame((state, delta) => {
    const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;

    if (selectedTarget || (selectedTarget && targetPlanetPosRef)) {
      // While tracking a planet, continuously save our current angle
      // so when we release, we pull straight back from this exact angle!
      macroAngle.current = Math.atan2(camera.position.z, camera.position.x);
    }

    if (!selectedTarget) {
      // DEFAULT OVERVIEW: Pull straight back to radius 14 * zoomFactor at the locked angle
      const radius = 14 * zoomFactor;
      // Disable mouse parallax on mobile so dragging perfectly spins the system without sliding the camera
      targetCamPos.current.set(
        Math.cos(macroAngle.current) * radius + (isMobile ? 0 : pointer.x * 2.5),
        6 * zoomFactor + (isMobile ? 0 : pointer.y * 2.0),
        Math.sin(macroAngle.current) * radius
      );
      targetLookAt.current.set(0, 0, 0);
    } else if (selectedTarget === 'core') {
      // CORE FOCUS: Zoom into central sphere
      const coreZ = (isMobile ? 7.0 : 4.8) * zoomFactor;
      targetCamPos.current.set(0, isMobile ? -1.5 : 0, coreZ);
      targetLookAt.current.set(0, isMobile ? -1.5 : 0, 0);
    } else if (selectedTarget && targetPlanetPosRef && targetPlanetPosRef.current) {
      // PLANET FOCUS: Fly camera directly to front of selected planet
      const distOffset = (isMobile ? 5.2 : 3.2) * zoomFactor;
      normal.current.copy(targetPlanetPosRef.current).normalize();
      targetCamPos.current
        .copy(targetPlanetPosRef.current)
        .add(normal.current.multiplyScalar(distOffset))
        .add(upOffset.current);
      targetLookAt.current.copy(targetPlanetPosRef.current);

      // On mobile, the UI drawer covers the bottom 35% of the screen.
      // We shift the camera and focal point down so the planet appears higher up!
      if (isMobile) {
        targetCamPos.current.y -= 1.5;
        targetLookAt.current.y -= 1.5;
      }
    } else {
      // Fallback
      targetCamPos.current.set(0, 3, 8);
      targetLookAt.current.set(0, 0, 0);
    }

    // Smooth lerp camera position & lookAt target
    camera.position.lerp(targetCamPos.current, delta * 1.8);
    currentLookAt.current.lerp(targetLookAt.current, delta * 1.8);
    camera.lookAt(currentLookAt.current);
  });

  return null;
}
