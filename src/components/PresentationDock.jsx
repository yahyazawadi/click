import React, { useState, useEffect } from "react";
import { SYSTEM_CONFIG } from "../config";

export function PresentationDock({
  selectedTarget,
  selectedProject,
  activeProjects = [],
  onSelectTarget,
  onReturn,
  isSecretLove = false,
}) {
  const [expanded, setExpanded] = useState(false);

  const isCore = selectedTarget === "core";
  const isOpen = selectedTarget === "core" || Boolean(selectedProject);

  const stages = [
    { id: "core", title: "CORE // OVERVIEW", shortLabel: "CORE" },
    ...activeProjects.map((p) => {
      const cleanTitle = p.title
        .replace(/\s*\/\/.*$/, "")
        .replace(/^PROJ\s*/i, "")
        .trim();
      return { id: p.id, title: p.title, shortLabel: cleanTitle };
    }),
  ];

  const currentStageIndex = selectedTarget
    ? stages.findIndex((s) => s.id === selectedTarget)
    : -1;

  // Collapse details whenever we switch projects
  useEffect(() => {
    setExpanded(false);
  }, [selectedTarget]);

  useEffect(() => {
    const down = (e) => {
      if (["INPUT", "TEXTAREA"].includes(document.activeElement?.tagName)) return;
      if (e.key === "ArrowRight" || e.key === "PageDown") {
        if (!selectedTarget) onSelectTarget(stages[0].id);
        else if (currentStageIndex < stages.length - 1)
          onSelectTarget(stages[currentStageIndex + 1].id);
      } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
        if (currentStageIndex > 0) onSelectTarget(stages[currentStageIndex - 1].id);
        else if (currentStageIndex === 0) onReturn();
      } else if (e.key === "Escape") {
        if (expanded) setExpanded(false);
        else if (selectedTarget) onReturn();
      }
    };
    window.addEventListener("keydown", down);
    return () => window.removeEventListener("keydown", down);
  }, [selectedTarget, currentStageIndex, stages, onSelectTarget, onReturn, expanded]);

  if (!isOpen) return null;

  const title = isCore ? SYSTEM_CONFIG.core.title : selectedProject?.title;
  const shortDesc = isCore
    ? SYSTEM_CONFIG.core.aboutText
    : selectedProject?.shortDesc;
  const liveUrl = selectedProject?.liveUrl;
  const githubUrl = selectedProject?.githubUrl;
  const specs = isCore ? SYSTEM_CONFIG.core.stats : selectedProject?.specs;
  const tags = isCore
    ? ["FULL-STACK", "SPATIAL WEB", "3D WEBGL", "REACT"]
    : selectedProject?.tags || [];
  const category = isCore
    ? SYSTEM_CONFIG.core.subtitle
    : selectedProject?.category;

  const totalStages = stages.length;
  const stageNum = String(currentStageIndex + 1).padStart(2, "0");
  const stageTotal = String(totalStages).padStart(2, "0");

  return (
    <div className={`mini-dock${isSecretLove ? " secret-love-theme" : ""}`}>

      {/* ── COMPACT ROW (always visible) ── */}
      <div className="mini-dock-row">

        {/* Left: Title + Short Desc */}
        <div className="mini-dock-identity">
          <span className="mini-dock-category">{category}</span>
          <span className="mini-dock-title">{title}</span>
          <span className="mini-dock-desc">{shortDesc}</span>
        </div>

        {/* Center: Actions */}
        <div className="mini-dock-actions">
          {liveUrl && (
            <a
              href={liveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mini-btn primary"
            >
              Launch ↗
            </a>
          )}
          {githubUrl && (
            <a
              href={githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mini-btn secondary"
            >
              Code ↗
            </a>
          )}
          {specs?.length > 0 && (
            <button
              className={`mini-btn ghost${expanded ? " active" : ""}`}
              onClick={() => setExpanded((v) => !v)}
            >
              {expanded ? "— Less" : "+ Specs"}
            </button>
          )}
        </div>

        {/* Right: Nav */}
        <div className="mini-dock-nav">
          <span className="mini-dock-counter">{stageNum} / {stageTotal}</span>
          <button
            className="mini-nav-btn"
            onClick={() => {
              if (currentStageIndex > 0) onSelectTarget(stages[currentStageIndex - 1].id);
              else onReturn();
            }}
          >
            ‹
          </button>
          <button
            className="mini-nav-btn"
            disabled={currentStageIndex >= stages.length - 1}
            onClick={() => {
              if (currentStageIndex < stages.length - 1)
                onSelectTarget(stages[currentStageIndex + 1].id);
            }}
          >
            ›
          </button>
          <button className="mini-close-btn" onClick={onReturn}>✕</button>
        </div>
      </div>

      {/* ── EXPANDABLE SPECS DRAWER ── */}
      <div className={`mini-dock-drawer${expanded ? " open" : ""}`}>
        <div className="mini-dock-drawer-inner">
          {/* Specs */}
          {specs?.length > 0 && (
            <div className="mini-specs-grid">
              {isCore
                ? specs.map((s, i) => (
                    <div key={i} className="mini-spec-item">
                      <span className="mini-spec-label">{s.label}</span>
                      <span className="mini-spec-val">{s.val}</span>
                    </div>
                  ))
                : specs.map((spec, i) => {
                    const colon = spec.indexOf(":");
                    if (colon !== -1) {
                      return (
                        <div key={i} className="mini-spec-item">
                          <span className="mini-spec-label">{spec.slice(0, colon).trim()}</span>
                          <span className="mini-spec-val">{spec.slice(colon + 1).trim()}</span>
                        </div>
                      );
                    }
                    return (
                      <div key={i} className="mini-spec-item">
                        <span className="mini-spec-val">{spec}</span>
                      </div>
                    );
                  })}
            </div>
          )}

          {/* Tags */}
          {tags.length > 0 && (
            <div className="mini-tags-row">
              {tags.map((t, i) => (
                <span key={i} className="mini-tag">{t}</span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── SEGMENT RAIL (project switcher) ── */}
      <div className="mini-dock-rail">
        {stages.map((stage) => (
          <button
            key={stage.id}
            className={`rail-seg${stage.id === selectedTarget ? " active" : ""}`}
            onClick={() => onSelectTarget(stage.id)}
            title={stage.title}
          >
            <span className="rail-seg-line" />
          </button>
        ))}
      </div>

    </div>
  );
}
