import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';

export function PlasmaTorusPlanet({ color, size }) {
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
        <torusGeometry args={[size * 0.7, size * 0.28, 30, 64]} />
        <meshStandardMaterial
          color="#00BAE3"
          roughness={0.15}
          metalness={0.85}
          emissive="#003268"
          emissiveIntensity={0.5}
        />
      </mesh>
      <mesh ref={innerRef}>
        <sphereGeometry args={[size * 0.35, 24, 24]} />
        <meshStandardMaterial
          color="#FCFCFC"
          emissive="#00BAE3"
          emissiveIntensity={1.0}
        />
      </mesh>
    </group>
  );
}
