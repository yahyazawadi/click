import React, { useRef, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { CORE_CONFIG, SYSTEM_CONFIG } from '../config';
import '../shaders/PlanetCoreMaterial';

export function SystemCore({ onSelect, isMobile, perfTierFloat = 0.0, isSelected = false }) {
  const innerCoreRef = useRef();
  const shaderMatRef = useRef();
  const ringRef1 = useRef();
  const ringRef2 = useRef();
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
  }), []);

  useFrame((state, delta) => {
    const time = state.clock.getElapsedTime();

    if (shaderMatRef.current) {
      shaderMatRef.current.uTime = time;

      // Sync color uniforms from CORE_CONFIG
      colors.deepOcean.set(CORE_CONFIG.colors.deepOcean);
      colors.midOcean.set(CORE_CONFIG.colors.midOcean);
      colors.cloudBand.set(CORE_CONFIG.colors.cloudBand);
      colors.stormHighlight.set(CORE_CONFIG.colors.stormHighlight);
      colors.atmosphere.set(CORE_CONFIG.colors.atmosphere);
      colors.continentColor.set(CORE_CONFIG.colors.continentColor);
      colors.coastColor.set(CORE_CONFIG.colors.coastColor);

      // Sync procedural dynamics uniforms
      shaderMatRef.current.uCloudDriftSpeed = CORE_CONFIG.clouds.driftSpeed;
      shaderMatRef.current.uCloudScale = CORE_CONFIG.clouds.scale;
      shaderMatRef.current.uBandFrequency = CORE_CONFIG.clouds.bandFrequency;
      shaderMatRef.current.uBandWarp = CORE_CONFIG.clouds.bandWarp;
      shaderMatRef.current.uStormIntensity = CORE_CONFIG.clouds.stormIntensity;

      shaderMatRef.current.uContinentDriftSpeed = CORE_CONFIG.continents.driftSpeed;
      shaderMatRef.current.uContinentScale = CORE_CONFIG.continents.scale;
      shaderMatRef.current.uSeaLevel = CORE_CONFIG.continents.seaLevel;

      shaderMatRef.current.uAtmosphereFresnelPower = CORE_CONFIG.atmosphere.fresnelPower;
      shaderMatRef.current.uAtmosphereFresnelIntensity = CORE_CONFIG.atmosphere.fresnelIntensity;

      shaderMatRef.current.uSpecularIntensity = CORE_CONFIG.lighting.specularIntensity;
      shaderMatRef.current.uSpecularShininess = CORE_CONFIG.lighting.specularShininess;
      shaderMatRef.current.uAmbientLight = CORE_CONFIG.lighting.ambientLight;
      shaderMatRef.current.uDiffuseLight = CORE_CONFIG.lighting.diffuseLight;
      shaderMatRef.current.uPolarFade = CORE_CONFIG.lighting.polarFade;
    }

    const rotSpeed = CORE_CONFIG.rotationSpeed !== undefined ? CORE_CONFIG.rotationSpeed : 0.15;
    if (innerCoreRef.current) {
      innerCoreRef.current.rotation.y += delta * rotSpeed;
    }

    const ring1 = CORE_CONFIG.innerRings?.ring1;
    if (ringRef1.current && ring1?.enabled !== false) {
      ringRef1.current.rotation.z += delta * (ring1?.speedZ !== undefined ? ring1.speedZ : 0.4);
    }

    const ring2 = CORE_CONFIG.innerRings?.ring2;
    if (ringRef2.current && ring2?.enabled !== false) {
      ringRef2.current.rotation.x += delta * (ring2?.speedX !== undefined ? ring2.speedX : 0.3);
      ringRef2.current.rotation.y += delta * (ring2?.speedY !== undefined ? ring2.speedY : 0.2);
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
        <sphereGeometry args={[coreRadius, perfTierFloat >= 0.8 ? 24 : 48, perfTierFloat >= 0.8 ? 24 : 48]} />
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

      {/* 2. Concentric Core Orbit Ring 1 (Inner Torus) */}
      {ring1.enabled !== false && (
        <mesh ref={ringRef1} rotation={[ring1.tiltX ?? (Math.PI / 4), ring1.tiltY ?? 0, ring1.tiltZ ?? 0]}>
          <torusGeometry args={[coreRadius * (ring1.radiusMultiplier || 1.5), ring1.tubeRadius || 0.03, perfTierFloat >= 0.8 ? 8 : 12, perfTierFloat >= 0.8 ? 24 : 48]} />
          {perfTierFloat >= 0.8 ? (
            <meshBasicMaterial color={ring1.color || '#FF0A2B'} transparent opacity={ring1.opacity ?? 1.0} />
          ) : (
            <meshStandardMaterial
              color={ring1.color || '#FF0A2B'}
              emissive={ring1.emissive || '#FF0A2B'}
              emissiveIntensity={ring1.emissiveIntensity ?? 0.8}
              transparent={(ring1.opacity ?? 1.0) < 1.0}
              opacity={ring1.opacity ?? 1.0}
            />
          )}
        </mesh>
      )}

      {/* 3. Concentric Core Orbit Ring 2 (Outer Torus) */}
      {ring2.enabled !== false && (
        <mesh ref={ringRef2} rotation={[ring2.tiltX ?? (-Math.PI / 3), ring2.tiltY ?? (Math.PI / 6), ring2.tiltZ ?? 0]}>
          <torusGeometry args={[coreRadius * (ring2.radiusMultiplier || 1.7), ring2.tubeRadius || 0.02, perfTierFloat >= 0.8 ? 8 : 12, perfTierFloat >= 0.8 ? 24 : 48]} />
          {perfTierFloat >= 0.8 ? (
            <meshBasicMaterial color={ring2.color || '#B3002D'} transparent opacity={ring2.opacity ?? 0.7} />
          ) : (
            <meshStandardMaterial
              color={ring2.color || '#B3002D'}
              emissive={ring2.emissive || '#B3002D'}
              emissiveIntensity={ring2.emissiveIntensity ?? 0.65}
              transparent
              opacity={ring2.opacity ?? 0.7}
            />
          )}
        </mesh>
      )}
    </group>
  );
}
