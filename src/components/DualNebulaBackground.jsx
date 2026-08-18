import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import '../shaders/NebulaShaderMaterial';
import { NEBULA_CONFIG } from '../config';

// ─────────────────────────────────────────────────────────────────────────────
//  HELPER: Clean Uniform Synchronizer Bridge
//  Synchronizes configuration to WebGL shader material safely with full fallback guards.
// ─────────────────────────────────────────────────────────────────────────────
function syncNebulaUniforms(mat, config, timeAcc, path, perfTierFloat) {
  if (!mat) return;
  mat.uTime = timeAcc;
  mat.uPerfTier = perfTierFloat;
  mat.uNebulaPath = path;
  mat.uScale = config.scale;
  mat.uWarp = config.warp;
  mat.uCoverage = config.coverage !== undefined ? config.coverage : 0.0;
  if (mat.uniforms?.uCoverage) {
    mat.uniforms.uCoverage.value = mat.uCoverage;
  }
  mat.uBrightness = config.brightness;
  mat.uDustStrength = config.dustStrength;
  mat.uPillarStrength = config.pillarStrength;
  mat.uMaskRadius = config.maskRadius;
  mat.uMinSize = config.minSize !== undefined ? config.minSize : (config.maskRadius ? config.maskRadius * 0.05 : 0.03);
  mat.uMaxSize = config.maxSize !== undefined ? config.maxSize : (config.maskRadius ? config.maskRadius * 1.35 : 0.32);
  if (mat.uniforms?.uMinSize) {
    mat.uniforms.uMinSize.value = mat.uMinSize;
  }
  if (mat.uniforms?.uMaxSize) {
    mat.uniforms.uMaxSize.value = mat.uMaxSize;
  }
  mat.uEdgeWarp = config.edgeWarp;
  mat.uCoreRadius = config.coreRadius;
  mat.uAlpha = config.alpha;
  mat.uGradientSoftness = config.gradientSoftness !== undefined ? config.gradientSoftness : 1.0;
  if (mat.uniforms?.uGradientSoftness) {
    mat.uniforms.uGradientSoftness.value = mat.uGradientSoftness;
  }
  if (mat.uSeedOffset) {
    mat.uSeedOffset.set(config.seedX || 0.0, config.seedY || 0.0);
  }
  if (mat.uniforms?.uSeedOffset) {
    mat.uniforms.uSeedOffset.value.set(config.seedX || 0.0, config.seedY || 0.0);
  }
  mat.uMultiCoreStrength = config.multiCoreStrength !== undefined ? config.multiCoreStrength : 0.0;
  mat.uMultiCoreScale = config.multiCoreScale !== undefined ? config.multiCoreScale : 1.8;
  mat.uVoidPinch = config.voidPinch !== undefined ? config.voidPinch : 0.0;

  if (mat.uColorSII && config.colors?.sii) mat.uColorSII.set(config.colors.sii);
  if (mat.uColorHa && config.colors?.ha) mat.uColorHa.set(config.colors.ha);
  if (mat.uColorOIII && config.colors?.oiii) mat.uColorOIII.set(config.colors.oiii);
  if (mat.uColorCore && config.colors?.core) mat.uColorCore.set(config.colors.core);
}

export function DualNebulaBackground({ 
  isMobile, 
  perfTierFloat = 0.0, 
  nebulaPath1 = NEBULA_CONFIG.nebula1.path, 
  nebulaPath2 = NEBULA_CONFIG.nebula2.path 
}) {
  const matRefLayer1 = useRef();
  const matRefLayer2 = useRef();
  const timeAcc1 = useRef(0);
  const timeAcc2 = useRef(0);

  useFrame((state, delta) => {
    // Clamp delta to 0.1s max to prevent sudden leaps on tab blur/focus/reload
    const safeDelta = Math.min(delta, 0.1);

    const n1 = NEBULA_CONFIG.nebula1;
    const speed1 = n1.speed !== undefined ? n1.speed : 0.10;
    timeAcc1.current += safeDelta * speed1;
    syncNebulaUniforms(matRefLayer1.current, n1, timeAcc1.current, nebulaPath1, perfTierFloat);

    const n2 = NEBULA_CONFIG.nebula2;
    const speed2 = n2.speed !== undefined ? n2.speed : 0.12;
    timeAcc2.current += safeDelta * speed2;
    syncNebulaUniforms(matRefLayer2.current, n2, timeAcc2.current, nebulaPath2, perfTierFloat);
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
          uCoverage={n1.coverage || 0.0}
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
          uCoverage={n2.coverage || 0.0}
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
