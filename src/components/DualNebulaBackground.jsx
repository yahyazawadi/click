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
      const n1 = NEBULA_CONFIG.nebula1;
      matRefLayer1.current.uTime = time * 0.35;
      matRefLayer1.current.uNebulaPath = nebulaPath1;
      matRefLayer1.current.uScale = n1.scale;
      matRefLayer1.current.uWarp = n1.warp;
      matRefLayer1.current.uBrightness = n1.brightness;
      matRefLayer1.current.uDustStrength = n1.dustStrength;
      matRefLayer1.current.uPillarStrength = n1.pillarStrength;
      matRefLayer1.current.uMaskRadius = n1.maskRadius;
      matRefLayer1.current.uEdgeWarp = n1.edgeWarp;
      matRefLayer1.current.uCoreRadius = n1.coreRadius;
      matRefLayer1.current.uAlpha = n1.alpha;
      matRefLayer1.current.uGradientSoftness = n1.gradientSoftness !== undefined ? n1.gradientSoftness : 1.0;
      if (matRefLayer1.current.uniforms?.uGradientSoftness) {
        matRefLayer1.current.uniforms.uGradientSoftness.value = n1.gradientSoftness !== undefined ? n1.gradientSoftness : 1.0;
      }
      if (matRefLayer1.current.uSeedOffset) {
        matRefLayer1.current.uSeedOffset.set(n1.seedX || 0.0, n1.seedY || 0.0);
      }
      if (matRefLayer1.current.uniforms?.uSeedOffset) {
        matRefLayer1.current.uniforms.uSeedOffset.value.set(n1.seedX || 0.0, n1.seedY || 0.0);
      }
      matRefLayer1.current.uMultiCoreStrength = n1.multiCoreStrength !== undefined ? n1.multiCoreStrength : 0.0;
      matRefLayer1.current.uMultiCoreScale = n1.multiCoreScale !== undefined ? n1.multiCoreScale : 1.8;
      matRefLayer1.current.uVoidPinch = n1.voidPinch !== undefined ? n1.voidPinch : 0.0;
      matRefLayer1.current.uColorSII.set(n1.colors.sii);
      matRefLayer1.current.uColorHa.set(n1.colors.ha);
      matRefLayer1.current.uColorOIII.set(n1.colors.oiii);
      matRefLayer1.current.uColorCore.set(n1.colors.core);
    }
    if (matRefLayer2.current) {
      const n2 = NEBULA_CONFIG.nebula2;
      matRefLayer2.current.uTime = time * 0.55;
      matRefLayer2.current.uNebulaPath = nebulaPath2;
      matRefLayer2.current.uScale = n2.scale;
      matRefLayer2.current.uWarp = n2.warp;
      matRefLayer2.current.uBrightness = n2.brightness;
      matRefLayer2.current.uDustStrength = n2.dustStrength;
      matRefLayer2.current.uPillarStrength = n2.pillarStrength;
      matRefLayer2.current.uMaskRadius = n2.maskRadius;
      matRefLayer2.current.uEdgeWarp = n2.edgeWarp;
      matRefLayer2.current.uCoreRadius = n2.coreRadius;
      matRefLayer2.current.uAlpha = n2.alpha;
      matRefLayer2.current.uGradientSoftness = n2.gradientSoftness !== undefined ? n2.gradientSoftness : 1.0;
      if (matRefLayer2.current.uniforms?.uGradientSoftness) {
        matRefLayer2.current.uniforms.uGradientSoftness.value = n2.gradientSoftness !== undefined ? n2.gradientSoftness : 1.0;
      }
      if (matRefLayer2.current.uSeedOffset) {
        matRefLayer2.current.uSeedOffset.set(n2.seedX || 0.0, n2.seedY || 0.0);
      }
      if (matRefLayer2.current.uniforms?.uSeedOffset) {
        matRefLayer2.current.uniforms.uSeedOffset.value.set(n2.seedX || 0.0, n2.seedY || 0.0);
      }
      matRefLayer2.current.uMultiCoreStrength = n2.multiCoreStrength !== undefined ? n2.multiCoreStrength : 0.0;
      matRefLayer2.current.uMultiCoreScale = n2.multiCoreScale !== undefined ? n2.multiCoreScale : 1.8;
      matRefLayer2.current.uVoidPinch = n2.voidPinch !== undefined ? n2.voidPinch : 0.0;
      matRefLayer2.current.uColorSII.set(n2.colors.sii);
      matRefLayer2.current.uColorHa.set(n2.colors.ha);
      matRefLayer2.current.uColorOIII.set(n2.colors.oiii);
      matRefLayer2.current.uColorCore.set(n2.colors.core);
    }
  });

  // Memoize colors ONCE — sourced from config.js for easy experimentation!
  const nebula1Colors = useMemo(() => ({
    sii:  new THREE.Color(NEBULA_CONFIG.nebula1.colors.sii),
    ha:   new THREE.Color(NEBULA_CONFIG.nebula1.colors.ha),
    oiii: new THREE.Color(NEBULA_CONFIG.nebula1.colors.oiii),
    core: new THREE.Color(NEBULA_CONFIG.nebula1.colors.core),
  }), []);

  const nebula2Colors = useMemo(() => ({
    sii:  new THREE.Color(NEBULA_CONFIG.nebula2.colors.sii),
    ha:   new THREE.Color(NEBULA_CONFIG.nebula2.colors.ha),
    oiii: new THREE.Color(NEBULA_CONFIG.nebula2.colors.oiii),
    core: new THREE.Color(NEBULA_CONFIG.nebula2.colors.core),
  }), []);

  const n1 = NEBULA_CONFIG.nebula1;
  const n2 = NEBULA_CONFIG.nebula2;

  return (
    <group position={[0, 0, -50]}>
      {/* NEBULA 1 (LEFT): Deep Violet / Crimson Gas Cloud */}
      <mesh position={[-60, 20, -30]} rotation={[0.15, 0.3, -0.1]}>
        <planeGeometry args={[520, 340]} />
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
          uGradientSoftness={n1.gradientSoftness ?? 1.0}
          uMultiCoreStrength={n1.multiCoreStrength || 0.0}
          uMultiCoreScale={n1.multiCoreScale || 1.8}
          uVoidPinch={n1.voidPinch || 0.0}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* NEBULA 2 (RIGHT): Teal / Blue Gas Cloud (Hidden on LOW tier to save draw calls) */}
      <mesh visible={perfTierFloat < 1.0} position={[60, -15, -25]} rotation={[-0.1, -0.4, 0.15]}>
        <planeGeometry args={[460, 300]} />
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
          uGradientSoftness={n2.gradientSoftness ?? 1.0}
          uMultiCoreStrength={n2.multiCoreStrength || 0.0}
          uMultiCoreScale={n2.multiCoreScale || 1.8}
          uVoidPinch={n2.voidPinch || 0.0}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
}
