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

// ── Supabase Color Palette ────────────────────────────────────────────────────
const C = {
  primary: '#3ECF8E',   // Official Supabase mint green
  dark:    '#249361',   // Deep brand green
  neon:    '#1aff8e',   // Neon glow accent
  abyss:   '#020a06',   // Deep space obsidian
};

// ── Supabase Side-Mounted Architectural Monolith ─────────────────────────────
// Rises directly out of the planet surface like a towering cyber-building structure.
function SupabaseEmblem({ size, planetRadius }) {
  const frontMatRef = useRef();
  const sideMatRef  = useRef();
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
      depth:          75,    // Deep building extrusion
      bevelEnabled:   true,
      bevelThickness: 10,
      bevelSize:      6,
      bevelSegments:  4,
    });
    fGeo.applyMatrix4(centerMatrix);

    // 2. Back Blade (Top-left tower) — Complementary interlocking skyscraper
    const bData   = loader.parse(`<svg viewBox="0 0 512 512"><g ${yFlip}><path d="${SVG_BACK_BLADE}"/></g></svg>`);
    const bShapes = bData.paths[0].toShapes(true);
    const bGeo    = new THREE.ExtrudeGeometry(bShapes, {
      depth:          60,    // Distinct floor level
      bevelEnabled:   true,
      bevelThickness: 8,
      bevelSize:      5,
      bevelSegments:  4,
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

    // Architectural beacon pulse on the monoliths
    if (frontMatRef.current) {
      frontMatRef.current.emissiveIntensity = Math.sin(t * 2.4) * 0.45 + 1.35;
    }
    if (sideMatRef.current) {
      sideMatRef.current.emissiveIntensity = Math.sin(t * 1.8) * 0.25 + 0.75;
    }

    // Expanding tectonic energy wave at the building's foundation
    if (pulseRef.current) {
      const p = (t * 0.35) % 1.0;
      pulseRef.current.scale.setScalar(0.4 + p * 2.4);
      pulseRef.current.material.opacity = Math.pow(1.0 - p, 1.3) * 0.75;
    }
  });

  return (
    // Local +Z points directly OUTWARD along planet normal
    <group rotation={[0, Math.PI / 2, 0]}>

      {/* ── 1. Sci-Fi Foundation Trench embedded slightly in ground ── */}
      <mesh position={[0, 0, -0.002]}>
        <ringGeometry args={[planetRadius * 0.36, planetRadius * 0.46, 64]} />
        <meshStandardMaterial
          color="#061c12"
          emissive={C.dark}
          emissiveIntensity={0.5}
          roughness={0.35}
          metalness={0.9}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* ── 2. Back Monolith Tower (Top-Left Blade) ── */}
      {/* Sinks slightly into crust at base, rises high into orbit */}
      <mesh
        geometry={backGeo}
        scale={[emblemScale, emblemScale, emblemScale]}
        position={[0, 0, -0.006]}
      >
        <meshStandardMaterial
          ref={sideMatRef}
          color="#1b7a4c"
          emissive={C.dark}
          emissiveIntensity={0.75}
          roughness={0.2}
          metalness={0.75}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* ── 3. Front Monolith Tower (Bottom-Right Blade) ── */}
      {/* Taller mega-structure with radiant emerald crown */}
      <mesh
        geometry={frontGeo}
        scale={[emblemScale, emblemScale, emblemScale]}
        position={[0, 0, -0.006]}
      >
        <meshStandardMaterial
          ref={frontMatRef}
          color={C.primary}
          emissive={C.neon}
          emissiveIntensity={1.35}
          roughness={0.12}
          metalness={0.7}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* ── 4. Holographic Base Energy Shockwave ── */}
      <mesh ref={pulseRef} position={[0, 0, 0.004]}>
        <ringGeometry args={[planetRadius * 0.22, planetRadius * 0.28, 48]} />
        <meshBasicMaterial
          color={C.neon}
          transparent
          opacity={0.65}
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
      shaderMatRef.current.uCutY     = 9999.0; // Full celestial sphere
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

        {/* ── Full Supabase-Themed Planet Sphere ── */}
        <mesh>
          <sphereGeometry args={[planetRadius, segments, segments]} />
          <scissorMoonShaderMaterial
            ref={shaderMatRef}
            uPerfTier={perfTierFloat}
            uCutY={9999.0}
            uDeepSea={new THREE.Color('#020a06')}
            uMidSea={new THREE.Color('#071a0e')}
            uShallowSea={new THREE.Color('#0e3320')}
            uCoast={new THREE.Color('#1a5c38')}
            uLand={new THREE.Color('#124530')}
            uForest={new THREE.Color('#092a1c')}
            uPolarIce={new THREE.Color('#3ecf8e')}
            uCloud={new THREE.Color('#b8fce0')}
            uAtmosphere={new THREE.Color('#3ECF8E')}
            uStorm={new THREE.Color('#1aff8e')}
          />
        </mesh>

        {/* ── Supabase Emerald Atmospheric Halo ── */}
        <mesh>
          <sphereGeometry args={[planetRadius * 1.048, 32, 32]} />
          <meshStandardMaterial
            color="#3ECF8E"
            emissive="#3ECF8E"
            emissiveIntensity={0.20}
            transparent
            opacity={0.08}
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
