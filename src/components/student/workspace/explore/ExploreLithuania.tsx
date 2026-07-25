"use client";

import { useEffect, useState } from "react";
import {
  Banknote, Bus, ChevronDown, ExternalLink, GraduationCap, HeartPulse, Home,
  Info, Landmark, MapPin, Quote, Sparkles, Wallet,
} from "lucide-react";
import {
  BANKING, CITIES, COSTS, HEALTHCARE, HERO_STATS, HOUSING, HOUSING_SCAMS, MARQUEE_SOURCES,
  PHOTOS, QUOTES, SOURCES, STUDENT_LIFE, TIPS, TIP_CALLOUTS, TRANSPORT, UNIVERSITIES, UNI_INTRO,
  type Callout, type Item,
} from "./content";

/* Explore Lithuania — an editorial guide inside the workspace. Uses the
   platform's cards, radii, shadows, motion and palette only; the accent is the
   platform indigo with amber/green/red reserved for callout status. */

const SECTIONS = [
  { id: "universities", label: "Universities", icon: <GraduationCap size={15} /> },
  { id: "cities", label: "Cities", icon: <MapPin size={15} /> },
  { id: "housing", label: "Housing", icon: <Home size={15} /> },
  { id: "costs", label: "Cost of living", icon: <Wallet size={15} /> },
  { id: "transport", label: "Transport", icon: <Bus size={15} /> },
  { id: "healthcare", label: "Healthcare", icon: <HeartPulse size={15} /> },
  { id: "banking", label: "Banking", icon: <Banknote size={15} /> },
  { id: "life", label: "Student life", icon: <Sparkles size={15} /> },
  { id: "tips", label: "Before you move", icon: <Info size={15} /> },
];

/* ── Small pieces ─────────────────────────────────────────────────────────── */

function SectionHead({ id, eyebrow, title, sub }: { id: string; eyebrow: string; title: string; sub?: string }) {
  return (
    <header className="ex-head" id={id}>
      <span className="ex-eyebrow">{eyebrow}</span>
      <h2 className="ex-title">{title}</h2>
      {sub && <p className="ex-sub">{sub}</p>}
    </header>
  );
}

/* Expandable information card — the guide's main reading unit. */
function Expandable({ item, open, onToggle }: { item: Item; open: boolean; onToggle: () => void }) {
  return (
    <div className={`ex-exp${open ? " open" : ""}`}>
      <button type="button" className="ex-exp-btn" onClick={onToggle} aria-expanded={open}>
        <span className="ex-exp-title">{item.title}</span>
        <ChevronDown size={16} className="ex-exp-chev" />
      </button>
      {open && <p className="ex-exp-body">{item.body}</p>}
    </div>
  );
}

function ExpandableList({ items, columns = 2 }: { items: Item[]; columns?: 1 | 2 }) {
  const [open, setOpen] = useState<string | null>(items[0]?.title ?? null);
  return (
    <div className={columns === 2 ? "ex-grid2" : "ex-col"}>
      {items.map((it) => (
        <Expandable key={it.title} item={it} open={open === it.title} onToggle={() => setOpen(open === it.title ? null : it.title)} />
      ))}
    </div>
  );
}

function CalloutCard({ c }: { c: Callout }) {
  return (
    <div className={`ex-callout ${c.tone}`}>
      <span className="ex-callout-ico"><Info size={15} /></span>
      <div>
        <div className="ex-callout-title">{c.title}</div>
        <p className="ex-callout-body">{c.body}</p>
      </div>
    </div>
  );
}

/* Full-width photograph, alternating side by side with the text. */
function Photo({ src, alt, caption, side = "right" }: { src: string; alt: string; caption: string; side?: "left" | "right" }) {
  return (
    <figure className={`ex-photo ${side}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} loading="lazy" />
      <figcaption>{caption}</figcaption>
    </figure>
  );
}

/* ── The module ───────────────────────────────────────────────────────────── */

export default function ExploreLithuania() {
  const [city, setCity] = useState(CITIES[0].key);
  const [active, setActive] = useState(SECTIONS[0].id);

  // Sticky table of contents follows the section currently on screen.
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (visible) setActive(visible.target.id);
      },
      { rootMargin: "-20% 0px -70% 0px", threshold: 0 },
    );
    SECTIONS.forEach((s) => { const el = document.getElementById(s.id); if (el) io.observe(el); });
    return () => io.disconnect();
  }, []);

  const go = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  const selected = CITIES.find((c) => c.key === city) ?? CITIES[0];

  return (
    <div className="ex-root">
      {/* ── Hero ── */}
      <section className="ex-hero">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="ex-hero-img" src={PHOTOS.hero} alt="Lithuania" />
        <div className="ex-hero-body">
          <span className="ex-hero-eyebrow">Country guide</span>
          <h1 className="ex-hero-title">Lithuania</h1>
          <p className="ex-hero-text">
            A small Baltic country with an outsized student scene: EU degrees taught in English, tuition and living
            costs far below western Europe, two lively university cities, and Schengen travel on your doorstep. This
            guide collects what you actually need before and after you arrive.
          </p>
        </div>
      </section>

      <div className="ex-stats">
        {HERO_STATS.map((s, i) => (
          <div key={s.label} className="ex-stat" style={{ animationDelay: `${i * 40}ms` }}>
            <span className="ex-stat-label">{s.label}</span>
            <span className="ex-stat-value">{s.value}</span>
          </div>
        ))}
      </div>

      <div className="ex-layout">
        {/* ── Sticky table of contents ── */}
        <nav className="ex-toc" aria-label="Sections">
          <span className="ex-toc-label">On this page</span>
          {SECTIONS.map((s) => (
            <button key={s.id} type="button" className={`ex-toc-item${active === s.id ? " active" : ""}`} onClick={() => go(s.id)}>
              <span className="ex-toc-ico">{s.icon}</span>{s.label}
            </button>
          ))}
        </nav>

        <div className="ex-content">
          {/* ── 1. Universities ── */}
          <section className="ex-section">
            <SectionHead id="universities" eyebrow="Section 1" title="Universities"
              sub="How Lithuanian higher education works, what it costs, and which institutions teach in English." />
            <Photo src={PHOTOS.universities} alt="University campus in Lithuania" caption="Study in a system that has been running since 1579." side="right" />
            <ExpandableList items={UNI_INTRO} />

            <h3 className="ex-h3">Major universities</h3>
            <div className="ex-unis">
              {UNIVERSITIES.map((u) => (
                <article key={u.short} className="ex-uni">
                  <div className="ex-uni-top">
                    <span className="ex-uni-logo">{u.short.slice(0, 2)}</span>
                    <div style={{ minWidth: 0 }}>
                      <div className="ex-uni-name">{u.name}</div>
                      <div className="ex-uni-city"><MapPin size={12} />{u.city}</div>
                    </div>
                  </div>
                  <p className="ex-uni-desc">{u.desc}</p>
                  <div className="ex-tags">{u.programs.map((p) => <span key={p} className="ex-tag">{p}</span>)}</div>
                  <div className="ex-uni-support"><Landmark size={13} />{u.support}</div>
                </article>
              ))}
            </div>
          </section>

          {/* ── 2. Cities ── */}
          <section className="ex-section">
            <SectionHead id="cities" eyebrow="Section 2" title="Student cities"
              sub="Pick a city to compare atmosphere, cost, safety, transport and where students actually live." />
            <Photo src={PHOTOS.cities} alt="Lithuanian city" caption="Vilnius old town, a UNESCO world heritage site." side="left" />

            <div className="ex-citytabs">
              {CITIES.map((c) => (
                <button key={c.key} type="button" className={`ex-citytab${city === c.key ? " active" : ""}`} onClick={() => setCity(c.key)}>{c.name}</button>
              ))}
            </div>

            <article className="ex-city" key={selected.key}>
              <div className="ex-city-head">
                <div>
                  <h3 className="ex-city-name">{selected.name}</h3>
                  <span className="ex-city-tag">{selected.tag}</span>
                </div>
              </div>
              <p className="ex-city-lead">{selected.overview}</p>
              <div className="ex-grid2">
                {([
                  ["Student atmosphere", selected.atmosphere],
                  ["Cost comparison", selected.costs],
                  ["Safety", selected.safety],
                  ["Nightlife", selected.nightlife],
                  ["Public transport", selected.transport],
                  ["Best neighbourhoods", selected.neighbourhoods],
                  ["Nearby attractions", selected.nearby],
                ] as const).map(([k, v]) => (
                  <div key={k} className="ex-fact">
                    <span className="ex-fact-label">{k}</span>
                    <span className="ex-fact-value">{v}</span>
                  </div>
                ))}
              </div>
            </article>
          </section>

          {/* ── 3. Housing ── */}
          <section className="ex-section">
            <SectionHead id="housing" eyebrow="Section 3" title="Housing"
              sub="Dormitories, shared flats and private rentals, plus the contract and deposit rules that catch students out." />
            <Photo src={PHOTOS.housing} alt="Housing in Lithuania" caption="Most first-year students start in a university dormitory." side="right" />
            <ExpandableList items={HOUSING} />
            <div className="ex-col" style={{ marginTop: 16 }}>
              {HOUSING_SCAMS.map((c) => <CalloutCard key={c.title} c={c} />)}
            </div>
          </section>

          {/* ── 4. Cost of living ── */}
          <section className="ex-section">
            <SectionHead id="costs" eyebrow="Section 4" title="Cost of living"
              sub="Typical monthly student spending, compared between the capital and the other university cities." />
            <div className="ex-table">
              <div className="ex-tr ex-th"><span>Item</span><span>Vilnius</span><span>Other cities</span><span>Note</span></div>
              {COSTS.map((c) => (
                <div key={c.item} className="ex-tr">
                  <span className="ex-td-item">{c.item}</span>
                  <span className="ex-td-price">{c.vilnius}</span>
                  <span className="ex-td-price alt">{c.other}</span>
                  <span className="ex-td-note">{c.note}</span>
                </div>
              ))}
            </div>
            <div className="ex-grid2" style={{ marginTop: 16 }}>
              <CalloutCard c={{ tone: "green", title: "Realistic monthly total", body: "Most students land between €600 and €900 per month in Vilnius, and €500 to €750 in Kaunas, Klaipėda, Šiauliai or Panevėžys. A dormitory place instead of a private room moves that by €150–250." }} />
              <CalloutCard c={{ tone: "amber", title: "Budget for the first month twice", body: "Arrival costs stack: deposit plus first rent, a winter coat, a transport pass, a SIM card and documents. Plan for roughly double a normal month at the start." }} />
            </div>
          </section>

          {/* ── 5. Transport ── */}
          <section className="ex-section">
            <SectionHead id="transport" eyebrow="Section 5" title="Getting around"
              sub="City transport, student discounts, trains and coaches, and the apps that make it painless." />
            <Photo src={PHOTOS.transport} alt="Public transport in Lithuania" caption="City buses and trolleybuses cover every student district." side="left" />
            <ExpandableList items={TRANSPORT} />
          </section>

          {/* ── 6. Healthcare ── */}
          <section className="ex-section">
            <SectionHead id="healthcare" eyebrow="Section 6" title="Healthcare"
              sub="Insurance is compulsory and tied to your residence permit. Here is how the system fits together." />
            <ExpandableList items={HEALTHCARE} />
            <div style={{ marginTop: 16 }}>
              <CalloutCard c={{ tone: "red", title: "112 works everywhere", body: "One number for ambulance, police and fire, from any phone with or without credit, and operators speak English. Emergency treatment is given regardless of your insurance status." }} />
            </div>
          </section>

          {/* ── 7. Banking ── */}
          <section className="ex-section">
            <SectionHead id="banking" eyebrow="Section 7" title="Banking"
              sub="Lithuania is a fintech hub, so you have far more options than a traditional branch account." />
            <ExpandableList items={BANKING} />
          </section>

          {/* ── 8. Student life ── */}
          <section className="ex-section">
            <SectionHead id="life" eyebrow="Section 8" title="Student life"
              sub="Organisations, events, sport, culture and the trips everyone ends up taking." />
            <Photo src={PHOTOS.studentLife} alt="Student life in Lithuania" caption="ESN sections run trips, buddy programmes and weekly events." side="right" />
            <ExpandableList items={STUDENT_LIFE} />
            <div className="ex-quotes">
              {QUOTES.map((q) => (
                <blockquote key={q.who} className="ex-quote">
                  <Quote size={16} className="ex-quote-ico" />
                  <p>{q.text}</p>
                  <cite>{q.who}</cite>
                </blockquote>
              ))}
            </div>
          </section>

          {/* ── 9. Tips ── */}
          <section className="ex-section">
            <SectionHead id="tips" eyebrow="Section 9" title="Before you move"
              sub="The practical checklist, including the things students say they wish they had known earlier." />
            <Photo src={PHOTOS.tips} alt="Lithuania in winter" caption="Winter is manageable with the right coat, the darkness needs more planning." side="left" />
            <div className="ex-col" style={{ marginBottom: 16 }}>
              {TIP_CALLOUTS.map((c) => <CalloutCard key={c.title} c={c} />)}
            </div>
            <ExpandableList items={TIPS} />
          </section>

          {/* ── Sources ── */}
          <section className="ex-section">
            <SectionHead id="sources" eyebrow="References" title="Sources"
              sub="Every organisation whose published information shaped this guide. Figures change: confirm current numbers on the official page." />
            <div className="ex-sources">
              {SOURCES.map((s) => (
                <a key={s.name} className="ex-source" href={s.url} target="_blank" rel="noopener noreferrer">
                  <span className="ex-source-name">{s.name}<ExternalLink size={12} /></span>
                  <span className="ex-source-kind">{s.kind}</span>
                </a>
              ))}
            </div>
          </section>
        </div>
      </div>

      {/* ── Moving sources bar ── */}
      <div className="ex-marquee af-marquee" aria-hidden>
        <div className="af-marquee-track ex-marquee-track">
          {[...MARQUEE_SOURCES, ...MARQUEE_SOURCES].map((n, i) => (
            <span key={i} className="ex-marquee-item">{n}<span className="ex-marquee-dot">•</span></span>
          ))}
        </div>
      </div>
    </div>
  );
}

