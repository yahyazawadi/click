import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';

export function CrystalPlanet({ color, size }) {
  const meshRef = useRef();
  const innerRef = useRef();

  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.4;
      meshRef.current.rotation.x += delta * 0.15;
    }
    if (innerRef.current) {
      innerRef.current.rotation.y -= delta * 0.7;
      innerRef.current.rotation.z += delta * 0.5;
    }
  });

  return (
    <group>
      <mesh ref={meshRef}>
        <octahedronGeometry args={[size * 1.1, 0]} />
        <meshStandardMaterial
          color="#5DBAE1"
          roughness={0.1}
          metalness={0.9}
          flatShading
          emissive="#003268"
          emissiveIntensity={0.5}
        />
      </mesh>
      <mesh ref={innerRef}>
        <icosahedronGeometry args={[size * 0.55, 0]} />
        <meshStandardMaterial
          color="#FCFCFC"
          wireframe
          emissive="#00BAE3"
          emissiveIntensity={1.0}
        />
      </mesh>
    </group>
  );
}
