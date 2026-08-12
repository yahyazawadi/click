import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { EnhancedStarfield } from './EnhancedStarfield';
import { DualNebulaBackground } from './DualNebulaBackground';
import { SYSTEM_CONFIG } from '../config';

export function CosmicBackground({ isMobile, enabled = true, perfTierFloat = 0.0, nebulaPath1 = 1, nebulaPath2 = 3 }) {
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
      {enabled && <DualNebulaBackground isMobile={isMobile} perfTierFloat={perfTierFloat} nebulaPath1={nebulaPath1} nebulaPath2={nebulaPath2} />}
      <group ref={starsRef}>
        <EnhancedStarfield
          radius={100}
          depth={50}
          count={starCount}
          factor={4}
        />
      </group>
    </>
  );
}

