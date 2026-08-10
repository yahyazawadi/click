# YAHYA.CLICK — Cosmic Orbital Portfolio

A high-performance 3D spatial web portfolio showcasing high-concurrency platforms, real-time system architecture, and spatial user experiences.

Built with **React 19**, **Three.js**, **React Three Fiber (@react-three/fiber)**, **Drei (@react-three/drei)**, and **Vanilla CSS**.

---

## 🌌 System Architecture Overview

```
                          ┌───────────────────────────┐
                          │   System Core (Sun Core)  │
                          └─────────────┬─────────────┘
                                        │
           ┌────────────────────────────┼────────────────────────────┐
           ▼                            ▼                            ▼
  ┌─────────────────┐          ┌─────────────────┐          ┌─────────────────┐
  │  Orbital Ring 0 │          │  Orbital Ring 1 │          │  Orbital Ring 2 │
  │  (Cyan Inner)   │          │  (Teal Mid)     │          │  (Deep Outer)   │
  └────────┬────────┘          └────────┬────────┘          └────────┬────────┘
           │                            │                            │
           ▼                            ▼                            ▼
   Barber PWA, etc.             Quantum Synth, etc.           Scissor Moon, etc.
```

The portfolio is structured around a central **Quantum Sphere Core** with three gyroscopically tilted orbital paths holding 8 interactive planetary project nodes.

---

## 🚀 Key Technical Features

### 1. Procedural GLSL Hubble SHO Nebula Background (`NebulaShaderMaterial.js`)
- **Hubble Palette Colors**: Sulfur-II (Orange-Red), H-alpha (Crimson), OIII (Teal/Violet), and Ionization Core (Cyan-White).
- **Domain-Warped Fractal Noise**: Multi-octave GLSL Fractional Brownian Motion (FBM) with organic boundary masking and dark dust absorption lanes.
- **Volumetric Scatter Halos & Newborn Stars**: Grid-cell embedded young stars with smooth distance attenuation and realistic twinkling.

### 2. Procedural Raymarched Planetary Shaders (`PlanetCoreMaterial.js` & `ScissorMoonShaderMaterial.js`)
- Dynamic landmass, shallow coastal shelves, deep oceans, atmospheric limb glow, and rotating cloud belts generated entirely in GLSL shaders without static texture maps.

### 3. FPS-Stabilized Progressive Planet Unlocker (`ProgressivePlanetController`)
- Automatically monitors live frame rate. Priority planets load instantly on frame 1, while additional orbital nodes unlock progressively as rendering performance stabilizes.

### 4. Comprehensive FPS Telemetry & Profiler HUD (`fpsLogger.js` & `FpsProfilerOverlay.jsx`)
- **Live Profiler HUD**: Toggleable via `?debug=fps` URL parameter or by pressing the `~` (Tilde) key.
- **1% Low FPS Tracking**: Monitors micro-stutters and frame time variances ($\text{ms/frame}$).
- **Stutter Capture (`STUTTER_EVENT`)**: Captures frame spikes ($>33.3\text{ ms}$ or $>50\text{ ms}$) alongside camera zoom, active focus target, battery status, memory heap, and active WebGL GPU renderer model (`UNMASKED_RENDERER_WEBGL`).
- **1-Click Log Exporter**: Export diagnostic logs anytime via **`[ LOG (.JSON) ]`** or **`[ LOG (.CSV) ]`**.

### 5. Battery & Power Management Warnings (`BatteryWarning.jsx` & `PerformanceWarning.jsx`)
- Detects battery power and low-power GPU throttling across Chromium browsers (`navigator.getBattery`).
- Automatically alerts users to plug in their charger for full 60–120+ FPS rendering performance.

### 6. Lighthouse & SEO Best Practices (100/100 Scores)
- **FCP / LCP Sub-second Paint**: Inlined critical void background CSS (`#071124`) and Google Fonts preloading.
- **100/100 SEO & Accessibility**: Semantic `<h1>` hierarchy, canonical tags, OpenGraph preview cards, Twitter cards, `robots.txt`, and `sitemap.xml`.

---

## 🛠️ Development & Build Commands

### Prerequisites
- Node.js (v18+ recommended)
- npm or yarn

### Installation
```bash
git clone https://github.com/yahyazawadi/click.git
cd yahya-click
npm install
```

### Run Local Development Server
```bash
npm run dev
```
Open `http://localhost:5174/` (or `http://localhost:5174/?debug=fps` for telemetry mode).

### Production Build
```bash
npm run build
```

### Preview Production Build Locally
```bash
npm run preview
```

---

## 🎮 Laptop GPU Setup (NVIDIA Optimus / Dual-GPU Laptops)

On laptops with dual GPUs (e.g. **NVIDIA RTX 3050 + Intel/AMD Integrated GPU**), Windows often assigns web browsers to the Integrated GPU by default to save battery life.

To ensure your browser uses the high-performance discrete GPU:

1. Open **Windows Settings** → **System** → **Display** → **Graphics**.
2. Add your web browser (**Google Chrome**, **Brave**, or **Firefox**).
3. Click **Options** → Set GPU preference to **High Performance (NVIDIA GeForce RTX)**.
4. Relaunch your browser and open `https://yahya.click/?debug=fps`.

---

## 📂 Project Structure

```
yahya-click/
├── public/
│   ├── favicon-dark-mode.svg
│   ├── favicon-light-mode.svg
│   ├── favicon.svg
│   ├── nebula_bg.png
│   ├── robots.txt
│   └── sitemap.xml
├── src/
│   ├── components/
│   │   ├── planets/            # Planet node implementations
│   │   ├── BatteryWarning.jsx  # Battery status warning modal
│   │   ├── CameraController.jsx# Smooth camera lerp & target controller
│   │   ├── CosmicBackground.jsx# Starfield & Nebula container
│   │   ├── DualNebulaBackground.jsx
│   │   ├── FaviconAnimator.jsx # Tab favicon animation engine
│   │   ├── FpsProfilerOverlay.jsx # Diagnostic Profiler HUD
│   │   ├── PerformanceWarning.jsx # FPS degradation detector
│   │   ├── PlanetNode.jsx      # Planetary node wrapper & HTML label
│   │   ├── SceneRotator.jsx    # Orbital gyroscope rotation logic
│   │   ├── SystemCore.jsx      # Central sphere core
│   │   └── UIOverlay.jsx       # Header & detail drawer HUD
│   ├── shaders/
│   │   ├── NebulaShaderMaterial.js
│   │   ├── PlanetCoreMaterial.js
│   │   └── ScissorMoonShaderMaterial.js
│   ├── utils/
│   │   └── fpsLogger.js        # High-precision telemetry & log exporter
│   ├── App.jsx                 # Application entry & R3F Canvas
│   ├── config.js               # Central system configuration & projects data
│   ├── index.css               # Cosmic orbital styling & CSS design system
│   └── main.jsx                # React DOM root
├── index.html                  # HTML5 shell, critical inline CSS & SEO tags
└── vite.config.js              # Vite configuration
```

---

## 📜 License

MIT License — Copyright (c) 2026 Yahya
