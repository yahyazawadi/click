import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import '../../shaders/ClimamedixEarthShaderMaterial';

export function ClimamedixPlanet({ size, isMobile, perfTierFloat = 0.0 }) {
  const earthRef    = useRef();
  const cloudsRef   = useRef();
  const earthMatRef = useRef();
  const cloudMatRef = useRef();

  const planetRadius = size * 0.88;
  const cloudRadius  = planetRadius * 1.022; // Layered just above surface for true parallax
  const segments     = perfTierFloat >= 0.8 ? 20 : (isMobile ? 24 : 36);

  useFrame((state, delta) => {
    const t = state.clock.getElapsedTime();

    // Pass time and perfTier into uniforms
    if (earthMatRef.current) {
      earthMatRef.current.uTime = t;
      earthMatRef.current.uPerfTier = perfTierFloat;
    }
    if (cloudMatRef.current) {
      cloudMatRef.current.uTime = t;
      cloudMatRef.current.uPerfTier = perfTierFloat;
    }

    // Ground rotation
    if (earthRef.current) {
      earthRef.current.rotation.y += delta * 0.12;
    }

    // Clouds rotate slightly faster for natural atmospheric wind drift & 3D parallax
    if (cloudsRef.current) {
      cloudsRef.current.rotation.y += delta * 0.16;
      cloudsRef.current.rotation.z = Math.sin(t * 0.05) * 0.04;
    }
  });

  return (
    <group>
      {/* ── 1. Earth Surface Mesh ─────────────────────────────────────── */}
      <group ref={earthRef}>
        <mesh>
          <sphereGeometry args={[planetRadius, segments, segments]} />
          <climamedixEarthShaderMaterial ref={earthMatRef} uPerfTier={perfTierFloat} />
        </mesh>
      </group>

      {/* ── 2. Top Rotating Cloud Sphere Layer (Semi-Transparent) ───────── */}
      <group ref={cloudsRef}>
        <mesh>
          <sphereGeometry args={[cloudRadius, segments, segments]} />
          <climamedixCloudShaderMaterial
            ref={cloudMatRef}
            uPerfTier={perfTierFloat}
            transparent
            depthWrite={false}
          />
        </mesh>
      </group>

      {/* ── 3. Soft Atmospheric Blue Haze Glow (Outer Inverted Shell) ─── */}
      <mesh>
        <sphereGeometry args={[planetRadius * 1.07, 24, 24]} />
        <meshStandardMaterial
          color="#4ea8de"
          transparent
          opacity={0.08}
          side={THREE.BackSide}
          emissive="#4ea8de"
          emissiveIntensity={0.4}
        />
      </mesh>
    </group>
  );
}
