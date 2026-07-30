import React, { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

export function CameraController({ selectedTarget, targetPosition, zoomFactor = 1.0 }) {
  const { camera, pointer } = useThree();
  const currentLookAt = useRef(new THREE.Vector3(0, 0, 0));
  
  // Track the camera's angle so we can pull straight back when deselecting
  const macroAngle = useRef(Math.PI / 2); // Default front view (Z is positive)

  useFrame((state, delta) => {
    const targetCamPos = new THREE.Vector3();
    const targetLookAt = new THREE.Vector3(0, 0, 0);
    const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;

    if (selectedTarget || targetPosition) {
      // While tracking a planet, continuously save our current angle
      // so when we release, we pull straight back from this exact angle!
      macroAngle.current = Math.atan2(camera.position.z, camera.position.x);
    }

    if (!selectedTarget) {
      // DEFAULT OVERVIEW: Pull straight back to radius 14 * zoomFactor at the locked angle
      const radius = 14 * zoomFactor;
      // Disable mouse parallax on mobile so dragging perfectly spins the system without sliding the camera
      targetCamPos.set(
        Math.cos(macroAngle.current) * radius + (isMobile ? 0 : pointer.x * 2.5),
        6 * zoomFactor + (isMobile ? 0 : pointer.y * 2.0),
        Math.sin(macroAngle.current) * radius
      );
      targetLookAt.set(0, 0, 0);
    } else if (selectedTarget === 'core') {
      // CORE FOCUS: Zoom into central sphere
      targetCamPos.set(0, isMobile ? -1.5 : 0, isMobile ? 7.0 : 4.8);
      targetLookAt.set(0, isMobile ? -1.5 : 0, 0);
    } else if (targetPosition) {
      // PLANET FOCUS: Fly camera directly to front of selected planet
      const distOffset = isMobile ? 5.2 : 3.2;
      const normal = targetPosition.clone().normalize();
      targetCamPos.copy(targetPosition).add(normal.multiplyScalar(distOffset)).add(new THREE.Vector3(0, 0.5, 0));
      targetLookAt.copy(targetPosition);

      // On mobile, the UI drawer covers the bottom 35% of the screen.
      // We shift the camera and focal point down so the planet appears higher up!
      if (isMobile) {
        targetCamPos.y -= 1.5;
        targetLookAt.y -= 1.5;
      }
    } else {
      // Fallback
      targetCamPos.set(0, 3, 8);
      targetLookAt.set(0, 0, 0);
    }

    // Smooth lerp camera position & lookAt target
    camera.position.lerp(targetCamPos, delta * 1.8);
    currentLookAt.current.lerp(targetLookAt, delta * 1.8);
    camera.lookAt(currentLookAt.current);
  });

  return null;
}
