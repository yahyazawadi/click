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

  // 1. Outer Main Wings (Pure Crisp White Facets)
  const outerWingPositions = [
    // Upper Left Wing
    ...N, ...WL, ...NL,
    // Upper Right Wing
    ...N, ...NR, ...WR,

    // Double-sided back faces
    ...N, ...NL, ...WL,
    ...N, ...WR, ...NR,
  ];

  // 2. Inner Central Valley Fold / Spine (Darker Inside Shaded Facets visible from above)
  const innerFoldPositions = [
    // Center Dorsal Spine Left
    ...N, ...NL, ...T,
    // Center Dorsal Spine Right
    ...N, ...T, ...NR,

    // Double-sided back faces
    ...N, ...T, ...NL,
    ...N, ...NR, ...T,
  ];

  // 3. Lower Keel / Underbody Triangles (Shaded Origami Underside)
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

  const outerWingsGeo = new THREE.BufferGeometry();
  outerWingsGeo.setAttribute('position', new THREE.Float32BufferAttribute(outerWingPositions, 3));
  outerWingsGeo.computeVertexNormals();

  const innerFoldGeo = new THREE.BufferGeometry();
  innerFoldGeo.setAttribute('position', new THREE.Float32BufferAttribute(innerFoldPositions, 3));
  innerFoldGeo.computeVertexNormals();

  const keelGeo = new THREE.BufferGeometry();
  keelGeo.setAttribute('position', new THREE.Float32BufferAttribute(keelPositions, 3));
  keelGeo.computeVertexNormals();

  return { outerWingsGeo, innerFoldGeo, keelGeo };
}

// ── Individual 3D Origami Glider Craft ────────────────────────────────────────
function OrigamiGlider({ outerWingsGeo, innerFoldGeo, keelGeo, scale = 1.0, logoMatRef }) {
  // 1. Top outer wings (White)
  const outerWingsColor     = '#ffffff';
  const outerWingsGlow      = '#e0f4ff';

  // 2. Center spine fold visible from above (Darker crease)
  const centerCreaseColor   = '#1a7ab5';
  const centerCreaseGlow    = '#10527c';

  // 3. Underbelly keel fold on the bottom (Azure blue)
  const underbellyKeelColor = '#229ED9';
  const underbellyKeelGlow  = '#1278ad';

  return (
    <group scale={[scale, scale, scale]}>
      {/* 1. Outer Main Wings (Pure Crisp Ice-White) */}
      <mesh geometry={outerWingsGeo}>
        <meshStandardMaterial
          ref={logoMatRef}
          color={outerWingsColor}
          emissive={outerWingsGlow}
          emissiveIntensity={0.65}
          roughness={0.15}
          metalness={0.20}
          flatShading={true}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* 2. Inner Central Fold (Darker Shaded Azure visible from above) */}
      <mesh geometry={innerFoldGeo}>
        <meshStandardMaterial
          color={centerCreaseColor}
          emissive={centerCreaseGlow}
          emissiveIntensity={0.55}
          roughness={0.22}
          metalness={0.45}
          flatShading={true}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* 3. Lower Keel Under-fold (Authentic Telegram Azure Blue) */}
      <mesh geometry={keelGeo}>
        <meshStandardMaterial
          color={underbellyKeelColor}
          emissive={underbellyKeelGlow}
          emissiveIntensity={0.50}
          roughness={0.25}
          metalness={0.45}
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
  const { outerWingsGeo, innerFoldGeo, keelGeo } = useMemo(() => createOrigamiGliderGeometries(), []);

  useEffect(() => {
    return () => {
      outerWingsGeo.dispose();
      innerFoldGeo.dispose();
      keelGeo.dispose();
    };
  }, [outerWingsGeo, innerFoldGeo, keelGeo]);

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
      logoMatRef.current.emissiveIntensity = Math.sin(t * 3.5) * 0.18 + 0.65;
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
            outerWingsGeo={outerWingsGeo}
            innerFoldGeo={innerFoldGeo}
            keelGeo={keelGeo}
            scale={gliderBaseScale * 1.25}
            logoMatRef={logoMatRef}
          />
        </group>

        {/* ── 2. Trailing Wingman Glider ── */}
        <group ref={glider2Ref}>
          <OrigamiGlider
            outerWingsGeo={outerWingsGeo}
            innerFoldGeo={innerFoldGeo}
            keelGeo={keelGeo}
            scale={gliderBaseScale * 0.85}
          />
        </group>

        {/* ── 3. Opposing Scout Glider (Ensures visibility from ALL 360° viewing angles) ── */}
        <group ref={glider3Ref}>
          <OrigamiGlider
            outerWingsGeo={outerWingsGeo}
            innerFoldGeo={innerFoldGeo}
            keelGeo={keelGeo}
            scale={gliderBaseScale * 1.10}
          />
        </group>
      </group>
    </group>
  );
}

