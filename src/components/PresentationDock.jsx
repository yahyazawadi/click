import React, { useState, useEffect } from 'react';
import { SYSTEM_CONFIG } from '../config';

/**
 * PresentationDock & Integrated Photo Gallery Slideshow
 * ─────────────────────────────────────────────────────────────────────────────
 * Provides:
 * 1. Wide horizontal floating presentation command dock.
 * 2. Integrated Interactive Photo Gallery & Fullscreen Image Lightbox Modal.
 * 3. Smooth Keyboard Navigation (◀ / ▶ / ESC / G to toggle Gallery).
 */
export function PresentationDock({
  selectedTarget,
  selectedProject,
  activeProjects = [],
  onSelectTarget,
  onReturn,
  isSecretLove = false,
}) {
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

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

  const currentGallery = selectedProject?.gallery || (isCore ? [
    {
      title: 'Exatik Official Training Milestone',
      caption: '560 verified practical training hours at Exatik Nablus under academic & field supervision.',
      url: '/gallery/exatik-profile.png',
      tag: '560 HOURS'
    }
  ] : []);

  // Reset active image index when stage changes
  useEffect(() => {
    setActiveImageIndex(0);
  }, [selectedTarget]);

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

  const handlePrevImage = (e) => {
    if (e) e.stopPropagation();
    if (currentGallery.length > 0) {
      setActiveImageIndex((prev) => (prev > 0 ? prev - 1 : currentGallery.length - 1));
    }
  };

  const handleNextImage = (e) => {
    if (e) e.stopPropagation();
    if (currentGallery.length > 0) {
      setActiveImageIndex((prev) => (prev < currentGallery.length - 1 ? prev + 1 : 0));
    }
  };

  // Keyboard navigation listener (ArrowLeft / ArrowRight / Escape / G)
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignore if typing inside form inputs
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;

      if (isGalleryOpen) {
        if (e.key === 'ArrowRight' || e.key === 'PageDown') {
          handleNextImage();
        } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
          handlePrevImage();
        } else if (e.key === 'Escape') {
          setIsGalleryOpen(false);
        }
        return;
      }

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
      } else if (e.key.toLowerCase() === 'g' && currentGallery.length > 0) {
        setIsGalleryOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedTarget, currentStageIndex, stages, onSelectTarget, onReturn, isGalleryOpen, currentGallery]);

  if (!isOpen) return null;

  const currentImage = currentGallery[activeImageIndex] || currentGallery[0];

  return (
    <>
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
            {currentGallery.length > 0 && (
              <button
                className="dock-gallery-toggle-btn"
                onClick={() => setIsGalleryOpen(true)}
                title="Open Photo Gallery (Press G)"
              >
                🖼️ PHOTOS ({currentGallery.length})
              </button>
            )}

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

          {/* Column 2: Architectural Specs + Interactive Photo Previews */}
          <div className="dock-col dock-col-specs">
            <div className="dock-specs-header-row">
              <span className="dock-specs-title">// KEY ARCHITECTURAL DELIVERABLES & SPECS</span>
            </div>

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

            {/* Quick Interactive Photo Thumbnails Bar */}
            {currentGallery.length > 0 && (
              <div className="dock-thumbnails-strip">
                <span className="thumbnails-label">// GALLERY PREVIEW:</span>
                <div className="thumbnails-items">
                  {currentGallery.map((item, idx) => (
                    <div
                      key={idx}
                      className="dock-thumb-item"
                      onClick={() => {
                        setActiveImageIndex(idx);
                        setIsGalleryOpen(true);
                      }}
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
        </div>
      </div>

      {/* Fullscreen High-Definition Photo Slideshow / Gallery Modal */}
      {isGalleryOpen && currentImage && (
        <div className="gallery-modal-overlay" onClick={() => setIsGalleryOpen(false)}>
          <div className="gallery-modal-content" onClick={(e) => e.stopPropagation()}>
            {/* Gallery Top Navigation Bar */}
            <div className="gallery-top-bar">
              <div className="gallery-info-meta">
                <span className="gallery-counter">
                  PHOTO {activeImageIndex + 1} / {currentGallery.length}
                </span>
                <span className="gallery-tag-badge">{currentImage.tag}</span>
              </div>
              <button
                className="gallery-close-btn"
                onClick={() => setIsGalleryOpen(false)}
                title="Close Gallery (ESC)"
              >
                ✕ CLOSE
              </button>
            </div>

            {/* Main High-Res Photo Stage */}
            <div className="gallery-image-stage">
              <button
                className="gallery-nav-arrow left"
                onClick={handlePrevImage}
                title="Previous Photo (Arrow Left)"
              >
                ◀
              </button>

              <div className="gallery-image-wrapper">
                <img
                  src={currentImage.url}
                  alt={currentImage.title}
                  className="gallery-main-img"
                  onError={(e) => {
                    // Fallback to high-tech SVG blueprint mockup if local photo is not yet placed
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.nextSibling.style.display = 'flex';
                  }}
                />
                {/* Visual Blueprint Tech Fallback Mockup */}
                <div className="gallery-fallback-blueprint" style={{ display: 'none' }}>
                  <div className="blueprint-grid"></div>
                  <div className="blueprint-core">
                    <span className="blueprint-icon">📸</span>
                    <h3 className="blueprint-title">{currentImage.title}</h3>
                    <p className="blueprint-path">File path: <code>public{currentImage.url}</code></p>
                    <span className="blueprint-hint">[ Drop your screenshot in <b>public{currentImage.url}</b> to display live ]</span>
                  </div>
                </div>
              </div>

              <button
                className="gallery-nav-arrow right"
                onClick={handleNextImage}
                title="Next Photo (Arrow Right)"
              >
                ▶
              </button>
            </div>

            {/* Gallery Bottom Caption & Controls */}
            <div className="gallery-caption-box">
              <h3 className="gallery-caption-title">{currentImage.title}</h3>
              <p className="gallery-caption-desc">{currentImage.caption}</p>

              <div className="gallery-dots-row">
                {currentGallery.map((_, idx) => (
                  <button
                    key={idx}
                    className={`gallery-dot ${idx === activeImageIndex ? 'active' : ''}`}
                    onClick={() => setActiveImageIndex(idx)}
                    title={`Go to photo ${idx + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
