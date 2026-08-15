import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export function SimpleEarthPlanet({ size = 0.65, color = '#00BAE3', isMobile = false }) {
  const planetRef = useRef();
  const cloudsRef = useRef();
  const ringRef   = useRef();

  const planetRadius = size * 0.88;
  const segments = isMobile ? 24 : 36;

  // Pre-allocate simple geometries for clean memory management
  const planetGeo = useMemo(() => new THREE.SphereGeometry(planetRadius, segments, segments), [planetRadius, segments]);
  const cloudGeo  = useMemo(() => new THREE.SphereGeometry(planetRadius * 1.025, 24, 24), [planetRadius]);
  const ringGeo   = useMemo(() => new THREE.RingGeometry(planetRadius * 1.25, planetRadius * 1.45, 48), [planetRadius]);

  React.useEffect(() => {
    return () => {
      planetGeo.dispose();
      cloudGeo.dispose();
      ringGeo.dispose();
    };
  }, [planetGeo, cloudGeo, ringGeo]);

  useFrame((_state, delta) => {
    if (planetRef.current) {
      planetRef.current.rotation.y += delta * 0.10;
    }
    if (cloudsRef.current) {
      cloudsRef.current.rotation.y += delta * 0.14;
      cloudsRef.current.rotation.z += delta * 0.02;
    }
    if (ringRef.current) {
      ringRef.current.rotation.z += delta * 0.05;
    }
  });

  return (
    <group rotation={[0.3, 0, 0.1]}>
      {/* ── 1. Smooth Clean Planet Body (Always softly glowing & bright) ── */}
      <mesh ref={planetRef} geometry={planetGeo}>
        <meshStandardMaterial
          color="#06203D"
          emissive="#0A3A68"
          emissiveIntensity={0.65}
          roughness={0.4}
          metalness={0.2}
        />
      </mesh>

      {/* ── 2. Simplistic Stylized Landmass Wire/Geo Shell ── */}
      <mesh geometry={planetGeo} scale={1.002}>
        <meshStandardMaterial
          color="#00E5FF"
          emissive="#10B981"
          emissiveIntensity={0.8}
          wireframe={true}
          transparent
          opacity={0.35}
        />
      </mesh>

      {/* ── 3. Soft Floating Simplistic Cloud Shell ── */}
      <mesh ref={cloudsRef} geometry={cloudGeo}>
        <meshStandardMaterial
          color="#E6F7FF"
          emissive="#00BAE3"
          emissiveIntensity={0.3}
          transparent
          opacity={0.28}
          wireframe={true}
        />
      </mesh>

      {/* ── 4. Elegant Minimalist Orbital Ring ── */}
      <mesh ref={ringRef} geometry={ringGeo} rotation={[Math.PI / 2.5, 0, 0]}>
        <meshBasicMaterial
          color={color || '#00BAE3'}
          side={THREE.DoubleSide}
          transparent
          opacity={0.3}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
}
