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
      id: 'proj-1',
      title: 'BARBER MULTI-TENANT PWA',
      ringIndex: 0,
      shapeIndex: 0,
      startAngle: 0,
      size: 0.55,
      color: '#00BAE3',
      category: 'FULLSTACK PLATFORM',
      shortDesc: 'High-concurrency reservation engine with real-time state synchronization.',
      fullDesc: 'Enterprise-grade multi-tenant reservation system. Features low-latency appointment availability engine, tenant isolation, role-based security policies, and offline-ready PWA capabilities.',
      tags: ['TYPESCRIPT', 'REACT', 'SUPABASE', 'SQL'],
      specs: [
        'Architecture: Multi-Tenant RBAC',
        'Latency: Sub-50ms slot verification',
        'Capability: Offline PWA Queue'
      ]
    },
    {
      id: 'proj-2',
      title: 'NEURAL LENS ARCHITECTURE',
      ringIndex: 1,
      shapeIndex: 1,
      startAngle: 1.2,
      size: 0.45,
      color: '#5DBAE1',
      category: 'SPATIAL & GRAPHICS',
      shortDesc: 'Real-time WebGL optical refraction and lighting canvas.',
      fullDesc: 'Interactive WebGL shader system that computes chromatic aberration, optical depth blur, and dynamic light refractions in real time.',
      tags: ['THREE.JS', 'GLSL', 'REACT THREE FIBER'],
      specs: [
        'Render Engine: WebGL Shader Pipeline',
        'Lighting: Dynamic Specular Reflection',
        'Performance: 60FPS Mobile Optimized'
      ]
    },
    {
      id: 'proj-3',
      title: 'QURAN AUTOMATION BOT',
      ringIndex: 2,
      shapeIndex: 2,
      startAngle: 2.4,
      size: 0.6,
      color: '#00BAE3',
      category: 'AUTOMATION & MEDIA',
      shortDesc: 'Automated video rendering and audio alignment pipeline.',
      fullDesc: 'Autonomous video processing microservice. Pulls audio recitations, aligns synchronized typography, burns high-definition subtitles, and broadcasts automatically.',
      tags: ['PYTHON', 'FFMPEG', 'ASYNCIO'],
      specs: [
        'Render Target: 4K 60FPS Pipeline',
        'Subtitle Engine: Sub-pixel Timing Sync',
        'Uptime: 99.9% Autonomous Execution'
      ]
    },
    {
      id: 'proj-4',
      title: 'AURA CHAT PROTOCOL',
      ringIndex: 1,
      shapeIndex: 3,
      startAngle: 3.6,
      size: 0.4,
      color: '#FCFCFC',
      category: 'REALTIME SYSTEMS',
      shortDesc: 'Zero-knowledge encrypted messaging interface.',
      fullDesc: 'Real-time communication interface designed with custom glassmorphic UI panels and responsive mobile-first touch gestures.',
      tags: ['WEBSOCKETS', 'NODE.JS', 'CANVAS'],
      specs: [
        'Security: End-to-End Ephemeral Keys',
        'Latency: < 20ms Broadcast Delay',
        'UI: Glassmorphic Floating Overlay'
      ]
    },
    {
      id: 'proj-5',
      title: 'ORBITAL KERNEL OS',
      ringIndex: 0,
      shapeIndex: 4,
      startAngle: 3.14,
      size: 0.5,
      color: '#5DBAE1',
      category: 'SYSTEM DESIGN',
      shortDesc: 'Virtual web-based desktop environment and windowing system.',
      fullDesc: 'Spatial window manager with custom layout engine, virtual process scheduler, and sandboxed browser sub-agents.',
      tags: ['TYPESCRIPT', 'CANVAS', 'VITE'],
      specs: [
        'Windowing: Multi-threaded Canvas',
        'Memory: Zero memory leak event listeners',
        'UI: Retro-futuristic OS design'
      ]
    },
    {
      id: 'proj-6',
      title: 'CHRONO DATA STREAM',
      ringIndex: 2,
      shapeIndex: 5,
      startAngle: 4.8,
      size: 0.42,
      color: '#00BAE3',
      category: 'DATA PIPELINE',
      shortDesc: 'High-throughput time-series analytics dashboard.',
      fullDesc: 'Real-time financial & telemetry data visualization engine capable of rendering 100,000+ data points per second with zero frame drops.',
      tags: ['D3.JS', 'WEBGL', 'RUST'],
      specs: [
        'Throughput: 100k events/sec',
        'Rendering: WebGL Instanced Buffers',
        'State: Zero-copy Memory Buffers'
      ]
    },
    {
      id: 'proj-7',
      title: 'QUANTUM SYNTH AUDIO',
      ringIndex: 1,
      shapeIndex: 6,
      startAngle: 5.2,
      size: 0.48,
      color: '#00BAE3',
      category: 'AUDIO GRAPHICS',
      shortDesc: 'Browser WebAudio DSP synthesizer and visualizer.',
      fullDesc: 'Interactive WebAudio synthesizer with polyphonic oscillators, dynamic low-pass filters, and real-time frequency spectrum visualizer.',
      tags: ['WEBAUDIO API', 'CANVAS', 'REACT'],
      specs: [
        'Audio Engine: WebAudio DSP Graph',
        'Latency: Sub-5ms Buffer Processing',
        'Visuals: 60FPS FFT Spectrum'
      ]
    },
    {
      id: 'proj-8',
      title: 'HYPERION AI GATEWAY',
      ringIndex: 2,
      shapeIndex: 7,
      startAngle: 0.8,
      size: 0.65,
      color: '#FCFCFC',
      category: 'AI ARCHITECTURE',
      shortDesc: 'Distributed LLM proxy with intelligent streaming router.',
      fullDesc: 'High-availability middleware API router for orchestrating multi-agent LLM requests, dynamic token management, and streaming fallback channels.',
      tags: ['GO', 'DOCKER', 'GRPC'],
      specs: [
        'Routing: Dynamic Context-Aware Fallback',
        'Concurrency: 10,000 Concurrent Streams',
        'Latency: < 10ms Overhead'
      ]
    },
    {
      id: 'proj-9',
      title: 'QUANTUM NODE MATRIX',
      ringIndex: 0,
      shapeIndex: 9,
      startAngle: 2.0,
      size: 0.65,
      color: '#00E5FF',
      category: 'SPATIAL GEOMETRY',
      shortDesc: 'Multi-node geodesic lattice with pulsating vertex anchors and quantum energy core.',
      fullDesc: 'Interactive spatial node planet built with an icosahedral outer lattice, dual counter-rotating interior core, pulsating emissive vertex nodes, and an equatorial energy ring.',
      tags: ['THREE.JS', 'GEODESIC LATTICE', 'GLSL SHADERS', 'REACT THREE FIBER'],
      specs: [
        'Lattice: Icosahedron Wireframe Shell',
        'Nodes: Independent Pulsating Emissive Spheres',
        'Core: Counter-Rotating Quantum Octahedron'
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
  // Master Active Paths — Centralized configuration!
  nebula1Path: NEBULA_PRESETS.ORION_BOW_WAVE,   // Path 2 (Red Nebula)
  nebula2Path: NEBULA_PRESETS.EMISSION_SHROUD,  // Path 5 (Teal Nebula)

  // Locked Baseline Guarantee
  isLocked: true,
};
