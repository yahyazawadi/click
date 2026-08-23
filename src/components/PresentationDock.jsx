import React, { useState, useEffect, useRef } from "react";
import { SYSTEM_CONFIG } from "../config";


export function PresentationDock({
  selectedTarget,
  selectedProject,
  activeProjects = [],
  onSelectTarget,
  onReturn,
  isSecretLove = false,
}) {
  const [showGallery, setShowGallery]           = useState(false);
  const [liftedImage, setLiftedImage]           = useState(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const bodyRef = useRef(null);

  const isCore  = selectedTarget === "core";
  const isOpen  = selectedTarget === "core" || Boolean(selectedProject);

  const stages = [
    { id: "core", title: "CORE // OVERVIEW", category: "EXATIK 560H" },
    ...activeProjects.map((p, i) => ({
      id: p.id, title: p.title, category: p.category || `PHASE ${i + 1}`,
    })),
  ];

  const currentStageIndex = selectedTarget
    ? stages.findIndex((s) => s.id === selectedTarget)
    : -1;


  const currentGallery = selectedProject?.gallery || (isCore ? (SYSTEM_CONFIG.core?.gallery || [{
    title: "Exatik Training Milestone",
    caption: "560 verified hours at Exatik Nablus.",
    url: "/gallery/exp-core-hud.png",
    tag: "560 HOURS"
  }]) : []);

  useEffect(() => {
    setShowGallery(false);
    setLiftedImage(null);
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

  const openLifted = (item, idx) => { setActiveImageIndex(idx); setLiftedImage(item); };
  const closeLifted = () => setLiftedImage(null);

  useEffect(() => {
    const down = (e) => {
      if (["INPUT", "TEXTAREA"].includes(document.activeElement?.tagName)) return;
      if (liftedImage) {
        if (e.key === "ArrowRight" || e.key === "PageDown") { e.preventDefault(); nextImage(); setLiftedImage(currentGallery[activeImageIndex < currentGallery.length - 1 ? activeImageIndex + 1 : 0]); }
        else if (e.key === "ArrowLeft" || e.key === "PageUp") { e.preventDefault(); prevImage(); setLiftedImage(currentGallery[activeImageIndex > 0 ? activeImageIndex - 1 : currentGallery.length - 1]); }
        else if (e.key === "Escape") closeLifted();
        return;
      }
      if (showGallery) { if (e.key === "Escape") setShowGallery(false); return; }
      if (e.key === "ArrowRight" || e.key === "PageDown") {
        if (!selectedTarget) onSelectTarget(stages[0].id);
        else if (currentStageIndex < stages.length - 1) onSelectTarget(stages[currentStageIndex + 1].id);
      } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
        if (currentStageIndex > 0) onSelectTarget(stages[currentStageIndex - 1].id);
        else if (currentStageIndex === 0) onReturn();
      } else if (e.key === "Escape") {
        if (selectedTarget) onReturn();
      }
    };
    window.addEventListener("keydown", down);
    return () => window.removeEventListener("keydown", down);
  }, [selectedTarget, currentStageIndex, stages, onSelectTarget, onReturn, showGallery, liftedImage, activeImageIndex, currentGallery]);

  if (!isOpen) return null;

  const currentImage = currentGallery[activeImageIndex];
  const isLastPhase  = currentStageIndex === stages.length - 1 && stages.length > 1;

  return (
    <>
      {liftedImage && (
        <div className="lifted-photo-backdrop" onClick={closeLifted}>
          <div className="lifted-photo-frame" onClick={(e) => e.stopPropagation()}>
            <img src={liftedImage.url} alt={liftedImage.title} className="lifted-photo-img"
              onError={(e) => { e.currentTarget.style.display = "none"; e.currentTarget.nextSibling.style.display = "flex"; }}
            />
            <div className="lifted-blueprint-fallback" style={{ display: "none" }}>
              <span className="blueprint-icon"></span>
              <span className="blueprint-title">{liftedImage.title}</span>
              <code className="blueprint-path">public{liftedImage.url}</code>
              <span className="blueprint-hint">Drop your screenshot here to show it live</span>
            </div>
            {currentGallery.length > 1 && (
              <>
                <button className="lifted-arrow left" onClick={(e) => { e.stopPropagation(); prevImage(); setLiftedImage(currentGallery[activeImageIndex > 0 ? activeImageIndex - 1 : currentGallery.length - 1]); }}>&#9664;</button>
                <button className="lifted-arrow right" onClick={(e) => { e.stopPropagation(); nextImage(); setLiftedImage(currentGallery[activeImageIndex < currentGallery.length - 1 ? activeImageIndex + 1 : 0]); }}>&#9654;</button>
              </>
            )}
            <div className="lifted-dismiss-hint">click anywhere or ESC to close</div>
          </div>
        </div>
      )}

      <div className={`dock-shell${isSecretLove ? " secret-love-theme" : ""}${isLastPhase ? " dock-shell--critical" : ""}`}>
        <div className={`bottom-presentation-dock${isSecretLove ? " secret-love-theme" : ""}${liftedImage ? " dock-collapsed" : ""}`}>

          <div className="dock-body-wrap" ref={bodyRef}>
            <div className={`dock-body-grid${showGallery ? " gallery-mode" : ""}`}>

              <div className="dock-col dock-col-main">
                <span className="dock-tag">
                  {isCore ? "[ EXATIK TRAINING PROFILE // 560 HOURS ]" : selectedProject?.category || "[ PHASE TRANSMISSION ]"}
                </span>
                <h2 className="dock-title">{isCore ? SYSTEM_CONFIG.core.title : selectedProject?.title}</h2>
                <p className="dock-desc" dangerouslySetInnerHTML={{
                  __html: isCore ? SYSTEM_CONFIG.core.aboutText : (selectedProject?.fullDesc || selectedProject?.shortDesc || ""),
                }} />
                <div className="dock-tags-row">
                  {(isCore
                    ? ["560 HOURS VERIFIED", "EXATIK NABLUS", "FULLSTACK & 3D", "AN-NAJAH UNIVERSITY"]
                    : selectedProject?.tags || []
                  ).map((tag, idx) => (<span key={idx} className="dock-tag-pill">{tag}</span>))}
                </div>
              </div>

              {!showGallery && (
                <div className="dock-col dock-col-specs">
                  <span className="dock-specs-title">// KEY ARCHITECTURAL DELIVERABLES &amp; SPECS</span>
                  <div className="dock-specs-grid">
                    {isCore
                      ? SYSTEM_CONFIG.core.stats.map((stat, idx) => (
                          <div key={idx} className="dock-spec-card">
                            <span className="card-label">{stat.label}</span>
                            <span className="card-val">{stat.val}</span>
                          </div>
                        ))
                      : selectedProject?.specs?.map((spec, idx) => {
                          const [head, ...rest] = spec.split(":");
                          return (
                            <div key={idx} className="dock-spec-card">
                              <span className="card-label">{head}</span>
                              <span className="card-val">{rest.join(":").trim() || head}</span>
                            </div>
                          );
                        })}
                  </div>
                  {currentGallery.length > 0 && (
                    <div className="dock-thumbnails-strip">
                      <span className="thumbnails-label">// PHOTOS:</span>
                      <div className="thumbnails-items">
                        {currentGallery.map((item, idx) => (
                          <div key={idx} className="dock-thumb-item" onClick={() => openLifted(item, idx)} title={`View: ${item.title}`}>
                            <span className="thumb-tag">{item.tag || `PHOTO ${idx + 1}`}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {showGallery && currentImage && (
                <div className="dock-col dock-col-gallery">
                  <div className="inline-gallery-stage">
                    <button className="inline-gallery-arrow left" onClick={prevImage}>&#9664;</button>
                    <div className="inline-gallery-img-wrap">
                      <img key={currentImage.url + activeImageIndex} src={currentImage.url} alt={currentImage.title}
                        className="inline-gallery-img" onClick={() => openLifted(currentImage, activeImageIndex)}
                        style={{ cursor: "zoom-in" }} title="Click to expand above planets"
                        onError={(e) => { e.currentTarget.style.display = "none"; e.currentTarget.nextSibling.style.display = "flex"; }}
                      />
                      <div className="inline-blueprint-fallback" style={{ display: "none" }}>
                        <span className="blueprint-icon"></span>
                        <span className="blueprint-title">{currentImage.title}</span>
                        <code className="blueprint-path">public{currentImage.url}</code>
                        <span className="blueprint-hint">Drop your screenshot here to display live</span>
                      </div>
                    </div>
                    <button className="inline-gallery-arrow right" onClick={nextImage}>&#9654;</button>
                  </div>
                  <div className="inline-gallery-caption">
                    <div className="inline-gallery-meta">
                      <span className="inline-gallery-tag">{currentImage.tag}</span>
                      <span className="inline-gallery-counter">{activeImageIndex + 1} / {currentGallery.length}</span>
                    </div>
                    <p className="inline-gallery-title">{currentImage.title}</p>
                    <p className="inline-gallery-desc">{currentImage.caption}</p>
                    <div className="gallery-dots-row">
                      {currentGallery.map((_, idx) => (
                        <button key={idx} className={`gallery-dot${idx === activeImageIndex ? " active" : ""}`} onClick={() => setActiveImageIndex(idx)} />
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="dock-header-bar dock-controls-bottom">
            <span className="hud-bracket bl" />
            <div className="dock-stage-indicators">
              {stages.map((stage, idx) => (
                <button key={stage.id}
                  className={`dock-pill-indicator${stage.id === selectedTarget ? " active" : ""}`}
                  onClick={() => onSelectTarget(stage.id)} title={stage.title}>
                  <span className="led-dot" />
                  <span className="pill-text">{idx === 0 ? "CORE" : `PHASE ${idx}`}</span>
                </button>
              ))}
            </div>

            <div className="dock-actions-row">
              {currentGallery.length > 0 && (
                <button className={`dock-gallery-toggle-btn${showGallery ? " active" : ""}`}
                  onClick={() => { if (showGallery) { closeLifted(); setShowGallery(false); } else setShowGallery(true); }}
                  title="Toggle photo strip">
                  {showGallery ? "HIDE" : "PHOTOS"} ({currentGallery.length})
                </button>
              )}
              <button className="dock-nav-btn icon-only" onClick={handlePrev} disabled={currentStageIndex === 0}>&#9664;</button>
              <button className="dock-nav-btn icon-only" onClick={handleNext} disabled={currentStageIndex === stages.length - 1}>&#9654;</button>
              <button className="dock-close-btn icon-only" onClick={onReturn}>&#10005;</button>
            </div>
            <span className="hud-bracket br" />
          </div>
        </div>
      </div>
    </>
  );
}
