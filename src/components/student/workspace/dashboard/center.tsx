"use client";

/* The centre column, top to bottom: welcome · metrics · media list.

   The header utilities are gone: the top of the page is the greeting, and
   nothing competes with it. Colour has roles here rather than decoration —
   primary for progress and actions, green for anything verified or complete,
   gold for what needs attention, purple for the secondary journey accent,
   neutral for everything upcoming. */

import { CircleCheck, Clock3, MoreHorizontal, Play } from "lucide-react";
import { COURSES, GOAL, MEDIA, SCORE } from "./demo";

/* ── Welcome card ─────────────────────────────────────────────────────────
   The dashboard's primary visual anchor: the one strongly branded surface on
   an otherwise white page. Greeting left (~65%), the journey CTA right (~35%),
   both vertically centred. */

export function Welcome({ name, started, onAction }: {
  name: string; started: boolean; onAction: () => void;
}) {
  return (
    <section className="dx-welcome">
      {/* Depth from the primary's own light, not from a second hue. */}
      <span className="dx-welcome-glow" aria-hidden />

      {/* The platform mark as a watermark on the right — the same double
          chevron as public/assets/brand/logo-glyph.svg, inlined so it takes
          the card's own white at low opacity instead of loading an asset. */}
      <svg className="dx-welcome-mark" viewBox="0 0 96 96" aria-hidden fill="none">
        <g stroke="#fff" strokeWidth="13" strokeLinecap="square" strokeLinejoin="miter">
          <path d="M29 28 48 45 67 28" />
          <path d="M29 54 48 71 67 54" />
        </g>
      </svg>

      <div className="dx-welcome-copy">
        <h1 className="dx-welcome-title">
          Welcome Back, {name}!{" "}
          {/* The real emoji character, in the platform's colour-emoji font. A
              hand-drawn SVG only ever approximates the glyph people know. */}
          <span className="dx-wave" role="img" aria-label="waving hand">👋</span>
        </h1>
        <p className="dx-welcome-sub">Let&rsquo;s continue your study journey.</p>
        <p className="dx-welcome-text">
          Everything you need is in one place: track your application, upload and verify
          your documents, follow each stage of your move, and talk to your advisor whenever
          you need a hand.
        </p>
      </div>

      {/* The label follows the student's real journey state, so the card always
          names the next thing they should actually do. */}
      <button type="button" className="dx-cta" onClick={onAction}>
        <span>{started ? "Continue Your Journey" : "Start Your Journey"}</span>
        <span className="dx-cta-arrow" aria-hidden>→</span>
      </button>
    </section>
  );
}

/* ── Semantic roles ───────────────────────────────────────────────────────
   Four states, one meaning each, used identically by every list on the page.
   Colour never travels alone: each row also carries the word and an icon. */

const STATE_META = {
  done:      { tone: "green",   word: "Completed", Icon: CircleCheck },
  active:    { tone: "primary", word: "In progress", Icon: Play },
  attention: { tone: "gold",    word: "Needs you", Icon: Clock3 },
  upcoming:  { tone: "neutral", word: "Upcoming", Icon: Play },
} as const;

/* ── Circular metric ───────────────────────────────────────────────────── */

function Ring({ pct, tone }: { pct: number; tone: "primary" | "green" }) {
  const size = 82, sw = 8, r = (size - sw) / 2, c = 2 * Math.PI * r;
  return (
    <svg className={`dx-ring dxt-${tone}`} width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
      <circle cx={size / 2} cy={size / 2} r={r} className="dx-ring-track" strokeWidth={sw} fill="none" />
      <circle
        cx={size / 2} cy={size / 2} r={r} className="dx-ring-fill" strokeWidth={sw} fill="none"
        strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c - (c * pct) / 100}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text x="50%" y="50%" className="dx-ring-num" textAnchor="middle" dominantBaseline="central">{pct}%</text>
    </svg>
  );
}

/* ── Metrics row ──────────────────────────────────────────────────────────
   Deliberately unequal: performance ~56%, stages ~42%. Both are white cards;
   only the indicators inside them carry colour. */

export function MetricsRow() {
  return (
    <div className="dx-metrics">
      <section className="dx-card dx-perf">
        <div className="dx-perf-cols">
          <div className="dx-perf-col">
            <h3 className="dx-card-title">Application progress</h3>
            <Ring pct={GOAL.value} tone={GOAL.tone} />
            <span className="dx-perf-sub">{GOAL.label}</span>
          </div>
          <span className="dx-perf-rule" aria-hidden />
          <div className="dx-perf-col">
            <h3 className="dx-card-title">Your documents</h3>
            <Ring pct={SCORE.value} tone={SCORE.tone} />
            <span className="dx-perf-sub">{SCORE.label}</span>
          </div>
        </div>
        <div className="dx-legend">
          <span><i className="dot primary" />Progress</span>
          <span><i className="dot green" />Verified</span>
          <span><i className="dot track" />Remaining</span>
        </div>
      </section>

      <section className="dx-card dx-courses">
        <h3 className="dx-card-title">Your journey</h3>
        <ul className="dx-courselist">
          {COURSES.map((c) => {
            const m = STATE_META[c.state];
            return (
              <li key={c.name} className={`dxt-${m.tone}`}>
                <div className="dx-course-top">
                  <span className="dx-course-name">{c.name}</span>
                  <span className="dx-course-pct">{c.pct}%</span>
                </div>
                <span className="dx-thin"><span style={{ width: `${c.pct}%` }} /></span>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}

/* ── Media list ───────────────────────────────────────────────────────────
   Compact rows inside one white section, never a card per item. */

export function MediaSection({ onAll }: { onAll: () => void }) {
  return (
    <section className="dx-card dx-media">
      <header className="dx-media-head">
        <h3 className="dx-card-title">Media for lessons</h3>
        <button type="button" className="dx-link" onClick={onAll}>View all</button>
      </header>
      <ul className="dx-medialist">
        {MEDIA.map((m) => {
          const meta = STATE_META[m.state];
          const Icon = meta.Icon;
          return (
            <li key={m.id} className={`dx-mediarow dxt-${meta.tone}`}>
              <span className="dx-thumb" aria-hidden><Icon size={15} /></span>
              <span className="dx-media-title">{m.title}</span>
              <span className="dx-chip">{meta.word}</span>
              <span className="dx-media-meta">{m.members}</span>
              <span className="dx-media-meta">{m.size}</span>
              <button type="button" className="dx-dots" aria-label={`More options for ${m.title}`}>
                <MoreHorizontal size={15} />
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
