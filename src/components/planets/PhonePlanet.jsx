import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import '../../shaders/ScissorMoonShaderMaterial';

// ── 3D Phone Handset Geometry ──────────────────────────────────────────────
function PhoneHandset({ size }) {
  const GREEN      = '#25D366';
  const GREEN_GLOW = '#1aff7a';
  const DARK_SLATE = '#05180f';

  const hs = size * 0.50;

  // Arc body of the handset
  const arcGeo = useMemo(() =>
    new THREE.TorusGeometry(hs * 0.55, hs * 0.13, 16, 48, Math.PI),
  [hs]);

  const earGeo   = useMemo(() => new THREE.CylinderGeometry(hs * 0.18, hs * 0.22, hs * 0.25, 24), [hs]);
  const mouthGeo = useMemo(() => new THREE.CylinderGeometry(hs * 0.18, hs * 0.22, hs * 0.25, 24), [hs]);

  const handsetMat = (
    <meshStandardMaterial
      color="#072b15"
      emissive={GREEN}
      emissiveIntensity={0.65}
      roughness={0.15}
      metalness={0.85}
    />
  );

  const glowingCapMat = (
    <meshStandardMaterial
      color={GREEN}
      emissive={GREEN_GLOW}
      emissiveIntensity={1.2}
      roughness={0.1}
      metalness={0.4}
    />
  );

  const darkAccentMat = (
    <meshStandardMaterial
      color={DARK_SLATE}
      emissive={GREEN}
      emissiveIntensity={0.2}
      roughness={0.3}
      metalness={0.9}
    />
  );

  return (
    <group rotation={[Math.PI / 12, 0, Math.PI / 4]}>
      {/* Curved main handle bar */}
      <mesh geometry={arcGeo} rotation={[Math.PI / 2, 0, 0]}>
        {handsetMat}
      </mesh>

      {/* Handle center grip ring */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[hs * 0.55, hs * 0.04, 12, 32, Math.PI * 0.4]} />
        {glowingCapMat}
      </mesh>

      {/* Earpiece assembly */}
      <group position={[-hs * 0.55, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <mesh geometry={earGeo}>{handsetMat}</mesh>
        {/* Glowing acoustic rim */}
        <mesh position={[0, hs * 0.13, 0]}>
          <cylinderGeometry args={[hs * 0.23, hs * 0.23, hs * 0.04, 24]} />
          {glowingCapMat}
        </mesh>
        {/* Inner receiver recess */}
        <mesh position={[0, hs * 0.15, 0]}>
          <cylinderGeometry args={[hs * 0.14, hs * 0.14, hs * 0.02, 16]} />
          {darkAccentMat}
        </mesh>
      </group>

      {/* Mouthpiece assembly */}
      <group position={[hs * 0.55, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <mesh geometry={mouthGeo}>{handsetMat}</mesh>
        {/* Glowing transmitter rim */}
        <mesh position={[0, hs * 0.13, 0]}>
          <cylinderGeometry args={[hs * 0.23, hs * 0.23, hs * 0.04, 24]} />
          {glowingCapMat}
        </mesh>
        {/* Inner mic grille */}
        <mesh position={[0, hs * 0.15, 0]}>
          <cylinderGeometry args={[hs * 0.14, hs * 0.14, hs * 0.02, 16]} />
          {darkAccentMat}
        </mesh>
      </group>
    </group>
  );
}

// ── Physical Indented Plateau / Transmitter Station on Planet Crust ────────
function TransmitterStationMount({ size }) {
  const GREEN      = '#25D366';
  const GREEN_GLOW = '#1aff7a';

  const baseRadius = size * 0.42;

  return (
    <group position={[0, 0, 0]}>
      {/* 1. Raised Mountain / Plateau Collar emerging from planet mantle */}
      <mesh position={[0, -size * 0.06, 0]}>
        <cylinderGeometry args={[baseRadius * 0.95, baseRadius * 1.35, size * 0.18, 32]} />
        <meshStandardMaterial
          color="#041f0f"
          emissive="#0a3d1d"
          emissiveIntensity={0.4}
          roughness={0.4}
          metalness={0.7}
        />
      </mesh>

      {/* 2. Metallic Outer Bevel Ring with Tech Ridges */}
      <mesh position={[0, size * 0.02, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[baseRadius * 0.92, size * 0.035, 16, 36]} />
        <meshStandardMaterial
          color="#073b1c"
          emissive={GREEN}
          emissiveIntensity={0.8}
          roughness={0.1}
          metalness={0.9}
        />
      </mesh>

      {/* 3. Sunken Receiver Basin / Indented Well */}
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[baseRadius * 0.78, baseRadius * 0.85, size * 0.08, 32]} />
        <meshStandardMaterial
          color="#021208"
          roughness={0.6}
          metalness={0.8}
        />
      </mesh>

      {/* 4. Glowing Plasma Core Energy Disc (at the floor of the indentation) */}
      <mesh position={[0, size * 0.02, 0]}>
        <cylinderGeometry args={[baseRadius * 0.65, baseRadius * 0.65, size * 0.015, 32]} />
        <meshStandardMaterial
          color={GREEN}
          emissive={GREEN_GLOW}
          emissiveIntensity={1.4}
          roughness={0.1}
        />
      </mesh>

      {/* 5. Concentric Runic Tech Circuit Rings on the plateau */}
      <mesh position={[0, size * 0.025, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[baseRadius * 0.40, baseRadius * 0.44, 32]} />
        <meshStandardMaterial
          color="#FCFCFC"
          emissive={GREEN_GLOW}
          emissiveIntensity={1.8}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}

// ── Main PhonePlanet ──────────────────────────────────────────────────────────
export function PhonePlanet({ size, isMobile, perfTierFloat = 0.0 }) {
  const planetRef    = useRef();
  const shaderMatRef = useRef();
  const pulseRingRef = useRef();

  const planetRadius = size * 0.85;

  useFrame((state, delta) => {
    const t = state.clock.getElapsedTime();
    const safeDelta = Math.min(delta, 0.1);

    if (shaderMatRef.current) {
      shaderMatRef.current.uTime     = t;
      shaderMatRef.current.uPerfTier = perfTierFloat;
    }

    // Steady planet rotation — the phone & plateau rotate seamlessly with the surface!
    if (planetRef.current) {
      planetRef.current.rotation.y += safeDelta * 0.18;
    }

    // Holographic Signal Wave pulsing upward from the indentation
    if (pulseRingRef.current) {
      const pulse = (t * 1.5) % 1.0;
      pulseRingRef.current.position.y = size * 0.12 + pulse * (size * 0.35);
      pulseRingRef.current.scale.setScalar(0.7 + pulse * 0.6);
      pulseRingRef.current.material.opacity = (1.0 - pulse) * 0.7;
    }
  });

  const segments = perfTierFloat >= 0.8 ? 24 : 48;

  return (
    <group>
      {/* ── Rotating Planet Body (Everything attached rotates with the crust) ── */}
      <group ref={planetRef}>
        {/* Base Noisy Organic Crust */}
        <mesh>
          <sphereGeometry args={[planetRadius, segments, segments]} />
          <scissorMoonShaderMaterial
            ref={shaderMatRef}
            uPerfTier={perfTierFloat}
            uDeepSea={new THREE.Color('#021408')}
            uMidSea={new THREE.Color('#053315')}
            uShallowSea={new THREE.Color('#0a5c24')}
            uCoast={new THREE.Color('#138f3a')}
            uLand={new THREE.Color('#1b6e32')}
            uForest={new THREE.Color('#0e421e')}
            uPolarIce={new THREE.Color('#98f2b5')}
            uCloud={new THREE.Color('#c2ffd6')}
            uAtmosphere={new THREE.Color('#25D366')}
            uStorm={new THREE.Color('#1aff7a')}
          />
        </mesh>

        {/* Emerald Atmospheric Halo */}
        <mesh>
          <sphereGeometry args={[planetRadius * 1.045, 32, 32]} />
          <meshStandardMaterial
            color="#25D366"
            emissive="#25D366"
            emissiveIntensity={0.22}
            transparent
            opacity={0.09}
            side={THREE.BackSide}
          />
        </mesh>

        {/* ── Physical Plateau & Indented Cradle at North Pole ── */}
        <group position={[0, planetRadius * 0.94, 0]}>
          <TransmitterStationMount size={size} />

          {/* Phone Handset docked securely in the sunken indentation */}
          <group position={[0, size * 0.16, 0]}>
            <PhoneHandset size={size} />
          </group>

          {/* Holographic Signal Pulse emitting from the indentation */}
          <mesh ref={pulseRingRef} rotation={[Math.PI / 2, 0, 0]} position={[0, size * 0.12, 0]}>
            <ringGeometry args={[size * 0.18, size * 0.22, 32]} />
            <meshBasicMaterial
              color="#1aff7a"
              transparent
              opacity={0.6}
              side={THREE.DoubleSide}
            />
          </mesh>
        </group>
      </group>
    </group>
  );
}

