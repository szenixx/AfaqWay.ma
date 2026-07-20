"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { fetchAdminRole } from "@/lib/admin";
import StudentTopBar from "@/components/student/StudentTopBar";
import StudentChat from "@/components/student/StudentChat";
import { glassPanelStyle } from "@/components/student/GlassCard";
import { planById } from "@/lib/plans";

type Nav = "dashboard" | "roadmap" | "chat" | "profile" | "help";
type Profile = { full_name: string | null; plan: string | null; user_number: number | null };

const STAGES = ["University Application", "University Interview", "Migration Office (Migris)", "VFS Application", "Migris Interview", "Residence Permit (TRP)"];

function Panel({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <div style={{ ...glassPanelStyle, padding: 24, ...style }}>{children}</div>;
}

function Header({ eyebrow, title, sub }: { eyebrow: string; title: string; sub: string }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ font: "600 11px/15px var(--font-sans)", letterSpacing: ".08em", textTransform: "uppercase", color: "var(--indigo-600)" }}>{eyebrow}</div>
      <h1 style={{ font: "700 27px/34px var(--font-sans)", color: "var(--ink)", margin: "4px 0 0" }}>{title}</h1>
      <p style={{ font: "400 14px/22px var(--font-sans)", color: "var(--ink-soft)", margin: "6px 0 0", maxWidth: 640 }}>{sub}</p>
    </div>
  );
}

function ProgressBar({ stage }: { stage: number }) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", font: "500 12px/16px var(--font-sans)", color: "var(--ink-soft)", marginBottom: 6 }}><span>Stage {stage} of 6</span><span>{Math.round((stage / 6) * 100)}%</span></div>
      <div style={{ height: 8, borderRadius: 999, background: "var(--subtle)", overflow: "hidden" }}><div style={{ width: `${(stage / 6) * 100}%`, height: "100%", background: "var(--indigo-600)", borderRadius: 999 }} /></div>
    </div>
  );
}

function StageList({ full }: { full: boolean }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 16 }}>
      {STAGES.map((s, i) => (
        <div key={s} style={{ display: "flex", alignItems: "center", gap: 12, border: "1px solid var(--line)", borderRadius: 12, background: "var(--card)", padding: "12px 14px" }}>
          <span style={{ width: 30, height: 30, borderRadius: 999, flex: "none", display: "flex", alignItems: "center", justifyContent: "center", font: "600 13px/1 var(--font-sans)", background: i === 0 ? "var(--indigo-600)" : "var(--subtle)", color: i === 0 ? "#fff" : "var(--ink-faint)" }}>{i + 1}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ font: "600 14px/20px var(--font-sans)", color: "var(--ink)" }}>{s}</div>
            <div style={{ font: "400 12px/16px var(--font-sans)", color: "var(--ink-soft)" }}>{i === 0 ? "In progress" : "Not started"}</div>
          </div>
          <span className={i === 0 ? "pill pill-amber" : "pill pill-grey"}>{i === 0 ? "Under review" : "Not started"}</span>
        </div>
      ))}
      {full && <div style={{ position: "relative", border: "1px solid var(--line)", borderRadius: 12, padding: 16, overflow: "hidden" }}>
        <div style={{ filter: "blur(3px)", opacity: 0.6 }}><div style={{ font: "600 14px/20px var(--font-sans)", color: "var(--ink)" }}>Post-Arrival Support</div><div style={{ font: "400 12px/16px var(--font-sans)", color: "var(--ink-soft)" }}>Bank account, SIM, registration, insurance, housing.</div></div>
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: "rgba(255,255,255,.4)", font: "600 12px/16px var(--font-sans)", color: "var(--ink-soft)" }}><svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.75"><rect x="4" y="9" width="12" height="8" rx="2" /><path d="M7 9V6a3 3 0 0 1 6 0v3" /></svg>Unlocks after your residence permit is approved</div>
      </div>}
    </div>
  );
}

function Shell({ nav, plan, name, userId }: { nav: Nav; plan: string | null; name: string | null; userId: string | null }) {
  const full = plan === "full_service";
  const planName = planById(plan)?.name ?? "your plan";
  if (nav === "dashboard") {
    return (
      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 20 }} className="af-dash-grid">
        <div>
          <Header eyebrow={full ? "Your tracker" : "Your dashboard"} title={`Welcome${name ? `, ${name.split(" ")[0]}` : ""}`} sub={full ? "Your application is being handled for you. Track its progress here." : "Your step-by-step plan. You drive it, we review every document you upload."} />
          <Panel><ProgressBar stage={1} /></Panel>
          <div style={{ marginTop: 16 }}><Panel><div style={{ font: "600 13px/18px var(--font-sans)", color: "var(--ink)", marginBottom: 10 }}>Calendar</div><div style={{ height: 120, borderRadius: 10, background: "var(--subtle)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--ink-faint)", font: "400 13px var(--font-sans)" }}>Upcoming deadlines & appointments</div></Panel></div>
        </div>
        <div>
          <Panel style={{ padding: 18 }}>
            <span className={full ? "pill pill-indigo" : "pill pill-green"}>{planName}</span>
            <div style={{ font: "400 13px/19px var(--font-sans)", color: "var(--ink-soft)", marginTop: 10 }}>{full ? "A dedicated admin manages your file. Reach them anytime from Messages." : "Human review on every upload, average 48h. Need help? 24/7 support."}</div>
          </Panel>
        </div>
      </div>
    );
  }
  if (nav === "roadmap") {
    return (
      <div>
        <Header eyebrow={full ? "Your tracker" : "Your roadmap"} title={full ? "Your application, handled for you" : "Your path to studying in Lithuania"} sub={full ? "Follow each stage as our team drives it. Documents are handled through Messages." : "Six stages, each with its own checklist. Tick them off, upload, and we review."} />
        <Panel><ProgressBar stage={1} /><StageList full={full} /></Panel>
      </div>
    );
  }
  if (nav === "chat") {
    return (
      <div>
        <Header eyebrow="Messages" title={full ? "Chat with your admin" : "Support"} sub={full ? "Your dedicated admin drives your file and answers here." : "Send documents or questions, our team reviews and replies here."} />
        {userId ? <StudentChat userId={userId} full={full} /> : <Panel><div style={{ color: "var(--ink-soft)", font: "400 14px var(--font-sans)" }}>Loading conversation…</div></Panel>}
      </div>
    );
  }
  if (nav === "profile") {
    return <div><Header eyebrow="Account" title="Your profile" sub="Your personal details and program choices. Editing here is coming next." /><Panel><div style={{ color: "var(--ink-soft)", font: "400 14px/21px var(--font-sans)" }}>Profile settings (edit personal details and program choice) are coming next.</div></Panel></div>;
  }
  return <div><Header eyebrow="Help" title="Help center" sub="Guides and support for every step." /><Panel><div style={{ color: "var(--ink-soft)", font: "400 14px/21px var(--font-sans)" }}>Help articles are coming soon. For now, reach us from Messages.</div></Panel></div>;
}

export default function Dashboard() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileId, setProfileId] = useState<string | undefined>(undefined);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [nav, setNav] = useState<Nav>("dashboard");
  const [chatUnread, setChatUnread] = useState(false);
  const navRef = useRef<Nav>(nav);

  useEffect(() => { navRef.current = nav; if (nav === "chat") setChatUnread(false); }, [nav]);
  useEffect(() => {
    if (!userId) return;
    const ch = supabase.channel(`dash-unread-${userId}`).on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `user_id=eq.${userId}` }, (payload) => {
      const m = payload.new as { sender?: string };
      if (m.sender === "admin" && navRef.current !== "chat") setChatUnread(true);
    }).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [userId]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace("/signup"); return; }
      const { role } = await fetchAdminRole(user.email);
      if (cancelled) return;
      if (role) { router.replace("/admin"); return; }
      const { data } = await supabase.from("profiles").select("full_name, onboarding_completed_at, plan, plan_status, user_number").eq("id", user.id).single();
      if (cancelled) return;
      const row = (data ?? {}) as Record<string, unknown>;
      if (!row.onboarding_completed_at) { router.replace("/profile-setup"); return; }
      setUserId(user.id);
      setProfile({ full_name: (row.full_name as string) ?? null, plan: (row.plan as string) ?? null, user_number: (row.user_number as number) ?? null });
      if (typeof row.user_number === "number") setProfileId("AWU-" + String(row.user_number).padStart(3, "0"));
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [router]);

  if (loading) {
    return <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--paper)", color: "var(--ink-faint)", font: "400 15px/24px var(--font-sans)" }}>Loading…</div>;
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--paper)" }}>
      <StudentTopBar nav={nav} onNav={setNav} userId={profileId} plan={profile?.plan} fullName={profile?.full_name} chatUnread={chatUnread} />
      <div className="dash-advice" style={{ maxWidth: 1120, margin: "0 auto", padding: "14px 16px 0" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 11, background: "var(--red-tint)", border: "1px solid var(--red-line)", borderRadius: 18, boxShadow: "0 10px 30px rgba(23,35,58,.10)", padding: "14px 16px" }}>
          <span style={{ width: 34, height: 34, borderRadius: 12, flex: "none", background: "#fff", border: "1px solid var(--red-line)", color: "var(--red)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><rect x="2.5" y="4" width="15" height="10" rx="1.5" /><path d="M7 17h6M10 14v3" /></svg>
          </span>
          <div style={{ minWidth: 0 }}>
            <div style={{ font: "600 13px/19px var(--font-sans)", color: "var(--red)" }}>For a smoother experience, we advise using a laptop, desktop, or tablet, your workspace feels more comfortable there.</div>
            <div dir="rtl" style={{ font: "500 12.5px/20px var(--font-sans)", color: "var(--ink-soft)", marginTop: 3 }}>ننصحك باستخدام حاسوب محمول أو مكتبي أو جهاز لوحي للحصول على تجربة أكثر سلاسة وراحة في مساحة عملك.</div>
          </div>
        </div>
      </div>
      <main style={{ maxWidth: 1120, margin: "0 auto", padding: "16px 20px 64px" }}>
        <Shell nav={nav} plan={profile?.plan ?? null} name={profile?.full_name ?? null} userId={userId} />
      </main>
    </div>
  );
}
