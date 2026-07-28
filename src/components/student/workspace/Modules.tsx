"use client";

/* Every workspace module for the Lithuania demo. One universal layout, content
   switches on the user's plan (self_service vs full_service). Realistic demo
   data comes from ./data. Presentational pieces come from ./parts. */

import { useState, useRef } from "react";
import { supabase } from "@/lib/supabase/client";
import { uploadUserFile, fileUrl } from "@/lib/storage/client";
import { useAvatarUrl, setAvatarUrl } from "@/lib/avatar";
import { removeUploadedPhoto, setUploadedPhoto } from "@/lib/avatarProfile";
import { squareCompress } from "@/lib/imagePrep";
import { downloadInvoice } from "@/lib/invoice";
import { Input, TextArea, Select, UserAvatar, Accordion, Loader, fieldIcon, iconForLabel, Pill } from "@/components/ds";
import { ENGLISH_LEVELS } from "@/lib/programs/catalog";
import { useJourneySummary } from "@/lib/useJourneySummary";
import { useNotifications, markRead, markAllRead } from "@/lib/notifications";
import {
  Route, CircleCheckBig, Clock3, FileText, Upload, Download,
  Bell, MessageCircle, ArrowRight, Plus, Check, Pencil, Mail, Phone, MapPin,
  Calendar, CreditCard, UserRound, Send, LifeBuoy, Compass,
  X, Sparkles, GraduationCap, Lock, Wallet, Ticket,
} from "lucide-react";
import { LogoMark } from "@/components/hero/OnboardingHeroPanel";
import { PAY_METHODS } from "@/lib/plans";
import { planById } from "@/lib/plans";
import type { StudyApp, AcademicInfo } from "@/lib/studyApplication";
import {
  JOURNEY, REQUIRED_DOCS, DOC_LABEL, DOC_TONE, RECENT_ACTIVITY,
  UPCOMING_TASKS, FAQ,
} from "./data";
import {
  Panel, CardTitle, StatTile, ProgressLine, EmptyState,
  BtnPrimary, BtnGhost, StatusGlyph, IconChip, CompactCard,
  SectionTitle, InlineNote,
} from "./parts";

/* The approved payment behind the user's subscription. Drives the verified
   badge, the service information card and the invoice. */
export type WsPayment = {
  id: string; method: string; amount: number; currency: string;
  createdAt: string; reviewedAt: string | null; reference: string | null;
};

export type WsProfile = {
  fullName: string | null; email: string | null; plan: string | null;
  userId: string; profileId: string; city: string | null;
  whatsapp: string | null; dob: string | null; program: string | null;
  study: StudyApp | null; academic: AcademicInfo | null;
  avatarUrl: string | null; diplomaField: string; englishLevel: string;
  /* Avatar identity: uploaded photo wins, otherwise the generated avatar. */
  gender: string | null; avatarSeed: string | null; avatarStyle: string | null; avatarType: string | null;
  /* Active paid subscription — shows the badge on the avatar everywhere. */
  verified: boolean; payment: WsPayment | null;
};

const totalTasks = JOURNEY.reduce((s, st) => s + st.tasks.length, 0);
const doneTasks = JOURNEY.reduce((s, st) => s + st.tasks.filter((t) => t.done).length, 0);
const journeyPct = Math.round((doneTasks / totalTasks) * 100);
const activeStageIdx = Math.max(0, JOURNEY.findIndex((s) => s.status === "active"));

/* ── Overview ─────────────────────────────────────────────────────────────── */
export function Overview({ profile, onNav }: { profile: WsProfile; onNav: (id: string) => void }) {
  const full = profile.plan === "full_service";
  // Live counters, shared with the Journey and Documents modules.
  const j = useJourneySummary(profile.userId, profile.plan, profile.academic?.targetDegree);
  // The student's real notifications, so the tile and the badge agree.
  const { items: notifs, unread } = useNotifications(profile.userId);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Stat row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }} className="sw-statrow">
        <StatTile label="Journey progress" value={`${j.pct}%`} accent="#3B5BDB" icon={<Route size={16} />} sub={j.stageCount ? `Stage ${j.stageIndex} of ${j.stageCount}` : "Not started"} />
        <StatTile label="Documents approved" value={`${j.docsApproved}/${j.docsTotal}`} accent="#20C997" icon={<CircleCheckBig size={16} />} sub="Verified by our team" />
        <StatTile label="Pending items" value={String(j.docsPending)} accent="#F76707" icon={<Clock3 size={16} />} sub="Awaiting you or review" />
        <StatTile label="Notifications" value={String(unread)} accent="#845EF7" icon={<Bell size={16} />} sub="Unread updates" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 16 }} className="sw-2col">
        {/* Left column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Panel>
            <CardTitle title="Your journey" sub={`${doneTasks} of ${totalTasks} steps done`} action={<BtnGhost onClick={() => onNav("journey")} style={{ height: 34 }}>Open<ArrowRight size={15} /></BtnGhost>} />
            <div style={{ display: "flex", justifyContent: "space-between", font: "600 12px/16px var(--font-sans)", color: "var(--ink-soft)", marginBottom: 7 }}>
              <span>{JOURNEY[activeStageIdx].title}</span><span>{journeyPct}%</span>
            </div>
            <ProgressLine pct={journeyPct} />
            <div style={{ display: "flex", gap: 8, marginTop: 16, flexWrap: "wrap" }}>
              {JOURNEY.map((s, i) => (
                <div key={s.key} style={{ display: "flex", alignItems: "center", gap: 7, padding: "7px 11px", borderRadius: 12, background: i === activeStageIdx ? "var(--indigo-tint)" : "var(--subtle)", border: i === activeStageIdx ? "1px solid var(--indigo-line)" : "1px solid transparent" }}>
                  <StatusGlyph status={s.status} size={15} />
                  <span style={{ font: "600 11.5px/15px var(--font-sans)", color: i === activeStageIdx ? "var(--indigo-text)" : "var(--ink-soft)" }}>{s.title}</span>
                </div>
              ))}
            </div>
          </Panel>

          <Panel>
            <CardTitle title="Upcoming tasks" sub={full ? "What our team is working on next" : "What to do next"} />
            <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
              {UPCOMING_TASKS.map((t) => (
                <div key={t.label} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 13px", borderRadius: 14, background: "var(--subtle)" }}>
                  <span style={{ width: 30, height: 30, borderRadius: 10, flex: "none", background: "#fff", color: "var(--indigo-600)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 3px 10px rgba(23,35,58,.08)" }}><Calendar size={15} /></span>
                  <div style={{ flex: 1, minWidth: 0 }}><div style={{ font: "600 13.5px/18px var(--font-sans)", color: "var(--ink)" }}>{t.label}</div><div style={{ font: "400 11.5px/16px var(--font-sans)", color: "var(--ink-faint)" }}>{t.due}</div></div>
                  <Pill tone={t.tone}>{t.due.includes("2 days") ? "Soon" : "Planned"}</Pill>
                </div>
              ))}
            </div>
          </Panel>

          <Panel>
            <CardTitle title="Recent documents" sub="Latest uploads & reviews" action={<BtnGhost onClick={() => onNav("documents")} style={{ height: 34 }}>All<ArrowRight size={15} /></BtnGhost>} />
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {REQUIRED_DOCS.slice(0, 4).map((d) => (
                <div key={d.key} style={{ display: "flex", alignItems: "center", gap: 12, padding: "9px 4px", borderBottom: "1px solid var(--line-soft)" }}>
                  <span style={{ width: 30, height: 30, borderRadius: 9, flex: "none", background: "var(--indigo-tint)", color: "var(--indigo-600)", display: "flex", alignItems: "center", justifyContent: "center" }}><FileText size={15} /></span>
                  <div style={{ flex: 1, minWidth: 0 }}><div style={{ font: "600 13px/17px var(--font-sans)", color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.name}</div><div style={{ font: "400 11px/15px var(--font-sans)", color: "var(--ink-faint)" }}>{d.updated}</div></div>
                  <Pill tone={DOC_TONE[d.status]}>{DOC_LABEL[d.status]}</Pill>
                </div>
              ))}
            </div>
          </Panel>
        </div>

        {/* Right column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Panel style={{ background: "linear-gradient(135deg, rgba(59,91,219,.14), rgba(132,94,247,.12))" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <Pill tone={full ? "indigo" : "green"}>{planById(profile.plan)?.name ?? "Your plan"}</Pill>
              <Sparkles size={16} color="var(--indigo-600)" />
            </div>
            <div style={{ font: "400 13px/20px var(--font-sans)", color: "var(--ink-soft)" }}>
              {full ? "A dedicated advisor manages your entire file. Reach them anytime from Messages." : "You drive each step and our reviewers verify every document you upload, usually within 48 hours."}
            </div>
            <div style={{ marginTop: 14 }}><BtnPrimary onClick={() => onNav("messages")} style={{ width: "100%", justifyContent: "center" }}><MessageCircle size={16} />{full ? "Message your advisor" : "Contact support"}</BtnPrimary></div>
          </Panel>

          <Panel>
            <CardTitle title="Quick actions" />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {[
                { label: "Upload document", icon: <Upload size={17} />, to: "documents" },
                { label: "View journey", icon: <Route size={17} />, to: "journey" },
                { label: "Explore Lithuania", icon: <Compass size={17} />, to: "explore" },
                { label: "Get support", icon: <LifeBuoy size={17} />, to: "support" },
              ].map((a) => (
                <CompactCard key={a.label} icon={a.icon} title={a.label} onClick={() => onNav(a.to)} />
              ))}
            </div>
          </Panel>

          <Panel>
            <CardTitle title="Recent activity" />
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {RECENT_ACTIVITY.map((a, i) => (
                <div key={i} style={{ display: "flex", gap: 11, padding: "9px 0", borderBottom: i < RECENT_ACTIVITY.length - 1 ? "1px solid var(--line-soft)" : "none" }}>
                  <span style={{ width: 8, height: 8, borderRadius: 999, flex: "none", marginTop: 6, background: "var(--indigo-600)" }} />
                  <div style={{ flex: 1, minWidth: 0 }}><div style={{ font: "500 12.5px/17px var(--font-sans)", color: "var(--ink)" }}>{a.text}</div><div style={{ font: "400 11px/15px var(--font-sans)", color: "var(--ink-faint)" }}>{a.time}</div></div>
                </div>
              ))}
            </div>
          </Panel>

          <Panel>
            <CardTitle title="Notifications" sub={`${unread} unread`} action={<BtnGhost onClick={() => onNav("notifications")} style={{ height: 34 }}>All<ArrowRight size={15} /></BtnGhost>} />
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {notifs.length === 0 ? (
                <div style={{ font: "400 12.5px/18px var(--font-sans)", color: "var(--ink-soft)", padding: "9px 0" }}>
                  Nothing yet. Updates about your journey, documents and schedule appear here.
                </div>
              ) : notifs.slice(0, 3).map((n) => (
                <div key={n.id} style={{ display: "flex", gap: 10, padding: "9px 0", borderBottom: "1px solid var(--line-soft)" }}>
                  {!n.read && <span style={{ width: 7, height: 7, borderRadius: 999, flex: "none", marginTop: 6, background: "var(--red)" }} />}
                  <div style={{ flex: 1, minWidth: 0, marginLeft: n.read ? 17 : 0 }}><div style={{ font: "600 12.5px/17px var(--font-sans)", color: "var(--ink)" }}>{n.title}</div><div style={{ font: "400 11.5px/16px var(--font-sans)", color: "var(--ink-soft)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{n.body}</div></div>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}

/* ── My Journey ───────────────────────────────────────────────────────────── */
export { JourneyRoadmap as Journey } from "./journey/JourneyRoadmap";

/* ── Documents ────────────────────────────────────────────────────────────── */
/* The module is database-driven: requirements come from Journey steps and
   uploads go to R2 through the platform gateway. It lives in its own file. */
export { Documents } from "./documents/DocumentsModule";

/** Square icon-only button, used by the small inline actions below. */
const iconBtnSt: React.CSSProperties = {
  width: 34, height: 34, borderRadius: 11, border: "1px solid var(--line)",
  background: "var(--card)", color: "var(--ink-soft)", cursor: "pointer",
  display: "flex", alignItems: "center", justifyContent: "center",
};

/* ── Explore Lithuania ────────────────────────────────────────────────────── */
export { default as Explore } from "./explore/ExploreLithuania";

/* ── Notifications ────────────────────────────────────────────────────────── */
const NOTIF_ICON: Record<string, React.ReactNode> = {
  document: <FileText size={16} />, journey: <Route size={16} />, message: <MessageCircle size={16} />,
  schedule: <Calendar size={16} />, payment: <CreditCard size={16} />, update: <Sparkles size={16} />,
  system: <Bell size={16} />,
};

/* The real notification centre: journey decisions, document verifications,
   schedule reminders and platform announcements, live. */
export function Notifications({ profile, onNav }: { profile: WsProfile; onNav?: (id: string) => void }) {
  const { items, unread, loading, reload } = useNotifications(profile.userId);

  const open = async (n: { id: string; read: boolean; link: string }) => {
    if (!n.read) { await markRead(n.id); await reload(); }
    if (n.link && onNav) onNav(n.link);
  };

  if (loading) return <Loader size={40} block label="Loading your notifications" />;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {unread > 0 && (
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <BtnGhost onClick={async () => { await markAllRead(profile.userId); await reload(); }}>
            <Check size={15} />Mark all read
          </BtnGhost>
        </div>
      )}
      <Panel style={{ padding: 8 }}>
        {items.length === 0 ? (
          <EmptyState icon={<Bell size={26} />} title="All caught up" sub="Updates about your journey, documents and schedule appear here." />
        ) : items.map((n, i) => (
          <button
            key={n.id} type="button" onClick={() => open(n)}
            style={{
              display: "flex", gap: 13, padding: "14px 12px", width: "100%", textAlign: "left",
              border: "none", cursor: n.link ? "pointer" : "default", font: "inherit",
              borderBottom: i < items.length - 1 ? "1px solid var(--line-soft)" : "none",
              background: n.read ? "transparent" : "var(--indigo-tint)", borderRadius: 12,
            }}
          >
            <span style={{ width: 38, height: 38, borderRadius: 12, flex: "none", background: "#fff", color: "var(--indigo-600)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 3px 10px rgba(23,35,58,.06)" }}>
              {NOTIF_ICON[n.kind] ?? <Bell size={16} />}
            </span>
            <span style={{ flex: 1, minWidth: 0 }}>
              <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ font: "600 13.5px/18px var(--font-sans)", color: "var(--ink)" }}>{n.title}</span>
                {!n.read && <span style={{ width: 7, height: 7, borderRadius: 999, background: "var(--red)" }} />}
              </span>
              {n.body && <span style={{ display: "block", font: "400 12.5px/18px var(--font-sans)", color: "var(--ink-soft)", marginTop: 2 }}>{n.body}</span>}
              <span style={{ display: "block", font: "400 11px/15px var(--font-sans)", color: "var(--ink-faint)", marginTop: 3 }}>
                {new Date(n.created_at).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
              </span>
            </span>
          </button>
        ))}
      </Panel>
    </div>
  );
}

/* ── Support ──────────────────────────────────────────────────────────────── */
export function Support({ onNav }: { onNav: (id: string) => void }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Floating cards with the icon repeated large in the background. */}
      <div className="sup-grid">
        {SUPPORT_CARDS.map((c) => {
          const inner = (
            <>
              <span aria-hidden className="sup-bg" style={{ color: c.color }}>{c.icon}</span>
              <span className="sup-ico" style={{ color: c.color, background: c.tint, borderColor: c.line }}>{c.icon}</span>
              <span className="sup-title">{c.title}</span>
              <span className="sup-desc">{c.desc}</span>
              <span className="sup-cta" style={{ color: c.color }}>{c.cta}<ArrowRight size={15} /></span>
            </>
          );
          return c.href
            ? <a key={c.title} className="sup-card" href={c.href} target={c.href.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer">{inner}</a>
            : <button key={c.title} type="button" className="sup-card" onClick={() => onNav(c.to!)}>{inner}</button>;
        })}
      </div>

      <section>
        <SectionTitle tone="indigo">Frequently asked questions</SectionTitle>
        <Accordion items={FAQ.map((f) => ({ question: f.q, answer: f.a }))} />
      </section>
    </div>
  );
}

// NOTE: WhatsApp number is the real support line.
const SUPPORT_CARDS: { icon: React.ReactNode; title: string; desc: string; cta: string; color: string; tint: string; line: string; to?: string; href?: string }[] = [
  { icon: <MessageCircle size={20} />, title: "Live chat", desc: "Chat with our team inside your workspace.", cta: "Open chat", color: "var(--indigo-600)", tint: "var(--indigo-tint)", line: "var(--indigo-line)", to: "messages" },
  { icon: <Ticket size={20} />, title: "Open a ticket", desc: "Send us your issue directly on WhatsApp.", cta: "WhatsApp us", color: "var(--green)", tint: "var(--green-tint)", line: "var(--green-line)", href: "https://wa.me/212632501155" },
  { icon: <Mail size={20} />, title: "Contact support", desc: "support@afaqway.com", cta: "Email us", color: "var(--amber)", tint: "var(--amber-tint)", line: "var(--amber-line)", href: "mailto:support@afaqway.com" },
];

/* ── Subscription ─────────────────────────────────────────────────────────── */
export function Subscription({ profile }: { profile: WsProfile }) {
  const [showDetails, setShowDetails] = useState(false);
  const [invoiceBusy, setInvoiceBusy] = useState(false);
  const [invoiceErr, setInvoiceErr] = useState("");
  const p = planById(profile.plan);
  const full = profile.plan === "full_service";
  const pay = profile.payment;
  const methodName = pay ? (PAY_METHODS.find((m) => m.id === pay.method)?.name ?? pay.method) : "—";
  const paidOn = pay ? new Date(pay.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—";

  async function getInvoice() {
    setInvoiceBusy(true); setInvoiceErr("");
    try { await downloadInvoice(); } catch (e) { setInvoiceErr(e instanceof Error ? e.message : "Could not generate the invoice."); }
    setInvoiceBusy(false);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }} className="sw-2col">
        {/* Current plan, in the same language as the admin payment cards:
            gradient surface, oversized plan glyph behind, badges on top. */}
        <div className="plan-card">
          <span aria-hidden className="plan-glyph"><Wallet size={190} /></span>
          <div className="plan-body">
            <div className="plan-badges">
              <Pill tone={full ? "indigo" : "green"}>{full ? "Full Service" : "Self Service"}</Pill>
              <Pill tone={profile.verified ? "green" : "amber"}>
                {profile.verified ? "Active" : "Pending"}
              </Pill>
            </div>

            <div className="plan-name">{p?.name ?? "—"}</div>
            <div className="plan-price">{p ? `${p.price.toLocaleString("en-US")} ${p.currency}` : ""}</div>
            <p className="plan-tagline">{p?.tagline}</p>

            <dl className="plan-meta">
              <div><dt>Billing</dt><dd>One-off payment</dd></div>
              <div><dt>Paid on</dt><dd>{pay ? new Date(pay.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—"}</dd></div>
              <div><dt>Method</dt><dd>{pay ? (PAY_METHODS.find((m) => m.id === pay.method)?.name ?? pay.method) : "—"}</dd></div>
              <div><dt>Expires</dt><dd>No expiry</dd></div>
            </dl>

            <div className="plan-acts">
              <BtnPrimary onClick={() => setShowDetails((v) => !v)}><CreditCard size={16} />{showDetails ? "Hide plan details" : "View plan details"}</BtnPrimary>
              {pay && (
                <BtnGhost tone="blue" onClick={getInvoice} disabled={invoiceBusy}><Download size={16} />{invoiceBusy ? "Preparing…" : "Download Invoice"}</BtnGhost>
              )}
            </div>
            {invoiceErr && <InlineNote tone="red">{invoiceErr}</InlineNote>}
          </div>
        </div>

        {/* Service information — the decorative logo sits behind the content. */}
        <Panel style={{ position: "relative", overflow: "hidden" }}>
          <span aria-hidden style={{ position: "absolute", right: -26, bottom: -34, opacity: 0.06, pointerEvents: "none", lineHeight: 0 }}><LogoMark size={210} /></span>
          <div style={{ position: "relative" }}>
            <SectionTitle tone="indigo" sub="Your subscription and how you paid for it">Service Information</SectionTitle>
            <div style={{ display: "flex", flexDirection: "column" }}>
              {[
                ["Status", "Active"],
                ["Billing", "One-time payment"],
                ["Destination", profile.study?.country ?? "Lithuania"],
                ["Payment method", methodName],
                ["Amount paid", pay ? `${pay.amount.toLocaleString("en-US")} ${pay.currency}` : "—"],
                ["Paid on", paidOn],
                ["Next invoice", "None"],
              ].map(([k, v]) => (
                <div key={k} style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "11px 0", borderBottom: "1px solid var(--line-soft)", font: "500 13px/18px var(--font-sans)", color: "var(--ink)" }}><span style={{ color: "var(--ink-soft)" }}>{k}</span><b>{v}</b></div>
              ))}
            </div>
            {pay && (
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 14 }}>
                <IconChip tone="green" size={34}><Wallet size={17} /></IconChip>
                <div style={{ minWidth: 0 }}>
                  <div style={{ font: "400 11px/15px var(--font-sans)", color: "var(--ink-faint)" }}>Payment reference</div>
                  <div style={{ font: "600 13px/18px var(--font-sans)", color: "var(--ink)" }}>{pay.reference ?? pay.id.slice(0, 8).toUpperCase()}</div>
                </div>
              </div>
            )}
          </div>
        </Panel>
      </div>
      {showDetails && p && (
        <Panel>
          <CardTitle title="What's included" sub={p.name} />
          <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }} className="sw-2col">
            {p.features.map((f, i) => (
              <li key={i} style={{ display: "flex", gap: 10, font: "400 13px/19px var(--font-sans)", color: "var(--ink)" }}>
                <span style={{ flex: "none", width: 20, height: 20, borderRadius: 999, background: "var(--indigo-tint)", color: "var(--indigo-600)", display: "flex", alignItems: "center", justifyContent: "center", marginTop: 1 }}><Check size={12} /></span>{f}
              </li>
            ))}
          </ul>
        </Panel>
      )}
    </div>
  );
}

/* ── Profile (read-only) ──────────────────────────────────────────────────── */
export function Profile({ profile, onNav }: { profile: WsProfile; onNav: (id: string) => void }) {
  const avatarUrl = useAvatarUrl(profile.avatarUrl);
  const rows = [
    { label: "Full name", value: profile.fullName || "—", icon: <UserRound size={15} /> },
    { label: "Email", value: profile.email || "—", icon: <Mail size={15} /> },
    { label: "WhatsApp", value: profile.whatsapp || "—", icon: <Phone size={15} /> },
    { label: "City", value: profile.city || "—", icon: <MapPin size={15} /> },
    { label: "Date of birth", value: profile.dob || "—", icon: <Calendar size={15} /> },
    { label: "Destination", value: "Lithuania", icon: <Compass size={15} /> },
  ];
  const st = profile.study ?? { program: "—", tuition: "—", city: "—", country: "Lithuania", language: "English", university: "—" };
  const ac = profile.academic ?? { lastDegree: "—", field: "—", year: "—", grade: "—", target: "—", targetDegree: "", englishLevel: "—", test: "—" };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <Panel>
        <div style={{ display: "flex", alignItems: "center", gap: 16, paddingBottom: 18, borderBottom: "1px solid var(--line-soft)", marginBottom: 6 }}>
          <UserAvatar size={64} user={{ id: profile.userId, name: profile.fullName, avatarUrl, gender: profile.gender, avatarSeed: profile.avatarSeed, avatarStyle: profile.avatarStyle, verified: profile.verified }} />
          <div style={{ minWidth: 0 }}>
            <div style={{ font: "800 20px/26px var(--font-sans)", color: "var(--ink)" }}>{profile.fullName || "Student"}</div>
            <div style={{ font: "500 12.5px/18px var(--font-sans)", color: "var(--ink-soft)" }}>ID {profile.profileId} · {planById(profile.plan)?.name ?? "—"}</div>
          </div>
          <BtnGhost tone="blue" style={{ marginLeft: "auto" }} onClick={() => onNav("settings")}><Pencil size={15} />Edit</BtnGhost>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2px 26px" }} className="sw-2col">
          {rows.map((r) => (
            <div key={r.label} style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 0", borderBottom: "1px solid var(--line-soft)" }}>
              <span style={{ width: 32, height: 32, borderRadius: 10, flex: "none", background: "var(--subtle)", color: "var(--indigo-600)", display: "flex", alignItems: "center", justifyContent: "center" }}>{r.icon}</span>
              <div style={{ minWidth: 0 }}><div style={{ font: "400 11px/15px var(--font-sans)", color: "var(--ink-faint)" }}>{r.label}</div><div style={{ font: "600 13.5px/19px var(--font-sans)", color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.value}</div></div>
            </div>
          ))}
        </div>
        <InlineNote>These details come from your onboarding. To change them, use Settings.</InlineNote>
      </Panel>

      {/* Personal Academic Information — sits above Study Application (always shown) */}
      <Panel>
        <SectionTitle tone="green" sub="Your previous diploma and English background, from onboarding">Personal Information</SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 26px" }} className="sw-2col">
          <InfoRow label="Last diploma" value={ac.lastDegree} />
          <InfoRow label="Field of study" value={ac.field} />
          <InfoRow label="Year of last degree" value={ac.year} />
          <InfoRow label="Grade" value={ac.grade} />
          <InfoRow label="Target degree" value={ac.target} />
          <InfoRow label="English level" value={ac.englishLevel} />
          <InfoRow label="English test" value={ac.test} />
        </div>
      </Panel>

      {/* Study Application — locked; changes go to the admin as a request (always shown) */}
      <Panel>
        <SectionTitle tone="purple" sub="Set from your application, locked">Study Application</SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 26px" }} className="sw-2col">
          <InfoRow label="Program Name" value={st.program} icon={<GraduationCap size={15} />} iconTone="blue" />
          <InfoRow label="Tuition Fees" value={st.tuition} />
          <InfoRow label="City" value={st.city} />
          <InfoRow label="Country" value={st.country} />
          <InfoRow label="Program Language" value={st.language} />
          <InfoRow label="University Name" value={st.university} />
        </div>
        <InlineNote icon={<Lock size={14} />}>These fields are locked. To change any of them, submit a change request in Settings and our team will review it.</InlineNote>
      </Panel>
    </div>
  );
}

function InfoRow({ label, value, icon, iconTone }: { label: string; value: string; icon?: React.ReactNode; iconTone?: "blue" | "amber" | "green" | "red" }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 0", borderBottom: "1px solid var(--line-soft)" }}>
      {icon && (iconTone
        ? <IconChip tone={iconTone}>{icon}</IconChip>
        : <span style={{ width: 32, height: 32, borderRadius: 10, flex: "none", background: "var(--subtle)", color: "var(--indigo-600)", display: "flex", alignItems: "center", justifyContent: "center" }}>{icon}</span>)}
      <div style={{ minWidth: 0 }}>
        <div style={{ font: "400 11px/15px var(--font-sans)", color: "var(--ink-faint)" }}>{label}</div>
        <div style={{ font: "600 13.5px/19px var(--font-sans)", color: "var(--ink)" }}>{value}</div>
      </div>
    </div>
  );
}

/* ── Settings (fully interactive: real saves + avatar upload to R2) ─────────── */
export function Settings({ profile, onProgramRequest, onReload }: { profile: WsProfile; onProgramRequest: (r: { program: string; university: string; reason: string }) => Promise<boolean>; onReload: () => Promise<void> }) {
  const [name, setName] = useState(profile.fullName ?? "");
  const [city, setCity] = useState(profile.city ?? "");
  const [whatsapp, setWhatsapp] = useState(profile.whatsapp ?? "");
  const [diploma, setDiploma] = useState(profile.diplomaField ?? "");
  const [english, setEnglish] = useState(profile.englishLevel ?? "");
  const [savedKey, setSavedKey] = useState("");
  const [busy, setBusy] = useState("");
  const [uploading, setUploading] = useState(false);
  const photoRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState(0);
  const seed = profile.avatarSeed;
  const avatarUrl = useAvatarUrl(profile.avatarUrl);

  const flash = (k: string) => { setSavedKey(k); setTimeout(() => setSavedKey(""), 2200); };

  async function savePersonal() {
    setBusy("personal");
    await supabase.from("profiles").update({ full_name: name.trim(), city: city.trim() }).eq("id", profile.userId);
    setBusy(""); flash("personal"); await onReload();
  }
  async function saveContact() {
    setBusy("contact");
    await supabase.from("profiles").update({ whatsapp_number: whatsapp.replace(/[^\d]/g, "") }).eq("id", profile.userId);
    setBusy(""); flash("contact"); await onReload();
  }
  async function saveAcademic() {
    setBusy("academic");
    const { data } = await supabase.from("profiles").select("country_flow_answers").eq("id", profile.userId).maybeSingle();
    const cfa = ((data?.country_flow_answers as Record<string, unknown>) ?? {});
    cfa.timing_education = { ...((cfa.timing_education as object) ?? {}), last_degree_field: diploma.trim() };
    cfa.program_setup = { ...((cfa.program_setup as object) ?? {}), english_level: english };
    await supabase.from("profiles").update({ country_flow_answers: cfa }).eq("id", profile.userId);
    setBusy(""); flash("academic"); await onReload();
  }
  async function removePhoto() {
    await removeUploadedPhoto(profile.userId);
    setAvatarUrl(null);
    await onReload();
  }

  /* Upload a picture from the device: crop to a square, compress, store, then
     publish it platform-wide before the profile reload finishes so every
     avatar on screen changes at once. */
  async function uploadPhoto(file: File) {
    setUploading(true); setProgress(15);
    try {
      const prepared = await squareCompress(file);
      setProgress(45);
      const { path } = await uploadUserFile(prepared, { folder: "avatars" });
      setProgress(80);
      await setUploadedPhoto(profile.userId, path);
      setAvatarUrl(await fileUrl(path, "avatars", undefined, 86400));
      await onReload();
      setProgress(100);
    } catch (err) {
      console.warn("profile picture not saved", err);
    } finally {
      setUploading(false); setProgress(0);
    }
  }
  const SavedTag = ({ k }: { k: string }) => savedKey === k ? <span style={{ display: "inline-flex", alignItems: "center", gap: 6, font: "600 12.5px/1 var(--font-sans)", color: "var(--green)" }}><Check size={15} />Saved</span> : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Profile picture: uploaded photo, or the generated avatar. */}
      <Panel>
        <SectionTitle tone="blue" sub="Your photo replaces the generated avatar everywhere on the platform">Profile Information</SectionTitle>
        <div style={{ display: "flex", alignItems: "center", gap: 18, flexWrap: "wrap" }}>
          <UserAvatar size={96} user={{ id: profile.userId, name: profile.fullName, avatarUrl, gender: profile.gender, avatarSeed: seed, avatarStyle: profile.avatarStyle, verified: profile.verified }} />
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {/* Upload only: a photo from the device, or remove the one there. */}
              <input
                ref={photoRef} type="file" accept="image/png,image/jpeg,image/webp" style={{ display: "none" }}
                onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) void uploadPhoto(f); }}
              />
              <BtnPrimary onClick={() => photoRef.current?.click()} disabled={uploading}>
                <Upload size={16} />{uploading ? `Uploading ${progress}%` : "Change Profile Picture"}
              </BtnPrimary>
              {avatarUrl && (
                <BtnGhost tone="red" onClick={removePhoto} disabled={uploading}>
                  <X size={15} />Remove photo
                </BtnGhost>
              )}
            </div>
            {uploading && (
              <span style={{ display: "block", height: 6, borderRadius: 999, background: "var(--subtle)", overflow: "hidden", maxWidth: 260 }}>
                <span style={{ display: "block", height: "100%", width: `${progress}%`, background: "var(--indigo-600)", borderRadius: 999, transition: "width 200ms var(--ease)" }} />
              </span>
            )}
            <div style={{ font: "400 11.5px/16px var(--font-sans)", color: "var(--ink-faint)" }}>
              PNG, JPG or WEBP. Images are cropped square and compressed before upload.
            </div>
          </div>
        </div>
      </Panel>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }} className="sw-2col">
        <Panel>
          <SectionTitle tone="green">Personal Information</SectionTitle>
          <Field label="Full name" value={name} onChange={setName} />
          <Field label="City" value={city} onChange={setCity} />
          <div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 12 }}>
            <BtnPrimary onClick={savePersonal} disabled={busy === "personal"}>Save changes</BtnPrimary>
            <SavedTag k="personal" />
          </div>
        </Panel>
        <Panel>
          <SectionTitle tone="orange">Emergency Contact</SectionTitle>
          <Field label="Email (read-only)" value={profile.email ?? ""} onChange={() => {}} readOnly />
          <Field label="WhatsApp" value={whatsapp} onChange={setWhatsapp} />
          <div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 12 }}>
            <BtnPrimary onClick={saveContact} disabled={busy === "contact"}>Save contact info</BtnPrimary>
            <SavedTag k="contact" />
          </div>
        </Panel>
      </div>

      {/* Academic info — the only academic fields the student may change (task 1) */}
      <Panel>
        <SectionTitle tone="indigo" sub="Update your previous field of study and your English level">Settings</SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 26px" }} className="sw-2col">
          <Field label="Field of study (previous diploma)" value={diploma} onChange={setDiploma} placeholder="e.g. Economics" />
          <Select
            label="English level" value={english} onChange={setEnglish} icon={fieldIcon("language")} placeholder="Choose a level"
            options={ENGLISH_LEVELS.map((o) => ({ value: o.value, label: o.label }))}
            containerStyle={{ marginBottom: 12 }}
          />
        </div>
        <div style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 12 }}>
          <BtnPrimary onClick={saveAcademic} disabled={busy === "academic"}>Save academic info</BtnPrimary>
          <SavedTag k="academic" />
        </div>
      </Panel>

      <Panel>
        <SectionTitle tone="blue" sub="Set by our team, based on your profile and requests">Program</SectionTitle>
        {profile.program ? (
          <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 22, background: "var(--indigo-tint)", border: "1px solid var(--indigo-line)" }}>
            <span style={{ width: 38, height: 38, borderRadius: 999, flex: "none", background: "var(--indigo-tint)", color: "var(--indigo-600)", border: "1px solid var(--indigo-line)", display: "flex", alignItems: "center", justifyContent: "center" }}><GraduationCap size={19} /></span>
            <div style={{ font: "600 13.5px/19px var(--font-sans)", color: "var(--ink)" }}>{profile.program}</div>
          </div>
        ) : (
          <div style={{ font: "400 13px/19px var(--font-sans)", color: "var(--ink-soft)" }}>No program assigned yet. Once our team sets your program it appears here.</div>
        )}
      </Panel>
      <ProgramChangeCard onProgramRequest={onProgramRequest} />
    </div>
  );
}

function ProgramChangeCard({ onProgramRequest }: { onProgramRequest: (r: { program: string; university: string; reason: string }) => Promise<boolean> }) {
  const [open, setOpen] = useState(false);
  const [program, setProgram] = useState("");
  const [university, setUniversity] = useState("");
  const [reason, setReason] = useState("");
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const valid = program.trim().length > 1 && reason.trim().length > 3;
  async function submit() {
    setSending(true);
    await onProgramRequest({ program: program.trim(), university: university.trim(), reason: reason.trim() });
    setSending(false); setDone(true);
    setProgram(""); setUniversity(""); setReason("");
    setTimeout(() => { setDone(false); setOpen(false); }, 2600);
  }
  return (
    <Panel style={{ border: open ? "1px solid var(--indigo-line)" : undefined }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ font: "700 15px/20px var(--font-sans)", color: "var(--ink)" }}>Request a program change</div>
          <div style={{ font: "400 12.5px/18px var(--font-sans)", color: "var(--ink-soft)" }}>Ask our team to switch you to a different program. We review and update your file.</div>
        </div>
        {!open && <BtnGhost tone="red" onClick={() => setOpen(true)}><Plus size={15} />New request</BtnGhost>}
        {open && <button type="button" onClick={() => setOpen(false)} aria-label="Close" style={{ ...iconBtnSt, flex: "none" }}><X size={16} /></button>}
      </div>
      {open && (
        <div style={{ marginTop: 16, background: "var(--subtle)", borderRadius: 16, padding: 16 }}>
          {done ? (
            <div style={{ display: "flex", alignItems: "center", gap: 10, font: "600 13.5px/19px var(--font-sans)", color: "var(--green)", padding: "10px 0" }}><Check size={18} />Request sent to our team. We'll follow up in Messages.</div>
          ) : (
            <>
              <Field label="New program name *" value={program} onChange={setProgram} placeholder="e.g. BSc Software Engineering" />
              <Field label="University (optional)" value={university} onChange={setUniversity} placeholder="Leave empty if not sure" />
              <Field label="Reason *" value={reason} onChange={setReason} textarea placeholder="Tell us why you'd like to change" />
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 6 }}>
                <BtnPrimary onClick={submit} disabled={!valid || sending}><Send size={15} />{sending ? "Sending…" : "Send request"}</BtnPrimary>
                <span style={{ font: "400 11.5px/16px var(--font-sans)", color: "var(--ink-faint)" }}>Sent to admin as a report.</span>
              </div>
            </>
          )}
        </div>
      )}
    </Panel>
  );
}

/* Thin adapter so this module's value/onChange call sites keep working while
   rendering the platform Input / TextArea. */
function Field({ label, value, onChange, readOnly, textarea, placeholder, icon }: { label: string; value: string; onChange: (v: string) => void; readOnly?: boolean; textarea?: boolean; placeholder?: string; icon?: React.ReactNode }) {
  const common = { label, value, placeholder, readOnly, icon: icon ?? iconForLabel(label), containerStyle: { marginBottom: 12 } };
  return textarea
    ? <TextArea {...common} rows={3} onChange={(e) => onChange(e.target.value)} />
    : <Input {...common} onChange={(e) => onChange(e.target.value)} />;
}
