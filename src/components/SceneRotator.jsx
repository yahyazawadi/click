import React, { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * SceneRotator — Incremental Trackball Controller with Page Load Spinup.
 *
 * Solves Euler axis-fighting by applying incremental rotations in screen space.
 * - Intro animation: Executes a smooth 540° (180 + 360) spinup on page refresh.
 * - Drag Horizontal (X) → rotates around World Y.
 * - Drag Vertical (Y)   → rotates around World X.
 */
export function SceneRotator({ children, disabled = false }) {
  const { gl, size } = useThree();
  const groupRef = useRef();

  // Target orientation quaternion & current display quaternion
  const targetQuaternion = useRef(new THREE.Quaternion());

  // Intro spinup animation state (540 degrees total = 1.5 * Math.PI * 2)
  const isIntroSpinning = useRef(true);
  const introProgress = useRef(0);

  // Drag velocity for smooth inertia
  const velocity = useRef({ x: 0, y: 0 });

  // Drag state tracking
  const dragging = useRef(false);
  const lastX = useRef(0);
  const lastY = useRef(0);

  // Accumulate mouse deltas between frames
  const mouseDelta = useRef({ x: 0, y: 0 });
  const touchCount = useRef(0);

  useEffect(() => {
    const canvas = gl.domElement;

    const onTouchStart = (e) => {
      touchCount.current = e.touches.length;
    };
    const onTouchEnd = (e) => {
      touchCount.current = e.touches.length;
    };

    const onPointerDown = (e) => {
      if (disabled || touchCount.current >= 2) return;
      isIntroSpinning.current = false; // User interaction cancels intro spin immediately
      dragging.current = true;
      lastX.current = e.clientX;
      lastY.current = e.clientY;
      mouseDelta.current = { x: 0, y: 0 };
      velocity.current = { x: 0, y: 0 };
      canvas.style.cursor = 'grabbing';
    };

    const onPointerMove = (e) => {
      if (!dragging.current || disabled || touchCount.current >= 2) return;

      mouseDelta.current.x += e.clientX - lastX.current;
      mouseDelta.current.y += e.clientY - lastY.current;
      
      lastX.current = e.clientX;
      lastY.current = e.clientY;
    };

    const onPointerUp = () => {
      dragging.current = false;
      canvas.style.cursor = 'grab';
    };

    canvas.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchend', onTouchEnd, { passive: true });
    canvas.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);
    canvas.style.cursor = 'grab';

    return () => {
      canvas.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchend', onTouchEnd);
      canvas.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
    };
  }, [gl, disabled]);

  useFrame((_state, delta) => {
    if (!groupRef.current) return;

    // Intro Spinup (540 deg total: 180 + 360)
    if (isIntroSpinning.current) {
      // Ease out spin over ~1.8 seconds
      introProgress.current += delta * 0.75;
      if (introProgress.current >= 1) {
        introProgress.current = 1;
        isIntroSpinning.current = false;
      }

      // Smooth step easing curve (spin from -540 degrees back to 0 degrees)
      const t = Math.min(1, introProgress.current);
      const easeT = 1 - Math.pow(1 - t, 3); // Cubic ease out
      const totalSpin = 1.5 * Math.PI * 2; // 540 degrees
      const currentAngle = (easeT - 1) * totalSpin; // Starts at -540° (-3pi) and ends at 0°

      // Apply spin around Y-axis
      const qSpin = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), currentAngle);
      targetQuaternion.current.copy(qSpin);
      groupRef.current.quaternion.copy(targetQuaternion.current);
      return;
    }

    if (dragging.current) {
      // 1. Process accumulated mouse movements for this frame
      const sensitivity = 2.2;
      const maxStep = 0.25;
      const rawAngleX = (mouseDelta.current.x / size.width) * Math.PI * sensitivity;
      const rawAngleY = (mouseDelta.current.y / size.height) * Math.PI * sensitivity;

      const angleX = THREE.MathUtils.clamp(rawAngleX, -maxStep, maxStep);
      const angleY = THREE.MathUtils.clamp(rawAngleY, -maxStep, maxStep);

      mouseDelta.current = { x: 0, y: 0 };

      // 2. Smoothly track velocity
      const maxVel = 0.08;
      const nextVelX = velocity.current.x * 0.5 + angleX * 0.5;
      const nextVelY = velocity.current.y * 0.5 + angleY * 0.5;

      velocity.current.x = THREE.MathUtils.clamp(nextVelX, -maxVel, maxVel);
      velocity.current.y = THREE.MathUtils.clamp(nextVelY, -maxVel, maxVel);

      // 3. Apply immediate incremental rotation
      if (Math.abs(angleX) > 0 || Math.abs(angleY) > 0) {
        const qY = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), angleX);
        const qX = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), angleY);
        targetQuaternion.current.premultiply(qX).premultiply(qY);
      }

      // 4. INSTANT 1:1 tracking during active drag
      groupRef.current.quaternion.copy(targetQuaternion.current);
    } else {
      // Apply inertia & smooth damping when let go
      if (Math.abs(velocity.current.x) > 0.0001 || Math.abs(velocity.current.y) > 0.0001) {
        const qY = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), velocity.current.x);
        const qX = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), velocity.current.y);

        targetQuaternion.current.premultiply(qX).premultiply(qY);

        velocity.current.x *= 0.93;
        velocity.current.y *= 0.93;
      }

      // Smoothly slerp to target quaternion during inertia release
      groupRef.current.quaternion.slerp(targetQuaternion.current, 1 - Math.pow(0.001, delta));
    }
  });

  return <group ref={groupRef}>{children}</group>;
}

