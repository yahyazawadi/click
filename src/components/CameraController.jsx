import React, { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

export function CameraController({ selectedTarget, targetPlanetPosRef, zoomFactor = 1.0, isMobile = false }) {
  const { camera, pointer } = useThree();
  const currentLookAt = useRef(new THREE.Vector3(0, 0, 0));
  
  // Track the camera's angle so we can pull straight back when deselecting
  const macroAngle = useRef(Math.PI / 2); // Default front view (Z is positive)

  // Track initial deep-space reload fly-in animation
  const isIntroAnimating = useRef(true);
  const introStartTime = useRef(Date.now());

  // Pre-allocate tracking vectors
  const targetCamPos = useRef(new THREE.Vector3());
  const targetLookAt = useRef(new THREE.Vector3());
  const normal = useRef(new THREE.Vector3());
  const tangent = useRef(new THREE.Vector3());
  const upOffset = useRef(new THREE.Vector3(0, 0.5, 0));

  // Initialize camera far in deep space on frame 1
  useEffect(() => {
    camera.position.set(0, 120, 300);
    camera.lookAt(0, 0, 0);
  }, [camera]);

  useFrame((state, delta) => {
    // Check intro fly-in timer (3.2s duration)
    const elapsed = (Date.now() - introStartTime.current) / 1000;
    if (elapsed > 3.2) {
      isIntroAnimating.current = false;
    }

    if (selectedTarget || (selectedTarget && targetPlanetPosRef)) {
      // While tracking a planet, continuously save our current angle
      // so when we release, we pull straight back from this exact angle!
      macroAngle.current = Math.atan2(camera.position.z, camera.position.x);
    }

    if (!selectedTarget) {
      // DEFAULT OVERVIEW: Pull straight back to radius 18 * zoomFactor at the locked angle
      // (Expanded distance so planets and orbits appear with broad breathing room)
      const radius = (isMobile ? 16 : 18) * zoomFactor;

      targetCamPos.current.set(
        Math.cos(macroAngle.current) * radius + (isMobile ? 0 : pointer.x * 2.5),
        7 * zoomFactor + (isMobile ? 0 : pointer.y * 2.0),
        Math.sin(macroAngle.current) * radius
      );
      targetLookAt.current.set(0, 0, 0);
    } else if (selectedTarget === 'core') {
      // CORE FOCUS: Offset camera to right so core sphere is beautifully framed in the open left area beside the drawer
      const coreZ = (isMobile ? 10.0 : 6.8) * zoomFactor;
      const coreX = isMobile ? 0 : 2.5;
      const coreY = isMobile ? -1.5 : 0;
      targetCamPos.current.set(coreX, coreY, coreZ);
      targetLookAt.current.set(0, 0, 0);
    } else if (selectedTarget && targetPlanetPosRef && targetPlanetPosRef.current) {
      // PLANET FOCUS: Fly camera to front-side of selected planet (angled to clear central sun core from view)
      const distOffset = (isMobile ? 5.2 : 3.2) * zoomFactor;
      normal.current.copy(targetPlanetPosRef.current).normalize();
      tangent.current.set(-normal.current.z, 0, normal.current.x).normalize();

      targetCamPos.current
        .copy(targetPlanetPosRef.current)
        .addScaledVector(normal.current, distOffset * 0.75)
        .addScaledVector(tangent.current, distOffset * 0.65)
        .add(upOffset.current);
      targetLookAt.current.copy(targetPlanetPosRef.current);

      if (isMobile) {
        targetCamPos.current.y -= 1.5;
        targetLookAt.current.y -= 1.5;
      }
    } else {
      // Fallback
      targetCamPos.current.set(0, 4, 12);
      targetLookAt.current.set(0, 0, 0);
    }

    // Smooth lerp camera position & lookAt target (slight initial ease-in during reload intro)
    const lerpFactor = isIntroAnimating.current ? delta * 1.5 : delta * 2.2;
    camera.position.lerp(targetCamPos.current, lerpFactor);
    currentLookAt.current.lerp(targetLookAt.current, lerpFactor);
    camera.lookAt(currentLookAt.current);
  });

  return null;
}
