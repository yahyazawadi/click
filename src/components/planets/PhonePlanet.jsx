import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import '../../shaders/ScissorMoonShaderMaterial';

// ── Phone handset geometry helper ────────────────────────────────────────────
function PhoneHandset({ size }) {
  const GREEN      = '#25D366';
  const GREEN_GLOW = '#1aff7a';
  const DARK       = '#0a2a15';

  const hs = size * 0.55;

  const arcGeo = useMemo(() =>
    new THREE.TorusGeometry(hs * 0.55, hs * 0.14, 16, 48, Math.PI),
  [hs]);

  const earGeo   = useMemo(() => new THREE.CylinderGeometry(hs * 0.20, hs * 0.20, hs * 0.28, 20), [hs]);
  const mouthGeo = useMemo(() => new THREE.CylinderGeometry(hs * 0.20, hs * 0.20, hs * 0.28, 20), [hs]);

  const handsetMat = (
    <meshStandardMaterial
      color={GREEN}
      emissive={GREEN_GLOW}
      emissiveIntensity={0.7}
      roughness={0.2}
      metalness={0.6}
    />
  );

  const darkMat = (
    <meshStandardMaterial
      color={DARK}
      emissive={GREEN}
      emissiveIntensity={0.15}
      roughness={0.4}
      metalness={0.5}
    />
  );

  return (
    <group rotation={[0, 0, Math.PI / 4]}>
      {/* Curved arc body */}
      <mesh geometry={arcGeo} rotation={[Math.PI / 2, 0, 0]}>
        {handsetMat}
      </mesh>

      {/* Earpiece cap */}
      <mesh geometry={earGeo} position={[-hs * 0.55, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        {handsetMat}
      </mesh>

      {/* Mouthpiece cap */}
      <mesh geometry={mouthGeo} position={[hs * 0.55, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        {handsetMat}
      </mesh>

      {/* Speaker dots */}
      {[-0.06, 0, 0.06].map((dx, i) => (
        <mesh key={i} position={[-hs * 0.55 + dx * hs, 0, hs * 0.17]}>
          <sphereGeometry args={[hs * 0.035, 8, 8]} />
          {darkMat}
        </mesh>
      ))}
    </group>
  );
}

// ── Main PhonePlanet ──────────────────────────────────────────────────────────
export function PhonePlanet({ size, isMobile, perfTierFloat = 0.0 }) {
  const planetRef    = useRef();
  const shaderMatRef = useRef();
  const handsetRef   = useRef();

  const planetRadius = size * 0.85;

  useFrame((state, delta) => {
    const t = state.clock.getElapsedTime();
    const safeDelta = Math.min(delta, 0.1);

    if (shaderMatRef.current) {
      shaderMatRef.current.uTime     = t;
      shaderMatRef.current.uPerfTier = perfTierFloat;
    }

    if (planetRef.current) planetRef.current.rotation.y += safeDelta * 0.18;

    if (handsetRef.current) {
      handsetRef.current.position.y = planetRadius * 1.18 + Math.sin(t * 1.2) * size * 0.06;
      handsetRef.current.rotation.z = Math.sin(t * 0.6) * 0.08;
    }
  });

  const segments = perfTierFloat >= 0.8 ? 24 : 48;

  return (
    <group>
      <group ref={planetRef}>
        <mesh>
          <sphereGeometry args={[planetRadius, segments, segments]} />
          <scissorMoonShaderMaterial
            ref={shaderMatRef}
            uPerfTier={perfTierFloat}
            uDeepSea={new THREE.Color('#031a0a')}
            uMidSea={new THREE.Color('#073d18')}
            uShallowSea={new THREE.Color('#0d6b2a')}
            uCoast={new THREE.Color('#15a040')}
            uLand={new THREE.Color('#1a7a32')}
            uForest={new THREE.Color('#0d4f1e')}
            uPolarIce={new THREE.Color('#a8f5c0')}
            uCloud={new THREE.Color('#c8ffda')}
            uAtmosphere={new THREE.Color('#25D366')}
            uStorm={new THREE.Color('#1aff7a')}
          />
        </mesh>

        {/* Green atmosphere glow rim */}
        <mesh>
          <sphereGeometry args={[planetRadius * 1.045, 32, 32]} />
          <meshStandardMaterial
            color="#25D366"
            emissive="#25D366"
            emissiveIntensity={0.18}
            transparent
            opacity={0.08}
            side={THREE.BackSide}
          />
        </mesh>
      </group>

      {/* Phone handset floating above north pole */}
      <group ref={handsetRef} position={[0, planetRadius * 1.18, 0]}>
        <PhoneHandset size={size} />
      </group>
    </group>
  );
}
