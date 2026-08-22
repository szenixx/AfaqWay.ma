"use client";

/* The centre column, top to bottom: welcome · metrics · media list.

   The header utilities are gone: the top of the page is the greeting, and
   nothing competes with it. Colour has roles here rather than decoration —
   primary for progress and actions, green for anything verified or complete,
   gold for what needs attention, purple for the secondary journey accent,
   neutral for everything upcoming. */

import { CalendarRange, Headset, MapPin, MessageCircle, Wallet } from "lucide-react";
import { TextAnimate } from "@/components/godui/text-animate";
import { MagicButton } from "@/components/godui/magic-button";
import type { JourneySummary, PreviewStep } from "@/lib/useJourneySummary";
import type { AcademicInfo, StudyApp } from "@/lib/studyApplication";
import { UniversityBrand } from "@/components/ds";
import { BorderBeam } from "@/components/godui/border-beam";
import { StepPreviewRow } from "../journey/StepPreview";

/* ── Welcome card ─────────────────────────────────────────────────────────
   The dashboard's primary visual anchor: the one strongly branded surface on
   an otherwise white page. Greeting left (~65%), the journey CTA right (~35%),
   both vertically centred. */

export function Welcome({ name, started, onAction }: {
  name: string; started: boolean; onAction: () => void;
}) {
  return (
    <section className="dx-welcome">
      {/* The study journey drawn as one continuous white line: faculty, papers,
          advice, the flight, the luggage, the cap. It washes the whole card at
          low opacity, so it reads as texture under the greeting rather than as
          a picture competing with it. Deliberately a plain img, as elsewhere:
          a decorative static that must not hold up the card. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        className="dx-welcome-bg"
        src="/assets/dashboard/welcome-journey.webp"
        alt="" aria-hidden loading="lazy" decoding="async"
      />

      {/* Depth from the primary's own light, not from a second hue. */}
      <span className="dx-welcome-glow" aria-hidden />

      {/* Four objects from the journey scattered around the student: the visa,
          the checklist, the university and the roadmap. They sit a layer ABOVE the line-art
          wash and BELOW every word, the student and the button, so wherever
          they fall they can never cover something that has to be read.
          Decorative statics, like the rest of this card's artwork. */}
      <span className="dx-welcome-props" aria-hidden>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/assets/dashboard/prop-visa.webp" alt="" loading="lazy" decoding="async" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/assets/dashboard/prop-checklist.webp" alt="" loading="lazy" decoding="async" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/assets/dashboard/prop-university.webp" alt="" loading="lazy" decoding="async" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/assets/dashboard/prop-roadmap.webp" alt="" loading="lazy" decoding="async" />
      </span>

      {/* Two beams, half a lap apart, chasing each other round the border.
          White on the brand fill, so they read as light rather than as a
          second colour. */}
      <BorderBeam colorFrom="#FFFFFF" colorTo="#BFC3F5" duration={6} size={70} />
      <BorderBeam colorFrom="#FFFFFF" colorTo="#BFC3F5" delay={3} duration={6} size={70} />

      <div className="dx-welcome-copy">
        <h1 className="dx-welcome-title">
          {/* The greeting slides in word by word. The full sentence stays in
              the accessible tree as one label — a reader hears a greeting,
              not five separate words. */}
          <TextAnimate animation="slideLeft" by="word" className="dx-welcome-anim" repeatEvery={6}>
            {`Welcome Back, ${name}!`}
          </TextAnimate>
          {/* The real emoji character, in the platform's colour-emoji font. A
              hand-drawn SVG only ever approximates the glyph people know. */}
          <span className="dx-wave" role="img" aria-label="waving hand">👋</span>
        </h1>
        <p className="dx-welcome-sub">Let&rsquo;s continue your study journey.</p>
        <p className="dx-welcome-text">
          Track your application, verify your documents, and reach your advisor, all in one place.
        </p>
      </div>

      {/* The card's hero: the AfaqWay student cropped to the chest, the brand
          mark standing in 3D behind his shoulder, and a flight arc climbing
          away to the right. Cut out against the card's own fill, so it sits on
          the gradient rather than on a plate. Decorative only, and the copy
          beside it already says everything this says. Deliberately a plain
          img, as elsewhere: a static that must not hold up the card. */}
      <span className="dx-welcome-figure" aria-hidden>
        {/* The frame is the grid item and carries the height; the artwork
            inside is taken out of flow, so it can never push the card taller
            than the column beside it. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/assets/dashboard/welcome-hero.webp" alt="" loading="lazy" decoding="async" />
      </span>

      {/* The label follows the student's real journey state, so the card always
          names the next thing they should actually do. */}
      <MagicButton onClick={onAction}>
        <span>{started ? "Continue Your Journey" : "Start Your Journey"}</span>
        <span className="dx-cta-arrow" aria-hidden>→</span>
      </MagicButton>
    </section>
  );
}

/* ── Circular metric ───────────────────────────────────────────────────── */

function Ring({ pct, tone }: { pct: number; tone: "primary" | "purple" | "green" }) {
  /* Sized to fill the card rather than sit politely inside it — the dials are
     the content here, so they carry the weight. */
  const size = 124, sw = 11, r = (size - sw) / 2, c = 2 * Math.PI * r;
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

/* ── AfaqWay Support ──────────────────────────────────────────────────────
   Action-oriented, and the only card in the row whose whole lower half is a
   call to action. A compact icon sits beside the title; a large one watermarks
   the bottom-right corner, behind the content and well under the text. */

export function SupportCard({ onChat }: { onChat: () => void }) {
  return (
    <section className="dx-card dx-support">
      {/* The decorative layer, and only that: a headset, a chat bubble, a help
          badge and a few small signals, clipped by the card's own corner. It
          carries no information, so it is hidden from readers and untouchable
          by the pointer. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        className="dx-support-art"
        src="/assets/dashboard/support-tools.webp"
        alt="" aria-hidden loading="lazy" decoding="async"
      />

      <header className="dx-support-head">
        <span className="dx-support-ico" aria-hidden><Headset size={15} /></span>
        <h3 className="dx-card-title">Your AfaqWay Support</h3>
      </header>

      {/* The live part of the card, and real markup rather than paint: a dot
          that pulses in CSS, with the state written out for screen readers. */}
      <p className="dx-support-live">
        <span className="dx-support-dot" aria-hidden />
        Online now, typically replies in minutes
      </p>

      <p className="dx-support-text">
        Your advisor guides you through the whole journey: choosing a university,
        preparing your documents, admissions, and residence procedures.
      </p>

      <button type="button" className="dx-support-cta" onClick={onChat}>
        <MessageCircle size={17} />
        Chat with your advisor
      </button>
    </section>
  );
}

/* ── University information ───────────────────────────────────────────────
   An academic profile card, not a dashboard tile. Everything is read from the
   student's own application, so it holds for any country and any university;
   a field with no value is dropped rather than shown empty. */

/** Duration is not stored, so it is only shown when the degree implies one. */
function durationFor(academic: AcademicInfo | null): string | null {
  const d = (academic?.targetDegree ?? "").toLowerCase();
  if (d === "bachelor") return "3–4 years";
  if (d === "master") return "1–2 years";
  return null;
}

export function UniversityCard({ study, academic }: {
  study: StudyApp | null; academic: AcademicInfo | null;
}) {
  const has = (v?: string | null) => Boolean(v && v !== "—" && v.trim());
  const place = [study?.country, study?.city].filter(has).join(" · ");
  const duration = durationFor(academic);
  const tuition = has(study?.tuition) ? study!.tuition : null;

  if (!has(study?.university) && !has(study?.program)) {
    return (
      <section className="dx-card dx-uni">
        <h3 className="dx-card-title">Your university</h3>
        <p className="dx-empty">
          Once your programme is confirmed, your university and course details appear here.
        </p>
      </section>
    );
  }

  return (
    <section className="dx-card dx-uni">
      {/* A classical faculty building in the lower-right corner, faint and
          behind every field. The name, place, programme and facts all read to
          its left, so nothing it covers is text. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        className="dx-uni-art"
        src="/assets/dashboard/university-building.webp"
        alt="" aria-hidden loading="lazy" decoding="async"
      />

      <header className="dx-uni-head">
        <UniversityBrand name={study?.university} size={46} />
        <div className="dx-uni-id">
          <h3 className="dx-uni-name">{has(study?.university) ? study!.university : "University to be confirmed"}</h3>
          {place && (
            <span className="dx-uni-place">
              <MapPin size={12} />{place}
            </span>
          )}
        </div>
      </header>

      {has(study?.program) && (
        <div className="dx-uni-prog">
          <span className="dx-uni-label">Programme</span>
          <span className="dx-uni-progname">{study!.program}</span>
        </div>
      )}

      {/* Cost first, then length: the tuition is the fact a student weighs
          hardest, so it takes the upper row. */}
      {(duration || tuition) && (
        <div className="dx-uni-facts">
          {tuition && (
            <div>
              <span className="dx-uni-label"><Wallet size={11} />Tuition</span>
              <span className="dx-uni-value">{tuition}</span>
            </div>
          )}
          {duration && (
            <div>
              <span className="dx-uni-label"><CalendarRange size={11} />Duration</span>
              <span className="dx-uni-value">{duration}</span>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

/* ── Metrics row ──────────────────────────────────────────────────────────
   Progress · Support · University — "how am I doing", "who can help me",
   "where am I going". One card language, three semantic identities: the
   progress card is measured, the support card is action-oriented, the
   university card is informative. */

export function MetricsRow({ j, study, academic, onChat }: {
  j: JourneySummary;
  study: StudyApp | null;
  academic: AcademicInfo | null;
  onChat: () => void;
}) {
  /* Both rings read the student's real journey: steps approved out of steps
     assigned, and documents verified out of documents required. */
  const stepsPct = j.pct;
  const docsPct = j.docsTotal ? Math.round((j.docsApproved / j.docsTotal) * 100) : 0;

  return (
    <div className="dx-metrics">
      <section className="dx-card dx-perf">
        <div className="dx-perf-cols">
          <div className="dx-perf-col">
            <h3 className="dx-card-title">Application progress</h3>
            <Ring pct={stepsPct} tone="purple" />
            <span className="dx-perf-sub">
              {j.stepsTotal ? `${j.stepsDone} of ${j.stepsTotal} steps` : "Not started yet"}
            </span>
          </div>
          <span className="dx-perf-rule" aria-hidden />
          <div className="dx-perf-col">
            <h3 className="dx-card-title">Your documents</h3>
            <Ring pct={docsPct} tone="green" />
            {/* Approvals only: the ring moves when a reviewer approves a
                document, and the caption says exactly that. */}
            <span className="dx-perf-sub">
              {j.docsTotal === 0 ? "None required yet"
                : `${j.docsApproved} of ${j.docsTotal} approved`}
            </span>
          </div>
        </div>

        {/* Two entries, not three: both rings measure the same thing — how
            much is done versus how much is left. The colours separate the two
            metrics, not two different meanings. */}
        <div className="dx-legend">
          <span><i className="dot purple" />Progress</span>
          <span><i className="dot track" />Remaining</span>
        </div>
      </section>

      <SupportCard onChat={onChat} />
      <UniversityCard academic={academic} study={study} />
    </div>
  );
}

/* ── Next Steps ───────────────────────────────────────────────────────────
   A four-row snapshot of the roadmap, not a second workflow. The rows are the
   Journey module's own — same icons, same state colours, same status pills —
   rendered through the shared StepPreviewRow so the two surfaces cannot drift.

   The window comes from useJourneySummary, which anchors it on the step the
   student should act on next and falls back so the card is never empty, even
   when everything ahead is locked. */

export function NextSteps({ steps, loading, onOpen }: {
  steps: PreviewStep[]; loading: boolean; onOpen: () => void;
}) {
  return (
    <section className="dx-card dx-next">
      <header className="dx-media-head">
        <h3 className="dx-card-title">Next Steps</h3>
        <button type="button" className="dx-link" onClick={onOpen}>View Journey →</button>
      </header>

      <div className="dx-nextlist">
        {loading ? (
          <p className="dx-empty">Loading your journey…</p>
        ) : steps.length === 0 ? (
          <p className="dx-empty">Your roadmap is being prepared. Your next steps appear here as soon as it is ready.</p>
        ) : (
          steps.map((st) => (
            <StepPreviewRow
              key={st.id}
              blocked={st.blocked}
              stageTitle={st.stageTitle}
              state={st.state}
              title={st.title}
              onOpen={onOpen}
            />
          ))
        )}
      </div>
    </section>
  );
}
