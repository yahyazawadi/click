import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader.js';
import '../../shaders/ScissorMoonShaderMaterial';

// ── Official Supabase Bolt — SVG Paths (viewBox 0 0 512 512) ─────────────────
// Front blade: tall right-leaning arrow
const SVG_FRONT_BLADE =
  'M297.6 501c-12.9 16.3-39.2 7.4-39.5-13.4L253.6 183h204.8c37.1 0 57.8 42.8 34.7 71.9z';

// Back blade: tall left-leaning arrow
const SVG_BACK_BLADE =
  'M214.4 11c12.9-16.3 39.2-7.4 39.5 13.4l2 304.5H53.7c-37.1 0-57.8-42.8-34.7-71.9z';

// ── Supabase Color Palette & Materials ───────────────────────────────────────
const C = {
  brightMint:  '#3ECF8E',   // Official Supabase radiant mint
  deepEmerald: '#12804d',   // Polished deep emerald
  hyperNeon:   '#00ff9d',   // Electric neon bloom
  obsidian:    '#010905',   // Deep space obsidian base
};

// ── Supabase Side-Mounted Architectural Monolith ─────────────────────────────
// Rises directly out of the planet surface like a towering cyber-building structure.
function SupabaseEmblem({ size, planetRadius }) {
  const frontMatRef = useRef();
  const backMatRef  = useRef();
  const lightRef    = useRef();
  const pulseRef    = useRef();

  const emblemScale = (planetRadius * 0.44) / 256;

  const { frontGeo, backGeo } = useMemo(() => {
    const loader = new SVGLoader();

    // Flip SVG Y coordinates so top is +Y in Three.js
    const yFlip = 'transform="scale(1,-1) translate(0,-512)"';
    const centerMatrix = new THREE.Matrix4().makeTranslation(-256, -256, 0);

    // 1. Front Blade (Bottom-right tower) — Taller monolithic skyscraper
    const fData   = loader.parse(`<svg viewBox="0 0 512 512"><g ${yFlip}><path d="${SVG_FRONT_BLADE}"/></g></svg>`);
    const fShapes = fData.paths[0].toShapes(true);
    const fGeo    = new THREE.ExtrudeGeometry(fShapes, {
      depth:          75,
      bevelEnabled:   true,
      bevelThickness: 10,
      bevelSize:      6,
      bevelSegments:  5,
    });
    fGeo.applyMatrix4(centerMatrix);

    // 2. Back Blade (Top-left tower) — Interlocking monolithic skyscraper
    const bData   = loader.parse(`<svg viewBox="0 0 512 512"><g ${yFlip}><path d="${SVG_BACK_BLADE}"/></g></svg>`);
    const bShapes = bData.paths[0].toShapes(true);
    const bGeo    = new THREE.ExtrudeGeometry(bShapes, {
      depth:          60,
      bevelEnabled:   true,
      bevelThickness: 8,
      bevelSize:      5,
      bevelSegments:  5,
    });
    bGeo.applyMatrix4(centerMatrix);

    return { frontGeo: fGeo, backGeo: bGeo };
  }, []);

  useEffect(() => {
    return () => {
      frontGeo?.dispose?.();
      backGeo?.dispose?.();
    };
  }, [frontGeo, backGeo]);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();

    // Dual pulsing energy glow on the shiny crystal towers
    if (frontMatRef.current) {
      frontMatRef.current.emissiveIntensity = Math.sin(t * 2.5) * 0.5 + 1.6;
    }
    if (backMatRef.current) {
      backMatRef.current.emissiveIntensity = Math.sin(t * 2.5 + 0.8) * 0.4 + 1.2;
    }

    // Dynamic light shimmer across the polished surfaces
    if (lightRef.current) {
      lightRef.current.intensity = Math.sin(t * 2.0) * 0.6 + 2.0;
    }

    // Expanding shockwave pulse at foundation
    if (pulseRef.current) {
      const p = (t * 0.35) % 1.0;
      pulseRef.current.scale.setScalar(0.4 + p * 2.4);
      pulseRef.current.material.opacity = Math.pow(1.0 - p, 1.4) * 0.8;
    }
  });

  return (
    // Local +Z points directly OUTWARD along planet normal
    <group rotation={[0, Math.PI / 2, 0]}>

      {/* ── Local Point Light for lustrous specular glints on beveled edges ── */}
      <pointLight
        ref={lightRef}
        color={C.hyperNeon}
        intensity={2.2}
        distance={size * 2.5}
        position={[0, 0, size * 0.3]}
      />

      {/* ── 1. Sleek Obsidian & Neon Foundation Ring ── */}
      <mesh position={[0, 0, -0.002]}>
        <ringGeometry args={[planetRadius * 0.36, planetRadius * 0.42, 64]} />
        <meshStandardMaterial
          color="#03140b"
          emissive={C.brightMint}
          emissiveIntensity={0.8}
          roughness={0.1}
          metalness={0.95}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* ── 2. Back Monolith Tower (Deep Glossy Emerald Crystal) ── */}
      <mesh
        geometry={backGeo}
        scale={[emblemScale, emblemScale, emblemScale]}
        position={[0, 0, -0.006]}
      >
        <meshStandardMaterial
          ref={backMatRef}
          color={C.deepEmerald}
          emissive={C.brightMint}
          emissiveIntensity={1.2}
          roughness={0.06}
          metalness={0.92}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* ── 3. Front Monolith Tower (Ultra-Shiny Radiant Mint Crown) ── */}
      <mesh
        geometry={frontGeo}
        scale={[emblemScale, emblemScale, emblemScale]}
        position={[0, 0, -0.006]}
      >
        <meshStandardMaterial
          ref={frontMatRef}
          color={C.brightMint}
          emissive={C.hyperNeon}
          emissiveIntensity={1.6}
          roughness={0.04}
          metalness={0.90}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* ── 4. Holographic Base Shockwave Ring ── */}
      <mesh ref={pulseRef} position={[0, 0, 0.004]}>
        <ringGeometry args={[planetRadius * 0.22, planetRadius * 0.26, 48]} />
        <meshBasicMaterial
          color={C.hyperNeon}
          transparent
          opacity={0.7}
          side={THREE.DoubleSide}
        />
      </mesh>

    </group>
  );
}

// ── Main SupabasePlanet ───────────────────────────────────────────────────────
export function SupabasePlanet({ size, isMobile, perfTierFloat = 0.0 }) {
  const planetRef    = useRef();
  const shaderMatRef = useRef();

  const planetRadius = size * 0.85;

  useFrame((state, delta) => {
    const t = state.clock.getElapsedTime();
    const safeDelta = Math.min(delta, 0.1);

    if (shaderMatRef.current) {
      shaderMatRef.current.uTime     = t;
      shaderMatRef.current.uPerfTier = perfTierFloat;
      shaderMatRef.current.uCutY     = 9999.0;
    }

    // Steady planetary rotation
    if (planetRef.current) {
      planetRef.current.rotation.y += safeDelta * 0.16;
    }
  });

  const segments = perfTierFloat >= 0.8 ? 24 : 48;

  return (
    <group rotation={[-0.38, 0, 0]}>

      {/* ── Rotating Planet Body ── */}
      <group ref={planetRef}>

        {/* ── Rich Obsidian-Emerald Celestial Sphere ── */}
        <mesh>
          <sphereGeometry args={[planetRadius, segments, segments]} />
          <scissorMoonShaderMaterial
            ref={shaderMatRef}
            uPerfTier={perfTierFloat}
            uCutY={9999.0}
            uDeepSea={new THREE.Color('#010c06')}
            uMidSea={new THREE.Color('#042414')}
            uShallowSea={new THREE.Color('#0a542d')}
            uCoast={new THREE.Color('#16a358')}
            uLand={new THREE.Color('#0f3f26')}
            uForest={new THREE.Color('#062113')}
            uPolarIce={new THREE.Color('#80ffcb')}
            uCloud={new THREE.Color('#d4fff0')}
            uAtmosphere={new THREE.Color('#3ECF8E')}
            uStorm={new THREE.Color('#00ff9d')}
          />
        </mesh>

        {/* ── Supabase Emerald Atmospheric Halo ── */}
        <mesh>
          <sphereGeometry args={[planetRadius * 1.048, 32, 32]} />
          <meshStandardMaterial
            color="#3ECF8E"
            emissive="#3ECF8E"
            emissiveIntensity={0.25}
            transparent
            opacity={0.12}
            side={THREE.BackSide}
          />
        </mesh>

        {/* ── Supabase Monolith Towers — Emerging Outward from Equator ── */}
        <group position={[planetRadius * 0.995, 0, 0]}>
          <SupabaseEmblem size={size} planetRadius={planetRadius} />
        </group>

      </group>
    </group>
  );
}
