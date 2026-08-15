// ─────────────────────────────────────────────────────────────────────────────
//  FACTORY BASELINE CONSTANTS (IMMUTABLE REFERENCE DEFAULTS FOR RESET)
// ─────────────────────────────────────────────────────────────────────────────

export const DEFAULT_CORE_CONFIG = {
  radius: 1.6,
  rotationSpeed: 0.15,
  colors: {
    deepOcean:      '#ffffff',
    midOcean:       '#0088ff',
    cloudBand:      '#00aaff',
    stormHighlight: '#00e1ff',
    atmosphere:     '#00BAE3',
    continentColor: '#00b3ff',
    coastColor:     '#00ddff'
  },
  clouds: {
    driftSpeed:     0.025,
    scale:          2,
    bandFrequency:  14,
    bandWarp:       0.65,
    stormIntensity: 0.7
  },
  continents: {
    driftSpeed:     0.004,
    scale:          0.95,
    seaLevel:       -0.1
  },
  atmosphere: {
    fresnelPower:     1.3,
    fresnelIntensity: 1.25
  },
  lighting: {
    specularIntensity: 0.35,
    specularShininess: 32,
    ambientLight:      0.25,
    diffuseLight:      0.85,
    polarFade:         1
  },
  innerRings: {
    ring1: {
      enabled:          true,
      radiusMultiplier: 1.5,
      tubeRadius:       0.03,
      speedX:           0.25,
      speedY:           0.35,
      speedZ:           0.15,
      color:            '#a600ff',
      emissive:         '#ff0040',
      emissiveIntensity: 0.9,
      opacity:          1,
      tiltX:            -3.14,
      tiltY:            0,
      tiltZ:            0
    },
    ring2: {
      enabled:          true,
      radiusMultiplier: 1.7,
      tubeRadius:       0.02,
      speedX:           0.3,
      speedY:           0.2,
      speedZ:           0.1,
      color:            '#8a0043',
      emissive:         '#5c003a',
      emissiveIntensity: 1.9,
      opacity:          1,
      tiltX:            -1.047198,
      tiltY:            3.11,
      tiltZ:            0
    }
  }
};

export const DEFAULT_RINGS_CONFIG = {
  rings: [
    {
      id: 0,
      radius: 5.1,
      tiltX: 1.31,
      tiltY: 0.5,
      tiltZ: -0.2,
      speed: 0.265,
      color: '#0091ff',
      opacity: 0.99,
      enabled: true
    },
    {
      id: 1,
      radius: 7.3,
      tiltX: 2.71,
      tiltY: 1.36,
      tiltZ: 0.4,
      speed: 0.08,
      color: '#009dff',
      opacity: 0.99,
      enabled: true
    },
    {
      id: 2,
      radius: 8.5,
      tiltX: 0.3,
      tiltY: -1.2,
      tiltZ: 0.9,
      speed: 0.05,
      color: '#00ccff',
      opacity: 0.99,
      enabled: true
    }
  ],
  global: {
    speedMultiplier: 1,
    opacityMultiplier: 1,
    enabled: true
  }
};

// ─────────────────────────────────────────────────────────────────────────────
//  MUTABLE RUNTIME CONFIGURATIONS (LIVE TUNED IN PROFILER)
// ─────────────────────────────────────────────────────────────────────────────

export const CORE_CONFIG = JSON.parse(JSON.stringify(DEFAULT_CORE_CONFIG));
export const RINGS_CONFIG = JSON.parse(JSON.stringify(DEFAULT_RINGS_CONFIG));


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
    get radius() { return CORE_CONFIG.radius; },
    color: '#003268',
    emissive: '#00BAE3',
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
  rings: RINGS_CONFIG.rings,

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

export const DEFAULT_NEBULA_CONFIG = {
  // NEBULA 1 (RED / CRIMSON) - Independent Configuration
  nebula1: {
    path: 2,
    scale: 5.4,
    warp: 5.7,
    brightness: 0.8,
    dustStrength: 0.92,
    pillarStrength: 0.52,
    maskRadius: 0.23,
    edgeWarp: 0.74,
    coreRadius: 0.17,
    alpha: 0.72,
    gradientSoftness: 1.0, // 0.1 = steep high-contrast, 1.0+ = silky continuous velvet gradient
    // Multi-Core & Cellular Convection Parameters
    multiCoreStrength: 0.0,
    multiCoreScale: 1.8,
    voidPinch: 0.0,
    // Color Palette
    colors: {
      sii:  '#bb168f',
      ha:   '#ff2465',
      oiii: '#570047',
      core: '#ff9500',
    },
  },

  // NEBULA 2 (TEAL / BLUE) - Independent Configuration
  nebula2: {
    path: 2,
    scale: 3.1,
    warp: 6,
    brightness: 0.7,
    dustStrength: 0,
    pillarStrength: 0.5,
    maskRadius: 0.14,
    edgeWarp: 1,
    coreRadius: 0.02,
    alpha: 1,
    gradientSoftness: 1.0, // 0.1 = steep high-contrast, 1.0+ = silky continuous velvet gradient
    // Multi-Core & Cellular Convection Parameters
    multiCoreStrength: 0.0,
    multiCoreScale: 1.8,
    voidPinch: 0.0,
    // Color Palette
    colors: {
      sii:  '#00658a',
      ha:   '#0031a3',
      oiii: '#4600a8',
      core: '#00e1ff',
    },
  },

  // Locked Baseline Guard
  isLocked: true,
};

export const NEBULA_CONFIG = JSON.parse(JSON.stringify(DEFAULT_NEBULA_CONFIG));

// ─────────────────────────────────────────────────────────────────────────────
//  LOCALSTORAGE PERSISTENCE INITIALIZER
// ─────────────────────────────────────────────────────────────────────────────
if (typeof window !== 'undefined') {
  try {
    const savedCore = localStorage.getItem('yahya_core_config');
    if (savedCore) Object.assign(CORE_CONFIG, JSON.parse(savedCore));

    const savedRings = localStorage.getItem('yahya_rings_config');
    if (savedRings) {
      const parsed = JSON.parse(savedRings);
      if (parsed.rings) {
        parsed.rings.forEach((r, i) => {
          if (RINGS_CONFIG.rings[i]) Object.assign(RINGS_CONFIG.rings[i], r);
        });
      }
      if (parsed.global) Object.assign(RINGS_CONFIG.global, parsed.global);
    }

    const savedNebula = localStorage.getItem('yahya_nebula_config');
    if (savedNebula) {
      const parsed = JSON.parse(savedNebula);
      if (parsed.nebula1) Object.assign(NEBULA_CONFIG.nebula1, parsed.nebula1);
      if (parsed.nebula2) Object.assign(NEBULA_CONFIG.nebula2, parsed.nebula2);
    }
  } catch (e) {
    console.warn('LocalStorage config load error:', e);
  }
}
