import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// ── Balanced Global Geospatial Hub Coordinates (Evenly distributed across hemispheres) ──
// Spherical coordinates: phi = polar angle [0, PI] (0 = North Pole, PI = South Pole)
//                        theta = azimuth angle [-PI, PI] (Longitude)
const GLOBAL_HUBS = [
  { id: 'sf',  label: 'SAN FRANCISCO', phi: 1.10, theta: -2.20, isAnchor: false }, // North America West
  { id: 'ny',  label: 'NEW YORK',      phi: 0.90, theta: -1.30, isAnchor: false }, // North America East
  { id: 'sao', label: 'SAO PAULO',     phi: 2.05, theta: -0.80, isAnchor: false }, // South America
  { id: 'lon', label: 'LONDON',        phi: 0.70, theta:  0.00, isAnchor: false }, // Europe
  { id: 'nab', label: 'NABLUS / HQ',   phi: 1.00, theta:  0.65, isAnchor: true  }, // Anchor HQ / Levant
  { id: 'cpt', label: 'CAPE TOWN',     phi: 2.15, theta:  0.35, isAnchor: false }, // Africa
  { id: 'tky', label: 'TOKYO',         phi: 0.95, theta:  2.35, isAnchor: false }, // Asia East
  { id: 'syd', label: 'SYDNEY',        phi: 2.15, theta:  2.65, isAnchor: false }, // Oceania
];

// ── Great-Circle Network Connections between Hubs (Balanced Global Web) ───────
const NETWORK_EDGES = [
  { from: 'sf',  to: 'ny',  speed: 0.50, offset: 0.00 },
  { from: 'ny',  to: 'lon', speed: 0.45, offset: 0.25 },
  { from: 'lon', to: 'nab', speed: 0.50, offset: 0.10 },
  { from: 'nab', to: 'tky', speed: 0.40, offset: 0.40 },
  { from: 'tky', to: 'syd', speed: 0.48, offset: 0.15 },
  { from: 'ny',  to: 'sao', speed: 0.42, offset: 0.50 },
  { from: 'sao', to: 'cpt', speed: 0.38, offset: 0.70 },
  { from: 'nab', to: 'cpt', speed: 0.45, offset: 0.30 },
  { from: 'sf',  to: 'tky', speed: 0.35, offset: 0.85 },
];

// Helper: spherical (phi, theta, radius) to 3D Cartesian Vector3
function sphericalToVector3(phi, theta, r) {
  const x = r * Math.sin(phi) * Math.sin(theta);
  const y = r * Math.cos(phi);
  const z = r * Math.sin(phi) * Math.cos(theta);
  return new THREE.Vector3(x, y, z);
}

// ── Surface Great-Circle Path Generator (Hugs the planet surface directly) ──
function generateGreatCircleArc(p1, p2, planetRadius, numSegments = 36) {
  const u1 = p1.clone().normalize();
  const u2 = p2.clone().normalize();

  // Angular distance between points in radians
  const angle = Math.max(0.001, u1.angleTo(u2));
  const sinAngle = Math.sin(angle);

  // Sits flush directly on the planet surface skin (+0.3% to prevent z-fighting with sphere)
  const surfaceRadius = planetRadius * 1.004;

  const points = [];
  for (let i = 0; i <= numSegments; i++) {
    const t = i / numSegments;

    // Slerp interpolation on unit sphere surface
    let u;
    if (sinAngle < 0.0001) {
      u = u1.clone().lerp(u2, t).normalize();
    } else {
      const a = Math.sin((1 - t) * angle) / sinAngle;
      const b = Math.sin(t * angle) / sinAngle;
      u = new THREE.Vector3(
        a * u1.x + b * u2.x,
        a * u1.y + b * u2.y,
        a * u1.z + b * u2.z
      ).normalize();
    }

    points.push(u.multiplyScalar(surfaceRadius));
  }

  return new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.0);
}

// ── High-Res Vector Mapbox Pin Sprite Texture Generator ──────────────────────
// Creates a clean, crisp Mapbox droplet pin without fuzzy background rings
function createPinTexture(isAnchor = false) {
  if (typeof document === 'undefined') return null;

  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  // Modern sleek teardrop pin silhouette (tip points exactly to bottom x=128, y=242)
  ctx.beginPath();
  ctx.moveTo(128, 242); // Crisp pointed needle tip
  ctx.bezierCurveTo(84, 168, 62, 126, 62, 84);
  ctx.arc(128, 84, 66, Math.PI, 0, false);
  ctx.bezierCurveTo(194, 126, 172, 168, 128, 242);
  ctx.closePath();

  // Gradient fill matching Mapbox telemetry palette (Radiant Cyan to Deep Electric Blue)
  const pinGrad = ctx.createLinearGradient(128, 18, 128, 242);
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

  // Crisp white outer rim
  ctx.lineWidth = 8;
  ctx.strokeStyle = '#FFFFFF';
  ctx.stroke();

  // Glowing inner aperture / core dot
  ctx.beginPath();
  ctx.arc(128, 84, 25, 0, Math.PI * 2);
  ctx.fillStyle = '#FFFFFF';
  ctx.shadowColor = '#00F0FF';
  ctx.shadowBlur = 14;
  ctx.fill();

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

export function MapboxPlanet({ size = 0.5, isMobile = false, perfTierFloat = 0.0 }) {
  const planetGroupRef = useRef();
  const photonRefs     = useRef([]);
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
    return GLOBAL_HUBS.map((hub) => {
      const surfacePos = sphericalToVector3(hub.phi, hub.theta, planetRadius);
      const normal = surfacePos.clone().normalize();

      return {
        ...hub,
        surfacePos,
        normal,
      };
    });
  }, [planetRadius]);

  const hubMap = useMemo(() => {
    const map = new Map();
    hubs.forEach((h) => map.set(h.id, h));
    return map;
  }, [hubs]);

  // 3. Surface Great-Circle Paths (Hugs the planet surface)
  const edgeCurves = useMemo(() => {
    return NETWORK_EDGES.map((edge) => {
      const fromHub = hubMap.get(edge.from);
      const toHub   = hubMap.get(edge.to);
      if (!fromHub || !toHub) return null;

      const curve = generateGreatCircleArc(
        fromHub.surfacePos,
        toHub.surfacePos,
        planetRadius,
        isMobile ? 24 : 40
      );

      const tubeGeo = new THREE.TubeGeometry(
        curve,
        isMobile ? 28 : 48,
        size * 0.006,
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

  // Zero-allocation reusable vectors for camera-facing horizon dot products
  const tempPos      = useMemo(() => new THREE.Vector3(), []);
  const vHubWorld    = useMemo(() => new THREE.Vector3(), []);
  const vPlanetWorld = useMemo(() => new THREE.Vector3(), []);
  const vCamDir      = useMemo(() => new THREE.Vector3(), []);
  const vHubNorm     = useMemo(() => new THREE.Vector3(), []);

  // 4. Animation loop: Planetary spin, photon data packets, and camera-facing horizon culling
  useFrame((state, delta) => {
    const t = state.clock.getElapsedTime();
    const safeDelta = Math.min(delta, 0.1);

    // Smooth planetary spin
    if (planetGroupRef.current) {
      planetGroupRef.current.rotation.y += safeDelta * 0.12;

      // Get world position of planet center and normalized vector toward camera
      planetGroupRef.current.getWorldPosition(vPlanetWorld);
      vCamDir.subVectors(state.camera.position, vPlanetWorld).normalize();

      // Check each hub: if dot > 0, it's on the FRONT hemisphere facing viewer.
      // If dot <= 0, it's on the BACK hemisphere (hidden behind planet).
      hubs.forEach((hub, i) => {
        vHubWorld.copy(hub.surfacePos).applyMatrix4(planetGroupRef.current.matrixWorld);
        vHubNorm.subVectors(vHubWorld, vPlanetWorld).normalize();

        const dot = vHubNorm.dot(vCamDir);
        const sprite = spriteRefs.current[i];

        if (sprite) {
          if (dot <= 0.0) {
            // Completely behind the planet
            sprite.visible = false;
          } else {
            sprite.visible = true;
            // Smooth edge fade across horizon limb (0.0 -> 0.22)
            const edgeFade = Math.min(1.0, dot * 4.5);
            const baseScale = (size * 0.23) * (hub.isAnchor ? 1.15 : 1.0);
            sprite.scale.set(baseScale, baseScale, 1);
            if (sprite.material) {
              sprite.material.opacity = edgeFade;
            }
          }
        }
      });
    }

    // A. Animate glowing data photons along the Great-Circle curves
    edgeCurves.forEach((edge, i) => {
      const photonMesh = photonRefs.current[i];
      if (photonMesh && edge.curve) {
        const progress = ((t * edge.speed + edge.offset) % 1.0 + 1.0) % 1.0;
        edge.curve.getPoint(progress, tempPos);
        photonMesh.position.copy(tempPos);

        if (photonMesh.material) {
          photonMesh.material.emissiveIntensity = 2.2;
        }
      }
    });
  });

  // Pin sprite base scale
  const pinSpriteScale = size * 0.23;

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

        {/* 4. Great-Circle Geodesic Arcs & Animated Photons (100% Elevated Above Surface) */}
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
                opacity={0.85}
              />
            </mesh>

            {/* Glowing Photon Packet gliding along surface path */}
            <mesh ref={(el) => (photonRefs.current[i] = el)}>
              <sphereGeometry args={[size * 0.016, 10, 10]} />
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

        {/* 5. Clean, Camera-Facing Location Pin Sprites (No Cluttered Ground Circles) */}
        {hubs.map((hub, i) => (
          <group key={hub.id} position={hub.surfacePos}>
            {/* Sleek Camera-Facing Location Pin Sprite */}
            {/* depthTest={false} + renderOrder={100} prevents the sphere curvature from clipping the pin */}
            {standardPinTex && (
              <sprite
                ref={(el) => (spriteRefs.current[i] = el)}
                scale={[pinSpriteScale, pinSpriteScale, 1]}
                center={[0.5, 0.03]}
                renderOrder={100}
              >
                <spriteMaterial
                  map={hub.isAnchor ? anchorPinTex : standardPinTex}
                  transparent={true}
                  depthWrite={false}
                  depthTest={false}
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
