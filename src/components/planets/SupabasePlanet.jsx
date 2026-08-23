import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader.js';
import '../../shaders/ScissorMoonShaderMaterial';

// ── Official Supabase Bolt — SVG Paths (viewBox 0 0 512 512) ─────────────────
// Front blade: tall right-leaning arrow (gradient green in the SVG)
const SVG_FRONT_BLADE =
  'M297.6 501c-12.9 16.3-39.2 7.4-39.5-13.4L253.6 183h204.8c37.1 0 57.8 42.8 34.7 71.9z';

// Back blade: tall left-leaning arrow (solid #3ecf8e in the SVG)
const SVG_BACK_BLADE =
  'M214.4 11c12.9-16.3 39.2-7.4 39.5 13.4l2 304.5H53.7c-37.1 0-57.8-42.8-34.7-71.9z';

// ── Supabase Color Palette ────────────────────────────────────────────────────
const C = {
  primary:    '#3ECF8E',   // Official Supabase mint green
  dark:       '#249361',   // Deep brand green
  neon:       '#1aff8e',   // Neon glow accent
  plaqueBg:   '#030e08',   // Near-black mounting surface
  rimMid:     '#1a6641',   // Mid-tone metallic ring
};

// ── Supabase Side-Mounted Emblem ─────────────────────────────────────────────
// Placed at [planetRadius * 1.01, 0, 0] inside the spinning planetRef group.
// The logo face points outward (+X) via the Y-axis rotation.
function SupabaseEmblem({ size, planetRadius }) {
  const frontMatRef = useRef();
  const rimRef      = useRef();
  const pulseRef    = useRef();

  const plaqueRadius = planetRadius * 0.52;

  const { frontGeo, backGeo } = useMemo(() => {
    const loader = new SVGLoader();

    // Front blade — bright primary green, extruded deep for 3D presence
    const fData   = loader.parse(`<svg viewBox="0 0 512 512"><path d="${SVG_FRONT_BLADE}"/></svg>`);
    const fShapes = fData.paths[0].toShapes(true);
    const fGeo    = new THREE.ExtrudeGeometry(fShapes, {
      depth:          16,
      bevelEnabled:   true,
      bevelThickness: 5,
      bevelSize:      3,
      bevelSegments:  5,
    });
    fGeo.center();

    // Back blade — darker green, slightly shallower extrusion
    const bData   = loader.parse(`<svg viewBox="0 0 512 512"><path d="${SVG_BACK_BLADE}"/></svg>`);
    const bShapes = bData.paths[0].toShapes(true);
    const bGeo    = new THREE.ExtrudeGeometry(bShapes, {
      depth:          10,
      bevelEnabled:   true,
      bevelThickness: 3,
      bevelSize:      2,
      bevelSegments:  4,
    });
    bGeo.center();

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

    // Rhythmic breathing glow on the front blade
    if (frontMatRef.current) {
      frontMatRef.current.emissiveIntensity = Math.sin(t * 2.4) * 0.45 + 1.25;
    }

    // Rim pulse, slightly offset phase from the logo breath
    if (rimRef.current) {
      rimRef.current.material.emissiveIntensity = Math.sin(t * 1.7 + 1.1) * 0.3 + 0.65;
    }

    // Single outward-expanding holographic pulse ring
    if (pulseRef.current) {
      const p = (t * 0.38) % 1.0;
      pulseRef.current.scale.setScalar(0.28 + p * 3.5);
      pulseRef.current.material.opacity = Math.pow(1.0 - p, 1.25) * 0.68;
    }
  });

  // Scale: after geo.center(), the combined bolt spans ~±245 units (Y) in SVG space.
  // Map that to fit within the plaque radius.
  const emblemScale = plaqueRadius / 255;

  return (
    // Rotate -PI/2 on Y so the extruded face (+Z) now aims outward (+X from planet center)
    <group rotation={[0, -Math.PI / 2, 0]}>

      {/* ── 1. Dark circular mounting plaque ── */}
      <mesh position={[0, 0, 0]}>
        <circleGeometry args={[plaqueRadius * 1.025, 64]} />
        <meshBasicMaterial color={C.plaqueBg} side={THREE.DoubleSide} />
      </mesh>

      {/* ── 2. Carved metallic rim ring ── */}
      <mesh ref={rimRef} position={[0, 0, size * 0.003]}>
        <ringGeometry args={[plaqueRadius * 0.88, plaqueRadius * 1.00, 64]} />
        <meshStandardMaterial
          color={C.rimMid}
          emissive={C.primary}
          emissiveIntensity={0.65}
          roughness={0.18}
          metalness={0.88}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* ── 3. Back Blade (lower layer — deep brand green) ── */}
      {/* Y scale is negated to correct SVG coordinate system (Y-down → Y-up) */}
      <mesh
        geometry={backGeo}
        scale={[emblemScale, -emblemScale, emblemScale]}
        position={[0, 0, size * 0.012]}
      >
        <meshStandardMaterial
          color={C.dark}
          emissive={C.neon}
          emissiveIntensity={0.85}
          roughness={0.22}
          metalness={0.52}
        />
      </mesh>

      {/* ── 4. Front Blade (upper layer — vibrant primary, raised higher) ── */}
      <mesh
        geometry={frontGeo}
        scale={[emblemScale, -emblemScale, emblemScale]}
        position={[0, 0, size * 0.026]}
      >
        <meshStandardMaterial
          ref={frontMatRef}
          color={C.primary}
          emissive={C.neon}
          emissiveIntensity={1.25}
          roughness={0.10}
          metalness={0.58}
        />
      </mesh>

      {/* ── 5. Holographic pulse ring emitting from logo center ── */}
      <mesh ref={pulseRef} position={[0, 0, size * 0.010]}>
        <ringGeometry args={[plaqueRadius * 0.16, plaqueRadius * 0.22, 48]} />
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
      shaderMatRef.current.uCutY     = 9999.0; // Full sphere — no polar cut
    }

    // Steady planetary spin — logo sweeps the equatorial arc
    if (planetRef.current) {
      planetRef.current.rotation.y += safeDelta * 0.16;
    }
  });

  const segments = perfTierFloat >= 0.8 ? 24 : 48;

  return (
    <group rotation={[-0.38, 0, 0]}>

      {/* ── Rotating Planet Body ── */}
      <group ref={planetRef}>

        {/* ── Full Supabase-Themed Sphere ── */}
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

        {/* ── Supabase Green Atmospheric Glow Halo ── */}
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

        {/* ── Supabase Bolt Logo — Side-Mounted on Equator ── */}
        {/* Placed on the sphere surface along the +X axis (equator) */}
        <group position={[planetRadius * 1.01, 0, 0]}>
          <SupabaseEmblem size={size} planetRadius={planetRadius} />
        </group>

      </group>
    </group>
  );
}
