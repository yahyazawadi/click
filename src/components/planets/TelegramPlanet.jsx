import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader.js';
import '../../shaders/ScissorMoonShaderMaterial';

// ── Exact SVG Paper Plane Path from official Telegram icon (viewBox 0 0 32 32) ─
const SVG_PLANE_PATH =
  "M22.9866 10.2088C23.1112 9.40332 22.3454 8.76755 21.6292 9.082L7.36482 15.3448C6.85123 15.5703 6.8888 16.3483 7.42147 16.5179L10.3631 17.4547C10.9246 17.6335 11.5325 17.541 12.0228 17.2023L18.655 12.6203C18.855 12.4821 19.073 12.7665 18.9021 12.9426L14.1281 17.8646C13.665 18.3421 13.7569 19.1512 14.314 19.5005L19.659 22.8523C20.2585 23.2282 21.0297 22.8506 21.1418 22.1261L22.9866 10.2088Z";

// ── True 3D Symmetrical Origami Glider Geometry ─────────────────────────────
function createOrigamiGliderGeometry() {
  // Key 3D folded paper vertices (Symmetrical & dimensional)
  // Coordinates are normalized [-1, 1]
  const N   = [ 0.00,  1.05,  0.18 ];  // 0: Nose Tip (Pointed apex)
  const WL  = [-0.92, -0.70,  0.36 ];  // 1: Left Wingtip (Swept back & raised up)
  const WR  = [ 0.92, -0.70,  0.36 ];  // 2: Right Wingtip (Swept back & raised up)
  const NL  = [-0.28, -0.58,  0.06 ];  // 3: Left Inner Notch / Crease
  const NR  = [ 0.28, -0.58,  0.06 ];  // 4: Right Inner Notch / Crease
  const T   = [ 0.00, -0.52,  0.14 ];  // 5: Center Tail Spine End
  const K   = [ 0.00, -0.32, -0.28 ];  // 6: Underbody Keel / Fuselage Bottom (Underfold)

  // Triangles defining the faceted origami paper plane
  const positions = [
    // ── Upper Left Wing (Tilted upward facet) ──
    ...N, ...WL, ...NL,
    // ── Upper Right Wing (Tilted upward facet) ──
    ...N, ...NR, ...WR,

    // ── Center Dorsal Spine Left ──
    ...N, ...NL, ...T,
    // ── Center Dorsal Spine Right ──
    ...N, ...T, ...NR,

    // ── Underbody Left Keel (Under-fold shadow facet) ──
    ...N, ...K, ...NL,
    // ── Underbody Right Keel (Under-fold shadow facet) ──
    ...N, ...NR, ...K,

    // ── Rear Keel Tail Walls ──
    ...NL, ...K, ...T,
    ...NR, ...T, ...K,

    // ── Double-Sided Underwing Faces ──
    ...N, ...NL, ...WL,
    ...N, ...WR, ...NR,
    ...N, ...T, ...NL,
    ...N, ...NR, ...T,
  ];

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.computeVertexNormals();
  return geo;
}

// ── 3D Official Telegram Carved Emblem with Live Pulse Waves ─────────────────
function TelegramEmbossedEmblem({ size, diskRadius }) {
  const CYAN       = '#229ED9';
  const CYAN_GLOW  = '#40c8ff';
  const PURE_BLACK = '#000000';

  const logoMatRef = useRef();
  const pulse1Ref  = useRef();
  const pulse2Ref  = useRef();

  // Create the 3D Origami Glider Geometry
  const gliderGeo = useMemo(() => createOrigamiGliderGeometry(), []);

  useEffect(() => {
    return () => {
      gliderGeo.dispose();
    };
  }, [gliderGeo]);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();

    // 1. Rhythmic breathing glow on the 3D glider
    if (logoMatRef.current) {
      const breath = Math.sin(t * 3.5) * 0.40 + 1.40;
      logoMatRef.current.emissiveIntensity = breath;
    }

    // 2. Outward expanding holographic pulse wave 1
    if (pulse1Ref.current) {
      const p1 = (t * 1.4) % 1.0;
      pulse1Ref.current.scale.setScalar(0.70 + p1 * 0.55);
      pulse1Ref.current.position.z = size * 0.015 + p1 * (size * 0.04);
      pulse1Ref.current.material.opacity = (1.0 - p1) * 0.65;
    }

    // 3. Offset outward expanding holographic pulse wave 2
    if (pulse2Ref.current) {
      const p2 = (t * 1.4 + 0.5) % 1.0;
      pulse2Ref.current.scale.setScalar(0.70 + p2 * 0.55);
      pulse2Ref.current.position.z = size * 0.015 + p2 * (size * 0.04);
      pulse2Ref.current.material.opacity = (1.0 - p2) * 0.65;
    }
  });

  // Scale of the 3D glider relative to the carved facet
  const gliderScale = diskRadius * 0.52;

  return (
    <group rotation={[-Math.PI / 2, 0, 0]}>
      {/* ── 1. Pure 2D Flat Black Slicing Disk (Seals the sliced dome cleanly) ── */}
      <mesh position={[0, 0, 0]}>
        <circleGeometry args={[diskRadius * 1.015, 64]} />
        <meshBasicMaterial
          color={PURE_BLACK}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* ── 2. Carved Outer Metallic Rim with Beveled Trench ── */}
      <mesh position={[0, 0, size * 0.005]}>
        <ringGeometry args={[diskRadius * 0.94, diskRadius * 1.01, 64]} />
        <meshStandardMaterial
          color="#04182b"
          emissive={CYAN}
          emissiveIntensity={0.6}
          roughness={0.25}
          metalness={0.9}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* ── 3. Telegram Circular Border Ring (Tiered Lower Height) ── */}
      <mesh position={[0, 0, size * 0.018]}>
        <ringGeometry args={[diskRadius * 0.74, diskRadius * 0.83, 64]} />
        <meshStandardMaterial
          color={CYAN}
          emissive={CYAN_GLOW}
          emissiveIntensity={1.2}
          roughness={0.15}
          metalness={0.65}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* ── 4. Symmetrical 3D Origami Paper Glider (Faceted 3D Sculpt with Banked Stance) ── */}
      <group
        position={[-diskRadius * 0.02, diskRadius * 0.02, size * 0.040]}
        rotation={[Math.PI * 0.06, Math.PI * 0.04, -Math.PI * 0.22]}
        scale={[gliderScale, gliderScale, gliderScale * 1.15]}
      >
        <mesh geometry={gliderGeo}>
          <meshStandardMaterial
            ref={logoMatRef}
            color={CYAN}
            emissive={CYAN_GLOW}
            emissiveIntensity={1.4}
            roughness={0.18}
            metalness={0.55}
            flatShading={true}
            side={THREE.DoubleSide}
          />
        </mesh>
      </group>

      {/* ── 5. Holographic Pulse Wave Rings emitting from the carved logo ── */}
      <mesh ref={pulse1Ref} position={[0, 0, size * 0.015]}>
        <ringGeometry args={[diskRadius * 0.42, diskRadius * 0.48, 48]} />
        <meshBasicMaterial
          color="#40c8ff"
          transparent
          opacity={0.6}
          side={THREE.DoubleSide}
        />
      </mesh>

      <mesh ref={pulse2Ref} position={[0, 0, size * 0.015]}>
        <ringGeometry args={[diskRadius * 0.42, diskRadius * 0.48, 48]} />
        <meshBasicMaterial
          color="#229ED9"
          transparent
          opacity={0.6}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}

// ── Main TelegramPlanet ───────────────────────────────────────────────────────
export function TelegramPlanet({ size, isMobile, perfTierFloat = 0.0 }) {
  const planetRef    = useRef();
  const shaderMatRef = useRef();

  const planetRadius = size * 0.85;
  // Y level where the cut happens (slices top ~20% off the sphere)
  const cutY = planetRadius * 0.78;
  // Radius of the circle where the sphere is sliced at cutY
  const diskRadius = Math.sqrt(planetRadius * planetRadius - cutY * cutY);

  useFrame((state, delta) => {
    const t = state.clock.getElapsedTime();
    const safeDelta = Math.min(delta, 0.1);

    if (shaderMatRef.current) {
      shaderMatRef.current.uTime     = t;
      shaderMatRef.current.uPerfTier = perfTierFloat;
      shaderMatRef.current.uCutY     = cutY;
    }

    // Steady planet rotation — logo disk rotates seamlessly with the sliced sphere
    if (planetRef.current) {
      planetRef.current.rotation.y += safeDelta * 0.18;
    }
  });

  const segments = perfTierFloat >= 0.8 ? 24 : 48;

  return (
    <group>
      {/* ── Rotating Planet Body ── */}
      <group ref={planetRef}>
        {/* Sphere with top sliced off via GLSL discard */}
        <mesh>
          <sphereGeometry args={[planetRadius, segments, segments]} />
          <scissorMoonShaderMaterial
            ref={shaderMatRef}
            uPerfTier={perfTierFloat}
            uCutY={cutY}
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

        {/* ── Telegram Logo Disk: flat black cap sealing the cut top ── */}
        <group position={[0, cutY, 0]}>
          <TelegramEmbossedEmblem size={size} diskRadius={diskRadius} />
        </group>
      </group>
    </group>
  );
}
