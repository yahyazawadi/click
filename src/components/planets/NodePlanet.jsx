import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export function NodePlanet({ color = '#00E5FF', size = 0.6 }) {
  const pyramidRef = useRef();
  const innerCoreRef = useRef();
  const particlesRef = useRef();
  const instancedNodesRef = useRef();
  const instancedHalosRef = useRef();
  const instancedTrisRef = useRef();

  const electricBlue = '#0077FF';
  const cyanGlow = '#00E5FF';

  // 1. Shared Geometries (memoized ONCE to eliminate duplicate GPU memory allocation)
  const pyramidGeom = useMemo(() => new THREE.TetrahedronGeometry(size, 0), [size]);
  const nodeSphereGeom = useMemo(() => new THREE.SphereGeometry(size * 0.18, 12, 12), [size]);
  const haloGeom = useMemo(() => new THREE.SphereGeometry(size * 0.28, 10, 10), [size]);
  const miniTriGeom = useMemo(() => new THREE.TetrahedronGeometry(1, 0), []);

  // Automatic GPU memory cleanup on unmount
  useEffect(() => {
    return () => {
      pyramidGeom.dispose();
      nodeSphereGeom.dispose();
      haloGeom.dispose();
      miniTriGeom.dispose();
    };
  }, [pyramidGeom, nodeSphereGeom, haloGeom, miniTriGeom]);

  // Extract 4 corner vertices
  const cornerVertices = useMemo(() => {
    const pos = pyramidGeom.getAttribute('position');
    const v = [];
    for (let i = 0; i < pos.count; i++) {
      v.push(new THREE.Vector3().fromBufferAttribute(pos, i));
    }
    const unique = [];
    v.forEach((vec) => {
      if (!unique.some((u) => u.distanceTo(vec) < 0.001)) {
        unique.push(vec);
      }
    });
    return unique;
  }, [pyramidGeom]);

  // Set up InstancedMesh matrices for corner nodes
  useEffect(() => {
    if (instancedNodesRef.current && instancedHalosRef.current) {
      const dummy = new THREE.Object3D();
      cornerVertices.forEach((v, i) => {
        dummy.position.copy(v);
        dummy.updateMatrix();
        instancedNodesRef.current.setMatrixAt(i, dummy.matrix);
        instancedHalosRef.current.setMatrixAt(i, dummy.matrix);
      });
      instancedNodesRef.current.instanceMatrix.needsUpdate = true;
      instancedHalosRef.current.instanceMatrix.needsUpdate = true;
    }
  }, [cornerVertices]);

  // Mini floating triangles data
  const miniTriangles = useMemo(() => {
    const list = [];
    for (let i = 0; i < 10; i++) {
      const radius = size * (1.3 + Math.random() * 0.7);
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      const scale = size * (0.08 + Math.random() * 0.06);
      const speed = 0.4 + Math.random() * 0.6;
      const axis = new THREE.Vector3(Math.random(), Math.random(), Math.random()).normalize();

      list.push({
        pos: new THREE.Vector3(
          radius * Math.sin(phi) * Math.cos(theta),
          radius * Math.sin(phi) * Math.sin(theta),
          radius * Math.cos(phi)
        ),
        scale,
        speed,
        axis,
        rot: new THREE.Euler(Math.random(), Math.random(), Math.random()),
      });
    }
    return list;
  }, [size]);

  // Orbiting Sparkles Buffer Geometry
  const sparkPoints = useMemo(() => {
    const count = 25; // Lightweight particle count
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = size * (1.2 + Math.random() * 0.8);
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geometry;
  }, [size]);

  const dummyTri = useMemo(() => new THREE.Object3D(), []);

  useFrame((state, delta) => {
    const time = state.clock.getElapsedTime();

    // Rotate main Pyramid
    if (pyramidRef.current) {
      pyramidRef.current.rotation.y += delta * 0.4;
      pyramidRef.current.rotation.x = Math.sin(time * 0.5) * 0.2;
    }

    // Inverted inner core counter-rotation
    if (innerCoreRef.current) {
      innerCoreRef.current.rotation.y -= delta * 0.8;
      innerCoreRef.current.rotation.z += delta * 0.5;
    }

    // Slowly rotate particle dust cloud
    if (particlesRef.current) {
      particlesRef.current.rotation.y += delta * 0.15;
    }

    // Animate mini floating triangles via single InstancedMesh (Zero garbage collection!)
    if (instancedTrisRef.current) {
      miniTriangles.forEach((tri, i) => {
        tri.pos.applyAxisAngle(tri.axis, delta * tri.speed);
        tri.rot.x += delta * 1.2;
        tri.rot.y += delta * 0.9;

        dummyTri.position.copy(tri.pos);
        dummyTri.rotation.copy(tri.rot);
        dummyTri.scale.setScalar(tri.scale);
        dummyTri.updateMatrix();

        instancedTrisRef.current.setMatrixAt(i, dummyTri.matrix);
      });
      instancedTrisRef.current.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <group>
      {/* Main Pyramid (Tetrahedron Node) */}
      <group ref={pyramidRef}>
        {/* Transparent Wireframe Edges */}
        <mesh geometry={pyramidGeom}>
          <meshStandardMaterial 
            color={cyanGlow} 
            wireframe 
            transparent 
            opacity={0.5} 
            emissive={cyanGlow}
            emissiveIntensity={0.8}
          />
        </mesh>

        {/* Semi-transparent Inner Faces */}
        <mesh geometry={pyramidGeom}>
          <meshStandardMaterial
            color={electricBlue}
            transparent
            opacity={0.12}
            side={THREE.DoubleSide}
            roughness={0.2}
          />
        </mesh>

        {/* 4 Corner Nodes (1 Single InstancedMesh for zero memory bloat) */}
        <instancedMesh
          ref={instancedNodesRef}
          args={[nodeSphereGeom, undefined, 4]}
        >
          <meshStandardMaterial 
            color={cyanGlow}
            emissive={cyanGlow}
            emissiveIntensity={1.5}
            roughness={0.1}
            metalness={0.9}
          />
        </instancedMesh>

        {/* Corner Halos (1 Single InstancedMesh) */}
        <instancedMesh
          ref={instancedHalosRef}
          args={[haloGeom, undefined, 4]}
        >
          <meshBasicMaterial 
            color={electricBlue}
            transparent
            opacity={0.35}
            wireframe
          />
        </instancedMesh>

        {/* Inner Floating Energy Crystal */}
        <mesh ref={innerCoreRef} geometry={pyramidGeom} scale={0.4} rotation={[Math.PI, 0, 0]}>
          <meshStandardMaterial
            color={electricBlue}
            emissive={cyanGlow}
            emissiveIntensity={1.2}
            wireframe
          />
        </mesh>
      </group>

      {/* Mini Floating Triangles (1 Single InstancedMesh) */}
      <instancedMesh
        ref={instancedTrisRef}
        args={[miniTriGeom, undefined, miniTriangles.length]}
      >
        <meshStandardMaterial
          color={cyanGlow}
          emissive={cyanGlow}
          emissiveIntensity={1.0}
          wireframe
          transparent
          opacity={0.8}
        />
      </instancedMesh>

      {/* Orbiting Quantum Dust / Sparkles */}
      <points ref={particlesRef} geometry={sparkPoints}>
        <pointsMaterial
          size={size * 0.05}
          color={cyanGlow}
          transparent
          opacity={0.7}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  );
}
