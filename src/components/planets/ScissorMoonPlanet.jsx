import React, { useRef, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import '../../shaders/ScissorMoonShaderMaterial';

// 11 scissor placements with varied spherical coords, rotations, speeds, and amplitudes
const SCISSOR_POSITIONS = [
  { phi: 1.40, theta: 0.00, rotZ: 0.2, speedMult: 0.75, ampMult: 0.90 },
  { phi: 1.65, theta: 0.57, rotZ: 1.1, speedMult: 1.35, ampMult: 1.15 },
  { phi: 1.25, theta: 1.14, rotZ: 2.3, speedMult: 0.95, ampMult: 0.80 },
  { phi: 1.80, theta: 1.71, rotZ: 0.7, speedMult: 1.50, ampMult: 1.20 },
  { phi: 1.35, theta: 2.28, rotZ: 1.8, speedMult: 0.65, ampMult: 1.00 },
  { phi: 1.60, theta: 2.85, rotZ: 2.9, speedMult: 1.20, ampMult: 0.85 },
  { phi: 1.20, theta: 3.42, rotZ: 0.5, speedMult: 0.85, ampMult: 1.10 },
  { phi: 1.75, theta: 3.99, rotZ: 1.4, speedMult: 1.40, ampMult: 0.95 },
  { phi: 1.30, theta: 4.56, rotZ: 2.1, speedMult: 1.05, ampMult: 1.25 },
  { phi: 1.65, theta: 5.13, rotZ: 0.9, speedMult: 0.70, ampMult: 0.75 },
  { phi: 1.45, theta: 5.70, rotZ: 2.6, speedMult: 1.30, ampMult: 1.05 },
];

export function ScissorMoonPlanet({ color, size }) {
  const planetRef    = useRef();
  const shaderMatRef = useRef();
  const blade1Refs   = useRef([]);
  const blade2Refs   = useRef([]);

  const planetRadius = size * 0.85;
  const bladeLen     = size * 1.6;

  // Pre-compute position + quaternion for each scissor (places them flat against the sphere surface).
  const scissorDefs = useMemo(() => {
    const zAxis = new THREE.Vector3(0, 0, 1);
    return SCISSOR_POSITIONS.map(({ phi, theta, rotZ, speedMult, ampMult }, i) => {
      const x      = Math.sin(phi) * Math.cos(theta);
      const y      = Math.cos(phi);
      const z      = Math.sin(phi) * Math.sin(theta);
      const normal = new THREE.Vector3(x, y, z).normalize();
      const pos    = normal.clone().multiplyScalar(planetRadius * 1.025);
      const quat   = new THREE.Quaternion().setFromUnitVectors(zAxis, normal);
      return { pos, quat, rotZ, speedMult, ampMult, phase: i * ((Math.PI * 2) / 11) };
    });
  }, [planetRadius]);

  // Shared continuous blade & shank extrude geometry (reused by all scissors)
  const bladeGeo = useMemo(() => {
    const shape = new THREE.Shape();
    // Razor sharp pointed tip
    shape.moveTo(bladeLen, 0);
    // Upper blade back spine
    shape.lineTo(bladeLen * 0.75, size * 0.08);
    shape.lineTo(0, size * 0.09);
    // Smooth handle shank contour flowing back to finger loop
    shape.lineTo(-bladeLen * 0.22, size * 0.14);
    shape.lineTo(-bladeLen * 0.42, size * 0.22);
    shape.lineTo(-bladeLen * 0.45, size * 0.12);
    shape.lineTo(-bladeLen * 0.20, size * 0.01);
    shape.lineTo(0, -size * 0.04);
    // Razor cutting edge
    shape.lineTo(bladeLen * 0.8, -size * 0.035);
    shape.closePath();

    return new THREE.ExtrudeGeometry(shape, {
      steps: 1,
      depth: size * 0.04,
      bevelEnabled: true,
      bevelThickness: size * 0.01,
      bevelSize: size * 0.008,
      bevelSegments: 4,
    });
  }, [bladeLen, size]);

  useEffect(() => () => bladeGeo.dispose(), [bladeGeo]);

  useFrame((state, delta) => {
    const t = state.clock.getElapsedTime();

    // Feed time to planet shader
    if (shaderMatRef.current) shaderMatRef.current.uTime = t;

    // Slow planetary rotation
    if (planetRef.current) planetRef.current.rotation.y += delta * 0.14;

    // Each scissor snips with its own speed, amplitude, and dual-harmonic organic wave
    scissorDefs.forEach((def, i) => {
      const tSub = t * (2.2 * def.speedMult) + def.phase;
      const raw  = Math.sin(tSub) * 0.75 + Math.sin(tSub * 2.3) * 0.25;
      const angle = (raw * 0.5 + 0.5) * (0.16 * def.ampMult) + 0.11;
      if (blade1Refs.current[i]) blade1Refs.current[i].rotation.z =  angle;
      if (blade2Refs.current[i]) blade2Refs.current[i].rotation.z = -angle;
    });
  });

  return (
    <group>
      {/* ── Rotating planet frame (scissors nested inside to lock to terrain) ── */}
      <group ref={planetRef}>
        <mesh>
          <sphereGeometry args={[planetRadius, 64, 64]} />
          <scissorMoonShaderMaterial ref={shaderMatRef} />
        </mesh>

        {/* ── 11 tiny scissors anchored directly to the rotating planet surface ── */}
        {scissorDefs.map((def, i) => (
        <group key={i} position={def.pos} quaternion={def.quat}>
          {/* Scale scissors so they lay 100% flat against the spherical surface tangent */}
          <group scale={[0.15, 0.15, 0.15]} rotation={[0, 0, def.rotZ]}>

            {/* Central pivot bolt */}
            <mesh>
              <sphereGeometry args={[size * 0.22, 16, 16]} />
              <meshStandardMaterial
                color="#001F3F"
                emissive="#00BAE3"
                emissiveIntensity={0.7}
                roughness={0.1}
                metalness={0.95}
              />
            </mesh>

            {/* Pivot cap ring */}
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[size * 0.28, size * 0.28, size * 0.12, 24]} />
              <meshStandardMaterial
                color="#00152B"
                metalness={0.9}
                roughness={0.1}
                emissive="#003268"
                emissiveIntensity={0.4}
              />
            </mesh>

            {/* ── Upper blade ── */}
            <group ref={(el) => (blade1Refs.current[i] = el)}>
              <mesh geometry={bladeGeo} position={[size * 0.12, 0, size * 0.018]}>
                <meshStandardMaterial
                  color="#E6F7FF"
                  metalness={0.98}
                  roughness={0.05}
                  emissive="#00BAE3"
                  emissiveIntensity={0.4}
                />
              </mesh>
              {/* Razor edge glow strip */}
              <mesh
                position={[bladeLen * 0.52, -size * 0.046, size * 0.04]}
                rotation={[0, 0, -Math.PI / 36]}
              >
                <boxGeometry args={[bladeLen * 0.82, size * 0.016, size * 0.04]} />
                <meshStandardMaterial color="#FCFCFC" emissive="#FCFCFC" emissiveIntensity={1.5} />
              </mesh>
              {/* Handle finger loop */}
              <group
                position={[-bladeLen * 0.42, -size * 0.2, size * 0.04]}
                rotation={[0, 0, -Math.PI / 24]}
              >
                <mesh>
                  <torusGeometry args={[size * 0.3, size * 0.085, 16, 32]} />
                  <meshStandardMaterial
                    color="#0088CC"
                    emissive="#00BAE3"
                    emissiveIntensity={0.6}
                    metalness={0.7}
                    roughness={0.2}
                  />
                </mesh>
                <mesh>
                  <torusGeometry args={[size * 0.3, size * 0.022, 12, 24]} />
                  <meshStandardMaterial color="#80F0FF" emissive="#00E5FF" emissiveIntensity={0.9} />
                </mesh>
              </group>
            </group>

            {/* ── Lower blade ── */}
            <group ref={(el) => (blade2Refs.current[i] = el)}>
              <mesh
                geometry={bladeGeo}
                position={[size * 0.12, 0, -size * 0.06]}
                rotation={[Math.PI, 0, 0]}
              >
                <meshStandardMaterial
                  color="#E6F7FF"
                  metalness={0.98}
                  roughness={0.05}
                  emissive="#00BAE3"
                  emissiveIntensity={0.4}
                />
              </mesh>
              {/* Razor edge glow strip */}
              <mesh
                position={[bladeLen * 0.52, size * 0.046, -size * 0.04]}
                rotation={[0, 0, Math.PI / 36]}
              >
                <boxGeometry args={[bladeLen * 0.82, size * 0.016, size * 0.04]} />
                <meshStandardMaterial color="#FCFCFC" emissive="#FCFCFC" emissiveIntensity={1.5} />
              </mesh>
              {/* Handle finger loop */}
              <group
                position={[-bladeLen * 0.42, size * 0.2, -size * 0.04]}
                rotation={[0, 0, Math.PI / 24]}
              >
                <mesh>
                  <torusGeometry args={[size * 0.3, size * 0.085, 16, 32]} />
                  <meshStandardMaterial
                    color="#0088CC"
                    emissive="#00BAE3"
                    emissiveIntensity={0.6}
                    metalness={0.7}
                    roughness={0.2}
                  />
                </mesh>
                <mesh>
                  <torusGeometry args={[size * 0.3, size * 0.022, 12, 24]} />
                  <meshStandardMaterial color="#80F0FF" emissive="#00E5FF" emissiveIntensity={0.9} />
                </mesh>
              </group>
            </group>

            </group>
          </group>
        ))}
      </group>

      {/* Atmospheric glow backside shell */}
      <mesh>
        <sphereGeometry args={[planetRadius * 1.09, 32, 32]} />
        <meshStandardMaterial
          color="#4a90c8"
          transparent
          opacity={0.07}
          side={THREE.BackSide}
          emissive="#4a90c8"
          emissiveIntensity={0.35}
        />
      </mesh>
    </group>
  );
}
