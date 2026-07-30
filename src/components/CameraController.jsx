import React, { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

export function CameraController({ selectedTarget, targetPosition }) {
  const { camera, pointer } = useThree();
  const currentLookAt = useRef(new THREE.Vector3(0, 0, 0));

  useFrame((state, delta) => {
    const targetCamPos = new THREE.Vector3();
    const targetLookAt = new THREE.Vector3(0, 0, 0);
    const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;

    if (!selectedTarget) {
      // DEFAULT OVERVIEW: Macro angled perspective with subtle mouse parallax
      targetCamPos.set(
        pointer.x * 2.5,
        6 + pointer.y * 2.0,
        14
      );
      targetLookAt.set(0, 0, 0);
    } else if (selectedTarget === 'core') {
      // CORE FOCUS: Zoom into central sphere
      targetCamPos.set(0, 0, isMobile ? 7.0 : 4.8);
      targetLookAt.set(0, 0, 0);
    } else if (targetPosition) {
      // PLANET FOCUS: Fly camera directly to front of selected planet
      const distOffset = isMobile ? 5.2 : 3.2;
      const normal = targetPosition.clone().normalize();
      targetCamPos.copy(targetPosition).add(normal.multiplyScalar(distOffset)).add(new THREE.Vector3(0, 0.5, 0));
      targetLookAt.copy(targetPosition);
    } else {
      // Fallback while planet position updates
      targetCamPos.set(0, 3, 8);
      targetLookAt.set(0, 0, 0);
    }

    // Add a slight arc when flying far distances (prevents clipping through the sun!)
    if (camera.position.distanceTo(targetCamPos) > 5) {
      targetCamPos.y += 2.0; 
    }

    // Smooth lerp camera position & lookAt target (slower for majestic feel)
    camera.position.lerp(targetCamPos, delta * 1.8);
    currentLookAt.current.lerp(targetLookAt, delta * 1.8);
    camera.lookAt(currentLookAt.current);
  });

  return null;
}
