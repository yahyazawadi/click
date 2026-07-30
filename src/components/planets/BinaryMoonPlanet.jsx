import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';

export function BinaryMoonPlanet({ color, size }) {
  const meshRef = useRef();
  const innerRef = useRef();
  const outerRingRef = useRef();

  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.4;
      meshRef.current.rotation.x += delta * 0.15;
    }
    if (innerRef.current) {
      innerRef.current.rotation.y -= delta * 0.7;
    }
    if (outerRingRef.current) {
      outerRingRef.current.rotation.z += delta * 0.6;
    }
  });

  return (
    <group>
      <mesh ref={meshRef}>
        <dodecahedronGeometry args={[size * 0.7, 1]} />
        <meshStandardMaterial
          color="#00BAE3"
          roughness={0.2}
          metalness={0.8}
          flatShading
          emissive="#003268"
          emissiveIntensity={0.5}
        />
      </mesh>
      <mesh ref={innerRef} position={[size * 1.35, size * 0.35, 0]}>
        <icosahedronGeometry args={[size * 0.35, 0]} />
        <meshStandardMaterial
          color="#FCFCFC"
          emissive="#00BAE3"
          emissiveIntensity={0.9}
          flatShading
        />
      </mesh>
      <mesh ref={outerRingRef} position={[-size * 1.25, -size * 0.3, 0]}>
        <sphereGeometry args={[size * 0.22, 16, 16]} />
        <meshStandardMaterial
          color="#5DBAE1"
          emissive="#5DBAE1"
          emissiveIntensity={0.8}
        />
      </mesh>
    </group>
  );
}
