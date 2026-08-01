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
  const instancedDiamondsRef = useRef();
  const instancedRingsRef = useRef();

  const electricBlue = '#0077FF';
  const cyanGlow = '#00E5FF';
  const brightTurquoise = '#00FFD1';

  // 1. Shared Geometries (memoized ONCE for zero duplicate memory allocations)
  const pyramidGeom = useMemo(() => new THREE.TetrahedronGeometry(size, 0), [size]);
  const nodeSphereGeom = useMemo(() => new THREE.SphereGeometry(size * 0.18, 12, 12), [size]);
  const haloGeom = useMemo(() => new THREE.SphereGeometry(size * 0.28, 10, 10), [size]);
  
  // Floating shapes geometries
  const miniTriGeom = useMemo(() => new THREE.TetrahedronGeometry(1, 0), []);
  const miniDiamondGeom = useMemo(() => new THREE.OctahedronGeometry(1, 0), []);
  const miniRingGeom = useMemo(() => new THREE.TorusGeometry(1, 0.15, 8, 24), []);

  // Automatic GPU memory cleanup on unmount
  useEffect(() => {
    return () => {
      pyramidGeom.dispose();
      nodeSphereGeom.dispose();
      haloGeom.dispose();
      miniTriGeom.dispose();
      miniDiamondGeom.dispose();
      miniRingGeom.dispose();
    };
  }, [pyramidGeom, nodeSphereGeom, haloGeom, miniTriGeom, miniDiamondGeom, miniRingGeom]);

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

  // Helper generator for orbiting shapes
  const createOrbitalSwarm = (count, minR, maxR, scaleMin, scaleMax) => {
    const list = [];
    for (let i = 0; i < count; i++) {
      const radius = size * (minR + Math.random() * (maxR - minR));
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      const scale = size * (scaleMin + Math.random() * (scaleMax - scaleMin));
      const speed = 0.3 + Math.random() * 0.7;
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
  };

  // Swarms of shapes
  const miniTriangles = useMemo(() => createOrbitalSwarm(8, 1.2, 1.8, 0.07, 0.12), [size]);
  const miniDiamonds = useMemo(() => createOrbitalSwarm(6, 1.5, 2.2, 0.06, 0.11), [size]);
  const miniRings = useMemo(() => createOrbitalSwarm(4, 1.8, 2.5, 0.08, 0.14), [size]);

  // Orbiting Sparkles Buffer Geometry
  const sparkPoints = useMemo(() => {
    const count = 30;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = size * (1.1 + Math.random() * 1.4);
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

  const dummy = useMemo(() => new THREE.Object3D(), []);

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

    // Helper animator for instanced swarms
    const animateSwarm = (ref, list) => {
      if (ref.current) {
        list.forEach((item, i) => {
          item.pos.applyAxisAngle(item.axis, delta * item.speed);
          item.rot.x += delta * 1.4;
          item.rot.y += delta * 1.0;

          dummy.position.copy(item.pos);
          dummy.rotation.copy(item.rot);
          dummy.scale.setScalar(item.scale);
          dummy.updateMatrix();

          ref.current.setMatrixAt(i, dummy.matrix);
        });
        ref.current.instanceMatrix.needsUpdate = true;
      }
    };

    // Animate all 3 shape swarms cleanly
    animateSwarm(instancedTrisRef, miniTriangles);
    animateSwarm(instancedDiamondsRef, miniDiamonds);
    animateSwarm(instancedRingsRef, miniRings);
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

        {/* 4 Corner Nodes (Single InstancedMesh) */}
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

        {/* Corner Halos (Single InstancedMesh) */}
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

      {/* 1. Mini Floating Triangles Swarm */}
      <instancedMesh
        ref={instancedTrisRef}
        args={[miniTriGeom, undefined, miniTriangles.length]}
      >
        <meshStandardMaterial
          color={cyanGlow}
          emissive={cyanGlow}
          emissiveIntensity={1.2}
          wireframe
          transparent
          opacity={0.85}
        />
      </instancedMesh>

      {/* 2. Mini Floating Octahedron Diamonds Swarm */}
      <instancedMesh
        ref={instancedDiamondsRef}
        args={[miniDiamondGeom, undefined, miniDiamonds.length]}
      >
        <meshStandardMaterial
          color={brightTurquoise}
          emissive={brightTurquoise}
          emissiveIntensity={1.4}
          roughness={0.2}
          metalness={0.8}
        />
      </instancedMesh>

      {/* 3. Mini Floating Spinning Torus Rings Swarm */}
      <instancedMesh
        ref={instancedRingsRef}
        args={[miniRingGeom, undefined, miniRings.length]}
      >
        <meshStandardMaterial
          color={electricBlue}
          emissive={electricBlue}
          emissiveIntensity={1.5}
          wireframe
          transparent
          opacity={0.7}
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
