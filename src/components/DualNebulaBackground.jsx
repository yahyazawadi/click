import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import '../shaders/NebulaShaderMaterial';

export function DualNebulaBackground({ isMobile, perfTierFloat = 0.0, nebulaPath1 = 2, nebulaPath2 = 5 }) {
  const matRefLayer1 = useRef();
  const matRefLayer2 = useRef();

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    if (matRefLayer1.current) {
      matRefLayer1.current.uTime = time * 0.35;
      matRefLayer1.current.uNebulaPath = nebulaPath1;
    }
    if (matRefLayer2.current) {
      matRefLayer2.current.uTime = time * 0.55;
      matRefLayer2.current.uNebulaPath = nebulaPath2;
    }
  });

  // Memoize colors ONCE to prevent allocation on React re-renders
  const nebula1Colors = useMemo(() => ({
    sii:  new THREE.Color('#9900cc'),
    ha:   new THREE.Color('#c40045'),
    oiii: new THREE.Color('#5500bb'),
    core: new THREE.Color('#c0f0ff'),
  }), []);

  const nebula2Colors = useMemo(() => ({
    sii:  new THREE.Color('#00f0ff'),
    ha:   new THREE.Color('#0d1b40'),
    oiii: new THREE.Color('#410099'),
    core: new THREE.Color('#a6f6ff'),
  }), []);

  return (
    <group position={[0, 0, -50]}>
      {/* NEBULA 1 (LEFT): Deep Violet / Crimson Gas Cloud */}
      <mesh position={[-35, 20, -40]} rotation={[0.15, 0.3, -0.1]}>
        <planeGeometry args={[220, 160]} />
        <nebulaMaterial
          ref={matRefLayer1}
          uPerfTier={perfTierFloat}
          uColorSII={nebula1Colors.sii}
          uColorHa={nebula1Colors.ha}
          uColorOIII={nebula1Colors.oiii}
          uColorCore={nebula1Colors.core}
          uScale={3.2}
          uWarp={2.6}
          uMaskRadius={0.38}
          uEdgeWarp={0.3}
          uAlpha={0.92}
          uBrightness={2.4}
          uDustStrength={0.55}
          uPillarStrength={0.65}
          uCoreRadius={0.16}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* NEBULA 2 (RIGHT): Hidden on LOW tier to save draw call + fragment cost */}
      <mesh visible={perfTierFloat < 1.0} position={[45, -15, -30]} rotation={[-0.1, -0.4, 0.15]}>
        <planeGeometry args={[190, 140]} />
        <nebulaMaterial
          ref={matRefLayer2}
          uPerfTier={perfTierFloat}
          uColorSII={nebula2Colors.sii}
          uColorHa={nebula2Colors.ha}
          uColorOIII={nebula2Colors.oiii}
          uColorCore={nebula2Colors.core}
          uScale={4.5}
          uWarp={3.8}
          uMaskRadius={0.35}
          uEdgeWarp={0.4}
          uAlpha={0.88}
          uBrightness={2.8}
          uDustStrength={0.35}
          uPillarStrength={0.5}
          uCoreRadius={0.20}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
}
