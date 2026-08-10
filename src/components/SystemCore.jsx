import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { SYSTEM_CONFIG } from '../config';
import '../shaders/PlanetCoreMaterial';

export function SystemCore({ onSelect }) {
  const innerCoreRef = useRef();
  const shaderMatRef = useRef();
  const outerLatticeRef = useRef();
  const ringRef1 = useRef();
  const ringRef2 = useRef();
  const [hovered, setHovered] = useState(false);

  useFrame((state, delta) => {
    const time = state.clock.getElapsedTime();

    if (shaderMatRef.current) {
      shaderMatRef.current.uTime = time;
    }

    if (innerCoreRef.current) {
      innerCoreRef.current.rotation.y += delta * 0.15;
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
      {/* 1. Procedural Sci-Fi Core Planet with Dynamic Tectonic Textures & Atmospheric Glow */}
      <mesh ref={innerCoreRef}>
        <icosahedronGeometry args={[coreRadius, 32]} />
        <planetCoreMaterial
          ref={shaderMatRef}
          uBaseColor={new THREE.Color('#030d22')}       // Deep cosmic space void blue
          uSecondaryColor={new THREE.Color('#003268')}  // Deep planetary trench blue
          uAccentColor={new THREE.Color('#00e5ff')}     // Bioluminescent cyan energy veins
          uGlowColor={new THREE.Color('#5500aa')}       // Deep cosmic violet/magenta tectonic glow
          uAtmosphereColor={new THREE.Color('#00BAE3')} // Glowing atmospheric rim halo
        />
      </mesh>

      {/* 2. Outer Rotating Geodesic Wireframe Shield */}
      <mesh ref={outerLatticeRef}>
        <icosahedronGeometry args={[coreRadius * 1.25, 1]} />
        <meshStandardMaterial
          color={hovered ? '#00e5ff' : SYSTEM_CONFIG.colors.primaryCyan}
          wireframe
          transparent
          opacity={hovered ? 0.8 : 0.5}
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
