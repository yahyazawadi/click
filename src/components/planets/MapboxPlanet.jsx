import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// ── Global Geospatial Hub Coordinates ─────────────────────────────────────────
// Spherical coordinates: phi = polar angle [0, PI], theta = azimuth [0, 2*PI]
const GLOBAL_HUBS = [
  { id: 'sf',  label: 'SAN FRANCISCO', phi: 0.92, theta: -2.13, isAnchor: false },
  { id: 'ny',  label: 'NEW YORK',      phi: 0.86, theta: -1.30, isAnchor: false },
  { id: 'lon', label: 'LONDON',        phi: 0.67, theta:  0.00, isAnchor: false },
  { id: 'nab', label: 'NABLUS / HQ',   phi: 1.01, theta:  0.61, isAnchor: true  }, // Main Origin Hub
  { id: 'dxb', label: 'DUBAI',         phi: 1.13, theta:  0.96, isAnchor: false },
  { id: 'tky', label: 'TOKYO',         phi: 0.95, theta:  2.44, isAnchor: false },
  { id: 'syd', label: 'SYDNEY',        phi: 2.16, theta:  2.64, isAnchor: false },
  { id: 'sao', label: 'SAO PAULO',     phi: 2.00, theta: -0.81, isAnchor: false },
];

// ── Great-Circle Network Connections between Hubs ─────────────────────────────
const NETWORK_EDGES = [
  { from: 'sf',  to: 'ny',  speed: 0.55, offset: 0.00 },
  { from: 'ny',  to: 'lon', speed: 0.45, offset: 0.30 },
  { from: 'lon', to: 'nab', speed: 0.50, offset: 0.15 },
  { from: 'nab', to: 'dxb', speed: 0.65, offset: 0.45 },
  { from: 'dxb', to: 'tky', speed: 0.40, offset: 0.65 },
  { from: 'tky', to: 'syd', speed: 0.48, offset: 0.20 },
  { from: 'ny',  to: 'sao', speed: 0.42, offset: 0.55 },
  { from: 'sf',  to: 'tky', speed: 0.35, offset: 0.80 },
];

// Helper: spherical (phi, theta, radius) to 3D Cartesian Vector3
function sphericalToVector3(phi, theta, r) {
  const x = r * Math.sin(phi) * Math.sin(theta);
  const y = r * Math.cos(phi);
  const z = r * Math.sin(phi) * Math.cos(theta);
  return new THREE.Vector3(x, y, z);
}

// ── High-Res Vector Mapbox Pin Sprite Texture Generator ──────────────────────
// Creates a crisp, clean SVG-style Mapbox droplet pin with glowing dot and gradient
function createPinTexture(isAnchor = false) {
  if (typeof document === 'undefined') return null;

  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  // 1. Soft radial background bloom
  const glowGrad = ctx.createRadialGradient(128, 86, 8, 128, 86, 75);
  glowGrad.addColorStop(0, isAnchor ? 'rgba(0, 240, 255, 0.65)' : 'rgba(0, 186, 227, 0.45)');
  glowGrad.addColorStop(1, 'rgba(0, 186, 227, 0)');
  ctx.fillStyle = glowGrad;
  ctx.beginPath();
  ctx.arc(128, 86, 75, 0, Math.PI * 2);
  ctx.fill();

  // 2. Modern sleek teardrop pin silhouette (tip points exactly to bottom x=128, y=240)
  ctx.beginPath();
  ctx.moveTo(128, 238); // Crisp pointed tip
  ctx.bezierCurveTo(86, 168, 64, 126, 64, 86);
  ctx.arc(128, 86, 64, Math.PI, 0, false);
  ctx.bezierCurveTo(192, 126, 170, 168, 128, 238);
  ctx.closePath();

  // Gradient fill matching Mapbox telemetry palette (Radiant Cyan to Deep Electric Blue)
  const pinGrad = ctx.createLinearGradient(128, 22, 128, 238);
  if (isAnchor) {
    pinGrad.addColorStop(0, '#FFFFFF');
    pinGrad.addColorStop(0.35, '#00F0FF');
    pinGrad.addColorStop(1, '#007ACC');
  } else {
    pinGrad.addColorStop(0, '#5CE1E6');
    pinGrad.addColorStop(0.4, '#00BAE3');
    pinGrad.addColorStop(1, '#004B87');
  }
  ctx.fillStyle = pinGrad;
  ctx.fill();

  // 3. Crisp white outer rim
  ctx.lineWidth = 7;
  ctx.strokeStyle = '#FFFFFF';
  ctx.stroke();

  // 4. Glowing inner aperture / core dot
  ctx.beginPath();
  ctx.arc(128, 86, 24, 0, Math.PI * 2);
  ctx.fillStyle = '#FFFFFF';
  ctx.shadowColor = '#00F0FF';
  ctx.shadowBlur = 16;
  ctx.fill();

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

export function MapboxPlanet({ size = 0.5, isMobile = false, perfTierFloat = 0.0 }) {
  const planetGroupRef = useRef();
  const photonRefs     = useRef([]);
  const rippleMatsRef  = useRef([]);
  const spriteRefs     = useRef([]);

  const planetRadius = size * 0.85;

  // 1. Sleek Billboarding Pin Textures (Shared across all sprites)
  const { standardPinTex, anchorPinTex } = useMemo(() => {
    return {
      standardPinTex: createPinTexture(false),
      anchorPinTex:   createPinTexture(true),
    };
  }, []);

  useEffect(() => {
    return () => {
      standardPinTex?.dispose();
      anchorPinTex?.dispose();
    };
  }, [standardPinTex, anchorPinTex]);

  // 2. Hub Surface Positions on the sphere
  const hubs = useMemo(() => {
    const yAxis = new THREE.Vector3(0, 1, 0);

    return GLOBAL_HUBS.map((hub) => {
      const surfacePos = sphericalToVector3(hub.phi, hub.theta, planetRadius);
      const normal = surfacePos.clone().normalize();
      const quat = new THREE.Quaternion().setFromUnitVectors(yAxis, normal);

      return {
        ...hub,
        surfacePos,
        normal,
        quat,
      };
    });
  }, [planetRadius]);

  const hubMap = useMemo(() => {
    const map = new Map();
    hubs.forEach((h) => map.set(h.id, h));
    return map;
  }, [hubs]);

  // 3. Great-Circle Geodesic Bezier Arcs & Curves
  const edgeCurves = useMemo(() => {
    return NETWORK_EDGES.map((edge) => {
      const fromHub = hubMap.get(edge.from);
      const toHub   = hubMap.get(edge.to);
      if (!fromHub || !toHub) return null;

      const p1 = fromHub.surfacePos;
      const p2 = toHub.surfacePos;

      // Spherical midpoint elevated outward along normal
      const mid = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5);
      const angle = p1.angleTo(p2);
      const elevation = planetRadius * (1.08 + Math.sin(angle * 0.5) * 0.22);
      mid.normalize().multiplyScalar(elevation);

      const curve = new THREE.QuadraticBezierCurve3(p1, mid, p2);
      const tubeGeo = new THREE.TubeGeometry(
        curve,
        isMobile ? 20 : 36,
        size * 0.009,
        isMobile ? 4 : 6,
        false
      );

      return {
        ...edge,
        curve,
        tubeGeo,
      };
    }).filter(Boolean);
  }, [hubMap, planetRadius, size, isMobile]);

  useEffect(() => {
    return () => {
      edgeCurves.forEach((e) => e.tubeGeo?.dispose());
    };
  }, [edgeCurves]);

  // Zero-allocation reusable vector
  const tempPos = useMemo(() => new THREE.Vector3(), []);

  // 4. Animation loop: Planetary spin, photon data packets, and ground radar ripples
  useFrame((state, delta) => {
    const t = state.clock.getElapsedTime();
    const safeDelta = Math.min(delta, 0.1);

    // Smooth planetary spin
    if (planetGroupRef.current) {
      planetGroupRef.current.rotation.y += safeDelta * 0.12;
    }

    // A. Animate glowing data photons along the Great-Circle curves
    edgeCurves.forEach((edge, i) => {
      const photonMesh = photonRefs.current[i];
      if (photonMesh && edge.curve) {
        const progress = ((t * edge.speed + edge.offset) % 1.0 + 1.0) % 1.0;
        edge.curve.getPoint(progress, tempPos);
        photonMesh.position.copy(tempPos);

        if (photonMesh.material) {
          photonMesh.material.emissiveIntensity = 2.0 + Math.sin(t * 6.0 + i) * 0.7;
        }
      }
    });

    // B. Subtle breathing pulse on sprites
    spriteRefs.current.forEach((sprite, i) => {
      if (sprite) {
        const pulse = 1.0 + Math.sin(t * 3.5 + i * 0.7) * 0.08;
        const baseScale = (size * 0.26) * (hubs[i]?.isAnchor ? 1.15 : 1.0);
        sprite.scale.set(baseScale * pulse, baseScale * pulse, 1);
      }
    });

    // C. Ground Radar Wave Ripples at Pin Anchor Points
    rippleMatsRef.current.forEach((mat, i) => {
      if (mat) {
        const phase = ((t * 0.55 + i * 0.22) % 1.0 + 1.0) % 1.0;
        const s = 0.5 + phase * 1.6;
        if (mat.__groupRef) {
          mat.__groupRef.scale.set(s, s, s);
        }
        mat.opacity = Math.pow(1.0 - phase, 1.4) * 0.7;
      }
    });
  });

  // Pin sprite scale (proportional to planet size)
  const pinSpriteScale = size * 0.26;

  return (
    <group rotation={[-0.32, 0, 0]}>
      {/* ── Rotating Planet Hub Frame ── */}
      <group ref={planetGroupRef}>
        {/* 1. Deep Geospatial Slate Oceanic Base */}
        <mesh>
          <sphereGeometry args={[planetRadius, perfTierFloat >= 0.8 ? 24 : 48, perfTierFloat >= 0.8 ? 24 : 48]} />
          <meshStandardMaterial
            color="#081426"
            roughness={0.5}
            metalness={0.6}
            emissive="#020a14"
            emissiveIntensity={0.5}
          />
        </mesh>

        {/* 2. Sleek Coordinate Grid Wireframe (Latitude & Longitude) */}
        <mesh>
          <sphereGeometry args={[planetRadius * 1.002, 20, 16]} />
          <meshBasicMaterial
            color="#143a63"
            wireframe={true}
            transparent={true}
            opacity={0.32}
          />
        </mesh>

        {/* 3. Glowing Equatorial Coordinate Line */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[planetRadius * 1.004, planetRadius * 1.012, 64]} />
          <meshBasicMaterial
            color="#00BAE3"
            transparent={true}
            opacity={0.55}
            side={THREE.DoubleSide}
          />
        </mesh>

        {/* 4. Great-Circle Geodesic Arcs & Animated Photons */}
        {edgeCurves.map((edge, i) => (
          <group key={`edge-${edge.from}-${edge.to}`}>
            {/* Slender Glowing 3D Path */}
            <mesh geometry={edge.tubeGeo}>
              <meshStandardMaterial
                color="#00BAE3"
                emissive="#00E5FF"
                emissiveIntensity={1.3}
                roughness={0.2}
                metalness={0.7}
                transparent={true}
                opacity={0.8}
              />
            </mesh>

            {/* Glowing Photon Packet */}
            <mesh ref={(el) => (photonRefs.current[i] = el)}>
              <sphereGeometry args={[size * 0.024, 10, 10]} />
              <meshStandardMaterial
                color="#FFFFFF"
                emissive="#00F0FF"
                emissiveIntensity={2.8}
                roughness={0.1}
                metalness={0.2}
              />
            </mesh>
          </group>
        ))}

        {/* 5. Clean, Camera-Facing Location Pin Sprites & Base Radar Ripples */}
        {hubs.map((hub, i) => (
          <group key={hub.id} position={hub.surfacePos}>
            {/* A. Surface Ground Target Ring (Fixed along surface normal) */}
            <group quaternion={hub.quat}>
              <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, size * 0.003, 0]}>
                <ringGeometry args={[size * 0.025, size * 0.045, 24]} />
                <meshBasicMaterial
                  color={hub.isAnchor ? '#00F0FF' : '#00BAE3'}
                  transparent
                  opacity={0.75}
                  side={THREE.DoubleSide}
                />
              </mesh>

              {/* Expanding Surface Radar Ripple */}
              <group ref={(g) => {
                if (g && rippleMatsRef.current[i]) {
                  rippleMatsRef.current[i].__groupRef = g;
                }
              }}>
                <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, size * 0.004, 0]}>
                  <ringGeometry args={[size * 0.035, size * 0.055, 24]} />
                  <meshBasicMaterial
                    ref={(m) => (rippleMatsRef.current[i] = m)}
                    color={hub.isAnchor ? '#00F0FF' : '#00BAE3'}
                    transparent
                    opacity={0.6}
                    side={THREE.DoubleSide}
                  />
                </mesh>
              </group>
            </group>

            {/* B. Sleek Camera-Facing Location Pin Sprite */}
            {/* Center [0.5, 0.08] anchors the bottom needle tip directly at the surface position */}
            {standardPinTex && (
              <sprite
                ref={(el) => (spriteRefs.current[i] = el)}
                scale={[pinSpriteScale, pinSpriteScale, 1]}
                center={[0.5, 0.08]}
              >
                <spriteMaterial
                  map={hub.isAnchor ? anchorPinTex : standardPinTex}
                  transparent={true}
                  depthWrite={false}
                  depthTest={true}
                />
              </sprite>
            )}
          </group>
        ))}
      </group>

      {/* Atmospheric Fresnel Outer Glow Shell */}
      <mesh>
        <sphereGeometry args={[planetRadius * 1.09, 24, 24]} />
        <meshStandardMaterial
          color="#0088FF"
          transparent
          opacity={0.07}
          side={THREE.BackSide}
          emissive="#00BAE3"
          emissiveIntensity={0.35}
        />
      </mesh>
    </group>
  );
}
