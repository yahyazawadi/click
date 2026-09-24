import React, { useState, useEffect, useCallback, useRef } from "react";

// ── Inline Vector SVG Icons (Zero Emojis, Crisp 120 FPS High-DPI) ──────────────

function WhatsAppLogoSvg({ size = 20, color = "#25D366" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function WebhookIconSvg({ size = 18, color = "#25D366" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
      <path d="M6 16H5a4 4 0 0 1 0-8h1" />
      <line x1="8" y1="12" x2="16" y2="12" />
      <circle cx="8" cy="12" r="2.5" fill={color} />
      <circle cx="16" cy="12" r="2.5" fill={color} />
    </svg>
  );
}

function EdgeIconSvg({ size = 18, color = "#00BAE3" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" fill={`${color}22`} />
    </svg>
  );
}

function DbIconSvg({ size = 18, color = "#a78bfa" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <ellipse cx="12" cy="5" rx="9" ry="3" fill={`${color}22`} />
      <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
      <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
    </svg>
  );
}

function CronIconSvg({ size = 18, color = "#f59e0b" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <polyline points="12 7 12 12 15 15" />
    </svg>
  );
}

// ── Tab definitions ───────────────────────────────────────────────────────────
const TABS = [
  { id: "chat", label: "Live Simulator & Capture" },
  { id: "pipeline", label: "Pipeline" },
  { id: "dispatch", label: "Fleet & Cron Dispatch" },
];

// ── Authentic Arabic Bot Messages (Faithful to Barber Multi-Tenant Production) ─
const AUTHENTIC_ARABIC_MESSAGES = [
  {
    id: "m1",
    type: "system",
    text: "حجز موعد · barber-multi-tenant.pages.dev",
    time: "21:54",
  },
  {
    id: "m2",
    type: "bot",
    text: "مرحباً بك!\n\n• لتأكيد موعدك المعلق: رد بـ \"1\" أو \"تأكيد\"\n• لإلغاء الموعد: رد بـ \"إلغاء\"\n• لإدارة وتعديل المواعيد:\nhttps://barber-multi-tenant.pages.dev/user?id=%2B972597733750\n\nيسعدنا دائماً خدمتك!",
    time: "21:54",
    replies: [
      { id: "confirm", label: "1 - تأكيد" },
      { id: "cancel", label: "إلغاء" },
    ],
  },
];

// ── Pipeline steps (Green API Gateway Architecture) ───────────────────────────
const PIPELINE_STEPS = [
  {
    id: "webhook",
    type: "webhook",
    label: "Green API Webhook",
    color: "#25D366",
    detail: "Inbound POST from Green API gateway instance. Token verification & payload ingestion before routing.",
  },
  {
    id: "edge",
    type: "edge",
    label: "Edge Function",
    color: "#00BAE3",
    detail: "Supabase Deno runtime parses Arabic keywords ('1', 'تأكيد', 'إلغاء'), routes state, and dispatches Green API sendMessage.",
  },
  {
    id: "db",
    type: "db",
    label: "PostgreSQL + RLS",
    color: "#a78bfa",
    detail: "Transaction-scoped pg_advisory_xact_lock prevents double-bookings. Row-Level Security isolates multi-tenant data.",
  },
  {
    id: "cron",
    type: "cron",
    label: "Cron & Sentinel",
    color: "#f59e0b",
    detail: "Background cron workers fire automated reminders at T-24h and T-2h. Sentinel monitors fleet health across 7 instances.",
  },
];

function renderStepIcon(type, color, size = 18) {
  switch (type) {
    case "webhook":
      return <WebhookIconSvg size={size} color={color} />;
    case "edge":
      return <EdgeIconSvg size={size} color={color} />;
    case "db":
      return <DbIconSvg size={size} color={color} />;
    case "cron":
      return <CronIconSvg size={size} color={color} />;
    default:
      return null;
  }
}

// ── Dynamic Dispatch Flows (Unrestricted Dynamic Payloads via Green API) ──────
const DISPATCH_FLOWS = [
  {
    name: "booking_confirmation",
    label: "Instant Booking Receipt",
    category: "DYNAMIC PAYLOAD",
    status: "UNRESTRICTED",
    desc: "Dispatches direct tenant portal URL with customer ID immediately upon appointment creation.",
  },
  {
    name: "reminder_24h",
    label: "T-24h Advance Reminder",
    category: "CRON TRIGGER",
    status: "AUTOMATED",
    desc: "Automated cron sweep 24 hours prior; prompts customer for 1-tap confirmation or cancellation.",
  },
  {
    name: "reminder_2h",
    label: "T-2h Urgent Notification",
    category: "CRON TRIGGER",
    status: "AUTOMATED",
    desc: "Countdown alert with shop location, barber name, and immediate cancellation option.",
  },
  {
    name: "arabic_keyword_parser",
    label: "Arabic Keyword Actions",
    category: "STATE MACHINE",
    status: "INSTANT REPLY",
    desc: "Parses '1', 'تأكيد', or 'إلغاء' to atomically mutate booking state via pg_advisory_xact_lock.",
  },
  {
    name: "portal_deep_link",
    label: "Self-Service Portal Link",
    category: "DIRECT ROUTE",
    status: "DYNAMIC",
    desc: "Direct magic link letting clients reschedule or inspect active bookings without password friction.",
  },
  {
    name: "fleet_failover_alert",
    label: "Multi-Instance Failover",
    category: "FLEET TELEMETRY",
    status: "HA SENTINEL",
    desc: "Automated routing across 7 Green API gateway instances with Telegram and ntfy sentinel alarms.",
  },
];

const WAMID_STEPS = [
  { id: "queued", label: "Queued" },
  { id: "sent", label: "Sent" },
  { id: "delivered", label: "Delivered" },
  { id: "read", label: "Read" },
];

// ── Chat Simulator & Real Device View ─────────────────────────────────────────
function ChatSimulator() {
  const [viewMode, setViewMode] = useState("real"); // "real" | "interactive"
  const [messages, setMessages] = useState(AUTHENTIC_ARABIC_MESSAGES);
  const [simState, setSimState] = useState("idle"); // idle | confirming | confirmed | cancelled
  const [wamidStep, setWamidStep] = useState(0);
  const bodyRef = useRef(null);

  const scrollToBottom = () => {
    setTimeout(() => {
      if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    }, 50);
  };

  const handleReply = useCallback(
    (replyId) => {
      if (simState !== "idle") return;

      const userMsg = {
        id: Date.now(),
        type: "user",
        text: replyId === "confirm" ? "1 - تأكيد" : "إلغاء",
        time: "الآن",
      };
      setMessages((p) => [...p, userMsg]);

      // Animate WAMID progression
      [1, 2, 3].forEach((step, i) => setTimeout(() => setWamidStep(step), (i + 1) * 500));

      if (replyId === "confirm") {
        setSimState("confirming");
        setTimeout(() => {
          setMessages((p) => [
            ...p,
            { id: Date.now() + 1, type: "event", text: "POST /webhook → text: '1' [34ms]" },
            { id: Date.now() + 2, type: "event", text: "pg_advisory_xact_lock acquired → status: CONFIRMED" },
          ]);
          scrollToBottom();
        }, 600);
        setTimeout(() => {
          setMessages((p) => [
            ...p,
            {
              id: Date.now() + 3,
              type: "bot",
              text: "تم تأكيد موعدك بنجاح! يسعدنا حضورك في الموعد المحدد. يمكنك دائماً إدارة وتعديل موعدك عبر الرابط أعلاه.",
              time: "الآن",
              replies: null,
            },
          ]);
          setSimState("confirmed");
          scrollToBottom();
        }, 1600);
      } else {
        setSimState("cancelled");
        setTimeout(() => {
          setMessages((p) => [
            ...p,
            { id: Date.now() + 1, type: "event", text: "POST /webhook → text: 'إلغاء' [28ms]" },
            {
              id: Date.now() + 2,
              type: "bot",
              text: "تم إلغاء الموعد بنجاح. إذا رغبت في حجز موعد جديد في أي وقت، يمكنك زيارة المنصة.",
              time: "الآن",
              replies: null,
            },
          ]);
          scrollToBottom();
        }, 600);
      }
    },
    [simState]
  );

  const reset = () => {
    setMessages(AUTHENTIC_ARABIC_MESSAGES);
    setSimState("idle");
    setWamidStep(0);
  };

  return (
    <div className="wa-sim-layout">
      {/* Left Column: Real Phone Capture or Interactive Frame */}
      <div className="wa-left-col">
        {/* View Mode Pill Switcher */}
        <div className="wa-view-toggle" role="tablist">
          <button
            className={`wa-toggle-pill${viewMode === "real" ? " active" : ""}`}
            onClick={() => setViewMode("real")}
            type="button"
          >
            Real Phone Capture
          </button>
          <button
            className={`wa-toggle-pill${viewMode === "interactive" ? " active" : ""}`}
            onClick={() => setViewMode("interactive")}
            type="button"
          >
            Interactive Demo
          </button>
        </div>

        {viewMode === "real" ? (
          /* Authentic Production Screenshot Container */
          <div className="wa-phone-frame wa-phone-frame--real">
            <div className="wa-phone-bar">
              <div className="wa-phone-avatar-wrap">
                <WhatsAppLogoSvg size={16} color="#fff" />
              </div>
              <div className="wa-phone-info">
                <span className="wa-phone-name">System Booking Bot</span>
                <span className="wa-phone-online">Production Android Client · Live</span>
              </div>
            </div>
            <div className="wa-real-img-container">
              <img
                src="/wa-chat-real.png"
                alt="Authentic WhatsApp appointment booking chat capture"
                className="wa-real-capture-img"
              />
            </div>
            <div className="wa-screenshot-label">
              Authentic device capture from live Barber SaaS fleet (+972 59 934 7728)
            </div>
          </div>
        ) : (
          /* Live Interactive Simulator */
          <div className="wa-phone-frame">
            <div className="wa-phone-bar">
              <div className="wa-phone-avatar-wrap">
                <WhatsAppLogoSvg size={16} color="#fff" />
              </div>
              <div className="wa-phone-info">
                <span className="wa-phone-name">System Booking Bot</span>
                <span className="wa-phone-online">online · active simulation</span>
              </div>
            </div>
            <div className="wa-chat-body" ref={bodyRef} dir="rtl">
              {messages.map((msg) =>
                msg.type === "system" ? (
                  <div key={msg.id} className="wa-system-msg" dir="ltr">{msg.text}</div>
                ) : msg.type === "event" ? (
                  <div key={msg.id} className="wa-event-msg" dir="ltr">{msg.text}</div>
                ) : msg.type === "user" ? (
                  <div key={msg.id} className="wa-bubble-row wa-bubble-row--user">
                    <div className="wa-bubble wa-bubble--user">
                      <span className="wa-bubble-text">{msg.text}</span>
                      <span className="wa-bubble-time">{msg.time}</span>
                    </div>
                  </div>
                ) : (
                  <div key={msg.id} className="wa-bubble-row wa-bubble-row--bot">
                    <div className="wa-bubble wa-bubble--bot">
                      <span className="wa-bubble-text" style={{ whiteSpace: "pre-line" }}>{msg.text}</span>
                      <span className="wa-bubble-time">{msg.time}</span>
                      {msg.replies && (
                        <div className="wa-quick-replies" dir="ltr">
                          {msg.replies.map((r) => (
                            <button
                              key={r.id}
                              className={`wa-reply-btn${simState !== "idle" ? " disabled" : ""}`}
                              onClick={() => handleReply(r.id)}
                              disabled={simState !== "idle"}
                              type="button"
                            >
                              {r.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )
              )}
            </div>
            <div className="wa-screenshot-label">Live interactive demo — tap the quick-reply buttons above ↑</div>
          </div>
        )}
      </div>

      {/* Right Column: Telemetry & Ingress Analytics */}
      <div className="wa-right-col">
        {/* WAMID Tracker */}
        <div className="wa-telem-block">
          <div className="wa-telem-heading">WAMID Delivery Track</div>
          <div className="wa-wamid-track">
            {WAMID_STEPS.map((s, i) => {
              const isStepActive = viewMode === "real" || i <= wamidStep;
              return (
                <div key={s.id} className={`wa-wamid-step${isStepActive ? " active" : ""}`}>
                  <div className="wa-wamid-dot" />
                  <span>
                    {s.label} {isStepActive && i > 0 ? "✓" : ""}
                  </span>
                  {i < WAMID_STEPS.length - 1 && <div className="wa-wamid-line" />}
                </div>
              );
            })}
          </div>
        </div>

        {/* Webhook Log */}
        <div className="wa-telem-block">
          <div className="wa-telem-heading">Webhook Ingress Log</div>
          <div className="wa-log-box">
            {viewMode === "real" ? (
              <>
                <span className="wa-log-line wa-log-in">→ POST /webhook 200 OK 42ms</span>
                <span className="wa-log-line wa-log-info">· Gateway: Green API Instance 7105</span>
                <span className="wa-log-line wa-log-info">· Dispatch: Dynamic sendMessage (Arabic RTL)</span>
                <span className="wa-log-line wa-log-info">· Recipient: +972 59 773 3750</span>
                <span className="wa-log-line wa-log-ok">✓ Status: READ (100% verified delivery)</span>
                <span className="wa-log-line wa-log-ok">✓ Concurrency: 0 collisions</span>
              </>
            ) : (
              <>
                {simState === "idle" && <span className="wa-log-idle">▸ Waiting for user interaction…</span>}
                {(simState === "confirming" || simState === "confirmed") && (
                  <>
                    <span className="wa-log-line wa-log-in">→ POST /webhook 200 OK 34ms</span>
                    <span className="wa-log-line wa-log-info">· Gateway: Green API webhook ingress</span>
                    <span className="wa-log-line wa-log-info">· Inbound payload: "1" (Arabic auto-reply match)</span>
                    <span className="wa-log-line wa-log-ok">✓ DB: status → CONFIRMED</span>
                    <span className="wa-log-line wa-log-ok">✓ Gateway: dynamic confirmation dispatched</span>
                  </>
                )}
                {simState === "cancelled" && (
                  <>
                    <span className="wa-log-line wa-log-in">→ POST /webhook 200 OK 28ms</span>
                    <span className="wa-log-line wa-log-info">· Inbound payload: "إلغاء"</span>
                    <span className="wa-log-line wa-log-ok">✓ DB: booking cancelled, slot released</span>
                  </>
                )}
              </>
            )}
          </div>
        </div>

        {/* Real Metrics Grid (100% Delivery Rate, Green API Fleet) */}
        <div className="wa-metrics-grid">
          {[
            { val: "<180ms", key: "Avg Webhook" },
            { val: "100%", key: "Delivery Rate" },
            { val: "0", key: "Concurrency Collisions" },
            { val: "7", key: "Fleet Gateways" },
          ].map((m) => (
            <div key={m.key} className="wa-metric">
              <span className="wa-metric-val">{m.val}</span>
              <span className="wa-metric-key">{m.key}</span>
            </div>
          ))}
        </div>

        {viewMode === "interactive" && simState !== "idle" && (
          <button className="wa-reset-btn" onClick={reset} type="button">
            ↺ Reset Simulator
          </button>
        )}
      </div>
    </div>
  );
}

// ── Pipeline Tab ──────────────────────────────────────────────────────────────
function PipelineTab() {
  const [active, setActive] = useState(null);

  return (
    <div className="wa-pipeline-tab">
      <img
        src="/wa-pipeline.jpg"
        alt="WhatsApp bot serverless pipeline architecture diagram"
        className="wa-pipeline-img"
      />
      <p className="wa-pipeline-caption">Select an architecture stage below for technical telemetry</p>

      <div className="wa-pipeline-nodes">
        {PIPELINE_STEPS.map((step, i) => (
          <React.Fragment key={step.id}>
            <button
              className={`wa-pipe-node${active?.id === step.id ? " active" : ""}`}
              style={{ "--nc": step.color }}
              onClick={() => setActive(active?.id === step.id ? null : step)}
              type="button"
            >
              <span className="wa-pipe-icon">{renderStepIcon(step.type, step.color, 20)}</span>
              <span className="wa-pipe-label">{step.label}</span>
            </button>
            {i < PIPELINE_STEPS.length - 1 && <div className="wa-pipe-arrow">›</div>}
          </React.Fragment>
        ))}
      </div>

      {active && (
        <div className="wa-pipe-detail" style={{ "--nc": active.color }}>
          <span className="wa-pipe-detail-icon">{renderStepIcon(active.type, active.color, 24)}</span>
          <div>
            <div className="wa-pipe-detail-name">{active.label}</div>
            <p className="wa-pipe-detail-desc">{active.detail}</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Fleet & Cron Dispatch Tab (Accurate Green API Multi-Instance Architecture) ──
function FleetDispatchTab() {
  return (
    <div className="wa-templates-tab">
      <div className="wa-tpl-header">
        <div>
          <div className="wa-tpl-title">Dynamic Message Dispatches</div>
          <p className="wa-tpl-sub">Unrestricted rich-text, Arabic RTL formatting, and direct links via Green API gateway fleet</p>
        </div>
        <div className="wa-tpl-badge">ZERO APPROVAL BOTTLENECK · INSTANT DISPATCH</div>
      </div>

      <div className="wa-tpl-grid">
        {DISPATCH_FLOWS.map((t) => (
          <div key={t.name} className="wa-tpl-card">
            <div className="wa-tpl-card-top">
              <span className="wa-tpl-label">{t.label}</span>
              <span className="wa-tpl-status">{t.status}</span>
            </div>
            <span className="wa-tpl-category">{t.category}</span>
            <p style={{ fontSize: "0.68rem", color: "rgba(252,252,252,0.65)", margin: "0.3rem 0 0", lineHeight: "1.4" }}>
              {t.desc}
            </p>
          </div>
        ))}
      </div>

      <div className="wa-cron-section">
        <div className="wa-cron-title">Dual Reminder Cron Timeline</div>
        <div className="wa-cron-bar-wrap">
          <div className="wa-cron-bar">
            <div className="wa-cron-bar-fill" />
            {[
              { left: "0%", label: "T+0", name: "Booking Created", color: "#25D366" },
              { left: "50%", label: "T-24h", name: "24h Reminder", color: "#00BAE3" },
              { left: "82%", label: "T-2h", name: "Urgent Reminder", color: "#f59e0b" },
              { left: "100%", label: "T-0", name: "Appointment", color: "#a78bfa" },
            ].map((ev) => (
              <div key={ev.label} className="wa-cron-event" style={{ left: ev.left }}>
                <div className="wa-cron-dot" style={{ background: ev.color, boxShadow: `0 0 8px ${ev.color}` }} />
                <div className="wa-cron-ev-labels">
                  <span className="wa-cron-ev-time" style={{ color: ev.color }}>{ev.label}</span>
                  <span className="wa-cron-ev-name">{ev.name}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="wa-templates-capture-box">
        <div className="wa-telem-heading" style={{ marginBottom: "0.5rem" }}>Live Client Inspection</div>
        <img
          src="/wa-chat-real.png"
          alt="Real WhatsApp appointment booking chat screenshot via Green API"
          className="wa-chat-screenshot"
        />
      </div>
    </div>
  );
}

// ── Main Modal ────────────────────────────────────────────────────────────────
export function WhatsAppBotModal({ isOpen, onClose }) {
  const [tab, setTab] = useState("chat");

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) setTab("chat");
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="wa-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="wa-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="wa-modal-header">
          <div className="wa-modal-title-group">
            <span className="wa-modal-logo">
              <WhatsAppLogoSvg size={22} color="#25D366" />
            </span>
            <div>
              <div className="wa-modal-title">WHATSAPP BOT</div>
              <div className="wa-modal-subtitle">Green API Gateway Fleet · Edge Functions · Supabase · Deno</div>
            </div>
          </div>
          <button className="wa-modal-close" onClick={onClose} aria-label="Close modal" type="button">
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M1 1L9 9M9 1L1 9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="wa-modal-tabs" role="tablist">
          {TABS.map((t) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={tab === t.id}
              className={`wa-modal-tab${tab === t.id ? " active" : ""}`}
              onClick={() => setTab(t.id)}
              type="button"
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="wa-modal-body">
          {tab === "chat" && <ChatSimulator />}
          {tab === "pipeline" && <PipelineTab />}
          {tab === "dispatch" && <FleetDispatchTab />}
        </div>

        {/* Footer */}
        <div className="wa-modal-footer">
          <span className="wa-footer-badge">PRODUCTION</span>
          <span className="wa-footer-text">
            Green API Gateway Fleet · Unrestricted Dynamic Messaging · 100% Delivery Rate · Zero Collision Concurrency
          </span>
        </div>
      </div>
    </div>
  );
}
