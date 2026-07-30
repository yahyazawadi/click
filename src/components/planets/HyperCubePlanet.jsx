import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';

export function HyperCubePlanet({ color, size }) {
  const meshRef = useRef();
  const cageRef = useRef();

  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.4;
      meshRef.current.rotation.x += delta * 0.15;
    }
    if (cageRef.current) {
      cageRef.current.rotation.y -= delta * 0.3;
      cageRef.current.rotation.z += delta * 0.2;
    }
  });

  return (
    <group>
      <mesh ref={meshRef}>
        <boxGeometry args={[size * 0.95, size * 0.95, size * 0.95]} />
        <meshStandardMaterial
          color="#003268"
          roughness={0.2}
          metalness={0.8}
          emissive="#00BAE3"
          emissiveIntensity={0.7}
        />
      </mesh>
      <mesh ref={cageRef}>
        <boxGeometry args={[size * 1.45, size * 1.45, size * 1.45]} />
        <meshStandardMaterial
          color="#FCFCFC"
          emissive="#00BAE3"
          emissiveIntensity={0.8}
          wireframe
          transparent
          opacity={0.85}
        />
      </mesh>
    </group>
  );
}
