// YAHYA.CLICK — CENTRAL SYSTEM CONFIGURATION
// Everything in this file is designed to be easily editable!

export const SYSTEM_CONFIG = {
  // 1. Color Palette
  colors: {
    bgVoid: '#071124',        // Deep Space Void
    deepShadow: '#003268',    // Core Base / Dark Elements
    primaryCyan: '#00BAE3',   // Primary Glowing Highlights
    secondaryBlue: '#5DBAE1', // Soft Orbital Ring Color
    textPure: '#FCFCFC',      // Crisp Readable Text
  },

  // 2. Typography
  fontFamily: "'JetBrains Mono', monospace",

  // 3. Central Sphere ("Sun" Core - Flexible Size!)
  core: {
    radius: 1.8,             // Change core size anytime!
    color: '#003268',        // NOT yellow/white
    emissive: '#00BAE3',     // Emissive rim glow
    title: 'YAHYA CORE',
    subtitle: 'SYSTEM ARCHITECT & DEVELOPER',
    aboutText: `Welcome to yahya.click. I craft high-concurrency platforms, real-time architectures, and interactive spatial interfaces. Driven by sleek minimalism, robust system design, and effortless user experiences.`,
    stats: [
      { label: 'STATUS', val: 'ONLINE // ACTIVE' },
      { label: 'DOMAIN', val: 'YAHYA.CLICK' },
      { label: 'FOCUS', val: 'FULLSTACK & SPATIAL' },
    ]
  },

  // 4. Tilted Macro Orbital Rings
  // Rings now configured to dramatically intersect (like a gyroscope) and stay perfectly in view!
  rings: [
    { id: 0, radius: 5.5, tiltX: 1.2, tiltY: 0.5, tiltZ: -0.2, speed: 0.12, color: '#00BAE3' },
    { id: 1, radius: 7.0, tiltX: -0.8, tiltY: 1.1, tiltZ: 0.4, speed: 0.08, color: '#5DBAE1' },
    { id: 2, radius: 8.5, tiltX: 0.3, tiltY: -1.2, tiltZ: 0.9, speed: 0.05, color: '#003268' },
  ],

  // 5. Planetary Projects Data (Expanded with 8 Orbital Nodes!)
  projects: [
    {
      id: 'proj-10',
      title: 'SCISSOR WORLD',
      ringIndex: 1,
      shapeIndex: 10,
      startAngle: 4.2,
      size: 0.55,
      color: '#00BAE3',
      category: 'PRECISION TOOLS',
      shortDesc: 'Compact orbital world crowned with a pair of precision cutting scissors.',
      fullDesc: 'A smaller rogue planet defined by the iconic scissors mounted on its north pole — snapping open and closed as it orbits the system, a testament to craftsmanship at cosmic scale.',
      tags: ['THREE.JS', 'GLSL', 'PROCEDURAL', 'REACT THREE FIBER'],
      specs: [
        'Crown: Animated Snapping Scissors',
        'Body: Glowing Icosahedral Planet',
        'Orbit: Inner Ring Trajectory'
      ]
    }
  ]
};

// ─────────────────────────────────────────────────────────────────────────────
//  CENTRAL NEBULA CONFIGURATION & PRESETS
//  Single source of truth for all nebula path selections & state locks.
// ─────────────────────────────────────────────────────────────────────────────

export const NEBULA_PRESETS = {
  SILKY_WISPS: 0,
  DEEP_OCEAN: 1,
  ORION_BOW_WAVE: 2,     // 🔴 Red Nebula Master Shape (Locked)
  PLASMA_CANOPY: 3,
  POLAR_VORTEX: 4,
  EMISSION_SHROUD: 5,   // 🔵 Teal Nebula Master Shape (Locked)
  KOLMOGOROV_CASCADE: 6,
  BOW_SHOCK_ARCS: 7,
};

export const NEBULA_CONFIG = {
  // 🔴 NEBULA 1 (RED / CRIMSON) — Independent Configuration
  nebula1: {
    path: NEBULA_PRESETS.ORION_BOW_WAVE,  // Path 2 (Orion Bow Wave)
    scale: 3.2,
    warp: 3.2,
    brightness: 2.7,
    dustStrength: 0.78,
    pillarStrength: 0.65,
    maskRadius: 0.44,
    edgeWarp: 0.30,
    coreRadius: 0.22,
    alpha: 0.95,
  },

  // 🔵 NEBULA 2 (TEAL / BLUE) — Independent Configuration
  nebula2: {
    path: NEBULA_PRESETS.ORION_BOW_WAVE,  // Path 2 (Orion Bow Wave)
    scale: 4.5,
    warp: 3.8,
    brightness: 2.8,
    dustStrength: 0.35,
    pillarStrength: 0.50,
    maskRadius: 0.42,
    edgeWarp: 0.40,
    coreRadius: 0.25,
    alpha: 0.88,
  },

  // Locked Baseline Guard
  isLocked: true,
};
