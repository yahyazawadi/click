import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader.js';
import '../../shaders/PlaywrightPlanetShaderMaterial';

// ── Official Playwright Dual Masks SVG Paths (viewBox 0 0 24 24) ─────────────
const SVG_PLAYWRIGHT_LOGO = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
  <g transform="scale(1,-1) translate(0,-24)">
    <!-- 1. Slate Base / Trims -->
    <path id="slate1" fill="#2d4552" d="M7.99585 13.141725c-0.87725 0.248975 -1.452775 0.685475 -1.8319 1.12165 0.363125 -0.317775 0.849525 -0.609425 1.505675 -0.795425 0.6711 -0.1902 1.243625 -0.188825 1.7167 -0.09755v-0.369925c-0.40355 -0.0369 -0.866225 -0.0075 -1.390475 0.14125Zm-1.872 -3.109775 -3.25795 0.858325s0.059375 0.083875 0.1693 0.195775l2.76235 -0.727875s-0.03915 0.5044 -0.379075 0.9556c0.643 -0.486475 0.705375 -1.281825 0.705375 -1.281825Zm2.727125 7.65675C4.26615 18.923575 1.8404825 13.61025 1.1060875 10.852425c-0.3393 -1.273 -0.487415 -2.2371 -0.5268925 -2.859275 -0.0042425 -0.0646 -0.0022825 -0.11905 0.002285 -0.16895 -0.237835 0.01435 -0.3517015 0.137975 -0.328535 0.49525 0.0394775 0.621825 0.187595 1.585875 0.526895 2.859275C1.5139075 13.936125 3.9399 19.24945 8.52475 18.0146c0.99795 -0.26885 1.747675 -0.758525 2.310475 -1.383625 -0.51875 0.468525 -1.168 0.8375 -1.98425 1.057725Zm0.861575 -10.90855v0.3263h1.79835c-0.0369 -0.115525 -0.074075 -0.219625 -0.110975 -0.3263h-1.687375Z"/>
    <path id="slate2" fill="#2d4552" d="M11.9129 9.46735c0.80875 0.229675 1.2365 0.7967 1.462575 1.2985l0.90175 0.2561s-0.123 -1.756175 -1.711525 -2.2074c-1.486075 -0.422225 -2.400575 0.8257 -2.5118 0.9872 0.4323 -0.308 1.063575 -0.56015 1.859 -0.3344Zm7.178175 1.3066c-1.487425 -0.424125 -2.401575 0.8264 -2.511175 0.985625 0.432625 -0.307625 1.063575 -0.559875 1.85865 -0.3331 0.80745 0.23005 1.23485 0.796375 1.461625 1.298525l0.90305 0.25705s-0.125 -1.756525 -1.71215 -2.2081Zm-0.8959 4.6305 -7.501475 -2.097125s0.0812 0.411725 0.3928 0.94485l6.3159 1.765675c0.519975 -0.30085 0.792775 -0.6134 0.792775 -0.6134ZM12.994375 19.918475C7.054675 18.326 7.77275 10.758025 8.733875 7.171825c0.395725 -1.4779 0.802575 -2.576375 1.13995 -3.312725 -0.2013 -0.041425 -0.368025 0.0646 -0.532775 0.39965 -0.358225 0.726575 -0.8163 1.90955 -1.259625 3.5656 -0.96085 3.586125 -1.67895 11.15385 4.2605 12.746325 2.79955 0.75 4.980475 -0.3899 6.60625 -2.18005 -1.543175 1.3977 -3.513425 2.181325 -5.9538 1.52785Z"/>

    <!-- 2. Red Mask Facets (Left Drama Mask) -->
    <path id="red1" fill="#e2574c" d="M9.7126 15.915175V14.388l-4.243175 1.2032s0.313525 -1.82175 2.526475 -2.4495c0.6711 -0.1902 1.2437 -0.1889 1.7167 -0.09755V6.780125h2.124575c-0.231325 -0.714825 -0.4551 -1.26515 -0.64305 -1.64755 -0.310925 -0.632925 -0.62965 -0.21335 -1.35325 0.39185 -0.50965 0.425775 -1.797675 1.33405 -3.7359 1.85635 -1.938275 0.522625 -3.50525 0.384025 -4.15906 0.2708 -0.9268825 -0.1599 -1.4116925 -0.36345 -1.3663375 0.34155 0.03947 0.621825 0.187595 1.58595 0.5268925 2.859275C1.8405325 13.609875 4.266525 18.9232 8.85135 17.68835c1.197625 -0.3227 2.04295 -0.960525 2.6289 -1.7735h-1.76765v0.000325ZM2.865625 10.89025l3.258275 -0.858325s-0.094975 1.25345 -1.31645 1.57545c-1.2218 0.321675 -1.941825 -0.717125 -1.941825 -0.717125Z"/>
    <path id="red2" fill="#d65348" d="M8.2299 14.808525 5.4695 15.590875s0.29985 -1.708225 2.33335 -2.385175l-1.563075 -5.865975 -0.135075 0.04105c-1.93825 0.5227 -3.505225 0.384025 -4.15903 0.2708 -0.9268775 -0.159825 -1.411685 -0.36345 -1.3663375 0.341625 0.0394775 0.621825 0.187595 1.585875 0.5268925 2.85925 0.7340675 2.757425 3.160075 8.07075 7.744875 6.8359l0.135075 -0.042425 -0.756275 -2.8374ZM2.8657 10.8903l3.258275 -0.858375s-0.094975 1.25345 -1.316425 1.57545c-1.221825 0.321675 -1.94185 -0.717075 -1.94185 -0.717075Z"/>
    <path id="red3" fill="#c04b41" d="m8.37055 14.7683 -0.740275 0.2101c0.174875 0.9859 0.483125 1.93205 0.966975 2.7679 0.0842 -0.0186 0.167725 -0.034575 0.2535 -0.058075 0.2248 -0.06065 0.43325 -0.13575 0.63395 -0.21765 -0.5406 -0.802225 -0.898225 -1.726175 -1.11415 -2.702275Zm-0.289075 -6.9439c-0.3804 1.419825 -0.720725 3.46345 -0.62705 5.51325 0.167675 -0.072775 0.3448 -0.140575 0.54155 -0.1964l0.13705 -0.030625c-0.167075 -2.189525 0.194075 -4.4207 0.600925 -5.93875 0.103125 -0.384025 0.206525 -0.741225 0.3096 -1.07435 -0.166025 0.105675 -0.3448 0.213975 -0.548425 0.32555 -0.137325 0.42385 -0.276 0.887125 -0.41365 1.401325Z"/>

    <!-- 3. Green Mask Facets (Right Drama Mask) -->
    <path id="green1" fill="#2ead33" d="M21.975075 6.8525c-0.84695 0.148475 -2.878875 0.33345 -5.389975 -0.339625 -2.5118 -0.672675 -4.17835 -1.849175 -4.838625 -2.402175 -0.936 -0.783975 -1.347725 -1.328825 -1.752925 -0.5047 -0.358225 0.726875 -0.816325 1.909875 -1.259725 3.565925 -0.960775 3.586125 -1.67885 11.15385 4.260525 12.7463 5.938125 1.591125 9.09945 -5.322175 10.0603 -8.908625 0.4434 -1.655725 0.637825 -2.9095 0.691325 -3.717925 0.061 -0.915775 -0.568025 -0.64995 -1.7709 -0.439175ZM10.0418 9.81945s0.936 -1.45575 2.523525 -1.00455c1.588525 0.451225 1.711525 2.207425 1.711525 2.207425l-4.23505 -1.202875ZM13.917 16.352c-2.79235 -0.817975 -3.223 -3.04465 -3.223 -3.04465l7.501125 2.0972c0 -0.00035 -1.5141 1.755175 -4.278125 0.94745Zm2.6521 -4.57605s0.9347 -1.45475 2.521925 -1.00225c1.587175 0.4519 1.71215 2.2081 1.71215 2.2081l-4.234075 -1.20585Z"/>
    <path id="green2" fill="#1d8d22" d="m14.04295 16.382625 -0.1263 -0.0307c-2.792325 -0.8179 -3.223 -3.044575 -3.223 -3.044575l3.86805 1.0812 2.047825 -7.86915 -0.024775 -0.006525c-2.5118 -0.672675 -4.17825 -1.849175 -4.838625 -2.402175 -0.936 -0.783975 -1.347725 -1.328825 -1.752925 -0.5047 -0.357875 0.726875 -0.815975 1.909875 -1.259375 3.565925 -0.960775 3.586125 -1.67885 11.15385 4.260525 12.74625l0.121725 0.027425 0.926875 -3.562975ZM10.0418 9.819475s0.936 -1.455775 2.523525 -1.004575c1.588525 0.451225 1.711525 2.207425 1.711525 2.207425l-4.23505 -1.20285Z"/>
  </g>
</svg>
`;

// ── Color Palette ─────────────────────────────────────────────────────────────
const C = {
  emeraldBright: '#2EAD33', // Playwright Green Mask
  emeraldGlow:   '#00F59B', // Radiant Mint Green Highlight
  rubyBright:    '#FF2D6E', // Radiant Reddish-Pink / Raspberry Coral
  rubyGlow:      '#FF6088', // Luminous Rose Pink Glow
  slateDark:     '#140818', // Deep Velvet Obsidian
  slateTrim:     '#221528', // Polished Chassis
  chromiumCyan:  '#00D4FF', // Browser node 1
  firefoxOrange: '#FF8A00', // Browser node 2
  webkitPurple:  '#D946EF', // Browser node 3
};

// ── 3D Architectural Playwright Masks Monolith ────────────────────────────────
function PlaywrightEmblem({ size, planetRadius, isMobile }) {
  const redMatRef   = useRef();
  const greenMatRef = useRef();

  const emblemScale = (planetRadius * 0.45) / 12;

  const { redGeo, greenGeo, slateGeo } = useMemo(() => {
    const loader = new SVGLoader();
    const data = loader.parse(SVG_PLAYWRIGHT_LOGO);
    const centerMatrix = new THREE.Matrix4().makeTranslation(-12, -12, 0);

    const redShapes   = [];
    const greenShapes = [];
    const slateShapes = [];

    data.paths.forEach((p) => {
      const color = (p.color?.getHexString?.() || '').toLowerCase();
      const shapes = p.toShapes(true);
      if (color.includes('e2574c') || color.includes('d65348') || color.includes('c04b41')) {
        redShapes.push(...shapes);
      } else if (color.includes('2ead33') || color.includes('1d8d22')) {
        greenShapes.push(...shapes);
      } else {
        slateShapes.push(...shapes);
      }
    });

    const extrudeConfig = (depth, bevelThick) => ({
      depth,
      bevelEnabled:   true,
      bevelThickness: bevelThick,
      bevelSize:      bevelThick * 0.6,
      bevelSegments:  isMobile ? 1 : 3,
    });

    const rGeo = new THREE.ExtrudeGeometry(redShapes, extrudeConfig(2.6, 0.45));
    rGeo.applyMatrix4(centerMatrix);

    const gGeo = new THREE.ExtrudeGeometry(greenShapes, extrudeConfig(3.2, 0.55));
    gGeo.applyMatrix4(centerMatrix);

    const sGeo = new THREE.ExtrudeGeometry(slateShapes, extrudeConfig(1.8, 0.35));
    sGeo.applyMatrix4(centerMatrix);

    return { redGeo: rGeo, greenGeo: gGeo, slateGeo: sGeo };
  }, [isMobile]);

  useEffect(() => {
    return () => {
      redGeo?.dispose?.();
      greenGeo?.dispose?.();
      slateGeo?.dispose?.();
    };
  }, [redGeo, greenGeo, slateGeo]);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (redMatRef.current) {
      redMatRef.current.emissiveIntensity = 1.4 + Math.sin(t * 2.8) * 0.45;
    }
    if (greenMatRef.current) {
      greenMatRef.current.emissiveIntensity = 1.5 + Math.sin(t * 2.8 + 1.2) * 0.45;
    }
  });

  return (
    <group position={[0, 0, planetRadius * 0.98]} scale={[emblemScale, emblemScale, emblemScale]}>
      {/* 1. Dark Support Chassis */}
      <mesh geometry={slateGeo}>
        <meshStandardMaterial
          color={C.slateTrim}
          roughness={0.4}
          metalness={0.8}
          emissive="#120618"
          emissiveIntensity={0.4}
        />
      </mesh>

      {/* 2. Left Red Theatre Mask (Ruby/Reddish-Pink Crystal) */}
      <mesh geometry={redGeo} position={[0, 0, 0.3]}>
        <meshStandardMaterial
          ref={redMatRef}
          color={C.rubyBright}
          emissive={C.rubyGlow}
          emissiveIntensity={1.4}
          roughness={0.12}
          metalness={0.85}
        />
      </mesh>

      {/* 3. Right Green Theatre Mask (Emerald/Mint Crystal) */}
      <mesh geometry={greenGeo} position={[0, 0, 0.6]}>
        <meshStandardMaterial
          ref={greenMatRef}
          color={C.emeraldBright}
          emissive={C.emeraldGlow}
          emissiveIntensity={1.5}
          roughness={0.12}
          metalness={0.85}
        />
      </mesh>
    </group>
  );
}

// ── Main PlaywrightPlanet Component ───────────────────────────────────────────
export function PlaywrightPlanet({ size = 0.5, isMobile = false, perfTierFloat = 0.0 }) {
  const planetGroupRef = useRef();
  const shaderMatRef   = useRef();
  const ring1Ref       = useRef();
  const ring2Ref       = useRef();
  const runnerRefs     = useRef([]);

  const planetRadius = size * 0.85;

  // Tri-browser test runner satellites (Chromium, Firefox, WebKit)
  const browserNodes = useMemo(() => [
    { name: 'Chromium', color: C.chromiumCyan,  speed:  0.8, offset: 0.0, ringRadius: planetRadius * 1.30, tiltX:  0.45 },
    { name: 'Firefox',  color: C.firefoxOrange, speed: -0.6, offset: 2.1, ringRadius: planetRadius * 1.45, tiltX: -0.35 },
    { name: 'WebKit',   color: C.webkitPurple,  speed:  0.7, offset: 4.2, ringRadius: planetRadius * 1.60, tiltX:  0.20 },
  ], [planetRadius]);

  const tempPos = useMemo(() => new THREE.Vector3(), []);

  useFrame((state, delta) => {
    const t = state.clock.getElapsedTime();
    const safeDelta = Math.min(delta, 0.1);

    // Update organic shader time and tier
    if (shaderMatRef.current) {
      shaderMatRef.current.uTime = t;
      shaderMatRef.current.uPerfTier = perfTierFloat;
    }

    // Planet axial rotation
    if (planetGroupRef.current) {
      planetGroupRef.current.rotation.y += safeDelta * 0.14;
    }

    // Orbiting test track laser rings counter-rotation
    if (ring1Ref.current) ring1Ref.current.rotation.z += safeDelta * 0.25;
    if (ring2Ref.current) ring2Ref.current.rotation.z -= safeDelta * 0.20;

    // Animate browser worker runner satellites along their inclined orbits
    browserNodes.forEach((node, i) => {
      const runner = runnerRefs.current[i];
      if (runner) {
        const angle = t * node.speed + node.offset;
        const x = Math.cos(angle) * node.ringRadius;
        const z = Math.sin(angle) * node.ringRadius;
        const y = Math.sin(angle * 2.0) * (node.ringRadius * 0.10);

        tempPos.set(x, y, z).applyAxisAngle(new THREE.Vector3(1, 0, 0), node.tiltX);
        runner.position.copy(tempPos);

        if (runner.material) {
          runner.material.emissiveIntensity = 2.4 + Math.sin(t * 5.0 + i) * 0.6;
        }
      }
    });
  });

  return (
    <group rotation={[-0.35, 0, 0]}>
      {/* ── Rotating Planet Core ── */}
      <group ref={planetGroupRef}>
        {/* 1. Smooth Organic Dual-Tone Reddish-Pink & Emerald Shader (No Grid Lines!) */}
        <mesh>
          <sphereGeometry args={[planetRadius, perfTierFloat >= 0.8 ? 24 : 48, perfTierFloat >= 0.8 ? 24 : 48]} />
          <playwrightPlanetShaderMaterial
            ref={shaderMatRef}
            uPerfTier={perfTierFloat}
          />
        </mesh>

        {/* 2. Extruded 3D Playwright Dual Masks Monolith */}
        <PlaywrightEmblem size={size} planetRadius={planetRadius} isMobile={isMobile} />
      </group>

      {/* ── Inclined Test Track Laser Rings (Reddish-Pink & Emerald) ── */}
      {/* Ring 1 (Emerald Test Track) */}
      <group ref={ring1Ref} rotation={[0.45, 0.2, 0]}>
        <mesh>
          <ringGeometry args={[planetRadius * 1.28, planetRadius * 1.32, 64]} />
          <meshBasicMaterial color={C.emeraldBright} transparent opacity={0.50} side={THREE.DoubleSide} />
        </mesh>
      </group>

      {/* Ring 2 (Reddish-Pink Test Track) */}
      <group ref={ring2Ref} rotation={[-0.35, -0.4, 0]}>
        <mesh>
          <ringGeometry args={[planetRadius * 1.43, planetRadius * 1.47, 64]} />
          <meshBasicMaterial color={C.rubyBright} transparent opacity={0.45} side={THREE.DoubleSide} />
        </mesh>
      </group>

      {/* ── Tri-Browser Test Runner Satellites ── */}
      {browserNodes.map((node, i) => (
        <mesh key={node.name} ref={(el) => (runnerRefs.current[i] = el)}>
          <sphereGeometry args={[size * 0.035, 12, 12]} />
          <meshStandardMaterial
            color="#FFFFFF"
            emissive={node.color}
            emissiveIntensity={2.5}
            roughness={0.1}
            metalness={0.4}
          />
        </mesh>
      ))}

      {/* Atmospheric Fresnel Outer Glow Shell (Reddish-Pink & Emerald Aura) */}
      <mesh>
        <sphereGeometry args={[planetRadius * 1.10, 24, 24]} />
        <meshStandardMaterial
          color="#FF2D6E"
          transparent
          opacity={0.07}
          side={THREE.BackSide}
          emissive="#2EAD33"
          emissiveIntensity={0.35}
        />
      </mesh>
    </group>
  );
}
