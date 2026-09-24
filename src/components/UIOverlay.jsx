import React, { useState } from 'react';
import { PresentationDock } from './PresentationDock';
import { ContactPanel } from './ContactPanel';

// ── Mobile FAB + Bottom Sheet ────────────────────────────────────────────────
function MobileNavFab({ stages, onSelectTarget }) {
  const [open, setOpen] = useState(false);

  const handleSelect = (id) => {
    setOpen(false);
    onSelectTarget(id);
  };

  return (
    <>
      {/* FAB — bottom-center */}
      <button
        className="mob-fab"
        onClick={() => setOpen(true)}
        aria-label="Open project list"
      >
        <span className="mob-fab-icon">≡</span>
        <span className="mob-fab-label">PROJECTS</span>
        <span className="mob-fab-count">{stages.length}</span>
      </button>

      {/* Sheet backdrop */}
      {open && (
        <div
          className="mob-sheet-backdrop"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Bottom sheet */}
      <div className={`mob-sheet${open ? ' mob-sheet--open' : ''}`} role="dialog" aria-modal="true">
        <div className="mob-sheet-handle" />
        <div className="mob-sheet-header">
          <span className="mob-sheet-title">PROJECTS</span>
          <button className="mob-sheet-close" onClick={() => setOpen(false)} aria-label="Close">✕</button>
        </div>
        <div className="mob-sheet-list">
          {stages.map((stage, idx) => (
            <button
              key={stage.id}
              className="mob-sheet-row"
              onClick={() => handleSelect(stage.id)}
            >
              <span className="mob-sheet-row-num">{String(idx).padStart(2, '0')}</span>
              <span className="mob-sheet-row-info">
                <span className="mob-sheet-row-title">{stage.title}</span>
                {stage.category && (
                  <span className="mob-sheet-row-cat">{stage.category}</span>
                )}
              </span>
              <span className="mob-sheet-row-arrow">›</span>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}

function SettingsIcon({ className }) {
  return (
    <svg
      className={className}
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

// ── Main UIOverlay ────────────────────────────────────────────────────────────
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
          <ContactPanel onReturn={onReturn} />

          <div className="top-right-hud">
            <div
              className="fps-hud-counter"
              onClick={onToggleProfiler}
              style={{ cursor: 'pointer' }}
              title="Click to toggle Telemetry Profiler HUD (~)"
            >
              <SettingsIcon className={`fps-icon ${isFpsStable ? 'stable' : 'warning'}`} />
              <span className="fps-val"><span className="fps-num">{currentFps}</span><span className="fps-unit"> FPS</span></span>
            </div>
          </div>
        </header>

        {/* Overview bar: desktop only */}
        {!selectedTarget && !isMobile && (
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

      {/* Mobile overview: FAB + bottom sheet (shown when no project selected) */}
      {isMobile && !selectedTarget && (
        <MobileNavFab stages={stages} onSelectTarget={onSelectTarget} />
      )}

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
