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

  // 5. Planetary Projects Data
  projects: [
    {
      id: 'proj-climamedix',
      title: 'CLIMAMEDIX',
      ringIndex: 0,
      shapeIndex: 'simple-earth',
      startAngle: 2.1,
      size: 0.65,
      color: '#10B981',
      category: 'MEDICAL & CLIMATE EPIDEMIOLOGY',
      shortDesc: 'Geospatial epidemiological intelligence platform tracking climate change impacts on disease vectors.',
      fullDesc: 'An epidemiological intelligence platform mapping climate change impacts on disease vectors, respiratory risks, and regional health dynamics. Built with Supabase PostgreSQL, geospatial data visualizers, and predictive telemetry.',
      tags: ['FULL-STACK', 'POSTGRESQL', 'SUPABASE', 'GEOSPATIAL', 'EPIDEMIOLOGY', '3D WEBGL'],
      specs: [
        'Core: Geospatial Contagion & Vector Tracking',
        'Database: Supabase PostgreSQL & Spatial Schemas',
        'Telemetry: Real-Time Environmental Health Indices',
        'Interface: Multi-Language Disease Intelligence'
      ]
    },
    {
      id: 'proj-climamedix-terra',
      title: 'CLIMAMEDIX // TERRA',
      ringIndex: 2,
      shapeIndex: 'real-earth',
      startAngle: 0.8,
      size: 0.70,
      color: '#0284C7',
      category: 'AUTHENTIC NASA CONTINENTS',
      shortDesc: 'Photorealistic continental Earth with real-world landmasses, oceans, and parallax clouds.',
      fullDesc: 'An authentic high-definition 3D Earth incorporating real NASA Blue Marble continental mapping, specular ocean reflections, and dynamic atmospheric cloud formations drifting in true 3D parallax.',
      tags: ['NASA MAPS', 'REAL CONTINENTS', 'PARALLAX CLOUDS', '120 FPS', 'THREE.JS'],
      specs: [
        'Mapping: Authentic NASA Continental Geography',
        'Atmosphere: Real-Time Parallax Cloud Drift',
        'Oceans: High-Definition Specular Glint Mapping',
        'Performance: Hardware-Accelerated 120 FPS'
      ]
    },
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

export const SECRET_LOVE_PROJECTS = [
  {
    id: 'proj-heart-1',
    title: 'FOR MY FAVORITE FLOWER',
    ringIndex: 0,
    shapeIndex: 'flower',
    startAngle: 1.2,
    size: 0.65,
    color: '#CD6973',
    category: 'SECRET WORLD // JUST FOR YOU',
    shortDesc: 'A world created for the most caring, gentle, and remarkably beautiful person in the universe.',
    fullDesc: 'No matter what challenges or storms come our way, we will pass every single struggle together, side-by-side. You bring so much strength, warmth, and comfort into my life. Hand in hand, there is nothing in this universe we cannot overcome together. I love you more than words can express.',
    tags: ['TOGETHER FOREVER', 'HAND IN HAND', 'SO CARING & KIND', 'MY EVERYTHING'],
    specs: [
      'Promise: Passing Every Struggle Together',
      'Heart: Caring, Gentle & Kind',
      'Status: Forever My Favorite Flower'
    ]
  },
  {
    id: 'proj-heart-2',
    title: 'YOU MEAN THE WORLD TO ME',
    ringIndex: 2,
    shapeIndex: 'heart-sculpted',
    startAngle: 3.5,
    size: 0.65,
    color: '#9F477E',
    category: 'SECRET WORLD // JUST FOR YOU',
    shortDesc: 'A glowing 3D heart floating in orbit, dedicated to the prettiest girl in the world.',
    fullDesc: 'You have the softest, most caring heart and a smile that lights up <b>my space</b>. Together, we will rise above every hardship and pass every struggle as one. Thank you for caring so deeply and making my life complete. You are loved endlessly, always & forever.',
    tags: ['ALWAYS & FOREVER', 'STRONG TOGETHER', 'WARM & CARING', 'SPECIAL EASTER EGG'],
    specs: [
      'Smile: Brightest Light in My Universe',
      'Promise: Standing Strong Side-by-Side',
      'My Heart: Yours Forever'
    ]
  }
];

// ─────────────────────────────────────────────────────────────────────────────
//  CENTRAL NEBULA CONFIGURATION & PRESETS
//  Single source of truth for all nebula path selections & state locks.
// ─────────────────────────────────────────────────────────────────────────────

export const NEBULA_PRESETS = {
  SILKY_WISPS: 0,
  DEEP_OCEAN: 1,
  ORION_BOW_WAVE: 2,     // Red Nebula Master Shape (Locked)
  PLASMA_CANOPY: 3,
  POLAR_VORTEX: 4,
  EMISSION_SHROUD: 5,   // Teal Nebula Master Shape (Locked)
  KOLMOGOROV_CASCADE: 6,
  BOW_SHOCK_ARCS: 7,
};

export const NEBULA_CONFIG = {
  // NEBULA 1 (RED / CRIMSON) - Independent Configuration
  nebula1: {
    path: NEBULA_PRESETS.ORION_BOW_WAVE,  // Path 2 (Orion Bow Wave)
    scale: 5,
    warp: 4.6,
    brightness: 2.8,
    dustStrength: 0.76,
    pillarStrength: 0.52,
    maskRadius: 0.24,
    edgeWarp: 0.64,
    coreRadius: 0.16,
    alpha: 0.92,
    // Color Palette
    colors: {
      sii:  '#b1631b', // Golden Amber Outer Wisps
      ha:   '#e61924', // Vivid Crimson Mid-Body
      oiii: '#570047', // Deep Violet Void Shadow
      core: '#ff2465', // Hot Ruby Rose Core
    },
  },

  // NEBULA 2 (TEAL / BLUE) - Independent Configuration
  nebula2: {
    path: NEBULA_PRESETS.ORION_BOW_WAVE,  // Path 2 (Orion Bow Wave)
    scale: 4.5,
    warp: 3.8,
    brightness: 2.8,
    dustStrength: 0.35,
    pillarStrength: 0.5,
    maskRadius: 0.42,
    edgeWarp: 0.4,
    coreRadius: 0.25,
    alpha: 0.88,
    // Color Palette
    colors: {
      sii:  '#00a8e6', // Rich deep cyan-turquoise
      ha:   '#081640', // Deep cosmic navy-cobalt
      oiii: '#3b008f', // Deep royal violet gas depth
      core: '#00b8e6', // Rich deep electric cyan core
    },
  },

  // Locked Baseline Guard
  isLocked: true,
};
