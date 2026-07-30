import React from 'react';
import * as THREE from 'three';

export function OrbitalPath({ radius, tiltX = 0, tiltY = 0, tiltZ = 0, color = '#00BAE3' }) {
  // Create a thin circular line curve for the orbit
  const points = [];
  const segments = 128;
  for (let i = 0; i <= segments; i++) {
    const theta = (i / segments) * Math.PI * 2;
    points.push(new THREE.Vector3(Math.cos(theta) * radius, 0, Math.sin(theta) * radius));
  }
  const geometry = new THREE.BufferGeometry().setFromPoints(points);

  return (
    <group rotation={[tiltX, tiltY, tiltZ]}>
      <line geometry={geometry}>
        <lineBasicMaterial
          color={color}
          transparent
          opacity={0.35}
          linewidth={1}
        />
      </line>
    </group>
  );
}
