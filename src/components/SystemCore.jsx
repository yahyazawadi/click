import React, { useRef, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { CORE_CONFIG, SYSTEM_CONFIG } from '../config';
import '../shaders/PlanetCoreMaterial';

export function SystemCore({ onSelect, isMobile, perfTierFloat = 0.0, isSelected = false }) {
  const innerCoreRef = useRef();
  const shaderMatRef = useRef();
  const groupRef1 = useRef();
  const groupRef2 = useRef();
  const ringRef1 = useRef();
  const ringRef2 = useRef();
  const matRef1 = useRef();
  const matRef2 = useRef();
  const [hovered, setHovered] = useState(false);

  // Pre-allocated THREE.Color instances to avoid garbage collection
  const colors = useMemo(() => ({
    deepOcean:      new THREE.Color(CORE_CONFIG.colors.deepOcean),
    midOcean:       new THREE.Color(CORE_CONFIG.colors.midOcean),
    cloudBand:      new THREE.Color(CORE_CONFIG.colors.cloudBand),
    stormHighlight: new THREE.Color(CORE_CONFIG.colors.stormHighlight),
    atmosphere:     new THREE.Color(CORE_CONFIG.colors.atmosphere),
    continentColor: new THREE.Color(CORE_CONFIG.colors.continentColor),
    coastColor:     new THREE.Color(CORE_CONFIG.colors.coastColor),
    ring1Color:     new THREE.Color(CORE_CONFIG.innerRings?.ring1?.color || '#FF0A2B'),
    ring1Emissive:  new THREE.Color(CORE_CONFIG.innerRings?.ring1?.emissive || '#FF0A2B'),
    ring2Color:     new THREE.Color(CORE_CONFIG.innerRings?.ring2?.color || '#B3002D'),
    ring2Emissive:  new THREE.Color(CORE_CONFIG.innerRings?.ring2?.emissive || '#B3002D'),
  }), []);

  useFrame((state, delta) => {
    const time = state.clock.getElapsedTime();

    if (shaderMatRef.current) {
      shaderMatRef.current.uTime = time;

      // Direct GPU Uniform Synchronization in-place every frame
      const u = shaderMatRef.current.uniforms;
      if (u) {
        if (u.uDeepOcean?.value?.set) u.uDeepOcean.value.set(CORE_CONFIG.colors.deepOcean);
        if (u.uMidOcean?.value?.set) u.uMidOcean.value.set(CORE_CONFIG.colors.midOcean);
        if (u.uCloudBand?.value?.set) u.uCloudBand.value.set(CORE_CONFIG.colors.cloudBand);
        if (u.uStormHighlight?.value?.set) u.uStormHighlight.value.set(CORE_CONFIG.colors.stormHighlight);
        if (u.uAtmosphere?.value?.set) u.uAtmosphere.value.set(CORE_CONFIG.colors.atmosphere);
        if (u.uContinentColor?.value?.set) u.uContinentColor.value.set(CORE_CONFIG.colors.continentColor);
        if (u.uCoastColor?.value?.set) u.uCoastColor.value.set(CORE_CONFIG.colors.coastColor);

        if (u.uCloudDriftSpeed) u.uCloudDriftSpeed.value = CORE_CONFIG.clouds.driftSpeed;
        if (u.uCloudScale) u.uCloudScale.value = CORE_CONFIG.clouds.scale;
        if (u.uBandFrequency) u.uBandFrequency.value = CORE_CONFIG.clouds.bandFrequency;
        if (u.uBandWarp) u.uBandWarp.value = CORE_CONFIG.clouds.bandWarp;
        if (u.uStormIntensity) u.uStormIntensity.value = CORE_CONFIG.clouds.stormIntensity;

        if (u.uContinentDriftSpeed) u.uContinentDriftSpeed.value = CORE_CONFIG.continents.driftSpeed;
        if (u.uContinentScale) u.uContinentScale.value = CORE_CONFIG.continents.scale;
        if (u.uSeaLevel) u.uSeaLevel.value = CORE_CONFIG.continents.seaLevel;

        if (u.uAtmosphereFresnelPower) u.uAtmosphereFresnelPower.value = CORE_CONFIG.atmosphere.fresnelPower;
        if (u.uAtmosphereFresnelIntensity) u.uAtmosphereFresnelIntensity.value = CORE_CONFIG.atmosphere.fresnelIntensity;

        if (u.uSpecularIntensity) u.uSpecularIntensity.value = CORE_CONFIG.lighting.specularIntensity;
        if (u.uSpecularShininess) u.uSpecularShininess.value = CORE_CONFIG.lighting.specularShininess;
        if (u.uAmbientLight) u.uAmbientLight.value = CORE_CONFIG.lighting.ambientLight;
        if (u.uDiffuseLight) u.uDiffuseLight.value = CORE_CONFIG.lighting.diffuseLight;
        if (u.uPolarFade) u.uPolarFade.value = CORE_CONFIG.lighting.polarFade;
      }
    }

    const rotSpeed = CORE_CONFIG.rotationSpeed !== undefined ? CORE_CONFIG.rotationSpeed : 0.15;
    if (innerCoreRef.current) {
      innerCoreRef.current.rotation.y += delta * rotSpeed;
      const coreScale = CORE_CONFIG.radius || 1.8;
      innerCoreRef.current.scale.set(coreScale / 1.8, coreScale / 1.8, coreScale / 1.8);
    }

    // --- INNER RING 1 DYNAMIC LIVE SYNC ---
    const ring1 = CORE_CONFIG.innerRings?.ring1;
    if (groupRef1.current && ring1) {
      groupRef1.current.visible = ring1.enabled !== false;
      groupRef1.current.rotation.set(
        ring1.tiltX !== undefined ? ring1.tiltX : (Math.PI / 4),
        ring1.tiltY !== undefined ? ring1.tiltY : 0,
        ring1.tiltZ !== undefined ? ring1.tiltZ : 0
      );
    }
    if (ringRef1.current && ring1 && ring1.enabled !== false) {
      ringRef1.current.rotation.x += delta * (ring1.speedX !== undefined ? ring1.speedX : 0.25);
      ringRef1.current.rotation.y += delta * (ring1.speedY !== undefined ? ring1.speedY : 0.35);
      ringRef1.current.rotation.z += delta * (ring1.speedZ !== undefined ? ring1.speedZ : 0.15);

      const radMult = ring1.radiusMultiplier || 1.5;
      ringRef1.current.scale.set(radMult / 1.5, radMult / 1.5, radMult / 1.5);
    }
    if (matRef1.current && ring1) {
      colors.ring1Color.set(ring1.color || '#FF0A2B');
      colors.ring1Emissive.set(ring1.emissive || '#FF0A2B');
      matRef1.current.color.copy(colors.ring1Color);
      matRef1.current.emissive.copy(colors.ring1Emissive);
      matRef1.current.emissiveIntensity = ring1.emissiveIntensity !== undefined ? ring1.emissiveIntensity : 0.8;
      matRef1.current.opacity = ring1.opacity !== undefined ? ring1.opacity : 1.0;
    }

    // --- INNER RING 2 DYNAMIC LIVE SYNC ---
    const ring2 = CORE_CONFIG.innerRings?.ring2;
    if (groupRef2.current && ring2) {
      groupRef2.current.visible = ring2.enabled !== false;
      groupRef2.current.rotation.set(
        ring2.tiltX !== undefined ? ring2.tiltX : (-Math.PI / 3),
        ring2.tiltY !== undefined ? ring2.tiltY : (Math.PI / 6),
        ring2.tiltZ !== undefined ? ring2.tiltZ : 0
      );
    }
    if (ringRef2.current && ring2 && ring2.enabled !== false) {
      ringRef2.current.rotation.x += delta * (ring2.speedX !== undefined ? ring2.speedX : 0.30);
      ringRef2.current.rotation.y += delta * (ring2.speedY !== undefined ? ring2.speedY : 0.20);
      ringRef2.current.rotation.z += delta * (ring2.speedZ !== undefined ? ring2.speedZ : 0.10);

      const radMult2 = ring2.radiusMultiplier || 1.7;
      ringRef2.current.scale.set(radMult2 / 1.7, radMult2 / 1.7, radMult2 / 1.7);
    }
    if (matRef2.current && ring2) {
      colors.ring2Color.set(ring2.color || '#B3002D');
      colors.ring2Emissive.set(ring2.emissive || '#B3002D');
      matRef2.current.color.copy(colors.ring2Color);
      matRef2.current.emissive.copy(colors.ring2Emissive);
      matRef2.current.emissiveIntensity = ring2.emissiveIntensity !== undefined ? ring2.emissiveIntensity : 0.65;
      matRef2.current.opacity = ring2.opacity !== undefined ? ring2.opacity : 0.70;
    }
  });

  const coreRadius = CORE_CONFIG.radius || SYSTEM_CONFIG.core.radius || 1.8;
  const ring1 = CORE_CONFIG.innerRings?.ring1 || {};
  const ring2 = CORE_CONFIG.innerRings?.ring2 || {};

  return (
    <group
      onClick={(e) => {
        e.stopPropagation();
        onSelect('core');
      }}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
      style={{ cursor: 'pointer' }}
    >
      {/* 1. Real Gas Giant Planet — organic cloud belts, storm swirls, limb atmosphere glow */}
      <mesh ref={innerCoreRef}>
        <sphereGeometry args={[1.8, perfTierFloat >= 0.8 ? 24 : 48, perfTierFloat >= 0.8 ? 24 : 48]} />
        <planetCoreMaterial
          ref={shaderMatRef}
          uPerfTier={isSelected ? Math.max(perfTierFloat, 0.5) : perfTierFloat}
          uDeepOcean={colors.deepOcean}
          uMidOcean={colors.midOcean}
          uCloudBand={colors.cloudBand}
          uStormHighlight={colors.stormHighlight}
          uAtmosphere={colors.atmosphere}
          uContinentColor={colors.continentColor}
          uCoastColor={colors.coastColor}
        />
      </mesh>

      {/* 2. Concentric Core Orbit Ring 1 (Inner Torus with Gyro Spin) */}
      <group ref={groupRef1}>
        <mesh ref={ringRef1}>
          <torusGeometry args={[1.8 * 1.5, ring1.tubeRadius || 0.03, 16, 48]} />
          <meshStandardMaterial
            ref={matRef1}
            color={ring1.color || '#FF0A2B'}
            emissive={ring1.emissive || '#FF0A2B'}
            emissiveIntensity={ring1.emissiveIntensity ?? 0.8}
            roughness={0.2}
            metalness={0.4}
            transparent={(ring1.opacity ?? 1.0) < 1.0}
            opacity={ring1.opacity ?? 1.0}
          />
        </mesh>
      </group>

      {/* 3. Concentric Core Orbit Ring 2 (Outer Torus with Gyro Spin) */}
      <group ref={groupRef2}>
        <mesh ref={ringRef2}>
          <torusGeometry args={[1.8 * 1.7, ring2.tubeRadius || 0.02, 16, 48]} />
          <meshStandardMaterial
            ref={matRef2}
            color={ring2.color || '#B3002D'}
            emissive={ring2.emissive || '#B3002D'}
            emissiveIntensity={ring2.emissiveIntensity ?? 0.65}
            roughness={0.2}
            metalness={0.4}
            transparent
            opacity={ring2.opacity ?? 0.7}
          />
        </mesh>
      </group>
    </group>
  );
}
