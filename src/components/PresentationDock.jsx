import React, { useState, useEffect } from 'react';
import { SYSTEM_CONFIG } from '../config';

/**
 * PresentationDock
 * ─────────────────────────────────────────────────────────────────────────────
 * Wide floating dock. When gallery is toggled, the specs column collapses
 * and a photo viewer appears inline — no new window, no modal.
 */
export function PresentationDock({
  selectedTarget,
  selectedProject,
  activeProjects = [],
  onSelectTarget,
  onReturn,
  isSecretLove = false,
}) {
  const [showGallery, setShowGallery] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const isCore = selectedTarget === 'core';
  const isOpen = selectedTarget === 'core' || Boolean(selectedProject);

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

  const currentGallery = selectedProject?.gallery || (isCore ? [
    {
      title: 'Exatik Official Training Milestone',
      caption: '560 verified practical training hours at Exatik Nablus under academic & field supervision.',
      url: '/gallery/exatik-profile.png',
      tag: '560 HOURS'
    }
  ] : []);

  // Reset gallery state when switching stages
  useEffect(() => {
    setShowGallery(false);
    setActiveImageIndex(0);
  }, [selectedTarget]);

  const handlePrev = (e) => {
    if (e) e.stopPropagation();
    if (currentStageIndex > 0) onSelectTarget(stages[currentStageIndex - 1].id);
    else if (currentStageIndex === 0) onReturn();
  };

  const handleNext = (e) => {
    if (e) e.stopPropagation();
    if (currentStageIndex < stages.length - 1) onSelectTarget(stages[currentStageIndex + 1].id);
  };

  const prevImage = () =>
    setActiveImageIndex((i) => (i > 0 ? i - 1 : currentGallery.length - 1));
  const nextImage = () =>
    setActiveImageIndex((i) => (i < currentGallery.length - 1 ? i + 1 : 0));

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;
      if (showGallery) {
        if (e.key === 'ArrowRight' || e.key === 'PageDown') { e.preventDefault(); nextImage(); }
        else if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); prevImage(); }
        else if (e.key === 'Escape') setShowGallery(false);
        return;
      }
      if (e.key === 'ArrowRight' || e.key === 'PageDown') {
        if (!selectedTarget) onSelectTarget(stages[0].id);
        else if (currentStageIndex < stages.length - 1) onSelectTarget(stages[currentStageIndex + 1].id);
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        if (currentStageIndex > 0) onSelectTarget(stages[currentStageIndex - 1].id);
        else if (currentStageIndex === 0) onReturn();
      } else if (e.key === 'Escape') {
        if (selectedTarget) onReturn();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedTarget, currentStageIndex, stages, onSelectTarget, onReturn, showGallery, currentGallery]);

  if (!isOpen) return null;

  const currentImage = currentGallery[activeImageIndex];

  return (
    <div className={`bottom-presentation-dock ${isSecretLove ? 'secret-love-theme' : ''}`}>

      {/* ── Header Bar ── */}
      <div className="dock-header-bar">
        <div className="dock-stage-indicators">
          {stages.map((stage, idx) => (
            <button
              key={stage.id}
              className={`dock-pill-indicator ${stage.id === selectedTarget ? 'active' : ''}`}
              onClick={() => onSelectTarget(stage.id)}
              title={stage.title}
            >
              <span className="dot" />
              <span className="pill-text">{idx === 0 ? 'CORE' : `PHASE ${idx}`}</span>
            </button>
          ))}
        </div>

        <div className="dock-actions-row">
          {currentGallery.length > 0 && (
            <button
              className={`dock-gallery-toggle-btn ${showGallery ? 'active' : ''}`}
              onClick={() => setShowGallery((v) => !v)}
              title="Toggle inline photo gallery (G)"
            >
              🖼️ {showGallery ? 'HIDE' : 'PHOTOS'} ({currentGallery.length})
            </button>
          )}
          <button className="dock-nav-btn icon-only" onClick={handlePrev}
            disabled={currentStageIndex === 0} title="Previous (◀)">◀</button>
          <button className="dock-nav-btn icon-only" onClick={handleNext}
            disabled={currentStageIndex === stages.length - 1} title="Next (▶)">▶</button>
          <button className="dock-close-btn icon-only" onClick={onReturn} title="Close (ESC)">✕</button>
        </div>
      </div>

      {/* ── Body: two columns, right col swaps between specs & gallery ── */}
      <div className={`dock-body-grid ${showGallery ? 'gallery-mode' : ''}`}>

        {/* Left Col: always visible — title + description + tags */}
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

        {/* Right Col: SPECS (hidden when gallery open) */}
        {!showGallery && (
          <div className="dock-col dock-col-specs">
            <span className="dock-specs-title">// KEY ARCHITECTURAL DELIVERABLES & SPECS</span>
            <div className="dock-specs-grid">
              {isCore
                ? SYSTEM_CONFIG.core.stats.map((stat, idx) => (
                    <div key={idx} className="dock-spec-card">
                      <span className="card-label">{stat.label}</span>
                      <span className="card-val">{stat.val}</span>
                    </div>
                  ))
                : selectedProject?.specs?.map((spec, idx) => {
                    const [head, ...rest] = spec.split(':');
                    return (
                      <div key={idx} className="dock-spec-card">
                        <span className="card-label">{head}</span>
                        <span className="card-val">{rest.join(':').trim() || head}</span>
                      </div>
                    );
                  })}
            </div>

            {/* Thumbnail strip to open gallery */}
            {currentGallery.length > 0 && (
              <div className="dock-thumbnails-strip">
                <span className="thumbnails-label">// PHOTOS:</span>
                <div className="thumbnails-items">
                  {currentGallery.map((item, idx) => (
                    <div
                      key={idx}
                      className="dock-thumb-item"
                      onClick={() => { setActiveImageIndex(idx); setShowGallery(true); }}
                      title={item.title}
                    >
                      <div className="thumb-icon">🖼️</div>
                      <span className="thumb-tag">{item.tag || `P0${idx + 1}`}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Right Col: INLINE PHOTO VIEWER (replaces specs) */}
        {showGallery && currentImage && (
          <div className="dock-col dock-col-gallery">

            {/* Photo display */}
            <div className="inline-gallery-stage">
              <button className="inline-gallery-arrow left" onClick={prevImage} title="◀ Prev">◀</button>

              <div className="inline-gallery-img-wrap">
                <img
                  key={currentImage.url}
                  src={currentImage.url}
                  alt={currentImage.title}
                  className="inline-gallery-img"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.nextSibling.style.display = 'flex';
                  }}
                />
                {/* Blueprint fallback if image not dropped yet */}
                <div className="inline-blueprint-fallback" style={{ display: 'none' }}>
                  <span className="blueprint-icon">📸</span>
                  <span className="blueprint-title">{currentImage.title}</span>
                  <code className="blueprint-path">public{currentImage.url}</code>
                  <span className="blueprint-hint">Drop your screenshot here to display live</span>
                </div>
              </div>

              <button className="inline-gallery-arrow right" onClick={nextImage} title="▶ Next">▶</button>
            </div>

            {/* Caption + dots */}
            <div className="inline-gallery-caption">
              <div className="inline-gallery-meta">
                <span className="inline-gallery-tag">{currentImage.tag}</span>
                <span className="inline-gallery-counter">{activeImageIndex + 1} / {currentGallery.length}</span>
              </div>
              <p className="inline-gallery-title">{currentImage.title}</p>
              <p className="inline-gallery-desc">{currentImage.caption}</p>
              <div className="gallery-dots-row">
                {currentGallery.map((_, idx) => (
                  <button
                    key={idx}
                    className={`gallery-dot ${idx === activeImageIndex ? 'active' : ''}`}
                    onClick={() => setActiveImageIndex(idx)}
                  />
                ))}
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
