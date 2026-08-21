import React from 'react';
import { PresentationDock } from './PresentationDock';

export function UIOverlay({
  selectedTarget,
  selectedProject,
  activeProjects = [],
  onReturn,
  onSelectTarget,
  currentFps = 60,
  isMobile = false,
  onToggleProfiler,
  isBottomHintEnabled = true,
}) {
  const isSecretLove = Boolean(selectedProject?.id?.includes('heart'));
  const targetFps = isMobile ? 30 : 45;
  const isFpsStable = currentFps >= targetFps;

  // Build overview stages sequence for the macro timeline
  const stages = [
    { id: 'core', title: 'CORE // OVERVIEW', category: 'EXATIK 560H' },
    ...activeProjects.map((p, i) => ({
      id: p.id,
      title: p.title,
      category: p.category || `PHASE ${i + 1}`,
    })),
  ];

  return (
    <>
      {/* Top Navbar Layer */}
      <div className="ui-overlay">
        <header className="top-header">
          <div className="brand-box" onClick={onReturn} title="Return to Orbit Overview">
            <div className="brand-dot"></div>
            <h1 className="brand-title">EXATIK INTERNSHIP // YAHYA.CLICK</h1>
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

        {/* Overview Timeline Bar (Visible when in macro overview orbit) */}
        {!selectedTarget && (
          <div className="overview-presentation-bar">
            {isBottomHintEnabled && (
              <div className="bottom-hint-tag">
                [ CLICK ANY PHASE TO START PRESENTATION OR USE KEYBOARD ARROWS ◀ ▶ ]
              </div>
            )}
            <div className="timeline-pills-row">
              {stages.map((stage, idx) => (
                <button
                  key={stage.id}
                  className="timeline-pill"
                  onClick={() => onSelectTarget(stage.id)}
                >
                  <span className="pill-num">0{idx}</span>
                  <span className="pill-label">{stage.title}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Standalone Reusable Floating Presentation Command Dock */}
      <PresentationDock
        selectedTarget={selectedTarget}
        selectedProject={selectedProject}
        activeProjects={activeProjects}
        onSelectTarget={onSelectTarget}
        onReturn={onReturn}
        isSecretLove={isSecretLove}
      />
    </>
  );
}
