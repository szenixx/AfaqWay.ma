"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import {
  Award, BadgeCheck, BookOpen, Calendar, CircleCheck, CircleDashed, Clock3, Copy, ExternalLink,
  FileText, Flag, GraduationCap, Globe, Landmark, Languages, Mail, MapPin, Phone, Route, User, X,
} from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { countryByCode } from "@/components/profile-setup/countries";
import { deriveAcademic, deriveStudy, type AcademicInfo, type StudyApp } from "@/lib/studyApplication";
import { fileUrl } from "@/lib/storage/client";
import { ChatAvatar, ChatEmpty } from "./parts";

/* The platform's standard student profile card. Opens over the conversation so
   the admin never loses their place. Everything shown here is real data from
   the student's profile and onboarding answers — nothing is invented, and any
   field the platform does not track yet says so plainly. */

type Row = Record<string, unknown>;
type Tab = "overview" | "academic" | "application" | "documents";

const TABS: { id: Tab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "academic", label: "Academic" },
  { id: "application", label: "Application" },
  { id: "documents", label: "Documents" },
];

/* The journey stages, in order. `reached` is derived from real profile
   timestamps; anything the platform does not record yet stays upcoming. */
const STAGES = [
  "Profile setup", "Choosing program", "Pre documents review", "University submitted",
  "Waiting decision", "Acceptance letter received", "Migris process", "VFS process", "Completed",
] as const;

const awu = (n: unknown) => "AWU-" + String((n as number) ?? 0).padStart(3, "0");
const date = (v: unknown) => (v ? new Date(v as string).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—");
const str = (v: unknown) => (v == null || v === "" ? "—" : String(v));

export default function StudentProfileModal({ userId, fallbackName, avatarUrl, onClose, onOpenPlanModule }: {
  userId: string;
  fallbackName?: string | null;
  avatarUrl?: string | null;
  onClose: () => void;
  /** Opens the admin module that manages this student's plan (full/self service). */
  onOpenPlanModule?: (plan: string, userId: string) => void;
}) {
  const [tab, setTab] = useState<Tab>("overview");
  const [row, setRow] = useState<Row | null>(null);
  const [loading, setLoading] = useState(true);
  const [waOpen, setWaOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [avatar, setAvatar] = useState<string | null>(avatarUrl ?? null);

  const load = useCallback(async () => {
    const { data } = await supabase.from("profiles")
      .select("full_name, email, user_number, plan, plan_status, plan_activated_at, destination_country, city, date_of_birth, whatsapp_country_code, whatsapp_number, onboarding_completed_at, created_at, country_flow_answers, avatar_path")
      .eq("id", userId).maybeSingle();
    const r = (data ?? null) as Row | null;
    setRow(r);
    setLoading(false);
    const path = r?.avatar_path as string | undefined;
    // The avatar always matches whatever the student last uploaded.
    if (path) setAvatar(await fileUrl(path, "avatars", undefined, 86400));
  }, [userId]);
  // Fetching the profile is exactly the "subscribe to an external system" case;
  // the state it sets is the fetch result, not derived render state.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void load(); }, [load]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const cfa = (row?.country_flow_answers as Record<string, unknown> | null) ?? null;
  const study: StudyApp | null = deriveStudy(cfa, (row?.destination_country as string) ?? null);
  const academic: AcademicInfo | null = deriveAcademic(cfa);
  const plan = (row?.plan as string) ?? null;
  const planName = plan === "full_service" ? "Full Service" : plan === "self_service" ? "Self Service" : "No plan";
  const country = countryByCode((row?.destination_country as string) ?? "")?.name ?? "—";
  const phone = `${str(row?.whatsapp_country_code) === "—" ? "" : row?.whatsapp_country_code} ${str(row?.whatsapp_number) === "—" ? "" : row?.whatsapp_number}`.trim();
  const active = row?.plan_status === "active";

  // Profile completion: the share of the profile fields the platform asks for.
  const filled = [row?.full_name, row?.email, row?.city, row?.date_of_birth, row?.whatsapp_number, row?.destination_country, row?.onboarding_completed_at, study?.program].filter(Boolean).length;
  const completion = Math.round((filled / 8) * 100);

  // Stage index from real signals only.
  let stageIdx = 0;
  if (row?.onboarding_completed_at) stageIdx = 1;
  if (study?.program) stageIdx = 2;
  if (active && study?.university && study.university !== "—") stageIdx = 3;

  const openWhatsApp = () => {
    const digits = phone.replace(/[^\d]/g, "");
    if (digits) window.open(`https://wa.me/${digits}`, "_blank", "noopener");
  };
  const copyPhone = async () => {
    try { await navigator.clipboard.writeText(phone); setCopied(true); setTimeout(() => setCopied(false), 1600); } catch { /* clipboard blocked */ }
  };

  return (
    <div className="spm-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label="Student profile">
      <div className="spm-card" onClick={(e) => e.stopPropagation()}>
        {/* ── Section 1: header ── */}
        <header className="spm-head">
          <ChatAvatar size={72} src={avatar} online={active} verified={active} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <span style={{ font: "700 19px/25px var(--font-sans)", color: "var(--ink)" }}>{(row?.full_name as string) || fallbackName || "Unnamed student"}</span>
              <span className={!plan ? "pill pill-grey" : plan === "full_service" ? "pill pill-indigo" : "pill pill-green"}>{planName}</span>
              <span className={completion === 100 ? "pill pill-green" : "pill pill-amber"}>{completion === 100 ? "Complete" : "In progress"}</span>
            </div>
            <div className="spm-headmeta">
              <span><BadgeCheck size={13} />{awu(row?.user_number)}</span>
              <span><Mail size={13} />{str(row?.email)}</span>
              <span><Globe size={13} />{country}</span>
              <span><MapPin size={13} />{str(row?.city)}</span>
            </div>
          </div>

          <div className="spm-actions">
            <button
              type="button" className="chat-chip" disabled={!plan || !onOpenPlanModule}
              title={plan ? `Open the ${planName} module` : "This student has no plan yet"}
              onClick={() => plan && onOpenPlanModule?.(plan, userId)}
            ><Route size={15} />Track journey</button>

            <div style={{ position: "relative" }}>
              <button type="button" className={`chat-chip${waOpen ? " on" : ""}`} onClick={() => setWaOpen((v) => !v)} disabled={!phone}
                title={phone ? "WhatsApp" : "No number on file"}><Phone size={15} />WhatsApp</button>
              {waOpen && phone && (
                <div className="spm-pop">
                  <div style={{ font: "400 11px/15px var(--font-sans)", color: "var(--ink-faint)" }}>Student phone number</div>
                  <div style={{ font: "700 14px/20px var(--font-sans)", color: "var(--ink)", marginBottom: 8 }}>{phone}</div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button type="button" className="chat-chip" onClick={copyPhone}><Copy size={14} />{copied ? "Copied" : "Copy"}</button>
                    <button type="button" className="chat-chip on" onClick={openWhatsApp}><ExternalLink size={14} />Open</button>
                  </div>
                </div>
              )}
            </div>

            <button type="button" className="chat-act" onClick={onClose} aria-label="Close" title="Close"><X size={16} /></button>
          </div>
        </header>

        {/* ── Section 2: tabs ── */}
        <nav className="spm-tabs">
          {TABS.map((t) => (
            <button key={t.id} type="button" className={`chat-tab${tab === t.id ? " active" : ""}`} onClick={() => setTab(t.id)}>{t.label}</button>
          ))}
        </nav>

        <div className="spm-body" key={tab}>
          {loading ? <div style={{ padding: 24, font: "400 13px var(--font-sans)", color: "var(--ink-faint)" }}>Loading profile…</div> : (
            <>
              {/* ── Section 3: overview ── */}
              {tab === "overview" && (
                <>
                  <Group title="Personal">
                    <InfoRow icon={<User size={15} />} label="Full name" value={str(row?.full_name)} />
                    <InfoRow icon={<Calendar size={15} />} label="Date of birth" value={date(row?.date_of_birth)} />
                    <InfoRow icon={<Flag size={15} />} label="City" value={str(row?.city)} />
                    <InfoRow icon={<BadgeCheck size={15} />} label="Student ID" value={awu(row?.user_number)} copy />
                  </Group>
                  <Group title="Contact">
                    <InfoRow icon={<Mail size={15} />} label="Email" value={str(row?.email)} copy />
                    <InfoRow icon={<Phone size={15} />} label="Phone number" value={phone || "—"} copy />
                    <InfoRow icon={<MapPin size={15} />} label="City" value={str(row?.city)} />
                    <InfoRow icon={<Globe size={15} />} label="Destination country" value={country} />
                  </Group>
                  <Group title="Platform">
                    <InfoRow icon={<Calendar size={15} />} label="Registered" value={date(row?.created_at)} />
                    <InfoRow icon={<GraduationCap size={15} />} label="Service type" value={planName} badge={<span className={plan === "full_service" ? "pill pill-indigo" : "pill pill-green"}>{active ? "Active" : "Inactive"}</span>} />
                    <InfoRow icon={<User size={15} />} label="Assigned advisor" value={plan === "full_service" ? "AfaqWay advisory team" : "Self-service (reviewers only)"} />
                    <div className="spm-row">
                      <span className="spm-ico"><CircleCheck size={15} /></span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="spm-label">Profile completion</div>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 5 }}>
                          <span style={{ flex: 1, height: 6, borderRadius: 999, background: "var(--subtle)", overflow: "hidden" }}>
                            <span style={{ display: "block", width: `${completion}%`, height: "100%", borderRadius: 999, background: "var(--indigo-600)", transition: "width 700ms var(--ease)" }} />
                          </span>
                          <span style={{ font: "700 12.5px/17px var(--font-sans)", color: "var(--indigo-600)" }}>{completion}%</span>
                        </div>
                      </div>
                    </div>
                  </Group>
                </>
              )}

              {/* ── Section 4: academic ── */}
              {tab === "academic" && (
                academic || study ? (
                  <>
                    <Group title="Education">
                      <InfoRow icon={<GraduationCap size={15} />} label="Highest diploma" value={academic?.lastDegree ?? "—"} />
                      <InfoRow icon={<BookOpen size={15} />} label="Field of study" value={academic?.field ?? "—"} />
                      <InfoRow icon={<Calendar size={15} />} label="Graduation year" value={academic?.year ?? "—"} />
                      <InfoRow icon={<Award size={15} />} label="Grade" value={academic?.grade ?? "—"} />
                    </Group>
                    <Group title="Language">
                      <InfoRow icon={<Languages size={15} />} label="English level" value={academic?.englishLevel ?? "—"} />
                      {academic?.test && academic.test !== "No test yet"
                        ? <InfoRow icon={<FileText size={15} />} label="English certification" value={academic.test} />
                        : <ChatEmpty icon={<FileText size={22} />} title="No English certificate yet" sub="The student has not uploaded a language certificate." />}
                    </Group>
                    <Group title="Preferences">
                      <InfoRow icon={<GraduationCap size={15} />} label="Preferred degree" value={academic?.target ?? "—"} />
                      <InfoRow icon={<Globe size={15} />} label="Preferred country" value={study?.country ?? country} />
                      <InfoRow icon={<Landmark size={15} />} label="Preferred university" value={study?.university ?? "—"} />
                      <InfoRow icon={<BookOpen size={15} />} label="Program" value={study?.program ?? "—"} />
                    </Group>
                  </>
                ) : <ChatEmpty icon={<GraduationCap size={22} />} title="No academic information yet" sub="It appears here once the student finishes onboarding." />
              )}

              {/* ── Section 5: application ── */}
              {tab === "application" && (
                <>
                  <Group title="Current status">
                    <div className="spm-row" style={{ alignItems: "center" }}>
                      <span className="spm-ico"><Route size={15} /></span>
                      <div style={{ flex: 1 }}>
                        <div className="spm-label">Stage {stageIdx + 1} of {STAGES.length}</div>
                        <div className="spm-value" style={{ fontSize: 14 }}>{STAGES[stageIdx]}</div>
                      </div>
                      <span className="pill pill-indigo">In progress</span>
                    </div>
                  </Group>

                  <Group title="Progress timeline">
                    <div className="spm-timeline">
                      {STAGES.map((s, i) => {
                        const done = i < stageIdx, now = i === stageIdx;
                        const when = i === 0 ? date(row?.created_at) : i === 1 ? date(row?.onboarding_completed_at) : i === 3 ? date(row?.plan_activated_at) : "";
                        return (
                          <div key={s} className="spm-step">
                            <span className={`spm-dot${done ? " done" : now ? " now" : ""}`}>
                              {done ? <CircleCheck size={14} /> : now ? <Clock3 size={14} /> : <CircleDashed size={14} />}
                            </span>
                            <div style={{ minWidth: 0 }}>
                              <div style={{ font: `${now ? 700 : 500} 12.5px/17px var(--font-sans)`, color: done || now ? "var(--ink)" : "var(--ink-faint)" }}>{s}</div>
                              <div style={{ font: "400 11px/15px var(--font-sans)", color: "var(--ink-faint)" }}>
                                {done ? `Completed${when && when !== "—" ? ` · ${when}` : ""}` : now ? "In progress" : "Not started"}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </Group>

                  <Group title="Summary">
                    <div className="spm-summary">
                      <SummaryTile label="Universities applied" value={study?.university && study.university !== "—" ? "1" : "0"} />
                      <SummaryTile label="Offers received" value="Not tracked yet" small />
                      <SummaryTile label="Missing documents" value="See plan module" small />
                      <SummaryTile label="Upcoming deadlines" value="Not tracked yet" small />
                    </div>
                  </Group>
                </>
              )}

              {/* ── Section 6: documents ── */}
              {tab === "documents" && (
                <ChatEmpty
                  art="documents"
                  title="Documents live in the plan module"
                  sub={`Open the ${planName} module to review, verify and download this student's files.`}
                  action={
                    <button type="button" className="chat-send" style={{ marginTop: 6 }} disabled={!plan || !onOpenPlanModule}
                      onClick={() => plan && onOpenPlanModule?.(plan, userId)}>
                      <FileText size={15} />Open {planName} module
                    </button>
                  }
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Reusable pieces ──────────────────────────────────────────────────────── */

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section style={{ marginBottom: 18 }}>
      <div style={{ font: "600 10.5px/14px var(--font-sans)", letterSpacing: ".08em", textTransform: "uppercase", color: "var(--ink-faint)", marginBottom: 8 }}>{title}</div>
      <div style={{ border: "1px solid var(--line)", borderRadius: 16, background: "var(--card)", overflow: "hidden" }}>{children}</div>
    </section>
  );
}

function InfoRow({ icon, label, value, badge, copy }: { icon: ReactNode; label: string; value: string; badge?: ReactNode; copy?: boolean }) {
  const [done, setDone] = useState(false);
  return (
    <div className="spm-row">
      <span className="spm-ico">{icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="spm-label">{label}</div>
        <div className="spm-value">{value}</div>
      </div>
      {badge}
      {copy && value !== "—" && (
        <button type="button" className="chat-act" title="Copy" aria-label={`Copy ${label}`}
          onClick={async () => { try { await navigator.clipboard.writeText(value); setDone(true); setTimeout(() => setDone(false), 1500); } catch { /* blocked */ } }}>
          {done ? <CircleCheck size={14} /> : <Copy size={14} />}
        </button>
      )}
    </div>
  );
}

function SummaryTile({ label, value, small }: { label: string; value: string; small?: boolean }) {
  return (
    <div style={{ border: "1px solid var(--line)", borderRadius: 14, padding: "12px 14px", background: "var(--card)" }}>
      <div style={{ font: small ? "600 12px/17px var(--font-sans)" : "800 20px/26px var(--font-sans)", color: small ? "var(--ink-soft)" : "var(--ink)" }}>{value}</div>
      <div style={{ font: "400 11px/15px var(--font-sans)", color: "var(--ink-faint)", marginTop: 2 }}>{label}</div>
    </div>
  );
}
