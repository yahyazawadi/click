import React, { useMemo, useEffect } from 'react';
import * as THREE from 'three';

export function OrbitalPath({ radius, tiltX = 0, tiltY = 0, tiltZ = 0, color = '#00BAE3', opacity = 0.35, enabled = true }) {
  // Create a thin circular line curve for the orbit (Memoized to prevent memory leaks)
  const geometry = useMemo(() => {
    const points = [];
    const segments = 128;
    for (let i = 0; i <= segments; i++) {
      const theta = (i / segments) * Math.PI * 2;
      points.push(new THREE.Vector3(Math.cos(theta) * radius, 0, Math.sin(theta) * radius));
    }
    return new THREE.BufferGeometry().setFromPoints(points);
  }, [radius]);

  // Clean up geometry from GPU memory on unmount or radius change
  useEffect(() => {
    return () => geometry.dispose();
  }, [geometry]);

  if (!enabled) return null;

  return (
    <group rotation={[tiltX, tiltY, tiltZ]}>
      <line geometry={geometry}>
        <lineBasicMaterial
          color={color}
          transparent
          opacity={opacity}
          linewidth={1}
        />
      </line>
    </group>
  );
}
