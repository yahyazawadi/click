import React, { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

export function CameraController({ selectedTarget, targetPlanetPosRef, targetPlanetQuatRef, zoomFactor = 1.0, isMobile = false }) {
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
      // DEFAULT OVERVIEW:
      // Mobile: pull back to radius 24 so the narrow portrait viewport can comfortably frame the orbits
      // Desktop: remains untouched at radius 18
      const radius = (isMobile ? 24 : 18) * zoomFactor;
      const camHeight = (isMobile ? 9.5 : 7) * zoomFactor;

      targetCamPos.current.set(
        Math.cos(macroAngle.current) * radius + (isMobile ? 0 : pointer.x * 2.5),
        camHeight + (isMobile ? 0 : pointer.y * 2.0),
        Math.sin(macroAngle.current) * radius
      );
      targetLookAt.current.set(0, isMobile ? 0.6 : 0, 0);
    } else if (selectedTarget === 'core') {
      // CORE FOCUS: Offset camera so core sphere is framed nicely beside UI
      const coreZ = (isMobile ? 8.5 : 6.8) * zoomFactor;
      const coreX = isMobile ? 0 : 2.5;
      const coreY = isMobile ? -0.8 : 0;
      targetCamPos.current.set(coreX, coreY, coreZ);
      targetLookAt.current.set(0, isMobile ? -0.2 : 0, 0);
    } else if (selectedTarget && targetPlanetPosRef && targetPlanetPosRef.current) {
      // PLANET FOCUS:
      // Mobile: distance 6.2 (prevents feeling claustrophobic/too close)
      // Desktop: remains untouched at 3.8
      const distOffset = (isMobile ? 6.2 : 3.8) * zoomFactor;
      const targetPos = targetPlanetPosRef.current;
      const targetQuat = targetPlanetQuatRef?.current || new THREE.Quaternion();

      // Center of background Nebulae in scene space
      const nebulaCenter = new THREE.Vector3(0, 0, -55).applyQuaternion(targetQuat);

      // Sightline:
      // On mobile: strictly radial outward from center (0,0,0) through planet.
      // Guarantees camera is always outside the orbit looking in — sun core never blocks the view!
      // On desktop: original sightline toward the background nebulae.
      const outwardDir = new THREE.Vector3(targetPos.x, 0, targetPos.z).normalize();
      if (outwardDir.lengthSq() < 0.001) outwardDir.set(0, 0, 1);

      const viewDir = isMobile ? outwardDir : new THREE.Vector3(
        targetPos.x - nebulaCenter.x,
        0,
        targetPos.z - nebulaCenter.z
      ).normalize();

      const camOffsetY = (isMobile ? 0.75 : 0.88) * zoomFactor;

      // Position camera along horizontal sightline with clean elevation
      targetCamPos.current.set(
        targetPos.x + viewDir.x * distOffset,
        targetPos.y + camOffsetY,
        targetPos.z + viewDir.z * distOffset
      );

      // Vertical look-at offset:
      // On mobile: -0.42 centers the planet in the open golden zone between top header/slider and bottom dock
      // Desktop: remains untouched at -0.78
      targetLookAt.current.set(
        targetPos.x,
        targetPos.y - (isMobile ? 0.42 : 0.78),
        targetPos.z
      );
    } else {
      // Fallback
      targetCamPos.current.set(0, 4, 12);
      targetLookAt.current.set(0, 0, 0);
    }

    // Smooth lerp camera position & lookAt target (slight initial ease-in during reload intro)
    const safeDelta = Math.min(delta, 0.1);
    const lerpFactor = isIntroAnimating.current ? safeDelta * 1.5 : safeDelta * 2.2;
    camera.position.lerp(targetCamPos.current, lerpFactor);
    currentLookAt.current.lerp(targetLookAt.current, lerpFactor);
    camera.lookAt(currentLookAt.current);
  });

  return null;
}
