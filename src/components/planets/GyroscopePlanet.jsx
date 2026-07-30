import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';

export function GyroscopePlanet({ color, size }) {
  const meshRef = useRef();
  const outerRingRef = useRef();
  const outerRing2Ref = useRef();

  useFrame((state, delta) => {
    const t = state.clock.getElapsedTime();
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.4;
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
        <sphereGeometry args={[size * 0.6, 24, 24]} />
        <meshStandardMaterial
          color="#003268"
          emissive="#00BAE3"
          emissiveIntensity={0.8}
          roughness={0.1}
        />
      </mesh>
      <mesh ref={outerRingRef}>
        <torusGeometry args={[size * 1.05, size * 0.04, 16, 48]} />
        <meshStandardMaterial
          color="#FCFCFC"
          emissive="#00BAE3"
          emissiveIntensity={0.6}
          metalness={0.9}
          roughness={0.1}
        />
      </mesh>
      <mesh ref={outerRing2Ref}>
        <torusGeometry args={[size * 1.4, size * 0.03, 16, 48]} />
        <meshStandardMaterial
          color="#5DBAE1"
          metalness={0.8}
          roughness={0.2}
          transparent
          opacity={0.85}
          emissive="#5DBAE1"
          emissiveIntensity={0.4}
        />
      </mesh>
    </group>
  );
}
