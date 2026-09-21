import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader.js';
import '../../shaders/ApifyPlanetShaderMaterial';

// ── Official Apify Logo SVG Paths (Original coordinate space: 0 0 184 184) ────
// 1. Right Monolithic Pillar — Electric Royal Blue (#246DFF)
const SVG_BLUE_PILLAR =
  'M105.384 0.898438H180.456C181.984 0.898438 183.222 2.13325 183.222 3.65647V118.095C183.222 120.836 179.648 121.898 178.143 119.605L103.07 5.1666C101.867 3.33229 103.187 0.898438 105.384 0.898438Z';

// 2. Left Monolithic Pillar — Vivid Emerald Green (#20A34E)
const SVG_GREEN_PILLAR =
  'M78.5665 0.898438H3.49381C1.96671 0.898438 0.72876 2.13325 0.72876 3.65647V118.095C0.72876 120.836 4.30287 121.898 5.80754 119.605L80.8803 5.1666C82.0837 3.33229 80.7642 0.898438 78.5665 0.898438Z';

// 3. Bottom Chevron Base — Solar Orange (#F86606)
const SVG_ORANGE_CHEVRON =
  'M90.6893 92.5211L5.40652 178.227C3.67468 179.968 4.91061 182.928 7.36901 182.928H176.652C179.1 182.928 180.341 179.988 178.63 178.241L94.6289 92.5361C93.55 91.4353 91.7765 91.4285 90.6893 92.5211Z';

// ── Official Apify Color Palette ─────────────────────────────────────────────
const C = {
  electricBlue:  '#246DFF', // Apify Right Pillar & Primary Core
  deepBlue:      '#0A4CD2', // Secondary Oceanic Depth
  emeraldGreen:  '#20A34E', // Apify Left Pillar & Continents
  emeraldBright: '#2EE26D', // Radiant Emerald Highlight
  solarOrange:   '#F86606', // Apify Base Chevron & Solar Belts
  amberWarm:     '#FFA347', // Glowing Scraper Data Flare
  crispWhite:    '#FFFFFF', // High-altitude Clouds & Polar Data
  charcoalDark:  '#1F2123', // Apify Brand Charcoal Base Ring
};

// ── 3D Architectural Apify Monolith Emblem ───────────────────────────────────
function ApifyEmblem({ size, planetRadius, isMobile }) {
  const blueMatRef   = useRef();
  const greenMatRef  = useRef();
  const orangeMatRef = useRef();
  const lightRef     = useRef();
  const pulseRef     = useRef();

  const emblemScale = (planetRadius * 0.44) / 92;

  const { blueGeo, greenGeo, orangeGeo } = useMemo(() => {
    const loader = new SVGLoader();

    // Center in 184x184 space, then invert Y so top is +Y in Three.js coordinates
    const centerMatrix = new THREE.Matrix4()
      .makeScale(1, -1, 1)
      .multiply(new THREE.Matrix4().makeTranslation(-92, -92, 0));

    const extrudeConfig = (depth, bevelThick) => ({
      depth,
      bevelEnabled:   true,
      bevelThickness: bevelThick,
      bevelSize:      bevelThick * 0.5,
      bevelSegments:  isMobile ? 1 : 4,
    });

    // 1. Right Blue Pillar (Official Apify Electric Blue #246DFF)
    const bData   = loader.parse(`<svg viewBox="0 0 184 184"><path d="${SVG_BLUE_PILLAR}"/></svg>`);
    const bShapes = bData.paths[0].toShapes(true);
    const bGeo    = new THREE.ExtrudeGeometry(bShapes, extrudeConfig(20, 2.6));
    bGeo.applyMatrix4(centerMatrix);

    // 2. Left Green Pillar (Official Apify Vivid Emerald Green #20A34E)
    const gData   = loader.parse(`<svg viewBox="0 0 184 184"><path d="${SVG_GREEN_PILLAR}"/></svg>`);
    const gShapes = gData.paths[0].toShapes(true);
    const gGeo    = new THREE.ExtrudeGeometry(gShapes, extrudeConfig(20, 2.6));
    gGeo.applyMatrix4(centerMatrix);

    // 3. Bottom Orange Chevron (Official Apify Solar Orange #F86606)
    const oData   = loader.parse(`<svg viewBox="0 0 184 184"><path d="${SVG_ORANGE_CHEVRON}"/></svg>`);
    const oShapes = oData.paths[0].toShapes(true);
    const oGeo    = new THREE.ExtrudeGeometry(oShapes, extrudeConfig(24, 3.0));
    oGeo.applyMatrix4(centerMatrix);

    return { blueGeo: bGeo, greenGeo: gGeo, orangeGeo: oGeo };
  }, [isMobile]);

  useEffect(() => {
    return () => {
      blueGeo?.dispose?.();
      greenGeo?.dispose?.();
      orangeGeo?.dispose?.();
    };
  }, [blueGeo, greenGeo, orangeGeo]);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();

    // Rhythmic data pipeline pulse
    if (blueMatRef.current) {
      blueMatRef.current.emissiveIntensity = 1.4 + Math.sin(t * 3.2) * 0.45;
    }
    if (greenMatRef.current) {
      greenMatRef.current.emissiveIntensity = 1.4 + Math.sin(t * 3.2 + 1.2) * 0.45;
    }
    if (orangeMatRef.current) {
      orangeMatRef.current.emissiveIntensity = 1.7 + Math.sin(t * 3.2 + 2.4) * 0.55;
    }

    // Dynamic specular glint
    if (lightRef.current) {
      lightRef.current.intensity = 2.8 + Math.sin(t * 2.5) * 0.8;
    }

    // Expanding holographic foundation shockwave
    if (pulseRef.current) {
      const p = (t * 0.45) % 1.0;
      pulseRef.current.scale.setScalar(0.5 + p * 2.4);
      pulseRef.current.material.opacity = Math.pow(1.0 - p, 1.4) * 0.8;
    }
  });

  return (
    <group position={[0, 0, planetRadius * 0.99]}>
      {/* Local cool-white point light — premium, not neon */}
      <pointLight
        ref={lightRef}
        color="#b8d0ff"
        intensity={1.8}
        distance={size * 3.2}
        position={[0, 0, size * 0.4]}
      />

      {/* 1. Sleek Charcoal & Electric Base Ring */}
      <mesh position={[0, 0, -0.002]}>
        <ringGeometry args={[planetRadius * 0.32, planetRadius * 0.42, 64]} />
        <meshStandardMaterial
          color={C.charcoalDark}
          emissive={C.electricBlue}
          emissiveIntensity={0.7}
          roughness={0.12}
          metalness={0.92}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* 2. Left Monolithic Pillar (Vivid Emerald Green #20A34E) */}
      <mesh
        geometry={greenGeo}
        scale={[emblemScale, emblemScale, emblemScale]}
        position={[0, 0, -0.004]}
      >
        <meshStandardMaterial
          ref={greenMatRef}
          color={C.emeraldGreen}
          emissive={C.emeraldGreen}
          emissiveIntensity={0.7}
          roughness={0.12}
          metalness={0.85}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* 3. Right Monolithic Pillar (Electric Royal Blue #246DFF) */}
      <mesh
        geometry={blueGeo}
        scale={[emblemScale, emblemScale, emblemScale]}
        position={[0, 0, -0.004]}
      >
        <meshStandardMaterial
          ref={blueMatRef}
          color={C.electricBlue}
          emissive={C.electricBlue}
          emissiveIntensity={0.7}
          roughness={0.12}
          metalness={0.85}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* 4. Bottom Chevron Base (Solar Orange #F86606) */}
      <mesh
        geometry={orangeGeo}
        scale={[emblemScale, emblemScale, emblemScale]}
        position={[0, 0, -0.003]}
      >
        <meshStandardMaterial
          ref={orangeMatRef}
          color={C.solarOrange}
          emissive={C.solarOrange}
          emissiveIntensity={0.9}
          roughness={0.10}
          metalness={0.88}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* 5. Holographic Foundation Pulse Ring — subtle blue */}
      <mesh ref={pulseRef} position={[0, 0, 0.004]}>
        <ringGeometry args={[planetRadius * 0.22, planetRadius * 0.26, 48]} />
        <meshBasicMaterial
          color={C.electricBlue}
          transparent
          opacity={0.5}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}

// ── Main Apify Planet Component ──────────────────────────────────────────────
export function ApifyPlanet({ size, isMobile, perfTierFloat = 0.0 }) {
  const planetRef    = useRef();
  const shaderMatRef = useRef();

  const planetRadius = size * 0.85;

  useFrame((state, delta) => {
    const t = state.clock.getElapsedTime();
    const safeDelta = Math.min(delta, 0.1);

    if (shaderMatRef.current) {
      shaderMatRef.current.uTime     = t;
      shaderMatRef.current.uPerfTier = perfTierFloat;
    }

    // Steady planetary rotation
    if (planetRef.current) {
      planetRef.current.rotation.y += safeDelta * 0.18;
    }
  });

  const segments = perfTierFloat >= 0.8 ? 24 : 48;

  return (
    <group rotation={[-0.28, 0, 0.12]}>
      {/* ── Rotating Planet Body ── */}
      <group ref={planetRef}>
        {/* ── Core Celestial Sphere Painted Purely in Official Apify Colors ── */}
        <mesh>
          <sphereGeometry args={[planetRadius, segments, segments]} />
          <apifyPlanetShaderMaterial
            ref={shaderMatRef}
            uPerfTier={perfTierFloat}
            uApifyBlue={new THREE.Color(C.electricBlue)}
            uApifyBlueDeep={new THREE.Color(C.deepBlue)}
            uApifyGreen={new THREE.Color(C.emeraldGreen)}
            uApifyGreenLit={new THREE.Color(C.emeraldBright)}
            uApifyOrange={new THREE.Color(C.solarOrange)}
            uApifyAmber={new THREE.Color(C.amberWarm)}
            uCrispWhite={new THREE.Color(C.crispWhite)}
            uAtmosphere={new THREE.Color(C.electricBlue)}
          />
        </mesh>

        {/* ── Single deep-blue atmospheric halo — calm, premium ── */}
        <mesh>
          <sphereGeometry args={[planetRadius * 1.048, 32, 32]} />
          <meshStandardMaterial
            color="#1a3a7a"
            emissive="#1a3a7a"
            emissiveIntensity={0.22}
            transparent
            opacity={0.13}
            side={THREE.BackSide}
          />
        </mesh>

        {/* ── Apify 3D Monolith Emblem (Mounted at Equator Face) ── */}
        <ApifyEmblem size={size} planetRadius={planetRadius} isMobile={isMobile} />
      </group>
    </group>
  );
}
