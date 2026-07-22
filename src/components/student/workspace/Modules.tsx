"use client";

/* Every workspace module for the Lithuania demo. One universal layout, content
   switches on the user's plan (self_service vs full_service). Realistic demo
   data comes from ./data. Presentational pieces come from ./parts. */

import { useState } from "react";
import {
  Route, CircleCheckBig, Clock3, FileText, Upload, Download,
  Bell, MessageCircle, ArrowRight, Plus, Check, Pencil, Mail, Phone, MapPin,
  Calendar, CreditCard, UserRound, ChevronRight, Send, LifeBuoy, Compass,
  TriangleAlert, X, Sparkles,
} from "lucide-react";
import { planById } from "@/lib/plans";
import {
  JOURNEY, REQUIRED_DOCS, DOC_LABEL, DOC_TONE, NOTIFICATIONS, RECENT_ACTIVITY,
  UPCOMING_TASKS, EXPLORE, FAQ, type DocStatus,
} from "./data";
import {
  Panel, PageHead, CardTitle, StatTile, ProgressLine, Pill, EmptyState,
  BtnPrimary, BtnGhost, StatusGlyph, exploreIcon,
} from "./parts";

export type WsProfile = {
  fullName: string | null; email: string | null; plan: string | null;
  userId: string; profileId: string; city: string | null;
  whatsapp: string | null; dob: string | null; program: string | null;
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
      <PageHead eyebrow="Overview" title="Your dashboard"
        sub={full ? "Your Lithuania application is being handled for you. Here's everything at a glance." : "Everything happening in your Lithuania journey, at a glance."} />

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
                <button key={a.label} type="button" onClick={() => onNav(a.to)} style={{ display: "flex", flexDirection: "column", gap: 8, padding: "14px 12px", borderRadius: 15, border: "1px solid var(--line)", background: "rgba(255,255,255,.6)", cursor: "pointer", textAlign: "left" }}>
                  <span style={{ width: 34, height: 34, borderRadius: 11, background: "var(--indigo-tint)", color: "var(--indigo-600)", display: "flex", alignItems: "center", justifyContent: "center" }}>{a.icon}</span>
                  <span style={{ font: "600 12.5px/16px var(--font-sans)", color: "var(--ink)" }}>{a.label}</span>
                </button>
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
      <PageHead eyebrow="My Journey" title="Your path to studying in Lithuania"
        sub={full ? "Six stages, driven by your advisor. Follow each one as our team moves your file forward." : "Six stages, each with its own checklist. Complete them, upload, and we review every step."} />
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
      <PageHead eyebrow="Documents" title="Document center"
        sub={full ? "Provide your documents once, our team applies them to your application for you." : "Upload each required document. A real reviewer verifies every file, usually within 48 hours."}
        action={<BtnPrimary><Upload size={16} />Upload document</BtnPrimary>} />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }} className="sw-statrow">
        <StatTile label="Approved" value={String(approved)} accent="#20C997" icon={<CircleCheckBig size={16} />} />
        <StatTile label="Under review" value={String(REQUIRED_DOCS.filter((d) => d.status === "under_review").length)} accent="#F76707" icon={<Clock3 size={16} />} />
        <StatTile label="Needs changes" value={String(REQUIRED_DOCS.filter((d) => d.status === "needs_changes").length)} accent="#F03E3E" icon={<TriangleAlert size={16} />} />
        <StatTile label="Pending" value={String(REQUIRED_DOCS.filter((d) => d.status === "pending").length)} accent="#868E96" icon={<FileText size={16} />} />
      </div>

      <Panel>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 6 }}>
          {filters.map((f) => (
            <button key={f.id} type="button" onClick={() => setFilter(f.id)} style={{ height: 34, padding: "0 14px", borderRadius: 12, border: "1px solid var(--line)", cursor: "pointer", font: "600 12.5px/1 var(--font-sans)", background: filter === f.id ? "var(--indigo-600)" : "rgba(255,255,255,.6)", color: filter === f.id ? "#fff" : "var(--ink-soft)" }}>{f.label}</button>
          ))}
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
export function Explore() {
  const [open, setOpen] = useState<string>(EXPLORE[0].key);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <PageHead eyebrow="Explore Lithuania" title="Everything about your destination"
        sub="Universities, cities, cost of living and the practical things you need to know before and after you arrive." />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }} className="sw-explore">
        {EXPLORE.map((sec) => {
          const isOpen = open === sec.key;
          return (
            <Panel key={sec.key} style={{ cursor: "pointer", outline: isOpen ? "2px solid var(--indigo-line)" : "none" }}>
              <button type="button" onClick={() => setOpen(isOpen ? "" : sec.key)} style={{ all: "unset", cursor: "pointer", display: "block", width: "100%" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ width: 44, height: 44, borderRadius: 14, flex: "none", background: "var(--indigo-tint)", color: "var(--indigo-600)", display: "flex", alignItems: "center", justifyContent: "center" }}>{exploreIcon(sec.icon, 21)}</span>
                  <div style={{ flex: 1, minWidth: 0 }}><div style={{ font: "700 15px/20px var(--font-sans)", color: "var(--ink)" }}>{sec.title}</div><div style={{ font: "400 12px/16px var(--font-sans)", color: "var(--ink-faint)" }}>{sec.blurb}</div></div>
                  <ChevronRight size={18} color="var(--ink-faint)" style={{ transform: isOpen ? "rotate(90deg)" : "none", transition: "transform 160ms" }} />
                </div>
              </button>
              {isOpen && (
                <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 8 }}>
                  {sec.items.map((it) => (
                    <div key={it.name} style={{ padding: "10px 12px", borderRadius: 12, background: "var(--subtle)" }}>
                      <div style={{ font: "600 12.5px/17px var(--font-sans)", color: "var(--ink)" }}>{it.name}</div>
                      <div style={{ font: "400 11.5px/16px var(--font-sans)", color: "var(--ink-soft)" }}>{it.note}</div>
                    </div>
                  ))}
                </div>
              )}
            </Panel>
          );
        })}
      </div>
    </div>
  );
}

/* ── Notifications ────────────────────────────────────────────────────────── */
const NOTIF_ICON = { doc: <FileText size={16} />, journey: <Route size={16} />, message: <MessageCircle size={16} />, deadline: <Calendar size={16} />, system: <Bell size={16} /> };
export function Notifications() {
  const [items, setItems] = useState(NOTIFICATIONS);
  const unread = items.filter((n) => !n.read).length;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <PageHead eyebrow="Notifications" title="Notification center" sub="Every update about your application, documents and messages."
        action={unread > 0 ? <BtnGhost onClick={() => setItems((xs) => xs.map((n) => ({ ...n, read: true })))}><Check size={15} />Mark all read</BtnGhost> : undefined} />
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
      <PageHead eyebrow="Support" title="How can we help?" sub="Find quick answers, open a ticket, or chat with our team directly." />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }} className="sw-explore">
        {[
          { icon: <MessageCircle size={20} />, title: "Live chat", desc: "Chat with our team in Messages.", cta: "Open chat", to: "messages" },
          { icon: <Plus size={20} />, title: "Open a ticket", desc: "Describe an issue and we'll follow up.", cta: "New ticket", to: "messages" },
          { icon: <Mail size={20} />, title: "Contact support", desc: "support@afaqway.com · 24/7", cta: "Email us", to: "messages" },
        ].map((c) => (
          <Panel key={c.title}>
            <span style={{ width: 46, height: 46, borderRadius: 14, background: "var(--indigo-tint)", color: "var(--indigo-600)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>{c.icon}</span>
            <div style={{ font: "700 15px/20px var(--font-sans)", color: "var(--ink)" }}>{c.title}</div>
            <div style={{ font: "400 12.5px/18px var(--font-sans)", color: "var(--ink-soft)", margin: "4px 0 14px" }}>{c.desc}</div>
            <BtnGhost onClick={() => onNav(c.to)}>{c.cta}<ArrowRight size={15} /></BtnGhost>
          </Panel>
        ))}
      </div>
      <Panel>
        <CardTitle title="Frequently asked questions" />
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
      </Panel>
    </div>
  );
}

/* ── Subscription ─────────────────────────────────────────────────────────── */
export function Subscription({ profile }: { profile: WsProfile }) {
  const [showDetails, setShowDetails] = useState(false);
  const p = planById(profile.plan);
  const full = profile.plan === "full_service";
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <PageHead eyebrow="Subscription" title="Your plan" sub="Your active subscription and what it includes." />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }} className="sw-2col">
        <Panel style={{ background: "linear-gradient(135deg, rgba(59,91,219,.14), rgba(132,94,247,.12))" }}>
          <span className={full ? "pill pill-indigo" : "pill pill-green"}>Current plan</span>
          <div style={{ font: "800 26px/32px var(--font-sans)", color: "var(--ink)", margin: "12px 0 2px", letterSpacing: "-.3px" }}>{p?.name ?? "—"}</div>
          <div style={{ font: "600 15px/22px var(--font-sans)", color: "var(--indigo-600)" }}>{p ? `${p.price.toLocaleString("en-US")} ${p.currency}` : ""}</div>
          <div style={{ font: "400 13px/19px var(--font-sans)", color: "var(--ink-soft)", marginTop: 8 }}>{p?.tagline}</div>
          <div style={{ marginTop: 16 }}><BtnPrimary onClick={() => setShowDetails((v) => !v)}><CreditCard size={16} />{showDetails ? "Hide plan details" : "View plan details"}</BtnPrimary></div>
        </Panel>
        <Panel>
          <CardTitle title="Billing" />
          <div style={{ display: "flex", flexDirection: "column" }}>
            {[["Status", "Active"], ["Billing", "One-time payment"], ["Country", "Lithuania"], ["Started", "This month"], ["Next invoice", "None"]].map(([k, v]) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "11px 0", borderBottom: "1px solid var(--line-soft)", font: "500 13px/18px var(--font-sans)", color: "var(--ink)" }}><span style={{ color: "var(--ink-soft)" }}>{k}</span><b>{v}</b></div>
            ))}
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
  const rows = [
    { label: "Full name", value: profile.fullName || "—", icon: <UserRound size={15} /> },
    { label: "Email", value: profile.email || "—", icon: <Mail size={15} /> },
    { label: "WhatsApp", value: profile.whatsapp || "—", icon: <Phone size={15} /> },
    { label: "City", value: profile.city || "—", icon: <MapPin size={15} /> },
    { label: "Date of birth", value: profile.dob || "—", icon: <Calendar size={15} /> },
    { label: "Destination", value: "Lithuania", icon: <Compass size={15} /> },
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <PageHead eyebrow="Profile" title="Your profile" sub="Your personal and account details."
        action={<BtnGhost onClick={() => onNav("settings")}><Pencil size={15} />Edit in Settings</BtnGhost>} />
      <Panel>
        <div style={{ display: "flex", alignItems: "center", gap: 16, paddingBottom: 18, borderBottom: "1px solid var(--line-soft)", marginBottom: 6 }}>
          <span style={{ width: 68, height: 68, borderRadius: 22, flex: "none", background: "linear-gradient(135deg,#3B5BDB,#845EF7)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", font: "800 28px/1 var(--font-sans)", boxShadow: "0 8px 22px rgba(59,91,219,.32)" }}>{(profile.fullName || "U").trim().charAt(0).toUpperCase()}</span>
          <div style={{ minWidth: 0 }}>
            <div style={{ font: "800 20px/26px var(--font-sans)", color: "var(--ink)" }}>{profile.fullName || "Student"}</div>
            <div style={{ font: "500 12.5px/18px var(--font-sans)", color: "var(--ink-soft)" }}>ID {profile.profileId} · {planById(profile.plan)?.name ?? "—"}</div>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2px 26px" }} className="sw-2col">
          {rows.map((r) => (
            <div key={r.label} style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 0", borderBottom: "1px solid var(--line-soft)" }}>
              <span style={{ width: 32, height: 32, borderRadius: 10, flex: "none", background: "var(--subtle)", color: "var(--indigo-600)", display: "flex", alignItems: "center", justifyContent: "center" }}>{r.icon}</span>
              <div style={{ minWidth: 0 }}><div style={{ font: "400 11px/15px var(--font-sans)", color: "var(--ink-faint)" }}>{r.label}</div><div style={{ font: "600 13.5px/19px var(--font-sans)", color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.value}</div></div>
            </div>
          ))}
        </div>
        <div style={{ font: "400 12px/17px var(--font-sans)", color: "var(--ink-faint)", marginTop: 14 }}>These details come from your onboarding. To change them, use Settings.</div>
      </Panel>
    </div>
  );
}

/* ── Settings ─────────────────────────────────────────────────────────────── */
export function Settings({ profile, onProgramRequest }: { profile: WsProfile; onProgramRequest: (r: { program: string; university: string; reason: string }) => Promise<boolean> }) {
  const [name, setName] = useState(profile.fullName ?? "");
  const [city, setCity] = useState(profile.city ?? "");
  const [whatsapp, setWhatsapp] = useState(profile.whatsapp ?? "");
  const [saved, setSaved] = useState(false);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <PageHead eyebrow="Settings" title="Settings" sub="Edit your details or request a change to your program." />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }} className="sw-2col">
        <Panel>
          <CardTitle title="Personal information" />
          <Field label="Full name" value={name} onChange={setName} />
          <Field label="City" value={city} onChange={setCity} />
          <div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 12 }}>
            <BtnPrimary onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 2200); }}>Save changes</BtnPrimary>
            {saved && <span style={{ display: "inline-flex", alignItems: "center", gap: 6, font: "600 12.5px/1 var(--font-sans)", color: "var(--green)" }}><Check size={15} />Saved</span>}
          </div>
        </Panel>
        <Panel>
          <CardTitle title="Contact information" />
          <Field label="Email (read-only)" value={profile.email ?? ""} onChange={() => {}} readOnly />
          <Field label="WhatsApp" value={whatsapp} onChange={setWhatsapp} />
          <div style={{ marginTop: 14 }}><BtnPrimary onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 2200); }}>Save contact info</BtnPrimary></div>
        </Panel>
      </div>
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
        {!open && <BtnGhost onClick={() => setOpen(true)}><Plus size={15} />New request</BtnGhost>}
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

function Field({ label, value, onChange, readOnly, textarea, placeholder }: { label: string; value: string; onChange: (v: string) => void; readOnly?: boolean; textarea?: boolean; placeholder?: string }) {
  const st: React.CSSProperties = { width: "100%", boxSizing: "border-box", borderRadius: 12, border: "1px solid var(--line)", background: readOnly ? "var(--subtle)" : "#fff", padding: "10px 13px", font: "500 13.5px/20px var(--font-sans)", color: "var(--ink)", outlineColor: "var(--indigo-600)", resize: "vertical" };
  return (
    <label style={{ display: "block", marginBottom: 12 }}>
      <span style={{ display: "block", font: "600 11.5px/16px var(--font-sans)", color: "var(--ink-soft)", marginBottom: 5 }}>{label}</span>
      {textarea
        ? <textarea value={value} onChange={(e) => onChange(e.target.value)} readOnly={readOnly} placeholder={placeholder} rows={3} style={st} />
        : <input value={value} onChange={(e) => onChange(e.target.value)} readOnly={readOnly} placeholder={placeholder} style={st} />}
    </label>
  );
}
