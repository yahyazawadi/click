import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import '../shaders/NebulaShaderMaterial';
import { NEBULA_CONFIG } from '../config';

export function DualNebulaBackground({ 
  isMobile, 
  perfTierFloat = 0.0, 
  nebulaPath1 = NEBULA_CONFIG.nebula1.path, 
  nebulaPath2 = NEBULA_CONFIG.nebula2.path 
}) {
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
    sii:  new THREE.Color('#ff0a2b'), // Vibrant bright crimson-scarlet
    ha:   new THREE.Color('#800000'), // Deep blood red mid-tone
    oiii: new THREE.Color('#140103'), // Pitch dark maroon-void shadow (high contrast base)
    core: new THREE.Color('#ff3856'), // Intense burning ruby core glow
  }), []);

  const nebula2Colors = useMemo(() => ({
    sii:  new THREE.Color('#00a8e6'), // Rich deep cyan-turquoise
    ha:   new THREE.Color('#081640'), // Deep cosmic navy-cobalt
    oiii: new THREE.Color('#3b008f'), // Deep royal violet gas depth
    core: new THREE.Color('#00b8e6'), // Rich deep electric cyan core (saturated & deep, zero pale white)
  }), []);

  const n1 = NEBULA_CONFIG.nebula1;
  const n2 = NEBULA_CONFIG.nebula2;

  return (
    <group position={[0, 0, -50]}>
      {/* NEBULA 1 (LEFT): Deep Violet / Crimson Gas Cloud */}
      <mesh position={[-22, 12, -45]} rotation={[0.15, 0.3, -0.1]}>
        <planeGeometry args={[480, 320]} />
        <nebulaMaterial
          ref={matRefLayer1}
          uPerfTier={perfTierFloat}
          uColorSII={nebula1Colors.sii}
          uColorHa={nebula1Colors.ha}
          uColorOIII={nebula1Colors.oiii}
          uColorCore={nebula1Colors.core}
          uScale={n1.scale}
          uWarp={n1.warp}
          uMaskRadius={n1.maskRadius}
          uEdgeWarp={n1.edgeWarp}
          uAlpha={n1.alpha}
          uBrightness={n1.brightness}
          uDustStrength={n1.dustStrength}
          uPillarStrength={n1.pillarStrength}
          uCoreRadius={n1.coreRadius}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* NEBULA 2 (RIGHT): Teal / Blue Gas Cloud (Hidden on LOW tier to save draw calls) */}
      <mesh visible={perfTierFloat < 1.0} position={[32, -10, -35]} rotation={[-0.1, -0.4, 0.15]}>
        <planeGeometry args={[420, 280]} />
        <nebulaMaterial
          ref={matRefLayer2}
          uPerfTier={perfTierFloat}
          uColorSII={nebula2Colors.sii}
          uColorHa={nebula2Colors.ha}
          uColorOIII={nebula2Colors.oiii}
          uColorCore={nebula2Colors.core}
          uScale={n2.scale}
          uWarp={n2.warp}
          uMaskRadius={n2.maskRadius}
          uEdgeWarp={n2.edgeWarp}
          uAlpha={n2.alpha}
          uBrightness={n2.brightness}
          uDustStrength={n2.dustStrength}
          uPillarStrength={n2.pillarStrength}
          uCoreRadius={n2.coreRadius}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
}
