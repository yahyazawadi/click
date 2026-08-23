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
    title: 'YAHYA CORE',
    subtitle: 'SYSTEM ARCHITECT & DEVELOPER',
    aboutText: `Full-stack developer building high-concurrency platforms, real-time systems, and spatial web interfaces.`,
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
    // COMMENTED OUT: proj-climamedix simple-earth (replaced by Terra real-earth)
    // {
    //   id: 'proj-climamedix',
    //   title: 'CLIMAMEDIX',
    //   ringIndex: 0,
    //   shapeIndex: 'simple-earth',
    //   startAngle: 2.1,
    //   size: 0.65,
    //   color: '#10B981',
    //   category: 'MEDICAL & CLIMATE EPIDEMIOLOGY',
    //   shortDesc: 'Geospatial health platform tracking climate impacts on disease vectors.',
    //   fullDesc: 'Maps climate change impacts on disease vectors and regional health dynamics. Supabase PostgreSQL backend, Mapbox GL JS geospatial visualizers, and an interactive LMS with automated quizzes.',
    //   tags: ['SUPABASE', 'MAPBOX GL JS', 'POSTGRESQL', 'LMS', 'GEOSPATIAL'],
    //   specs: [
    //     'Geospatial contagion & vector tracking',
    //     'Interactive LMS with auto-graded quizzes',
    //     'Cloudflare R2 multipart storage',
    //     'Live PostgreSQL schema visualizer'
    //   ],
    //   gallery: [
    //     {
    //       title: 'ClimaMedix Live Platform',
    //       caption: 'The ClimaMedix platform — empowering healthcare providers for climate action.',
    //       url: '/gallery/climamedix-home.png',
    //       tag: 'LIVE SITE'
    //     }
    //   ]
    // },
    {
      id: 'proj-climamedix-terra',
      title: 'CLIMAMEDIX // TERRA',
      ringIndex: 2,
      shapeIndex: 'real-earth',
      startAngle: 0.8,
      size: 0.70,
      color: '#0284C7',
      category: 'AUTHENTIC NASA CONTINENTS',
      shortDesc: 'Photorealistic 3D Earth — real NASA landmasses, specular oceans, parallax clouds.',
      fullDesc: 'Real NASA Blue Marble continental mapping with specular ocean reflections and 3D parallax cloud drift. Hardware-accelerated at 120 FPS.',
      tags: ['NASA MAPS', 'THREE.JS', 'GLSL', '120 FPS'],
      specs: [
        'Real NASA continental geography',
        'Specular ocean glint mapping',
        'True 3D parallax cloud drift',
        '120 FPS hardware-accelerated'
      ],
      gallery: [
        {
          title: 'ClimaMedix Live Platform',
          caption: 'The ClimaMedix platform — empowering healthcare providers for climate action.',
          url: '/gallery/climamedix-home.png',
          tag: 'LIVE SITE'
        }
      ]
    },
    {
      id: 'proj-10',
      title: 'BARBER SAAS',
      ringIndex: 1,
      shapeIndex: 10,
      startAngle: 4.2,
      size: 0.55,
      color: '#00BAE3',
      category: 'MULTI-TENANT SAAS PLATFORM',
      shortDesc: 'Enterprise barber shop SaaS — multi-tenant bookings, RBAC, WhatsApp bot, and real-time concurrency.',
      fullDesc: 'Full-stack multi-tenant platform for barbershops. Feature-based React + Supabase architecture with PostgreSQL RLS, 20-key granular RBAC, transaction-scoped advisory locks for concurrent bookings, WhatsApp Edge Functions for automated confirmations, and a Super Admin live device lab.',
      tags: ['SUPABASE', 'POSTGRESQL RLS', 'RBAC', 'WHATSAPP BOT', 'REACT', 'TYPESCRIPT'],
      specs: [
        'Advisory locks: zero concurrent booking collisions',
        '20-key granular RBAC with per-user overrides',
        'WhatsApp bot Edge Functions (wamid lookup)',
        'Supabase Realtime WebSocket live dashboard'
      ]
    },
    {
      id: 'proj-whatsapp',
      title: 'WHATSAPP BOT',
      ringIndex: 1,
      shapeIndex: 'phone',
      startAngle: 5.8,
      size: 0.45,
      color: '#25D366',
      category: 'WHATSAPP CLOUD API & EDGE FUNCTIONS',
      shortDesc: 'Meta Business Cloud API bot with interactive quick-replies, automated 2-tier reminders, and webhook ingress.',
      fullDesc: 'Production messaging automation pipeline integrated directly with Meta WhatsApp Business Cloud API. Powered by Supabase Edge Functions with 6 verified utility message templates, interactive quick-reply booking confirmations, dual automated reminder cron workers (24h & 2h prior), wamid status tracking, and passwordless login verifications.',
      tags: ['META CLOUD API', 'EDGE FUNCTIONS', 'SUPABASE', 'CRON WORKERS', 'WEBHOOKS', 'DENO'],
      specs: [
        '6 Meta utility message templates integrated',
        'Interactive quick-replies (15-min timeout)',
        'Dual automated reminder dispatch (24h & 2h)',
        'wamid status tracking & webhook ingress'
      ]
    },
    {
      id: 'proj-telegram',
      title: 'TELEGRAM BOT',
      ringIndex: 1,
      shapeIndex: 'telegram',
      startAngle: 1.8,
      size: 0.45,
      color: '#229ED9',
      category: 'SERVERLESS TELEGRAM BOT & WEBHOOKS',
      shortDesc: 'High-speed Telegram Bot on serverless Edge Functions with real-time webhook routing.',
      fullDesc: 'Serverless Telegram automation bot designed for high-throughput messaging, interactive inline keyboards, automated broadcast dispatches, and real-time webhook payload handling with end-to-end type safety.',
      tags: ['TELEGRAM API', 'EDGE FUNCTIONS', 'TYPESCRIPT', 'WEBHOOKS', 'INLINE BOT'],
      specs: [
        'Serverless webhook routing architecture',
        'Interactive inline keyboard workflows',
        'Automated real-time notification dispatch',
        'Low-latency global edge execution'
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
    seedX: -100.1,
    seedY: 56.0,
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
    seedX: 107.7,
    seedY: -10.0,
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
