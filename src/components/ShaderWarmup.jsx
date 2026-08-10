/**
 * ShaderWarmup.jsx
 *
 * Gradually pre-compiles heavy custom GLSL shaders in the background
 * to eliminate the stutter spike that happens when a planet first unlocks.
 *
 * Strategy:
 *  - Wait 300ms after mount (scene is stable, user is reading the landing)
 *  - Render each heavy shader at scale=0 (invisible, but the GPU driver
 *    still compiles the GLSL on the first draw call)
 *  - One material per 150ms interval → imperceptible, spreads the cost
 *  - Self-destructs after all shaders are warmed (returns null)
 *
 * Materials that need warmup:
 *  - ScissorMoonShaderMaterial  ← main offender (complex GLSL, not rendered until unlocked)
 *
 * Materials that do NOT need warmup:
 *  - PlanetCoreMaterial  → already compiled by SystemCore from frame 1
 *  - NebulaShaderMaterial → already compiled by DualNebulaBackground from frame 1
 *  - All standard MeshStandardMaterial / MeshBasicMaterial → compiles in <2ms, no issue
 */

import { useEffect, useState } from 'react';
import '../shaders/ScissorMoonShaderMaterial';

export function ShaderWarmup({ perfTierFloat = 0.0 }) {
  // step 0 = not started, 1 = ScissorMoon visible, 99 = done (removed)
  const [step, setStep] = useState(0);

  useEffect(() => {
    const timers = [
      // 300ms: scene is rendered and stable → compile ScissorMoonShaderMaterial
      setTimeout(() => setStep(1), 300),

      // 600ms: 2-3 frames have passed → shader is compiled → remove warmup mesh
      setTimeout(() => setStep(99), 600),
    ];

    return () => timers.forEach(clearTimeout);
  }, []); // run once on mount

  // Not started yet or done — render nothing
  if (step === 0 || step >= 99) return null;

  return (
    <group>
      {/* ScissorMoonShaderMaterial warmup mesh — invisible but forces GLSL compilation */}
      {step >= 1 && (
        <mesh
          scale={[0, 0, 0]}
          frustumCulled={false} // must not be culled or it won't draw
        >
          {/* Minimal geometry — 4×4 sphere is enough to trigger compilation */}
          <sphereGeometry args={[1, 4, 4]} />
          <scissorMoonShaderMaterial uPerfTier={perfTierFloat} />
        </mesh>
      )}
    </group>
  );
}
