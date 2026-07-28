"use client";

/* Universal student workspace shell: glass sidebar (~19%) + header greeting +
   avatar menu, matching the admin Overview/Wallet dashboards. Renders one module
   at a time. Same shell for every country/plan — only module content changes. */

import { usePresenceBroadcast } from "@/lib/presence";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  LayoutDashboard, Route, FileText, Compass, Bell, MessageCircle, LifeBuoy,
  CreditCard, UserRound, Settings as SettingsIcon, LogOut, ChevronDown,
  ChevronLeft, ChevronRight, CalendarDays,
} from "lucide-react";
import { MobileNavigationHeader } from "./MobileNavigationHeader";
import RightPanel from "./RightPanel";
import Schedule from "./schedule/Schedule";
import StudentChat from "@/components/student/StudentChat";
import { planById } from "@/lib/plans";
import { supabase } from "@/lib/supabase/client";
import { useAvatarUrl } from "@/lib/avatar";
import { nextScheduleEvent } from "@/lib/schedule";
import { UserAvatar, BrandLogo, Toaster } from "@/components/ds";
import SidebarCarousel from "./SidebarCarousel";
import {
  Overview, Journey, Documents, Explore, Notifications, Support,
  Subscription, Profile, Settings, type WsProfile,
} from "./Modules";

export type Nav =
  | "overview" | "journey" | "documents" | "explore"
  | "messages" | "notifications" | "support" | "subscription" | "profile" | "settings" | "schedule";

const NAV_ICON = 20;
const PRIMARY_NAV: { id: Nav; label: string; icon: React.ReactNode }[] = [
  { id: "overview", label: "Overview", icon: <LayoutDashboard size={NAV_ICON} /> },
  { id: "journey", label: "My Journey", icon: <Route size={NAV_ICON} /> },
  { id: "documents", label: "Documents", icon: <FileText size={NAV_ICON} /> },
  { id: "schedule", label: "Schedule", icon: <CalendarDays size={NAV_ICON} /> },
  { id: "explore", label: "Explore Lithuania", icon: <Compass size={NAV_ICON} /> },
];

const firstName = (n: string | null) => (n ? n.trim().split(" ")[0] : "there");

/* Title shown next to the back/forward buttons in the top bar. */
const MODULE_TITLE: Record<Nav, string> = {
  overview: "Overview", journey: "My Journey", documents: "Documents", explore: "Explore Lithuania", schedule: "Schedule",
  messages: "Messages", notifications: "Notifications", support: "Support",
  subscription: "Subscription", profile: "Profile", settings: "Settings",
};

export default function WorkspaceShell({
  profile, nav, onNav, chatUnread, unreadNotifs, onSignOut, onProgramRequest, onReload,
}: {
  profile: WsProfile; nav: Nav; onNav: (n: Nav) => void;
  /** Unread counts. Both are live, and both are zero when nothing is waiting. */
  chatUnread: number; unreadNotifs: number; onSignOut: () => void;
  onProgramRequest: (r: { program: string; university: string; reason: string }) => Promise<boolean>;
  onReload: () => Promise<void>;
}) {
  const [menu, setMenu] = useState(false);
  const [sidebarMini, setSidebarMini] = useState(false);
  /* Announce this student as online for as long as the workspace is open. */
  usePresenceBroadcast(profile.userId, { name: profile.fullName, role: "student" });
  const full = profile.plan === "full_service";
  const avatarUrl = useAvatarUrl(profile.avatarUrl);

  /* Module history powering the top-bar back/forward buttons. Every navigation
     in the workspace goes through `navigate`, so the trail is complete; back and
     forward replay it without recording the replay itself. */
  const [hist, setHist] = useState<Nav[]>([nav]);
  const [hIdx, setHIdx] = useState(0);
  const canBack = hIdx > 0;
  const canFwd = hIdx < hist.length - 1;
  const navigate = (n: Nav) => {
    if (n === nav) return;
    setHist((h) => [...h.slice(0, hIdx + 1), n]);
    setHIdx(hIdx + 1);
    onNav(n);
  };
  const goHist = (step: -1 | 1) => {
    const i = hIdx + step;
    if (i < 0 || i >= hist.length) return;
    setHIdx(i);
    onNav(hist[i]);
  };

  /* Collapsed state persists (cookie) and toggles with ⌘/Ctrl+B, like the
     reference sidebar. */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "b" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); setSidebarMini((v) => !v); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  useEffect(() => { document.cookie = `sidebar_state=${!sidebarMini}; path=/; max-age=${60 * 60 * 24 * 7}`; }, [sidebarMini]);

  const navItem = (id: Nav, label: string, icon: React.ReactNode, opts?: { onClick?: () => void; badge?: number }) => (
    <button
      key={id} type="button" data-label={label} title={sidebarMini ? label : undefined}
      className={`sw-navitem${nav === id ? " active" : ""}`}
      onClick={opts?.onClick ?? (() => navigate(id))}
    >
      <span className="sw-navico">{icon}</span>
      <span className="sw-navlabel">{label}</span>
      {!!opts?.badge && <span className="sw-navbadge">{opts.badge > 9 ? "9+" : opts.badge}</span>}
    </button>
  );

  /* The mini calendar's upcoming event is the student's next Schedule entry —
     the same events the Schedule module manages. It falls back to their latest
     conversation update when nothing is scheduled. */
  const [lastEvent, setLastEvent] = useState<{ title: string; at: string } | null>(null);
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      // Prefer the next Schedule entry; fall back to the latest conversation.
      const next = nextScheduleEvent(profile.userId);
      if (next) { if (!cancelled) setLastEvent(next); return; }
      const { data } = await supabase.from("messages")
        .select("body, file_name, created_at").eq("user_id", profile.userId)
        .order("created_at", { ascending: false }).limit(1).maybeSingle();
      const m = data as { body?: string; file_name?: string; created_at?: string } | null;
      if (cancelled || !m?.created_at) return;
      const d = new Date(m.created_at);
      setLastEvent({
        title: (m.body?.replace(/^ASK::.*/, "Advisor question") || m.file_name || "Advisor update").slice(0, 42),
        at: `${d.toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })} · ${d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}`,
      });
    })();
    return () => { cancelled = true; };
  }, [profile.userId, nav]);

  const withPanel = (main: React.ReactNode, hide?: "journey" | "documents") => (
    <div className="sw-withpanel">
      <div style={{ minWidth: 0 }}>{main}</div>
      <RightPanel profile={profile} onNav={(n) => navigate(n as Nav)} event={lastEvent} hide={hide} />
    </div>
  );

  const content = (() => {
    switch (nav) {
      case "overview": return <Overview profile={profile} onNav={(n) => navigate(n as Nav)} />;
      // Journey and Documents share the reusable right panel.
      case "journey": return withPanel(<Journey profile={profile} onNav={(n) => navigate(n as Nav)} />, "journey");
      case "documents": return withPanel(<Documents profile={profile} onNav={(id) => onNav(id as Nav)} />, "documents");
      case "schedule": return <Schedule profile={profile} onNav={(n) => navigate(n as Nav)} />;
      case "explore": return <Explore />;
      case "notifications": return <Notifications profile={profile} onNav={(id) => onNav(id as Nav)} />;
      case "support": return <Support onNav={(n) => navigate(n as Nav)} />;
      case "subscription": return <Subscription profile={profile} />;
      case "profile": return <Profile profile={profile} onNav={(n) => navigate(n as Nav)} />;
      case "settings": return <Settings profile={profile} onProgramRequest={onProgramRequest} onReload={onReload} />;
      case "messages": return <StudentChat userId={profile.userId} full={full} onNav={(id) => onNav(id as Nav)} />;
      default: return null;
    }
  })();

  return (
    <div className="sw-root">
      {/* One stack for the whole workspace; every module raises toasts into it. */}
      <Toaster />
      <div className="sw-shell">
        {/* Sidebar */}
        <aside className={`sw-sidebar${sidebarMini ? " mini" : ""}`}>
          {/* Logo and wordmark, centred on the sidebar itself — no frame, no
              card. The collapse control floats at the edge as a bare icon. */}
          <div className="sw-brandrow">
            {sidebarMini ? <BrandLogo size={32} /> : (
              <Link href="/" className="sw-brand" aria-label="AfaqWay home">
                <BrandLogo size={32} />
                <span className="sw-brand-name">AfaqWay</span>
              </Link>
            )}
            <button
              type="button" className="sw-sidebar-close" onClick={() => setSidebarMini((v) => !v)}
              aria-label={sidebarMini ? "Expand sidebar" : "Collapse sidebar"} title="Toggle sidebar (⌘B)"
            >{sidebarMini ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}</button>
          </div>
          <nav className="sw-nav">
            <div className="sw-group-label">Platform</div>
            {PRIMARY_NAV.map((n) => navItem(n.id, n.label, n.icon))}
            {/* Everything above is a place in the journey; below is everything
                waiting for the student's attention. */}
            <div className="sw-nav-divider" role="separator" />
            {navItem("notifications", "Notifications", <Bell size={NAV_ICON} />, { badge: unreadNotifs })}
            {navItem("messages", "Messages", <MessageCircle size={NAV_ICON} />, { badge: chatUnread })}
          </nav>
          <SidebarCarousel />
        </aside>

        {/* Main */}
        <div className="sw-main">
          {/* Header */}
          <header className="sw-header">
            {/* mobile logo + menu */}
            {/* Back / forward through visited modules, then the current module name. */}
            <div className="sw-topnav">
              <button type="button" className="sw-navbtn" onClick={() => goHist(-1)} disabled={!canBack} aria-label="Back" title="Back"><ChevronLeft size={20} /></button>
              <button type="button" className="sw-navbtn" onClick={() => goHist(1)} disabled={!canFwd} aria-label="Forward" title="Forward"><ChevronRight size={20} /></button>
              <span className="sw-topnav-sep" aria-hidden />
              <span className="sw-topnav-title">{MODULE_TITLE[nav]}</span>
            </div>
            <div style={{ flex: 1 }} />
            <div style={{ display: "flex", alignItems: "center", gap: 10, flex: "none" }}>
              <button type="button" className={`sw-iconbtn${nav === "notifications" ? " active" : ""}`} onClick={() => navigate("notifications")} aria-label="Notifications">
                <Bell size={20} />{unreadNotifs > 0 && nav !== "notifications" && <span className="sw-dot">{unreadNotifs > 9 ? "9+" : unreadNotifs}</span>}
              </button>
              <button type="button" className={`sw-iconbtn${nav === "messages" ? " active" : ""}`} onClick={() => navigate("messages")} aria-label="Messages">
                <MessageCircle size={20} />{chatUnread > 0 && nav !== "messages" && <span className="sw-dot">{chatUnread > 9 ? "9+" : chatUnread}</span>}
              </button>
              <div style={{ position: "relative" }}>
                <button type="button" className="sw-profile" onClick={() => setMenu((v) => !v)} aria-label="Account menu">
                  <UserAvatar size={40} user={{ id: profile.userId, name: profile.fullName, avatarUrl, gender: profile.gender, avatarSeed: profile.avatarSeed, avatarStyle: profile.avatarStyle, verified: profile.verified }} />
                  <span className="sw-profile-meta">
                    <span className="sw-profile-name">{firstName(profile.fullName)}</span>
                    <span className="sw-profile-email">{profile.email || profile.profileId}</span>
                  </span>
                  <ChevronDown size={16} color="var(--ink-faint)" />
                </button>
                {menu && (
                  <>
                    <div onClick={() => setMenu(false)} style={{ position: "fixed", inset: 0, zIndex: 50 }} aria-hidden />
                    <div className="sw-menu">
                      <div style={{ padding: "8px 12px 10px", borderBottom: "1px solid var(--line-soft)", marginBottom: 5 }}>
                        <div style={{ font: "700 13px/17px var(--font-sans)", color: "var(--ink)" }}>{firstName(profile.fullName)}</div>
                        <div style={{ font: "500 11px/15px var(--font-sans)", color: "var(--ink-faint)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 200 }}>{profile.email || `${planById(profile.plan)?.name ?? "—"} · ${profile.profileId}`}</div>
                      </div>
                      <MenuRow icon={<UserRound size={17} />} label="Profile" onClick={() => { navigate("profile"); setMenu(false); }} />
                      <MenuRow icon={<CreditCard size={17} />} label="Subscription" onClick={() => { navigate("subscription"); setMenu(false); }} />
                      <MenuRow icon={<SettingsIcon size={17} />} label="Settings" onClick={() => { navigate("settings"); setMenu(false); }} />
                      <div style={{ height: 1, background: "var(--line-soft)", margin: "5px 0" }} />
                      <MenuRow icon={<LifeBuoy size={17} />} label="Contact support" onClick={() => { navigate("support"); setMenu(false); }} />
                      <MenuRow icon={<LogOut size={17} />} label="Sign out" danger onClick={onSignOut} />
                    </div>
                  </>
                )}
              </div>
            </div>
          </header>

          <div className={`sw-content${nav === "messages" ? " sw-content-full" : ""}`}>{content}</div>
        </div>
      </div>

      {/* Mobile navigation — header + dismissable dialog (reference structure) */}
      <MobileNavigationHeader>
        <div className="sw-brandrow" style={{ height: "auto", marginBottom: 6 }}>
          <Link href="/" className="sw-brand" aria-label="AfaqWay home">
            <BrandLogo size={24} />
            <span className="sw-brand-name">AfaqWay</span>
          </Link>
        </div>
        <div className="sw-group-label">Platform</div>
        {PRIMARY_NAV.map((n) => navItem(n.id, n.label, n.icon))}
        <div className="sw-nav-divider" role="separator" />
        {navItem("notifications", "Notifications", <Bell size={NAV_ICON} />, { badge: unreadNotifs })}
        {navItem("messages", "Messages", <MessageCircle size={NAV_ICON} />, { badge: chatUnread })}
        {navItem("subscription", "Subscription", <CreditCard size={NAV_ICON} />)}
        {navItem("support", "Support", <LifeBuoy size={NAV_ICON} />)}
      </MobileNavigationHeader>

    </div>
  );
}

function MenuRow({ icon, label, onClick, danger }: { icon: React.ReactNode; label: string; onClick: () => void; danger?: boolean }) {
  return (
    <button type="button" className={`sw-menu-row${danger ? " danger" : ""}`} onClick={onClick}>
      <span style={{ display: "flex", color: danger ? "var(--red)" : "var(--ink-soft)" }}>{icon}</span>{label}
    </button>
  );
}
