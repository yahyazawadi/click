import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export function VortexShellPlanet({ color, size }) {
  const meshRef = useRef();
  const innerRef = useRef();

  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.4;
      meshRef.current.rotation.x += delta * 0.15;
    }
    if (innerRef.current) {
      innerRef.current.rotation.y -= delta * 0.7;
    }
  });

  return (
    <group>
      <mesh ref={meshRef}>
        <sphereGeometry args={[size * 0.85, 32, 16, 0, Math.PI * 1.5, 0, Math.PI * 0.85]} />
        <meshStandardMaterial
          color="#5DBAE1"
          side={THREE.DoubleSide}
          roughness={0.15}
          metalness={0.85}
          emissive="#003268"
          emissiveIntensity={0.4}
        />
      </mesh>
      <mesh ref={innerRef}>
        <sphereGeometry args={[size * 0.5, 24, 24]} />
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
