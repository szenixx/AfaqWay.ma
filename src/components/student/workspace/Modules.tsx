"use client";

/* Every workspace module for the Lithuania demo. One universal layout, content
   switches on the user's plan (self_service vs full_service). Realistic demo
   data comes from ./data. Presentational pieces come from ./parts. */

import { useState, useRef } from "react";
import { supabase } from "@/lib/supabase/client";
import { uploadUserFile, fileUrl } from "@/lib/storage/client";
import { useAvatarUrl, setAvatarUrl } from "@/lib/avatar";
import { downloadInvoice } from "@/lib/invoice";
import { Input, TextArea, Select, fieldIcon, iconForLabel } from "@/components/ds";
import { ENGLISH_LEVELS } from "@/lib/programs/catalog";
import {
  Route, CircleCheckBig, Clock3, FileText, Upload, Download,
  Bell, MessageCircle, ArrowRight, Plus, Check, Pencil, Mail, Phone, MapPin,
  Calendar, CreditCard, UserRound, ChevronRight, Send, LifeBuoy, Compass,
  TriangleAlert, X, Sparkles, GraduationCap, Info, Lock, Wallet,
} from "lucide-react";
import { LogoMark } from "@/components/hero/OnboardingHeroPanel";
import { PAY_METHODS } from "@/lib/plans";
import { planById } from "@/lib/plans";
import type { StudyApp, AcademicInfo } from "@/lib/studyApplication";
import {
  JOURNEY, REQUIRED_DOCS, DOC_LABEL, DOC_TONE, NOTIFICATIONS, RECENT_ACTIVITY,
  UPCOMING_TASKS, FAQ, type DocStatus,
} from "./data";
import {
  Panel, CardTitle, StatTile, ProgressLine, Pill, EmptyState,
  BtnPrimary, BtnGhost, StatusGlyph, DefaultAvatar, InfoNotice, IconChip, CompactCard,
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
  const approved = REQUIRED_DOCS.filter((d) => d.status === "approved").length;
  const pending = REQUIRED_DOCS.filter((d) => d.status === "pending" || d.status === "under_review").length;
  const unread = NOTIFICATIONS.filter((n) => !n.read).length;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Stat row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }} className="sw-statrow">
        <StatTile label="Journey progress" value={`${journeyPct}%`} accent="#3B5BDB" icon={<Route size={16} />} sub={`Stage ${activeStageIdx + 1} of ${JOURNEY.length}`} />
        <StatTile label="Documents approved" value={`${approved}/${REQUIRED_DOCS.length}`} accent="#20C997" icon={<CircleCheckBig size={16} />} sub="Verified by our team" />
        <StatTile label="Pending items" value={String(pending)} accent="#F76707" icon={<Clock3 size={16} />} sub="Awaiting you or review" />
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
                  <Pill tone={t.tone} text={t.due.includes("2 days") ? "Soon" : "Planned"} />
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
                  <Pill tone={DOC_TONE[d.status]} text={DOC_LABEL[d.status]} />
                </div>
              ))}
            </div>
          </Panel>
        </div>

        {/* Right column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Panel style={{ background: "linear-gradient(135deg, rgba(59,91,219,.14), rgba(132,94,247,.12))" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <span className={full ? "pill pill-indigo" : "pill pill-green"}>{planById(profile.plan)?.name ?? "Your plan"}</span>
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
              {NOTIFICATIONS.slice(0, 3).map((n) => (
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
export function Journey({ profile }: { profile: WsProfile }) {
  const full = profile.plan === "full_service";
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <Panel>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <span style={{ font: "700 14px/18px var(--font-sans)", color: "var(--ink)" }}>Overall progress</span>
          <span style={{ font: "700 14px/18px var(--font-sans)", color: "var(--indigo-600)" }}>{journeyPct}%</span>
        </div>
        <ProgressLine pct={journeyPct} height={10} />
      </Panel>

      <div style={{ position: "relative" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {JOURNEY.map((s, i) => {
            const locked = s.status === "locked";
            const tone = s.status === "done" ? "green" : s.status === "active" ? "amber" : "grey";
            const label = s.status === "done" ? "Completed" : s.status === "active" ? (full ? "In progress" : "In progress") : locked ? "Locked" : "Not started";
            return (
              <Panel key={s.key} style={locked ? { opacity: 0.72 } : undefined}>
                <div style={{ display: "flex", gap: 14 }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: "none" }}>
                    <span style={{ width: 40, height: 40, borderRadius: 999, display: "flex", alignItems: "center", justifyContent: "center", font: "700 15px/1 var(--font-sans)", background: s.status === "active" ? "var(--indigo-600)" : s.status === "done" ? "var(--green)" : "var(--subtle)", color: s.status === "active" || s.status === "done" ? "#fff" : "var(--ink-faint)" }}>{i + 1}</span>
                    {i < JOURNEY.length - 1 && <span style={{ width: 2, flex: 1, minHeight: 18, background: "var(--line)", marginTop: 4 }} />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0, paddingBottom: 2 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                      <span style={{ font: "700 16px/22px var(--font-sans)", color: "var(--ink)" }}>{s.title}</span>
                      <Pill tone={tone} text={label} />
                      <span style={{ font: "400 11.5px/16px var(--font-sans)", color: "var(--ink-faint)", marginLeft: "auto" }}>{s.eta}</span>
                    </div>
                    <p style={{ font: "400 13px/20px var(--font-sans)", color: "var(--ink-soft)", margin: "6px 0 0" }}>{full ? s.desc.full : s.desc.self}</p>
                    {!locked && (
                      <div style={{ display: "flex", flexDirection: "column", gap: 7, marginTop: 12 }}>
                        {s.tasks.map((t) => (
                          <div key={t.label} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <span style={{ width: 20, height: 20, borderRadius: 7, flex: "none", display: "flex", alignItems: "center", justifyContent: "center", background: t.done ? "var(--green)" : "var(--subtle)", color: t.done ? "#fff" : "transparent", border: t.done ? "none" : "1px solid var(--line)" }}><Check size={13} /></span>
                            <span style={{ font: "500 13px/18px var(--font-sans)", color: t.done ? "var(--ink-faint)" : "var(--ink)", textDecoration: t.done ? "line-through" : "none" }}>{t.label}</span>
                            {full && !t.done && <span style={{ font: "400 11px/15px var(--font-sans)", color: "var(--indigo-600)", marginLeft: "auto" }}>Advisor handling</span>}
                          </div>
                        ))}
                      </div>
                    )}
                    {locked && <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12, font: "600 12px/16px var(--font-sans)", color: "var(--ink-faint)" }}><StatusGlyph status="locked" size={15} />Unlocks after your residence permit is approved</div>}
                  </div>
                </div>
              </Panel>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ── Documents ────────────────────────────────────────────────────────────── */
export function Documents({ profile }: { profile: WsProfile }) {
  const full = profile.plan === "full_service";
  const [filter, setFilter] = useState<"all" | DocStatus>("all");
  const filters: { id: "all" | DocStatus; label: string }[] = [
    { id: "all", label: "All" }, { id: "approved", label: "Approved" },
    { id: "under_review", label: "Under review" }, { id: "needs_changes", label: "Needs changes" }, { id: "pending", label: "Pending" },
  ];
  const rows = REQUIRED_DOCS.filter((d) => filter === "all" || d.status === filter);
  const approved = REQUIRED_DOCS.filter((d) => d.status === "approved").length;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }} className="sw-statrow">
        <StatTile label="Approved" value={String(approved)} accent="#20C997" icon={<CircleCheckBig size={16} />} />
        <StatTile label="Under review" value={String(REQUIRED_DOCS.filter((d) => d.status === "under_review").length)} accent="#F76707" icon={<Clock3 size={16} />} />
        <StatTile label="Needs changes" value={String(REQUIRED_DOCS.filter((d) => d.status === "needs_changes").length)} accent="#F03E3E" icon={<TriangleAlert size={16} />} />
        <StatTile label="Pending" value={String(REQUIRED_DOCS.filter((d) => d.status === "pending").length)} accent="#868E96" icon={<FileText size={16} />} />
      </div>

      <Panel>
        <div style={{ display: "flex", gap: 10, alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" }}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {filters.map((f) => (
              <button key={f.id} type="button" onClick={() => setFilter(f.id)} style={{ height: 34, padding: "0 14px", borderRadius: 12, border: "1px solid var(--line)", cursor: "pointer", font: "600 12.5px/1 var(--font-sans)", background: filter === f.id ? "var(--indigo-600)" : "rgba(255,255,255,.6)", color: filter === f.id ? "#fff" : "var(--ink-soft)" }}>{f.label}</button>
            ))}
          </div>
          <BtnPrimary style={{ height: 38 }}><Upload size={16} />Upload document</BtnPrimary>
        </div>
      </Panel>

      <Panel style={{ padding: 8 }}>
        {rows.length === 0 ? <EmptyState icon={<FileText size={26} />} title="Nothing here" sub="No documents match this filter." /> : rows.map((d, i) => (
          <div key={d.key} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 12px", borderBottom: i < rows.length - 1 ? "1px solid var(--line-soft)" : "none" }}>
            <span style={{ width: 42, height: 42, borderRadius: 13, flex: "none", background: "var(--indigo-tint)", color: "var(--indigo-600)", display: "flex", alignItems: "center", justifyContent: "center" }}><FileText size={19} /></span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ font: "600 14px/19px var(--font-sans)", color: "var(--ink)" }}>{d.name}</div>
              <div style={{ font: "400 12px/16px var(--font-sans)", color: "var(--ink-faint)" }}>{d.desc} · Updated {d.updated}</div>
            </div>
            <Pill tone={DOC_TONE[d.status]} text={DOC_LABEL[d.status]} />
            <div style={{ display: "flex", gap: 6, flex: "none" }}>
              {(d.status === "pending" || d.status === "needs_changes") ? (
                <button type="button" title="Upload" style={iconBtnSt}><Upload size={16} /></button>
              ) : (
                <button type="button" title="Download" style={iconBtnSt}><Download size={16} /></button>
              )}
            </div>
          </div>
        ))}
      </Panel>
    </div>
  );
}
const iconBtnSt: React.CSSProperties = { width: 36, height: 36, borderRadius: 11, border: "1px solid var(--line)", background: "rgba(255,255,255,.7)", color: "var(--ink-soft)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" };

/* ── Explore Lithuania ────────────────────────────────────────────────────── */
export { default as Explore } from "./explore/ExploreLithuania";

/* ── Notifications ────────────────────────────────────────────────────────── */
const NOTIF_ICON = { doc: <FileText size={16} />, journey: <Route size={16} />, message: <MessageCircle size={16} />, deadline: <Calendar size={16} />, system: <Bell size={16} /> };
export function Notifications() {
  const [items, setItems] = useState(NOTIFICATIONS);
  const unread = items.filter((n) => !n.read).length;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {unread > 0 && (
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <BtnGhost onClick={() => setItems((xs) => xs.map((n) => ({ ...n, read: true })))}><Check size={15} />Mark all read</BtnGhost>
        </div>
      )}
      <Panel style={{ padding: 8 }}>
        {items.length === 0 ? <EmptyState icon={<Bell size={26} />} title="All caught up" /> : items.map((n, i) => (
          <div key={n.id} style={{ display: "flex", gap: 13, padding: "14px 12px", borderBottom: i < items.length - 1 ? "1px solid var(--line-soft)" : "none", background: n.read ? "transparent" : "var(--indigo-tint)", borderRadius: 12 }}>
            <span style={{ width: 38, height: 38, borderRadius: 12, flex: "none", background: "#fff", color: "var(--indigo-600)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 3px 10px rgba(23,35,58,.06)" }}>{NOTIF_ICON[n.kind]}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}><span style={{ font: "600 13.5px/18px var(--font-sans)", color: "var(--ink)" }}>{n.title}</span>{!n.read && <span style={{ width: 7, height: 7, borderRadius: 999, background: "var(--red)" }} />}</div>
              <div style={{ font: "400 12.5px/18px var(--font-sans)", color: "var(--ink-soft)", marginTop: 2 }}>{n.body}</div>
              <div style={{ font: "400 11px/15px var(--font-sans)", color: "var(--ink-faint)", marginTop: 3 }}>{n.time}</div>
            </div>
          </div>
        ))}
      </Panel>
    </div>
  );
}

/* ── Support ──────────────────────────────────────────────────────────────── */
export function Support({ onNav }: { onNav: (id: string) => void }) {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }} className="sw-explore">
        {SUPPORT_CARDS.map((c) => {
          const inner = (
            <>
              <span style={{ width: 46, height: 46, borderRadius: 14, background: "#fff", color: c.color, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12, boxShadow: "0 3px 10px rgba(23,35,58,.06)" }}>{c.icon}</span>
              <div style={{ font: "700 15px/20px var(--font-sans)", color: "var(--ink)" }}>{c.title}</div>
              <div style={{ font: "400 12.5px/18px var(--font-sans)", color: "var(--ink-soft)", margin: "4px 0 14px" }}>{c.desc}</div>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 7, font: "600 13px/1 var(--font-sans)", color: c.color }}>{c.cta}<ArrowRight size={15} /></span>
            </>
          );
          const cardStyle: React.CSSProperties = { display: "block", textAlign: "left", padding: 18, borderRadius: 20, background: c.tint, border: `1px solid ${c.line}`, cursor: "pointer", textDecoration: "none" };
          return c.href
            ? <a key={c.title} href={c.href} target={c.href.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer" style={cardStyle}>{inner}</a>
            : <button key={c.title} type="button" onClick={() => onNav(c.to!)} style={{ ...cardStyle, width: "100%", font: "inherit" }}>{inner}</button>;
        })}
      </div>

      {/* FAQ — no card background, just a thin divider above it */}
      <div style={{ borderTop: "1px solid var(--line)", paddingTop: 18, marginTop: 4 }}>
        <div style={{ font: "700 15px/20px var(--font-sans)", color: "var(--ink)", marginBottom: 14 }}>Frequently asked questions</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {FAQ.map((f, i) => {
            const isOpen = openFaq === i;
            return (
              <div key={i} style={{ borderRadius: 14, background: "var(--subtle)", overflow: "hidden" }}>
                <button type="button" onClick={() => setOpenFaq(isOpen ? null : i)} style={{ all: "unset", cursor: "pointer", display: "flex", alignItems: "center", gap: 10, width: "100%", boxSizing: "border-box", padding: "13px 15px" }}>
                  <span style={{ flex: 1, font: "600 13.5px/19px var(--font-sans)", color: "var(--ink)" }}>{f.q}</span>
                  <ChevronRight size={17} color="var(--ink-faint)" style={{ transform: isOpen ? "rotate(90deg)" : "none", transition: "transform 160ms" }} />
                </button>
                {isOpen && <div style={{ padding: "0 15px 14px", font: "400 13px/20px var(--font-sans)", color: "var(--ink-soft)" }}>{f.a}</div>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// NOTE: WhatsApp number is the real support line.
const SUPPORT_CARDS: { icon: React.ReactNode; title: string; desc: string; cta: string; color: string; tint: string; line: string; to?: string; href?: string }[] = [
  { icon: <MessageCircle size={20} />, title: "Live chat", desc: "Chat with our team inside your workspace.", cta: "Open chat", color: "var(--indigo-600)", tint: "var(--indigo-tint)", line: "var(--indigo-line)", to: "messages" },
  { icon: <Plus size={20} />, title: "Open a ticket", desc: "Send us your issue directly on WhatsApp.", cta: "WhatsApp us", color: "var(--green)", tint: "var(--green-tint)", line: "var(--green-line)", href: "https://wa.me/212632501155" },
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
        <Panel style={{ background: "linear-gradient(135deg, rgba(59,91,219,.14), rgba(132,94,247,.12))" }}>
          <span className={full ? "pill pill-indigo" : "pill pill-green"}>Current plan</span>
          <div style={{ font: "800 26px/32px var(--font-sans)", color: "var(--ink)", margin: "12px 0 2px", letterSpacing: "-.3px" }}>{p?.name ?? "—"}</div>
          <div style={{ font: "600 15px/22px var(--font-sans)", color: "var(--indigo-600)" }}>{p ? `${p.price.toLocaleString("en-US")} ${p.currency}` : ""}</div>
          <div style={{ font: "400 13px/19px var(--font-sans)", color: "var(--ink-soft)", marginTop: 8 }}>{p?.tagline}</div>
          <div style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <BtnPrimary onClick={() => setShowDetails((v) => !v)}><CreditCard size={16} />{showDetails ? "Hide plan details" : "View plan details"}</BtnPrimary>
            {pay && (
              <BtnGhost tone="blue" onClick={getInvoice} disabled={invoiceBusy}><Download size={16} />{invoiceBusy ? "Preparing…" : "Download Invoice"}</BtnGhost>
            )}
          </div>
          {invoiceErr && <div style={{ font: "500 12px/17px var(--font-sans)", color: "var(--red)", marginTop: 8 }}>{invoiceErr}</div>}
        </Panel>

        {/* Service information — the decorative logo sits behind the content. */}
        <Panel style={{ position: "relative", overflow: "hidden" }}>
          <span aria-hidden style={{ position: "absolute", right: -26, bottom: -34, opacity: 0.06, pointerEvents: "none", lineHeight: 0 }}><LogoMark size={210} /></span>
          <div style={{ position: "relative" }}>
            <CardTitle title="Service information" sub="Your subscription and how you paid for it" />
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
  const ac = profile.academic ?? { lastDegree: "—", field: "—", year: "—", grade: "—", target: "—", englishLevel: "—", test: "—" };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <Panel>
        <div style={{ display: "flex", alignItems: "center", gap: 16, paddingBottom: 18, borderBottom: "1px solid var(--line-soft)", marginBottom: 6 }}>
          <DefaultAvatar size={68} src={avatarUrl} verified={profile.verified} />
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
        <InfoNotice icon={<Info size={16} />} style={{ marginTop: 14 }}>These details come from your onboarding. To change them, use Settings.</InfoNotice>
      </Panel>

      {/* Personal Academic Information — sits above Study Application (always shown) */}
      <Panel>
        <CardTitle title="Personal Academic Information" sub="Your previous diploma and English background, from onboarding" />
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
        <CardTitle title="Study Application" sub="Set from your application — locked" action={<BtnGhost tone="red" onClick={() => onNav("settings")}><Pencil size={15} />Request a change</BtnGhost>} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 26px" }} className="sw-2col">
          <InfoRow label="Program Name" value={st.program} icon={<GraduationCap size={15} />} iconTone="amber" />
          <InfoRow label="Tuition Fees" value={st.tuition} />
          <InfoRow label="City" value={st.city} />
          <InfoRow label="Country" value={st.country} />
          <InfoRow label="Program Language" value={st.language} />
          <InfoRow label="University Name" value={st.university} />
        </div>
        <InfoNotice icon={<Lock size={16} />} style={{ marginTop: 12 }}>These fields are locked. To change any of them, submit a change request in Settings and our team will review it.</InfoNotice>
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
  const fileRef = useRef<HTMLInputElement>(null);
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
  async function onPickAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { path } = await uploadUserFile(file, { folder: "avatars" });
      await supabase.from("profiles").update({ avatar_path: path }).eq("id", profile.userId);
      // Publish the new photo platform-wide before the profile reload finishes,
      // so the top bar and every other avatar update instantly.
      setAvatarUrl(await fileUrl(path, "avatars", undefined, 86400));
      await onReload();
    } catch (err) { console.warn("avatar upload failed", err); }
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
  }
  const SavedTag = ({ k }: { k: string }) => savedKey === k ? <span style={{ display: "inline-flex", alignItems: "center", gap: 6, font: "600 12.5px/1 var(--font-sans)", color: "var(--green)" }}><Check size={15} />Saved</span> : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Profile photo */}
      <Panel>
        <CardTitle title="Profile photo" sub="Upload a picture — stored securely in your private storage" />
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <DefaultAvatar size={64} src={avatarUrl} verified={profile.verified} />
          <div>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={onPickAvatar} />
            <BtnPrimary onClick={() => fileRef.current?.click()} disabled={uploading}><Upload size={16} />{uploading ? "Uploading…" : "Upload photo"}</BtnPrimary>
            <div style={{ font: "400 11.5px/16px var(--font-sans)", color: "var(--ink-faint)", marginTop: 6 }}>JPG or PNG. Replaces your current photo.</div>
          </div>
        </div>
      </Panel>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }} className="sw-2col">
        <Panel>
          <CardTitle title="Personal information" />
          <Field label="Full name" value={name} onChange={setName} />
          <Field label="City" value={city} onChange={setCity} />
          <div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 12 }}>
            <BtnPrimary onClick={savePersonal} disabled={busy === "personal"}>Save changes</BtnPrimary>
            <SavedTag k="personal" />
          </div>
        </Panel>
        <Panel>
          <CardTitle title="Contact information" />
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
        <CardTitle title="Academic information" sub="Update your previous field of study and your English level" />
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
        <CardTitle title="Your program" sub="Set by our team, based on your profile and requests" />
        {profile.program ? (
          <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 22, background: "var(--indigo-tint)", border: "1px solid var(--indigo-line)" }}>
            <span style={{ width: 38, height: 38, borderRadius: 999, flex: "none", background: "var(--green-tint)", color: "var(--green)", border: "1px solid var(--green-line)", display: "flex", alignItems: "center", justifyContent: "center" }}><GraduationCap size={19} /></span>
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
