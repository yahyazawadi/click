import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { detectGpuTier, tierToFloat } from './utils/detectGpuTier.js'

// Detect GPU tier BEFORE first React render so the 3D scene starts
// with the correct quality level from frame 1.
// ~5ms on RTX 3060, ~100–200ms on weak iGPUs (imperceptible vs React startup).
const gpuTier       = detectGpuTier();
const perfTierFloat = tierToFloat(gpuTier);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App gpuTier={gpuTier} perfTierFloat={perfTierFloat} />
  </StrictMode>,
)
