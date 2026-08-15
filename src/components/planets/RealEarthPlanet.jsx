import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';

export function RealEarthPlanet({ size = 0.65, isMobile = false, perfTierFloat = 0.0 }) {
  const earthRef  = useRef();
  const cloudsRef = useRef();

  const planetRadius = size * 0.88;
  const cloudRadius  = planetRadius * 1.025; // Clean soft cloud altitude
  const segments     = perfTierFloat >= 0.8 ? 20 : (isMobile ? 24 : 36);

  // Load authentic NASA planetary textures from local /textures directory
  const textures = useTexture([
    '/textures/earth_map.jpg',
    '/textures/earth_clouds.jpg',
    '/textures/earth_specular.jpg',
  ]);

  const [earthMap, cloudsMap, specularMap] = textures;

  // Optimize texture filtering
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

  // Pre-allocate geometries
  const earthGeo = useMemo(() => new THREE.SphereGeometry(planetRadius, segments, segments), [planetRadius, segments]);
  const cloudGeo = useMemo(() => new THREE.SphereGeometry(cloudRadius, segments, segments), [cloudRadius, segments]);
  const hazeGeo  = useMemo(() => new THREE.SphereGeometry(planetRadius * 1.08, 24, 24), [planetRadius]);

  useEffect(() => {
    return () => {
      earthGeo.dispose();
      cloudGeo.dispose();
      hazeGeo.dispose();
    };
  }, [earthGeo, cloudGeo, hazeGeo]);

  useFrame((_state, delta) => {
    // Smooth, relaxing axial rotation
    if (earthRef.current) {
      earthRef.current.rotation.y += delta * 0.08;
    }

    // Gentle cloud drift
    if (cloudsRef.current) {
      cloudsRef.current.rotation.y += delta * 0.11;
    }
  });

  return (
    <group rotation={[0.35, 0, 0.1]}>
      {/* Soft local ambient fill to keep the planet bright, clear, and easy on the eyes */}
      <pointLight position={[4, 3, 4]} intensity={2.2} color="#ffffff" distance={15} />
      <pointLight position={[-4, -2, -4]} intensity={1.0} color="#00BAE3" distance={15} />

      {/* ── 1. Clean, Bright Earth Surface (Always Clearly Visible) ── */}
      <mesh ref={earthRef} geometry={earthGeo}>
        <meshStandardMaterial
          map={earthMap}
          roughnessMap={specularMap}
          roughness={0.45}
          metalness={0.1}
          emissiveMap={earthMap}
          emissive="#003554"
          emissiveIntensity={0.65}
        />
      </mesh>

      {/* ── 2. Soft, Gentle White Parallax Cloud Layer ── */}
      <mesh ref={cloudsRef} geometry={cloudGeo}>
        <meshStandardMaterial
          map={cloudsMap}
          transparent
          opacity={0.65}
          emissive="#ffffff"
          emissiveIntensity={0.35}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* ── 3. Calming Cyan Atmospheric Halo ── */}
      <mesh geometry={hazeGeo}>
        <meshStandardMaterial
          color="#00BAE3"
          transparent
          opacity={0.12}
          side={THREE.BackSide}
          emissive="#00BAE3"
          emissiveIntensity={0.6}
        />
      </mesh>
    </group>
  );
}
