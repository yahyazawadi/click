import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader.js';
import '../../shaders/ScissorMoonShaderMaterial';

// ── Exact SVG Paths from official WhatsApp icon (viewBox 0 0 16 16) ─────────
const SVG_PHONE_PATH =
  "M11.42 9.49c-.19-.09-1.1-.54-1.27-.61s-.29-.09-.42.1-.48.6-.59.73-.21.14-.4 0a5.13 5.13 0 0 1-1.49-.92 5.25 5.25 0 0 1-1-1.29c-.11-.18 0-.28.08-.38s.18-.21.28-.32a1.39 1.39 0 0 0 .18-.31.38.38 0 0 0 0-.33c0-.09-.42-1-.58-1.37s-.3-.32-.41-.32h-.4a.72.72 0 0 0-.5.23 2.1 2.1 0 0 0-.65 1.55A3.59 3.59 0 0 0 5 8.2 8.32 8.32 0 0 0 8.19 11c.44.19.78.3 1.05.39a2.53 2.53 0 0 0 1.17.07 1.93 1.93 0 0 0 1.26-.88 1.67 1.67 0 0 0 .11-.88c-.05-.07-.17-.12-.36-.21z";

const SVG_BUBBLE_PATH =
  "M13.29 2.68A7.36 7.36 0 0 0 8 .5a7.44 7.44 0 0 0-6.41 11.15l-1 3.85 3.94-1a7.4 7.4 0 0 0 3.55.9H8a7.44 7.44 0 0 0 5.29-12.72zM8 14.12a6.12 6.12 0 0 1-3.15-.87l-.22-.13-2.34.61.62-2.28-.14-.23a6.18 6.18 0 0 1 9.6-7.65 6.12 6.12 0 0 1 1.81 4.37A6.19 6.19 0 0 1 8 14.12z";

// ── 3D Official WhatsApp Inlaid Emblem on a 2D Carved Flat Facet ───────────
function WhatsAppEmbossedEmblem({ size, diskRadius }) {
  const GREEN      = '#25D366';
  const GREEN_GLOW = '#1aff7a';
  const PURE_BLACK = '#000000';

  // Parse SVG paths into 3D Extruded Geometries
  const { phoneGeo, bubbleGeo } = useMemo(() => {
    const loader = new SVGLoader();

    // 1. Official Phone Handset Shape
    const phonePathData = loader.parse(`<svg><path d="${SVG_PHONE_PATH}"/></svg>`);
    const phoneShapesList = phonePathData.paths[0].toShapes(true);
    
    const pGeo = new THREE.ExtrudeGeometry(phoneShapesList, {
      depth: 0.12,
      bevelEnabled: true,
      bevelThickness: 0.04,
      bevelSize: 0.03,
      bevelSegments: 2,
    });
    pGeo.center();

    // 2. Speech Bubble Ring Shape
    const bubblePathData = loader.parse(`<svg><path d="${SVG_BUBBLE_PATH}"/></svg>`);
    const bubbleShapesList = bubblePathData.paths[0].toShapes(true);
    
    const bGeo = new THREE.ExtrudeGeometry(bubbleShapesList, {
      depth: 0.12,
      bevelEnabled: true,
      bevelThickness: 0.04,
      bevelSize: 0.03,
      bevelSegments: 2,
    });
    bGeo.center();

    return { phoneGeo: pGeo, bubbleGeo: bGeo };
  }, []);

  useEffect(() => {
    return () => {
      phoneGeo.dispose();
      bubbleGeo.dispose();
    };
  }, [phoneGeo, bubbleGeo]);

  // Scale factor to map 16x16 SVG units cleanly inside the flat disk facet
  const emblemScale = diskRadius * 0.088;

  return (
    <group rotation={[-Math.PI / 2, 0, 0]}>
      {/* ── 1. Pure 2D Flat Black Slicing Disk (Covers the sliced dome cleanly) ── */}
      <mesh position={[0, 0, 0]}>
        <circleGeometry args={[diskRadius * 1.015, 64]} />
        <meshBasicMaterial
          color={PURE_BLACK}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* ── 2. Outer Speech Bubble Outline (Light Vibrant Green) ── */}
      <mesh
        geometry={bubbleGeo}
        scale={[emblemScale, emblemScale, emblemScale]}
        position={[0, 0, size * 0.010]}
      >
        <meshStandardMaterial
          color={GREEN}
          emissive={GREEN_GLOW}
          emissiveIntensity={1.4}
          roughness={0.2}
          metalness={0.3}
        />
      </mesh>

      {/* ── 3. Official Phone Handset Silhouette (Matched Light Green Color) ── */}
      <mesh
        geometry={phoneGeo}
        scale={[emblemScale * 1.05, emblemScale * 1.05, emblemScale * 1.05]}
        position={[0, 0, size * 0.012]}
      >
        <meshStandardMaterial
          color={GREEN}
          emissive={GREEN_GLOW}
          emissiveIntensity={1.4}
          roughness={0.2}
          metalness={0.3}
        />
      </mesh>
    </group>
  );
}

// ── Main PhonePlanet ──────────────────────────────────────────────────────────
export function PhonePlanet({ size, isMobile, perfTierFloat = 0.0 }) {
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

        {/* ── WhatsApp Logo Disk: flat black cap sealing the cut top ── */}
        <group position={[0, cutY, 0]}>
          <WhatsAppEmbossedEmblem size={size} diskRadius={diskRadius} />
        </group>
      </group>
    </group>
  );
}



