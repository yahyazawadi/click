import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { SYSTEM_CONFIG } from '../config';

export function SystemCore({ onSelect }) {
  const innerCoreRef = useRef();
  const outerLatticeRef = useRef();
  const ringRef1 = useRef();
  const ringRef2 = useRef();
  const [hovered, setHovered] = useState(false);

  useFrame((state, delta) => {
    if (innerCoreRef.current) {
      innerCoreRef.current.rotation.y += delta * 0.2;
    }
    if (outerLatticeRef.current) {
      outerLatticeRef.current.rotation.y -= delta * 0.15;
      outerLatticeRef.current.rotation.x += delta * 0.05;
    }
    if (ringRef1.current) {
      ringRef1.current.rotation.z += delta * 0.4;
    }
    if (ringRef2.current) {
      ringRef2.current.rotation.x += delta * 0.3;
      ringRef2.current.rotation.y += delta * 0.2;
    }
  });

  const coreRadius = SYSTEM_CONFIG.core.radius || 1.8;

  return (
    <group
      onClick={(e) => {
        e.stopPropagation();
        onSelect('core');
      }}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
      style={{ cursor: 'pointer' }}
    >
      {/* 1. Inner Solid Core (Deep Shadow Blue) */}
      <mesh ref={innerCoreRef}>
        <icosahedronGeometry args={[coreRadius, 2]} />
        <meshStandardMaterial
          color={SYSTEM_CONFIG.colors.deepShadow}
          roughness={0.2}
          metalness={0.8}
          emissive={SYSTEM_CONFIG.colors.primaryCyan}
          emissiveIntensity={0.5}
          flatShading
        />
      </mesh>

      {/* 2. Outer Rotating Geodesic Wireframe Shield */}
      <mesh ref={outerLatticeRef}>
        <icosahedronGeometry args={[coreRadius * 1.25, 1]} />
        <meshStandardMaterial
          color={SYSTEM_CONFIG.colors.primaryCyan}
          wireframe
          transparent
          opacity={0.6}
        />
      </mesh>

      {/* 3. Concentric Core Orbit Ring 1 */}
      <mesh ref={ringRef1} rotation={[Math.PI / 4, 0, 0]}>
        <torusGeometry args={[coreRadius * 1.5, 0.03, 16, 64]} />
        <meshStandardMaterial
          color={SYSTEM_CONFIG.colors.primaryCyan}
          emissive={SYSTEM_CONFIG.colors.primaryCyan}
          emissiveIntensity={0.6}
        />
      </mesh>

      {/* 4. Concentric Core Orbit Ring 2 */}
      <mesh ref={ringRef2} rotation={[-Math.PI / 3, Math.PI / 6, 0]}>
        <torusGeometry args={[coreRadius * 1.7, 0.02, 16, 64]} />
        <meshStandardMaterial
          color={SYSTEM_CONFIG.colors.secondaryBlue}
          transparent
          opacity={0.5}
        />
      </mesh>
    </group>
  );
}
