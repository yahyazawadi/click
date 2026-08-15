import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame, extend } from '@react-three/fiber';
import { useTexture, shaderMaterial } from '@react-three/drei';
import * as THREE from 'three';

const StylizedEarthMaterial = shaderMaterial(
  {
    uSpecularMap: null,
    uOceanColor: new THREE.Color('#031528'),
    uOceanEmissive: new THREE.Color('#062444'),
    uLandColor: new THREE.Color('#00B4D8'),
    uLandEmissive: new THREE.Color('#0284C7'),
    uAtmosphereColor: new THREE.Color('#38BDF8'),
  },
  // Vertex Shader
  /* glsl */ `
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vViewPosition;

    void main() {
      vUv = uv;
      vNormal = normalize(normalMatrix * normal);
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      vViewPosition = -mvPosition.xyz;
      gl_Position = projectionMatrix * mvPosition;
    }
  `,
  // Fragment Shader
  /* glsl */ `
    uniform sampler2D uSpecularMap;
    uniform vec3 uOceanColor;
    uniform vec3 uOceanEmissive;
    uniform vec3 uLandColor;
    uniform vec3 uLandEmissive;
    uniform vec3 uAtmosphereColor;

    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vViewPosition;

    void main() {
      // Sample specular map: 1.0 is ocean, 0.0 is land
      float spec = texture2D(uSpecularMap, vUv).r;
      float isLand = smoothstep(0.45, 0.15, spec);

      // Stylized clean base & emissive colors (zero photographic noise)
      vec3 baseCol = mix(uOceanColor, uLandColor, isLand);
      vec3 emissiveCol = mix(uOceanEmissive, uLandEmissive, isLand);

      // Soft lighting and atmospheric rim fresnel
      vec3 normal = normalize(vNormal);
      vec3 viewDir = normalize(vViewPosition);
      float fresnel = pow(1.0 - max(0.0, dot(normal, viewDir)), 2.8);

      vec3 finalCol = baseCol * 0.6 + emissiveCol * 0.85 + uAtmosphereColor * fresnel * 0.5;

      gl_FragColor = vec4(finalCol, 1.0);
    }
  `
);

extend({ StylizedEarthMaterial });

export function SimpleEarthPlanet({ size = 0.65, isMobile = false }) {
  const earthRef  = useRef();
  const cloudsRef = useRef();
  const earthMatRef = useRef();

  const planetRadius = size * 0.88;
  const cloudRadius  = planetRadius * 1.022; // Parallax cloud altitude
  const segments     = isMobile ? 24 : 38;

  // Load NASA cloud layer and specular continent mask
  const [cloudsMap, specularMap] = useTexture([
    '/textures/earth_clouds.jpg',
    '/textures/earth_specular.jpg',
  ]);

  // Optimize texture filtering
  useEffect(() => {
    if (cloudsMap) {
      cloudsMap.generateMipmaps = true;
      cloudsMap.minFilter = THREE.LinearMipmapLinearFilter;
    }
    if (specularMap) {
      specularMap.generateMipmaps = true;
      specularMap.minFilter = THREE.LinearMipmapLinearFilter;
    }
  }, [cloudsMap, specularMap]);

  // Pre-allocate geometries for clean memory lifecycle
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
    // Stylized Earth surface rotation
    if (earthRef.current) {
      earthRef.current.rotation.y += delta * 0.09;
    }

    // Clouds rotate faster for continuous 3D parallax over stylized continents
    if (cloudsRef.current) {
      cloudsRef.current.rotation.y += delta * 0.13;
    }
  });

  return (
    <group rotation={[0.38, 0, 0.12]}>
      {/* ── 1. Simplified Stylized Continents (Clean Vector-like Geography) ── */}
      <mesh ref={earthRef} geometry={earthGeo}>
        <stylizedEarthMaterial
          ref={earthMatRef}
          uSpecularMap={specularMap}
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

