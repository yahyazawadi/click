import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Stars } from '@react-three/drei';
import { DualNebulaBackground } from './DualNebulaBackground';
import { SYSTEM_CONFIG } from '../config';

export function CosmicBackground() {
  const starsRef = useRef();

  // Very slow background rotation for deep space ambiance
  useFrame((state, delta) => {
    if (starsRef.current) {
      starsRef.current.rotation.y += delta * 0.01;
      starsRef.current.rotation.x += delta * 0.005;
    }
  });

  return (
    <>
      <DualNebulaBackground />
      <group ref={starsRef}>
        <Stars
          radius={100}
          depth={50}
          count={2500}
          factor={4}
          saturation={0}
          fade
          speed={1}
        />
      </group>
    </>
  );
}

