import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { SYSTEM_CONFIG } from '../../config';

export function SaturnPlanet({ color, size }) {
  const meshRef = useRef();
  const outerRingRef = useRef();
  const outerRing2Ref = useRef();

  useFrame((state, delta) => {
    const t = state.clock.getElapsedTime();
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.4;
      meshRef.current.rotation.x += delta * 0.15;
    }
    if (outerRingRef.current) {
      outerRingRef.current.rotation.z += delta * 0.6;
      outerRingRef.current.rotation.x = Math.sin(t * 0.5) * 0.4 + Math.PI / 3;
    }
    if (outerRing2Ref.current) {
      outerRing2Ref.current.rotation.z -= delta * 0.8;
      outerRing2Ref.current.rotation.y = Math.cos(t * 0.4) * 0.5;
    }
  });

  return (
    <group>
      <mesh ref={meshRef}>
        <sphereGeometry args={[size, 32, 32]} />
        <meshStandardMaterial
          color="#003268"
          roughness={0.2}
          metalness={0.8}
          emissive={SYSTEM_CONFIG.colors.primaryCyan}
          emissiveIntensity={0.6}
        />
      </mesh>
      <mesh ref={outerRingRef} rotation={[Math.PI / 3, 0, 0]}>
        <ringGeometry args={[size * 1.3, size * 1.7, 64]} />
        <meshStandardMaterial
          color={SYSTEM_CONFIG.colors.primaryCyan}
          side={THREE.DoubleSide}
          transparent
          opacity={0.8}
          roughness={0.1}
          emissive={SYSTEM_CONFIG.colors.primaryCyan}
          emissiveIntensity={0.4}
        />
      </mesh>
      <mesh ref={outerRing2Ref} rotation={[-Math.PI / 4, 0, 0]}>
        <torusGeometry args={[size * 1.5, size * 0.03, 16, 64]} />
        <meshStandardMaterial
          color="#FCFCFC"
          emissive="#00BAE3"
          emissiveIntensity={0.9}
          roughness={0.1}
        />
      </mesh>
    </group>
  );
}
