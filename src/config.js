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
      tubeRadius:       0.011,
      speedX:           0.25,
      speedY:           0.35,
      speedZ:           0.15,
      color:            '#1e4e6c',
      emissive:         '#4a83cf',
      emissiveIntensity: 0.9,
      opacity:          1,
      tiltX:            -3.14,
      tiltY:            0,
      tiltZ:            0
    },
    ring2: {
      enabled:          true,
      radiusMultiplier: 1.7,
      tubeRadius:       0.017,
      speedX:           0.3,
      speedY:           0.2,
      speedZ:           0.1,
      color:            '#8eaccc',
      emissive:         '#5b539d',
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
    title: 'EXATIK INTERNSHIP',
    subtitle: 'FULL-STACK & SPATIAL WEB ENGINEERING',
    aboutText: `Official practical training defense & systems architecture showcase for Exatik (Nablus). Supervised academically by Anas Atatrih & field-supervised by Mohammad Shadid. Total verified: 560 training hours spanning 4 core engineering phases across SaaS, Geospatial data, Mobile PWAs, and 120 FPS 3D WebGL.`,
    stats: [
      { label: 'INSTITUTION', val: 'EXATIK // NABLUS' },
      { label: 'TOTAL LOGGED', val: '560 HOURS (175%)' },
      { label: 'SUPERVISION', val: 'A. ATATRIH // M. SHADID' },
      { label: 'STATUS', val: 'COMPLETED // VERIFIED' },
    ]
  },

  // 4. Tilted Macro Orbital Rings
  rings: RINGS_CONFIG.rings,

  // 5. Planetary Projects Data (Chronological 4-Phase Internship Progression)
  projects: [
    {
      id: 'proj-phase1-climamedix',
      title: 'PHASE 1: CLIMAMEDIX',
      ringIndex: 0,
      shapeIndex: 'simple-earth',
      startAngle: 1.0,
      size: 0.65,
      color: '#10B981',
      category: 'WEEKS 1-2 // GEOSPATIAL & LMS',
      shortDesc: 'Geospatial epidemiological platform with Mapbox GL JS, interactive LMS, and Cloudflare R2 storage.',
      fullDesc: 'During Weeks 1 & 2 at Exatik, engineered the full-stack ClimaMedix platform: integrated Mapbox GL JS for geospatial contagion tracking, built an interactive LMS with custom media players & automated quiz grading, connected secure Cloudflare R2 multipart storage, and deployed a live PostgreSQL schema debugger at climamedix-sql.pages.dev/debug.',
      tags: ['MAPBOX GL JS', 'SUPABASE', 'POSTGRESQL', 'CLOUDFLARE R2', 'LMS ENGINE', 'GEOSPATIAL'],
      specs: [
        'Geospatial: Mapbox GL JS Vector & Heatmap Tracking',
        'LMS Hub: Drag-and-Drop Course Builder & Auto Quizzes',
        'Storage: Secure Cloudflare R2 Multipart Asset Uploads',
        'Database: Supabase PostgreSQL & Live Schema Visualizer'
      ],
      gallery: [
        {
          title: 'ClimaMedix Platform Screenshot',
          caption: 'Full-stack ClimaMedix: Mapbox GL JS geospatial tracking, LMS, and Cloudflare R2 storage.',
          url: '/gallery/120usd.png',
          tag: 'PHASE 1'
        }
      ]
    },
    {
      id: 'proj-phase2-design-pwa',
      title: 'PHASE 2: DESIGN & PWAs',
      ringIndex: 0,
      shapeIndex: 'flower',
      startAngle: 4.2,
      size: 0.60,
      color: '#06B6D4',
      category: 'WEEKS 3-4 // UI/UX & MOBILE FOUNDATIONS',
      shortDesc: 'Google UX Foundations, Figma BYOL Design Systems, and Mobile PWA Service Workers.',
      fullDesc: 'Weeks 3 & 4 focused on UI/UX excellence and mobile architecture: completed Google UX Design Foundations (Coursera) and Figma BYOL Essentials (design frames, Auto-Layout, Smart Animate). Engineered Progressive Web Apps (PWAs) with manifest configurations, Service Worker lifecycles (Cache-First vs Network-First), and Web Push Notifications.',
      tags: ['GOOGLE UX CERT', 'FIGMA BYOL', 'PWA', 'SERVICE WORKERS', 'WEB PUSH API', 'DESIGN SYSTEMS'],
      specs: [
        'Certification: Google UX Design Foundations (Coursera)',
        'Design System: Figma Auto-Layout & Micro-Interactions',
        'PWA Architecture: Service Workers & Offline Caching',
        'Notifications: Web Push API & Custom Permission Flows'
      ],
      gallery: [
        {
          title: 'Design & PWA Screenshot',
          caption: 'Google UX Design Foundations, Figma BYOL design systems, and PWA Service Workers.',
          url: '/gallery/120usd.png',
          tag: 'PHASE 2'
        }
      ]
    },
    {
      id: 'proj-phase3-barber-saas',
      title: 'PHASE 3: BARBER SAAS',
      ringIndex: 1,
      shapeIndex: 10,
      startAngle: 2.6,
      size: 0.65,
      color: '#3B82F6',
      category: 'WEEKS 5-7 // ENTERPRISE SAAS & CONCURRENCY',
      shortDesc: 'Multi-Tenant SaaS with PostgreSQL Advisory Locks, RLS, WhatsApp Edge Functions, and Live Device Lab.',
      fullDesc: 'Weeks 5 to 7 delivered enterprise multi-tenant architecture for barber-multi-tenant: eliminated concurrent booking race conditions with PostgreSQL transaction-scoped advisory locks (pg_advisory_xact_lock), enforced 20-key database RBAC and Row-Level Security (RLS), deployed Supabase WhatsApp Edge Functions, built the Super Admin Live Device Lab, and wrote comprehensive Playwright E2E test suites.',
      tags: ['POSTGRESQL RLS', 'ADVISORY LOCKS', 'SUPABASE EDGE', 'WHATSAPP BOT', 'PLAYWRIGHT E2E', 'LIVE DEVICE LAB'],
      specs: [
        'Concurrency: Transaction-Scoped Advisory Locks (No Collision)',
        'Security: Database-Enforced 20-Key RBAC & Row-Level Security',
        'Automation: WhatsApp Bot Edge Functions with wamid Lookup',
        'Testing & QA: Super Admin Live Device Lab & Playwright E2E'
      ],
      gallery: [
        {
          title: 'Barber SaaS Platform Screenshot',
          caption: 'Multi-tenant SaaS: Advisory Locks, RLS, WhatsApp Edge Functions, and Live Device Lab.',
          url: '/gallery/120usd.png',
          tag: 'PHASE 3'
        }
      ]
    },
    {
      id: 'proj-phase4-spatial-3d',
      title: 'PHASE 4: 3D SPATIAL WEB',
      ringIndex: 2,
      shapeIndex: 'real-earth',
      startAngle: 0.8,
      size: 0.70,
      color: '#0284C7',
      category: 'WEEK 8 // 120 FPS WEBGL & SHADERS',
      shortDesc: 'Hardware-accelerated 3D spatial web engine with custom GLSL shaders and real-time telemetry.',
      fullDesc: 'Week 8 culminated in building yahya.click: an interactive 120 FPS spatial web platform using Three.js and custom GLSL procedural noise shaders (volumetric dual nebulae with additive blending). Engineered Zero-Allocation Frustum Culling to eliminate GC stutter, built a real-time Telemetry Profiler HUD with live frametime graphing, and integrated dynamic SVG favicon performance sync.',
      tags: ['THREE.JS', 'CUSTOM GLSL', '120 FPS', 'ZERO-ALLOCATION', 'TELEMETRY PROFILER', 'REACT THREE FIBER'],
      specs: [
        'Performance: 120 FPS Hardware-Accelerated Rendering',
        'Shaders: Procedural fBM & Simplex Noise GLSL Nebulae',
        'Optimization: Zero-Allocation Frustum Culling (No GC Stutter)',
        'Telemetry: Real-Time Frametime HUD & Dynamic SVG Favicon'
      ],
      gallery: [
        {
          title: '3D Spatial Web Engine Screenshot',
          caption: '120 FPS Three.js cosmos: custom GLSL nebulae, Zero-Allocation Frustum Culling, live Telemetry HUD.',
          url: '/gallery/120usd.png',
          tag: 'PHASE 4'
        }
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

// Generate unique, high-entropy procedural seeds based on exact timestamp when website is opened
export function generateTimeBasedSeed(salt = 0) {
  const now = typeof Date !== 'undefined' ? Date.now() : 1000;
  const perf = typeof performance !== 'undefined' ? performance.now() : 500;
  const hash = Math.sin((now + salt * 997) * 0.0015) * 67.0 + Math.cos((perf + salt * 433) * 0.003) * 49.0 + (Math.random() - 0.5) * 30.0;
  return +(hash).toFixed(1);
}

export const DEFAULT_NEBULA_CONFIG = {
  // NEBULA 1 (RED / CRIMSON) - Independent Configuration
  nebula1: {
    path: 2,
    scale: 5.4,
    warp: 5.7,
    coverage: 0.21, // Gas expansion bias (0.21 = expanded majestic crimson cloud)
    brightness: 0.8,
    dustStrength: 0.92,
    pillarStrength: 0.52,
    maskRadius: 0.23,
    minSize: 0.03, // Minimum inner solid radius (guaranteed full density core)
    maxSize: 0.32, // Maximum outer perimeter cutoff
    edgeWarp: 0.74,
    coreRadius: 0.17,
    alpha: 0.72,
    gradientSoftness: 1.0, // 0.1 = steep high-contrast, 1.0+ = silky continuous velvet gradient
    speed: 0.0, // Static freeze baseline
    seedX: generateTimeBasedSeed(1),
    seedY: generateTimeBasedSeed(2),
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
    coverage: 0.35, // Gas expansion bias (0.35 = expanded lush celestial stream)
    brightness: 0.7,
    dustStrength: 0,
    pillarStrength: 0.5,
    maskRadius: 0.14,
    minSize: 0.02, // Minimum inner solid radius (guaranteed full density core)
    maxSize: 0.20, // Maximum outer perimeter cutoff
    edgeWarp: 1,
    coreRadius: 0.02,
    alpha: 1,
    gradientSoftness: 1.0, // 0.1 = steep high-contrast, 1.0+ = silky continuous velvet gradient
    speed: 0.0, // Static freeze baseline
    seedX: generateTimeBasedSeed(3),
    seedY: generateTimeBasedSeed(4),
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
    
    // Always generate unique timestamp seeds on session startup for both nebulae
    NEBULA_CONFIG.nebula1.seedX = generateTimeBasedSeed(1);
    NEBULA_CONFIG.nebula1.seedY = generateTimeBasedSeed(2);
    NEBULA_CONFIG.nebula2.seedX = generateTimeBasedSeed(3);
    NEBULA_CONFIG.nebula2.seedY = generateTimeBasedSeed(4);
  } catch (e) {
    console.warn('LocalStorage config load error:', e);
  }
}
