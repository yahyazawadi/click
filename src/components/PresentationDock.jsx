import React, { useEffect } from 'react';
import { SYSTEM_CONFIG } from '../config';

/**
 * PresentationDock
 * ─────────────────────────────────────────────────────────────────────────────
 * A modular, high-performance horizontal floating presentation command dock.
 * Spans wide screen width, provides keyboard arrow navigation (◀ / ▶ / ESC),
 * and formats project architecture & specs into clean, scannable cards.
 *
 * @param {string|null} selectedTarget - ID of currently selected stage ('core' | project.id)
 * @param {object|null} selectedProject - Selected project object data
 * @param {Array} activeProjects - Array of available project objects
 * @param {function} onSelectTarget - Callback when a phase/stage is selected
 * @param {function} onReturn - Callback to return to default orbit overview
 * @param {boolean} isSecretLove - Theme override flag for special easter egg
 */
export function PresentationDock({
  selectedTarget,
  selectedProject,
  activeProjects = [],
  onSelectTarget,
  onReturn,
  isSecretLove = false,
}) {
  const isCore = selectedTarget === 'core';
  const isProject = Boolean(selectedProject);
  const isOpen = isCore || isProject;

  // Build ordered sequence of presentation stages: [Core, Phase 1, Phase 2, ...]
  const stages = [
    { id: 'core', title: 'CORE // OVERVIEW', category: 'EXATIK 560H' },
    ...activeProjects.map((p, i) => ({
      id: p.id,
      title: p.title,
      category: p.category || `PHASE ${i + 1}`,
    })),
  ];

  const currentStageIndex = selectedTarget
    ? stages.findIndex((s) => s.id === selectedTarget)
    : -1;

  const handlePrev = (e) => {
    if (e) e.stopPropagation();
    if (currentStageIndex > 0) {
      onSelectTarget(stages[currentStageIndex - 1].id);
    } else if (currentStageIndex === 0) {
      onReturn();
    }
  };

  const handleNext = (e) => {
    if (e) e.stopPropagation();
    if (currentStageIndex < stages.length - 1) {
      onSelectTarget(stages[currentStageIndex + 1].id);
    }
  };

  // Keyboard navigation listener (ArrowLeft / ArrowRight / Escape)
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignore if typing inside form inputs
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;

      if (e.key === 'ArrowRight' || e.key === 'PageDown') {
        if (!selectedTarget) {
          onSelectTarget(stages[0].id);
        } else if (currentStageIndex < stages.length - 1) {
          onSelectTarget(stages[currentStageIndex + 1].id);
        }
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        if (currentStageIndex > 0) {
          onSelectTarget(stages[currentStageIndex - 1].id);
        } else if (currentStageIndex === 0) {
          onReturn();
        }
      } else if (e.key === 'Escape') {
        if (selectedTarget) onReturn();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedTarget, currentStageIndex, stages, onSelectTarget, onReturn]);

  if (!isOpen) return null;

  return (
    <div className={`bottom-presentation-dock ${isSecretLove ? 'secret-love-theme' : ''}`}>
      {/* Top Dock Control Bar */}
      <div className="dock-header-bar">
        <div className="dock-stage-indicators">
          {stages.map((stage, idx) => (
            <button
              key={stage.id}
              className={`dock-pill-indicator ${stage.id === selectedTarget ? 'active' : ''}`}
              onClick={() => onSelectTarget(stage.id)}
              title={stage.title}
            >
              <span className="dot"></span>
              <span className="pill-text">{idx === 0 ? 'CORE' : `PHASE ${idx}`}</span>
            </button>
          ))}
        </div>

        <div className="dock-actions-row">
          <button
            className="dock-nav-btn icon-only"
            onClick={handlePrev}
            disabled={currentStageIndex === 0}
            title="Previous Phase (Arrow Left)"
          >
            ◀
          </button>
          <button
            className="dock-nav-btn icon-only"
            onClick={handleNext}
            disabled={currentStageIndex === stages.length - 1}
            title="Next Phase (Arrow Right)"
          >
            ▶
          </button>
          <button className="dock-close-btn icon-only" onClick={onReturn} title="Close (ESC)">
            ✕
          </button>
        </div>
      </div>

      {/* Main Wide Multi-Column Stage Content */}
      <div className="dock-body-grid">
        {/* Column 1: Title, Category & Summary */}
        <div className="dock-col dock-col-main">
          <span className="dock-tag">
            {isCore
              ? '[ EXATIK TRAINING PROFILE // 560 HOURS ]'
              : selectedProject?.category || '[ PHASE TRANSMISSION ]'}
          </span>
          <h2 className="dock-title">
            {isCore ? SYSTEM_CONFIG.core.title : selectedProject?.title}
          </h2>
          <p
            className="dock-desc"
            dangerouslySetInnerHTML={{
              __html: isCore
                ? SYSTEM_CONFIG.core.aboutText
                : (selectedProject?.fullDesc || selectedProject?.shortDesc || ''),
            }}
          />
          <div className="dock-tags-row">
            {(isCore
              ? ['560 HOURS VERIFIED', 'EXATIK NABLUS', 'FULLSTACK & 3D', 'AN-NAJAH UNIVERSITY']
              : selectedProject?.tags || []
            ).map((tag, idx) => (
              <span key={idx} className="dock-tag-pill">{tag}</span>
            ))}
          </div>
        </div>

        {/* Column 2: Architectural Specifications in Clean Scannable Cards */}
        <div className="dock-col dock-col-specs">
          <span className="dock-specs-title">// KEY ARCHITECTURAL DELIVERABLES & SPECS</span>
          <div className="dock-specs-grid">
            {isCore ? (
              SYSTEM_CONFIG.core.stats.map((stat, idx) => (
                <div key={idx} className="dock-spec-card">
                  <span className="card-label">{stat.label}</span>
                  <span className="card-val">{stat.val}</span>
                </div>
              ))
            ) : (
              selectedProject?.specs?.map((spec, idx) => {
                const [head, ...rest] = spec.split(':');
                return (
                  <div key={idx} className="dock-spec-card">
                    <span className="card-label">{head}</span>
                    <span className="card-val">{rest.join(':').trim() || head}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
