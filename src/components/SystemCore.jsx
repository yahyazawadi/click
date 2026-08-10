import React, { useRef, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { SYSTEM_CONFIG } from '../config';
import '../shaders/PlanetCoreMaterial';

export function SystemCore({ onSelect, isMobile, perfTierFloat = 0.0 }) {
  const innerCoreRef = useRef();
  const shaderMatRef = useRef();
  const ringRef1 = useRef();
  const ringRef2 = useRef();
  const [hovered, setHovered] = useState(false);

  useFrame((state, delta) => {
    const time = state.clock.getElapsedTime();

    if (shaderMatRef.current) {
      shaderMatRef.current.uTime = time;
    }

    if (innerCoreRef.current) {
      innerCoreRef.current.rotation.y += delta * 0.15;
    }
    if (ringRef1.current) {
      ringRef1.current.rotation.z += delta * 0.4;
    }
    if (ringRef2.current) {
      ringRef2.current.rotation.x += delta * 0.3;
      ringRef2.current.rotation.y += delta * 0.2;
    }
  });

  const coreRadius = SYSTEM_CONFIG.core.radius || 1.8;

  // Memoize color objects — avoids rebuilding THREE.Color on every React re-render
  const colors = useMemo(() => ({
    deepOcean:      new THREE.Color('#041830'),
    midOcean:       new THREE.Color('#0a4070'),
    cloudBand:      new THREE.Color('#1a7aaa'),
    stormHighlight: new THREE.Color('#00d4f0'),
    atmosphere:     new THREE.Color('#00BAE3'),
    continentColor: new THREE.Color('#2d5a6e'),
    coastColor:     new THREE.Color('#1a8090'),
  }), []);

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
        <sphereGeometry args={[coreRadius, 48, 48]} />
        <planetCoreMaterial
          ref={shaderMatRef}
          uPerfTier={perfTierFloat}
          uDeepOcean={colors.deepOcean}
          uMidOcean={colors.midOcean}
          uCloudBand={colors.cloudBand}
          uStormHighlight={colors.stormHighlight}
          uAtmosphere={colors.atmosphere}
          uContinentColor={colors.continentColor}
          uCoastColor={colors.coastColor}
        />
      </mesh>

      {/* 3. Concentric Core Orbit Ring 1 */}
      <mesh ref={ringRef1} rotation={[Math.PI / 4, 0, 0]}>
        <torusGeometry args={[coreRadius * 1.5, 0.03, 12, 48]} />
        <meshStandardMaterial
          color={SYSTEM_CONFIG.colors.primaryCyan}
          emissive={SYSTEM_CONFIG.colors.primaryCyan}
          emissiveIntensity={0.6}
        />
      </mesh>

      {/* 4. Concentric Core Orbit Ring 2 */}
      <mesh ref={ringRef2} rotation={[-Math.PI / 3, Math.PI / 6, 0]}>
        <torusGeometry args={[coreRadius * 1.7, 0.02, 12, 48]} />
        <meshStandardMaterial
          color={SYSTEM_CONFIG.colors.secondaryBlue}
          transparent
          opacity={0.5}
        />
      </mesh>
    </group>
  );
}
