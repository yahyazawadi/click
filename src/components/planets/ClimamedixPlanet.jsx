import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// 6 Geospatial Epidemiological Sensor Node coordinates around the globe
const SENSOR_NODES = [
  { lat: 0.45, lon: 0.60, color: '#00FFAA', phase: 0.0 },   // Mediterranean / Middle East
  { lat: -0.20, lon: 1.80, color: '#00E5FF', phase: 1.2 },  // South Asia
  { lat: 0.65, lon: 3.20, color: '#38BDF8', phase: 2.4 },   // North Atlantic
  { lat: -0.50, lon: 4.50, color: '#00FFAA', phase: 3.6 },  // Southern Ocean
  { lat: 0.25, lon: 5.40, color: '#00E5FF', phase: 4.8 },   // Pacific Rim
  { lat: 0.70, lon: 1.20, color: '#38BDF8', phase: 5.5 },   // Arctic Zone
];

export function ClimamedixPlanet({ size = 0.65, color = '#00BAE3', isMobile = false }) {
  const planetGroupRef = useRef();
  const innerGlobeRef  = useRef();
  const geoGridRef     = useRef();
  const ringRef1       = useRef();
  const ringRef2       = useRef();
  const satelliteRef   = useRef();
  const beaconMatsRef  = useRef([]);

  const planetRadius = size * 0.88;
  const segments     = isMobile ? 24 : 36;
  const satOrbitR    = planetRadius * 1.58;

  // Pre-allocate geometries for clean GPU memory lifecycle
  const globeGeo = useMemo(() => new THREE.SphereGeometry(planetRadius, segments, segments), [planetRadius, segments]);
  const gridGeo  = useMemo(() => new THREE.IcosahedronGeometry(planetRadius * 1.025, isMobile ? 2 : 3), [planetRadius, isMobile]);
  const ringGeo1 = useMemo(() => new THREE.TorusGeometry(planetRadius * 1.34, 0.012, 12, isMobile ? 32 : 64), [planetRadius, isMobile]);
  const ringGeo2 = useMemo(() => new THREE.RingGeometry(planetRadius * 1.48, planetRadius * 1.56, isMobile ? 32 : 64), [planetRadius, isMobile]);
  const beaconGeo = useMemo(() => new THREE.SphereGeometry(size * 0.032, 8, 8), [size]);
  const hazeGeo  = useMemo(() => new THREE.SphereGeometry(planetRadius * 1.08, 20, 20), [planetRadius]);

  // Compute 3D positions for the sensor beacons on the surface
  const beaconPositions = useMemo(() => {
    return SENSOR_NODES.map(({ lat, lon }) => {
      const phi = Math.PI / 2 - lat;
      const theta = lon;
      const r = planetRadius * 1.03;
      return new THREE.Vector3(
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.cos(phi),
        r * Math.sin(phi) * Math.sin(theta)
      );
    });
  }, [planetRadius]);

  useEffect(() => {
    return () => {
      globeGeo.dispose();
      gridGeo.dispose();
      ringGeo1.dispose();
      ringGeo2.dispose();
      beaconGeo.dispose();
      hazeGeo.dispose();
    };
  }, [globeGeo, gridGeo, ringGeo1, ringGeo2, beaconGeo, hazeGeo]);

  useFrame((state, delta) => {
    const t = state.clock.getElapsedTime();

    // 1. Smooth planetary ground rotation
    if (innerGlobeRef.current) {
      innerGlobeRef.current.rotation.y += delta * 0.12;
    }

    // 2. Geospatial data grid counter-rotation for dynamic depth
    if (geoGridRef.current) {
      geoGridRef.current.rotation.y -= delta * 0.08;
      geoGridRef.current.rotation.z += delta * 0.03;
    }

    // 3. Gyroscopic orbital data rings
    if (ringRef1.current) {
      ringRef1.current.rotation.z += delta * 0.18;
    }
    if (ringRef2.current) {
      ringRef2.current.rotation.z -= delta * 0.10;
    }

    // 4. Miniature Climate Telemetry Satellite Orbit
    if (satelliteRef.current) {
      const satAngle = t * 0.85;
      const satY = Math.sin(satAngle * 1.2) * (planetRadius * 0.45);
      const satX = Math.cos(satAngle) * satOrbitR;
      const satZ = Math.sin(satAngle) * satOrbitR;
      satelliteRef.current.position.set(satX, satY, satZ);
      satelliteRef.current.rotation.y = satAngle + Math.PI / 2;
    }

    // 5. Sensor Beacon Pulses
    SENSOR_NODES.forEach((node, i) => {
      const mat = beaconMatsRef.current[i];
      if (mat) {
        const pulse = Math.sin(t * 3.5 + node.phase) * 0.5 + 0.5;
        mat.emissiveIntensity = 0.5 + pulse * 1.2;
      }
    });
  });

  return (
    <group ref={planetGroupRef} rotation={[0.32, 0, 0.1]}>
      {/* ── 1. Smooth Deep Ocean Base Sphere ───────────────────────────────── */}
      <mesh ref={innerGlobeRef} geometry={globeGeo}>
        <meshStandardMaterial
          color="#061F3B"
          emissive="#0A3A68"
          emissiveIntensity={0.6}
          roughness={0.3}
          metalness={0.25}
        />
      </mesh>

      {/* ── 2. Geospatial Epidemiological Data Grid (Lightweight Icosahedron) ─ */}
      <mesh ref={geoGridRef} geometry={gridGeo}>
        <meshStandardMaterial
          color="#00E5FF"
          emissive="#00BAE3"
          emissiveIntensity={0.75}
          wireframe={true}
          transparent
          opacity={0.32}
        />
      </mesh>

      {/* ── 3. Pulsing Sensor Beacons (Geospatial Telemetry Hotspots) ──────── */}
      {beaconPositions.map((pos, idx) => (
        <mesh key={idx} position={pos} geometry={beaconGeo}>
          <meshStandardMaterial
            ref={(el) => (beaconMatsRef.current[idx] = el)}
            color={SENSOR_NODES[idx].color}
            emissive={SENSOR_NODES[idx].color}
            emissiveIntensity={1.0}
            roughness={0.1}
          />
        </mesh>
      ))}

      {/* ── 4. Primary Cyan Telemetry Ring (Gyroscopic Data Ring) ──────────── */}
      <mesh ref={ringRef1} geometry={ringGeo1} rotation={[Math.PI / 3, 0.2, 0]}>
        <meshStandardMaterial
          color={color || '#00BAE3'}
          emissive={color || '#00BAE3'}
          emissiveIntensity={0.8}
          roughness={0.2}
          metalness={0.8}
        />
      </mesh>

      {/* ── 5. Secondary Outer Translucent Ring (Additive Glow) ─────────────── */}
      <mesh ref={ringRef2} geometry={ringGeo2} rotation={[-Math.PI / 3.5, -0.3, 0]}>
        <meshBasicMaterial
          color="#00E5FF"
          side={THREE.DoubleSide}
          transparent
          opacity={0.22}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* ── 6. Miniature Orbiting Climate Satellite Probe ───────────────────── */}
      <group ref={satelliteRef}>
        {/* Central Satellite Body */}
        <mesh>
          <boxGeometry args={[size * 0.05, size * 0.04, size * 0.06]} />
          <meshStandardMaterial
            color="#E6F7FF"
            emissive="#00BAE3"
            emissiveIntensity={0.5}
            metalness={0.9}
            roughness={0.1}
          />
        </mesh>
        {/* Left Solar Wing */}
        <mesh position={[-size * 0.06, 0, 0]}>
          <boxGeometry args={[size * 0.06, size * 0.006, size * 0.035]} />
          <meshStandardMaterial color="#005588" emissive="#0088CC" emissiveIntensity={0.6} />
        </mesh>
        {/* Right Solar Wing */}
        <mesh position={[size * 0.06, 0, 0]}>
          <boxGeometry args={[size * 0.06, size * 0.006, size * 0.035]} />
          <meshStandardMaterial color="#005588" emissive="#0088CC" emissiveIntensity={0.6} />
        </mesh>
        {/* Glowing Telemetry Antenna Light */}
        <mesh position={[0, size * 0.03, 0]}>
          <sphereGeometry args={[size * 0.015, 6, 6]} />
          <meshBasicMaterial color="#00FFAA" />
        </mesh>
      </group>

      {/* ── 7. Soft Blue Atmospheric Limb Scattering Glow ─────────────────── */}
      <mesh geometry={hazeGeo}>
        <meshStandardMaterial
          color="#38bdf8"
          transparent
          opacity={0.08}
          side={THREE.BackSide}
          emissive="#38bdf8"
          emissiveIntensity={0.4}
        />
      </mesh>
    </group>
  );
}
