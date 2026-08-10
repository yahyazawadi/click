import React from 'react';
import { SYSTEM_CONFIG } from '../config';

export function UIOverlay({ selectedTarget, selectedProject, onReturn, currentFps = 60, isMobile = false }) {
  const isCore = selectedTarget === 'core';
  const isProject = Boolean(selectedProject);
  const isOpen = isCore || isProject;

  const targetFps = isMobile ? 24 : 45;
  const isFpsStable = currentFps >= targetFps;

  return (
    <>
      {/* Top Navbar Layer */}
      <div className="ui-overlay">
        <header className="top-header">
          <div className="brand-box" onClick={onReturn}>
            <div className="brand-dot"></div>
            <span className="brand-title">YAHYA.CLICK</span>
          </div>

          <div className="top-right-hud">
            <div className="header-status">
              SYSTEM // {selectedTarget ? 'TARGET_ENGAGED' : 'MACRO_ORBIT'}
            </div>

            <div className="fps-hud-counter">
              <span className={`fps-indicator ${isFpsStable ? 'stable' : 'warning'}`} />
              <span className="fps-val">{currentFps} FPS</span>
              <span className="fps-badge">{isMobile ? 'MOB-24' : '60Hz'}</span>
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
