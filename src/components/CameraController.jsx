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
      // PLANET FOCUS: Horizontal sightline through planet into Nebulae, with planet framed high in upper sky above dock
      const distOffset = (isMobile ? 5.2 : 3.8) * zoomFactor;
      const targetPos = targetPlanetPosRef.current;
      const targetQuat = targetPlanetQuatRef?.current || new THREE.Quaternion();

      // Center of background Nebulae in scene space
      const nebulaCenter = new THREE.Vector3(0, 0, -55).applyQuaternion(targetQuat);

      // Strictly horizontal sightline in X-Z plane (Y=0 eliminates vertical camera drift/tipping)
      const viewDir = new THREE.Vector3(
        targetPos.x - nebulaCenter.x,
        0,
        targetPos.z - nebulaCenter.z
      ).normalize();

      const camOffsetY = (isMobile ? 0.6 : 0.88) * zoomFactor;

      // Position camera along horizontal sightline with clean elevation
      targetCamPos.current.set(
        targetPos.x + viewDir.x * distOffset,
        targetPos.y + camOffsetY,
        targetPos.z + viewDir.z * distOffset
      );

      // Balanced vertical look-at offset (-0.78): keeps planet centered in open viewport with ample clearance from both top header and bottom dock
      targetLookAt.current.set(
        targetPos.x,
        targetPos.y - (isMobile ? 1.3 : 0.78),
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
