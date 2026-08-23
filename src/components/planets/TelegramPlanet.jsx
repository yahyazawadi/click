import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import '../../shaders/ScissorMoonShaderMaterial';

// ── Slender, Aerodynamic 3D Origami Glider Geometries (+Z is Forward Nose) ─
function createOrigamiGliderGeometries() {
  // Standard Aeronautical Coordinates:
  // +Z = Forward (Nose)
  // +Y = Up (Spine / Dihedral)
  // ±X = Wings (Left / Right)
  const N   = [  0.00,  0.06,  1.35 ];  // 0: Nose Tip (Forward +Z)
  const WL  = [ -0.80,  0.25, -0.75 ];  // 1: Left Wingtip (-X, dihedral up +Y, back -Z)
  const WR  = [  0.80,  0.25, -0.75 ];  // 2: Right Wingtip (+X, dihedral up +Y, back -Z)
  const NL  = [ -0.22,  0.02, -0.60 ];  // 3: Left Inner Notch
  const NR  = [  0.22,  0.02, -0.60 ];  // 4: Right Inner Notch
  const T   = [  0.00,  0.08, -0.65 ];  // 5: Dorsal Tail Spine
  const K   = [  0.00, -0.28, -0.35 ];  // 6: Underbody Keel Fuselage (Down -Y)

  // 1. Upper Main Wings & Spine (Bright Facets)
  const wingPositions = [
    // Upper Left Wing
    ...N, ...WL, ...NL,
    // Upper Right Wing
    ...N, ...NR, ...WR,
    // Center Dorsal Spine Left
    ...N, ...NL, ...T,
    // Center Dorsal Spine Right
    ...N, ...T, ...NR,

    // Double-sided back faces
    ...N, ...NL, ...WL,
    ...N, ...WR, ...NR,
    ...N, ...T, ...NL,
    ...N, ...NR, ...T,
  ];

  // 2. Lower Keel / Underbody Triangles (Shaded Origami Facets)
  const keelPositions = [
    // Underbody Left Keel
    ...N, ...K, ...NL,
    // Underbody Right Keel
    ...N, ...NR, ...K,
    // Rear Keel Tail Walls
    ...NL, ...K, ...T,
    ...NR, ...T, ...K,

    // Double-sided back faces
    ...N, ...NL, ...K,
    ...N, ...K, ...NR,
    ...NL, ...T, ...K,
    ...NR, ...K, ...T,
  ];

  const wingsGeo = new THREE.BufferGeometry();
  wingsGeo.setAttribute('position', new THREE.Float32BufferAttribute(wingPositions, 3));
  wingsGeo.computeVertexNormals();

  const keelGeo = new THREE.BufferGeometry();
  keelGeo.setAttribute('position', new THREE.Float32BufferAttribute(keelPositions, 3));
  keelGeo.computeVertexNormals();

  return { wingsGeo, keelGeo };
}

// ── Individual 3D Origami Glider Craft ────────────────────────────────────────
function OrigamiGlider({ wingsGeo, keelGeo, scale = 1.0, logoMatRef }) {
  const CYAN_BRIGHT = '#38c0ff';
  const CYAN_GLOW   = '#80e4ff';
  const SHADED_CYAN = '#1a72ab';
  const SHADED_GLOW = '#228ac8';

  return (
    <group scale={[scale, scale, scale]}>
      {/* Upper Main Wings (Bright Electric Cyan) */}
      <mesh geometry={wingsGeo}>
        <meshStandardMaterial
          ref={logoMatRef}
          color={CYAN_BRIGHT}
          emissive={CYAN_GLOW}
          emissiveIntensity={1.4}
          roughness={0.16}
          metalness={0.45}
          flatShading={true}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Lower Keel Under-fold (Medium-Shaded Azure) */}
      <mesh geometry={keelGeo}>
        <meshStandardMaterial
          color={SHADED_CYAN}
          emissive={SHADED_GLOW}
          emissiveIntensity={0.75}
          roughness={0.28}
          metalness={0.55}
          flatShading={true}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}

// ── Main TelegramPlanet with Active Orbital Glider Squadron ───────────────────
export function TelegramPlanet({ size, isMobile, perfTierFloat = 0.0 }) {
  const planetRef      = useRef();
  const shaderMatRef   = useRef();
  const logoMatRef     = useRef();

  // Glider references for dynamic orbital flight paths
  const glider1Ref     = useRef();
  const glider2Ref     = useRef();
  const glider3Ref     = useRef();
  const trailRingRef   = useRef();

  const planetRadius   = size * 0.85;
  const orbitRadius    = planetRadius * 1.48;

  // Build high-definition 3D origami geometries
  const { wingsGeo, keelGeo } = useMemo(() => createOrigamiGliderGeometries(), []);

  useEffect(() => {
    return () => {
      wingsGeo.dispose();
      keelGeo.dispose();
    };
  }, [wingsGeo, keelGeo]);

  useFrame((state, delta) => {
    const t = state.clock.getElapsedTime();
    const safeDelta = Math.min(delta, 0.1);

    // Planet terrain shader update
    if (shaderMatRef.current) {
      shaderMatRef.current.uTime     = t;
      shaderMatRef.current.uPerfTier = perfTierFloat;
      shaderMatRef.current.uCutY     = 9999.0; // Render full celestial sphere
    }

    // Steady planet rotation
    if (planetRef.current) {
      planetRef.current.rotation.y += safeDelta * 0.14;
    }

    // Rhythmic breathing emissive glow on gliders
    if (logoMatRef.current) {
      logoMatRef.current.emissiveIntensity = Math.sin(t * 3.5) * 0.40 + 1.40;
    }

    // ── Orbital Flight Kinematics for 3 Gliders (Forward-Facing lookAt) ──
    const speed = 0.85;

    // Helper to position and point glider directly forward along the flight trajectory
    const updateGlider = (ref, angleOffset, radius, bankAngle) => {
      if (!ref.current) return;
      const angle = t * speed + angleOffset;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const y = Math.sin(angle * 2.0) * (size * 0.06);

      ref.current.position.set(x, y, z);

      // Exact tangent flight heading in orbital plane (Nose is local +Z)
      const forwardX = -Math.sin(angle);
      const forwardZ =  Math.cos(angle);
      const heading = Math.atan2(forwardX, forwardZ);

      // Lock heading around Y axis
      ref.current.rotation.set(0, heading, 0);

      // Subtle flight pitch following wave undulation
      const pitch = Math.cos(angle * 2.0) * 0.10;
      ref.current.rotateX(-pitch);

      // Inward banking roll into the turn around the fuselage axis (+Z)
      ref.current.rotateZ(bankAngle);
    };

    // Glider 1: Lead flagship glider
    updateGlider(glider1Ref, 0.0, orbitRadius, -Math.PI * 0.25);

    // Glider 2: Trailing wingman (close formation)
    updateGlider(glider2Ref, -0.38, orbitRadius * 0.94, -Math.PI * 0.28);

    // Glider 3: Opposing celestial scout (180° opposite for 360° all-around visibility)
    updateGlider(glider3Ref, Math.PI, orbitRadius * 1.04, -Math.PI * 0.25);

    // Slipstream pulse animation
    if (trailRingRef.current) {
      trailRingRef.current.material.opacity = Math.sin(t * 2.5) * 0.15 + 0.35;
    }
  });

  const segments = perfTierFloat >= 0.8 ? 24 : 48;
  const gliderBaseScale = size * 0.22;

  return (
    <group>
      {/* ── Complete Celestial Cyan/Azure Planet ── */}
      <group ref={planetRef}>
        <mesh>
          <sphereGeometry args={[planetRadius, segments, segments]} />
          <scissorMoonShaderMaterial
            ref={shaderMatRef}
            uPerfTier={perfTierFloat}
            uCutY={9999.0}
            uDeepSea={new THREE.Color('#020d1c')}
            uMidSea={new THREE.Color('#05233d')}
            uShallowSea={new THREE.Color('#09446d')}
            uCoast={new THREE.Color('#146ea3')}
            uLand={new THREE.Color('#1b5a82')}
            uForest={new THREE.Color('#0c3654')}
            uPolarIce={new THREE.Color('#a8e4ff')}
            uCloud={new THREE.Color('#d4f3ff')}
            uAtmosphere={new THREE.Color('#229ED9')}
            uStorm={new THREE.Color('#40c8ff')}
          />
        </mesh>

        {/* Emerald/Cyan Atmospheric Glow Rim */}
        <mesh>
          <sphereGeometry args={[planetRadius * 1.045, 32, 32]} />
          <meshStandardMaterial
            color="#229ED9"
            emissive="#229ED9"
            emissiveIntensity={0.25}
            transparent
            opacity={0.10}
            side={THREE.BackSide}
          />
        </mesh>
      </group>

      {/* ── Inclined Orbital Plane Container ── */}
      <group rotation={[Math.PI * 0.15, Math.PI * 0.08, -Math.PI * 0.12]}>
        {/* Glowing Cyan Orbital Slipstream Ribbon */}
        <mesh ref={trailRingRef} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[orbitRadius, size * 0.008, 16, 80]} />
          <meshStandardMaterial
            color="#229ED9"
            emissive="#40c8ff"
            emissiveIntensity={1.2}
            transparent
            opacity={0.4}
            roughness={0.2}
          />
        </mesh>

        {/* ── 1. Flagship Lead Glider ── */}
        <group ref={glider1Ref}>
          <OrigamiGlider
            wingsGeo={wingsGeo}
            keelGeo={keelGeo}
            scale={gliderBaseScale * 1.25}
            logoMatRef={logoMatRef}
          />
        </group>

        {/* ── 2. Trailing Wingman Glider ── */}
        <group ref={glider2Ref}>
          <OrigamiGlider
            wingsGeo={wingsGeo}
            keelGeo={keelGeo}
            scale={gliderBaseScale * 0.85}
          />
        </group>

        {/* ── 3. Opposing Scout Glider (Ensures visibility from ALL 360° viewing angles) ── */}
        <group ref={glider3Ref}>
          <OrigamiGlider
            wingsGeo={wingsGeo}
            keelGeo={keelGeo}
            scale={gliderBaseScale * 1.10}
          />
        </group>
      </group>
    </group>
  );
}

