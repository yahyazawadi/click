import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame, extend } from '@react-three/fiber';
import { useTexture, shaderMaterial } from '@react-three/drei';
import * as THREE from 'three';

const StylizedEarthMaterial = shaderMaterial(
  {
    uSpecularMap: null,
    uOceanColor: new THREE.Color('#031224'),
    uOceanDeep: new THREE.Color('#010712'),
    uLandColor: new THREE.Color('#16A34A'),     // Pure vibrant lush green continents
    uLandCoast: new THREE.Color('#4ADE80'),     // Bright fresh green coastal glow
    uPolarColor: new THREE.Color('#E2FBE8'),    // Soft pale mint-white polar frost
    uAtmosphereColor: new THREE.Color('#22C55E'),// Pure emerald green atmospheric glow
  },
  // Vertex Shader
  /* glsl */ `
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vWorldNormal;
    varying vec3 vViewPosition;

    void main() {
      vUv = uv;
      vNormal = normalize(normalMatrix * normal);
      vWorldNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      vViewPosition = -mvPosition.xyz;
      gl_Position = projectionMatrix * mvPosition;
    }
  `,
  // Fragment Shader
  /* glsl */ `
    uniform sampler2D uSpecularMap;
    uniform vec3 uOceanColor;
    uniform vec3 uOceanDeep;
    uniform vec3 uLandColor;
    uniform vec3 uLandCoast;
    uniform vec3 uPolarColor;
    uniform vec3 uAtmosphereColor;

    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vWorldNormal;
    varying vec3 vViewPosition;

    void main() {
      // Specular map: 1.0 is ocean, 0.0 is land
      float spec = texture2D(uSpecularMap, vUv).r;
      float isLand = smoothstep(0.40, 0.15, spec);
      float isCoast = smoothstep(0.55, 0.35, spec) * (1.0 - isLand);

      // Polar ice cap blending at extreme latitudes
      float polarDist = abs(vUv.y - 0.5) * 2.0; // 0 at equator, 1 at poles
      float isPolar = smoothstep(0.82, 0.94, polarDist);

      // 3D Directional Sun Lighting
      vec3 normal = normalize(vNormal);
      vec3 lightDir = normalize(vec3(4.0, 5.0, 8.0));
      float NdotL = dot(normal, lightDir);
      float diffuse = max(0.0, NdotL);
      float ambient = 0.28;
      float light = ambient + diffuse * 0.82;

      // Ocean color with deep cosmic navy contrast
      vec3 oceanCol = mix(uOceanDeep, uOceanColor, max(0.0, NdotL * 0.7 + 0.3));

      // Pure Green Landmasses with gentle coastal shelf
      vec3 landCol = mix(uLandColor, uLandCoast, isCoast * 0.65);
      landCol = mix(landCol, uPolarColor, isPolar * 0.80);

      // Combine base surface
      vec3 surfaceCol = mix(oceanCol, landCol, isLand);
      surfaceCol *= light;

      // Soft Specular Glint on Oceans
      vec3 viewDir = normalize(vViewPosition);
      vec3 halfVector = normalize(lightDir + viewDir);
      float specHighlight = pow(max(0.0, dot(normal, halfVector)), 32.0);
      surfaceCol += uAtmosphereColor * (specHighlight * (1.0 - isLand) * 0.25);

      // Atmospheric Green Rim Fresnel
      float fresnel = pow(1.0 - max(0.0, dot(normal, viewDir)), 2.5);
      surfaceCol += uAtmosphereColor * fresnel * 0.40;

      gl_FragColor = vec4(surfaceCol, 1.0);
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
      {/* ── 1. Simplified Stylized Green Continents (Clean Vector Geography) ── */}
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

      {/* ── 3. Atmospheric Green Limb Glow ── */}
      <mesh geometry={hazeGeo}>
        <meshStandardMaterial
          color="#22c55e"
          transparent
          opacity={0.09}
          side={THREE.BackSide}
          emissive="#22c55e"
          emissiveIntensity={0.45}
        />
      </mesh>
    </group>
  );
}

