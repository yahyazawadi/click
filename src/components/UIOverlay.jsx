import React from 'react';
import { SYSTEM_CONFIG } from '../config';

export function UIOverlay({ selectedTarget, selectedProject, onReturn, currentFps = 60, isMobile = false, onToggleProfiler }) {
  const isCore = selectedTarget === 'core';
  const isProject = Boolean(selectedProject);
  const isOpen = isCore || isProject;

  const targetFps = isMobile ? 30 : 45;
  const isFpsStable = currentFps >= targetFps;

  return (
    <>
      {/* Top Navbar Layer */}
      <div className="ui-overlay">
        <header className="top-header">
          <div className="brand-box" onClick={onReturn}>
            <img src="/favicon.svg" alt="Yahya Logo" style={{ width: '22px', height: '22px', marginRight: '10px' }} />
            <h1 className="brand-title">YAHYA.CLICK</h1>
          </div>

          <div className="top-right-hud">

            <div 
              className="fps-hud-counter"
              onClick={onToggleProfiler}
              style={{ cursor: 'pointer' }}
              title="Click to toggle Telemetry Profiler HUD (~)"
            >
              <span className={`fps-indicator ${isFpsStable ? 'stable' : 'warning'}`} />
              <span className="fps-val">{currentFps} FPS</span>
              <span className="fps-badge">{isMobile ? 'MOB-30' : '60Hz'}</span>
            </div>
          </div>
        </header>

        {/* Bottom Hint (only when in macro overview mode) */}
        {!selectedTarget && (
          <div className="bottom-hint">
            [ CLICK CORE OR PLANET TO FOCUS ]
          </div>
        )}
      </div>

      {/* Floating Return Button */}
      {selectedTarget && (
        <button className="return-btn" onClick={onReturn}>
          [ RETURN TO ORBIT ]
        </button>
      )}

      {/* Slide-over Detail Drawer */}
      <div className={`detail-drawer ${isOpen ? 'open' : ''}`}>
        {isCore && (
          <>
            <span className="drawer-tag">[ SYSTEM CORE // ABOUT ]</span>
            <h2 className="drawer-title">{SYSTEM_CONFIG.core.title}</h2>
            <p className="drawer-desc">{SYSTEM_CONFIG.core.aboutText}</p>

            <div className="specs-box">
              <span className="specs-header">// SYSTEM TELEMETRY</span>
              <div className="specs-list">
                {SYSTEM_CONFIG.core.stats.map((stat, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--secondary-blue)' }}>{stat.label}</span>
                    <span style={{ color: 'var(--primary-cyan)', fontWeight: 600 }}>{stat.val}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="specs-box" style={{ marginTop: '1rem' }}>
              <span className="specs-header">// SECURE COMMS // MEET</span>
              <div className="specs-list" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {SYSTEM_CONFIG.core.meetLinks?.map((link, idx) => (
                  <a 
                    key={idx} 
                    href={link.url} 
                    target="_blank" 
                    rel="noreferrer"
                    style={{
                      flex: 1,
                      textAlign: 'center',
                      padding: '0.4rem',
                      background: 'rgba(0, 186, 227, 0.1)',
                      border: '1px solid rgba(0, 186, 227, 0.3)',
                      color: 'var(--primary-cyan)',
                      textDecoration: 'none',
                      fontSize: '0.65rem',
                      fontWeight: 'bold',
                      borderRadius: '4px',
                      transition: 'all 0.2s ease',
                      minWidth: '30%'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = 'rgba(0, 186, 227, 0.3)';
                      e.target.style.boxShadow = '0 0 10px rgba(0, 186, 227, 0.4)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = 'rgba(0, 186, 227, 0.1)';
                      e.target.style.boxShadow = 'none';
                    }}
                  >
                    [{link.label}]
                  </a>
                ))}
              </div>
            </div>
          </>
        )}

        {isProject && selectedProject && (
          <>
            <span className="drawer-tag">{selectedProject.category || '[ PROJECT TRANSMISSION ]'}</span>
            <h2 className="drawer-title">{selectedProject.title}</h2>
            <p className="drawer-desc">{selectedProject.fullDesc || selectedProject.shortDesc}</p>

            <div className="specs-box">
              <span className="specs-header">// SPECIFICATIONS & ARCHITECTURE</span>
              <ul className="specs-list">
                {selectedProject.specs?.map((spec, idx) => (
                  <li key={idx}>• {spec}</li>
                ))}
              </ul>
            </div>

            <div className="tags-row">
              {selectedProject.tags?.map((tag, idx) => (
                <span key={idx} className="tag-badge">{tag}</span>
              ))}
            </div>
          </>
        )}
      </div>
    </>
  );
}
