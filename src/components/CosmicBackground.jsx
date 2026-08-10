import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Stars } from '@react-three/drei';
import { DualNebulaBackground } from './DualNebulaBackground';
import { SYSTEM_CONFIG } from '../config';

export function CosmicBackground({ isMobile, enabled = true, perfTierFloat = 0.0, nebulaPath = 0 }) {
  const starsRef = useRef();

  // Very slow background rotation for deep space ambiance (skipped on LOW tier)
  useFrame((state, delta) => {
    if (starsRef.current && perfTierFloat < 0.8) {
      starsRef.current.rotation.y += delta * 0.01;
    }
  });

  const starCount = perfTierFloat >= 0.8 ? 600 : perfTierFloat >= 0.3 ? 1200 : (isMobile ? 1000 : 2500);

  return (
    <>
      {enabled && <DualNebulaBackground isMobile={isMobile} perfTierFloat={perfTierFloat} nebulaPath={nebulaPath} />}
      <group ref={starsRef}>
        <Stars
          radius={100}
          depth={50}
          count={starCount}
          factor={4}
          saturation={0}
          fade
          speed={1}
        />
      </group>
    </>
  );
}

