import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';

export function RealEarthPlanet({ size = 0.65, isMobile = false, perfTierFloat = 0.0 }) {
  const earthRef  = useRef();
  const cloudsRef = useRef();

  const planetRadius = size * 0.88;
  const cloudRadius  = planetRadius * 1.022; // Parallax cloud altitude
  const segments     = perfTierFloat >= 0.8 ? 20 : (isMobile ? 24 : 38);

  // Load authentic NASA planetary textures from local /textures directory
  const textures = useTexture([
    '/textures/earth_map.jpg',
    '/textures/earth_clouds.jpg',
    '/textures/earth_specular.jpg',
  ]);

  const [earthMap, cloudsMap, specularMap] = textures;

  // Optimize texture filtering for crisp 120 FPS rendering
  useEffect(() => {
    if (earthMap) {
      earthMap.generateMipmaps = true;
      earthMap.minFilter = THREE.LinearMipmapLinearFilter;
    }
    if (cloudsMap) {
      cloudsMap.generateMipmaps = true;
      cloudsMap.minFilter = THREE.LinearMipmapLinearFilter;
    }
  }, [earthMap, cloudsMap]);

  // Pre-allocate geometries for clean lifecycle management
  const earthGeo = useMemo(() => new THREE.SphereGeometry(planetRadius, segments, segments), [planetRadius, segments]);
  const cloudGeo = useMemo(() => new THREE.SphereGeometry(cloudRadius, segments, segments), [cloudRadius, segments]);
  const hazeGeo  = useMemo(() => new THREE.SphereGeometry(planetRadius * 1.065, 24, 24), [planetRadius]);

  useEffect(() => {
    return () => {
      earthGeo.dispose();
      cloudGeo.dispose();
      hazeGeo.dispose();
    };
  }, [earthGeo, cloudGeo, hazeGeo]);

  useFrame((_state, delta) => {
    // Earth surface axial rotation
    if (earthRef.current) {
      earthRef.current.rotation.y += delta * 0.09;
    }

    // Clouds rotate faster to generate continuous authentic 3D parallax over continents
    if (cloudsRef.current) {
      cloudsRef.current.rotation.y += delta * 0.13;
    }
  });

  return (
    <group rotation={[0.38, 0, 0.12]}>
      {/* ── 1. Authentic Real Earth (Africa, Europe, Americas, Asia, Australia, Antarctica) ── */}
      <mesh ref={earthRef} geometry={earthGeo}>
        <meshStandardMaterial
          map={earthMap}
          roughnessMap={specularMap}
          roughness={0.5}
          metalness={0.1}
          emissive="#002855"
          emissiveIntensity={0.55}
        />
      </mesh>

      {/* ── 2. NASA Parallax Cloud Layer ── */}
      <mesh ref={cloudsRef} geometry={cloudGeo}>
        <meshStandardMaterial
          map={cloudsMap}
          transparent
          opacity={0.82}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* ── 3. Atmospheric Blue Limb Glow ── */}
      <mesh geometry={hazeGeo}>
        <meshStandardMaterial
          color="#38bdf8"
          transparent
          opacity={0.09}
          side={THREE.BackSide}
          emissive="#38bdf8"
          emissiveIntensity={0.45}
        />
      </mesh>
    </group>
  );
}
