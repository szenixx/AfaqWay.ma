"use client";

/* Universal student workspace shell: glass sidebar (~19%) + header greeting +
   avatar menu, matching the admin Overview/Wallet dashboards. Renders one module
   at a time. Same shell for every country/plan — only module content changes. */

import { useState } from "react";
import Link from "next/link";
import {
  LayoutDashboard, Route, FileText, Compass, Bell, MessageCircle, LifeBuoy,
  CreditCard, UserRound, Settings as SettingsIcon, LogOut, ChevronDown, Menu, X,
} from "lucide-react";
import { LogoMark } from "@/components/hero/OnboardingHeroPanel";
import StudentChat from "@/components/student/StudentChat";
import { planById } from "@/lib/plans";
import { DefaultAvatar } from "./parts";
import SidebarCarousel from "./SidebarCarousel";
import {
  Overview, Journey, Documents, Explore, Notifications, Support,
  Subscription, Profile, Settings, type WsProfile,
} from "./Modules";

export type Nav =
  | "overview" | "journey" | "documents" | "explore"
  | "messages" | "notifications" | "support" | "subscription" | "profile" | "settings";

const NAV_ICON = 20;
const PRIMARY_NAV: { id: Nav; label: string; icon: React.ReactNode }[] = [
  { id: "overview", label: "Overview", icon: <LayoutDashboard size={NAV_ICON} /> },
  { id: "journey", label: "My Journey", icon: <Route size={NAV_ICON} /> },
  { id: "documents", label: "Documents", icon: <FileText size={NAV_ICON} /> },
  { id: "explore", label: "Explore Lithuania", icon: <Compass size={NAV_ICON} /> },
];

const firstName = (n: string | null) => (n ? n.trim().split(" ")[0] : "there");

export default function WorkspaceShell({
  profile, nav, onNav, chatUnread, unreadNotifs, onSignOut, onProgramRequest, onReload,
}: {
  profile: WsProfile; nav: Nav; onNav: (n: Nav) => void;
  chatUnread: boolean; unreadNotifs: number; onSignOut: () => void;
  onProgramRequest: (r: { program: string; university: string; reason: string }) => Promise<boolean>;
  onReload: () => Promise<void>;
}) {
  const [menu, setMenu] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const full = profile.plan === "full_service";

  const navItem = (id: Nav, label: string, icon: React.ReactNode, onClick?: () => void) => (
    <button key={id} type="button" className={`sw-navitem${nav === id ? " active" : ""}`} onClick={onClick ?? (() => { onNav(id); setMobileNav(false); })}>
      <span className="sw-navico">{icon}</span>{label}
    </button>
  );

  const content = (() => {
    switch (nav) {
      case "overview": return <Overview profile={profile} onNav={(n) => onNav(n as Nav)} />;
      case "journey": return <Journey profile={profile} />;
      case "documents": return <Documents profile={profile} />;
      case "explore": return <Explore />;
      case "notifications": return <Notifications />;
      case "support": return <Support onNav={(n) => onNav(n as Nav)} />;
      case "subscription": return <Subscription profile={profile} />;
      case "profile": return <Profile profile={profile} onNav={(n) => onNav(n as Nav)} />;
      case "settings": return <Settings profile={profile} onProgramRequest={onProgramRequest} onReload={onReload} />;
      case "messages": return <StudentChat userId={profile.userId} full={full} />;
      default: return null;
    }
  })();

  return (
    <div className="sw-root">
      <div className="sw-shell">
        {/* Sidebar */}
        <aside className="sw-sidebar">
          <Link href="/" className="sw-brand">
            <LogoMark size={30} />
            <div><div className="sw-brand-name">AfaqWay</div><div className="sw-brand-sub">Lithuania</div></div>
          </Link>
          <nav className="sw-nav">
            <div className="sw-group-label">Workspace</div>
            {PRIMARY_NAV.map((n) => navItem(n.id, n.label, n.icon))}
          </nav>
          <SidebarCarousel />
        </aside>

        {/* Main */}
        <div className="sw-main">
          {/* Header */}
          <header className="sw-header">
            {/* mobile logo + menu */}
            <button type="button" className="sw-iconbtn sw-mobilebar" onClick={() => setMobileNav(true)} aria-label="Menu"><Menu size={20} /></button>
            {/* Overview keeps the Welcome greeting; other modules show their title in-page (below). */}
            {nav === "overview" ? (
              <div style={{ minWidth: 0 }}>
                <div style={{ font: "800 clamp(19px,2.4vw,24px)/1.15 var(--font-sans)", color: "var(--ink)", letterSpacing: "-.3px" }}>Welcome back, {firstName(profile.fullName)}!</div>
                <div style={{ font: "400 13px/19px var(--font-sans)", color: "var(--ink-soft)", marginTop: 3 }}>Continue your Lithuania journey and keep track of your progress from one place.</div>
              </div>
            ) : <div style={{ flex: 1 }} />}
            <div style={{ display: "flex", alignItems: "center", gap: 10, flex: "none" }}>
              <button type="button" className={`sw-iconbtn${nav === "notifications" ? " active" : ""}`} onClick={() => onNav("notifications")} aria-label="Notifications">
                <Bell size={20} />{unreadNotifs > 0 && nav !== "notifications" && <span className="sw-dot">{unreadNotifs > 9 ? "9+" : unreadNotifs}</span>}
              </button>
              <button type="button" className={`sw-iconbtn${nav === "messages" ? " active" : ""}`} onClick={() => onNav("messages")} aria-label="Messages">
                <MessageCircle size={20} />{chatUnread && nav !== "messages" && <span className="sw-dot" style={{ background: "var(--red)", minWidth: 11, height: 11, padding: 0, top: 9, right: 10 }} />}
              </button>
              <div style={{ position: "relative" }}>
                <button type="button" className="sw-profile" onClick={() => setMenu((v) => !v)} aria-label="Account menu">
                  <DefaultAvatar size={36} src={profile.avatarUrl} />
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
                      <MenuRow icon={<UserRound size={17} />} label="Profile" onClick={() => { onNav("profile"); setMenu(false); }} />
                      <MenuRow icon={<CreditCard size={17} />} label="Subscription" onClick={() => { onNav("subscription"); setMenu(false); }} />
                      <MenuRow icon={<SettingsIcon size={17} />} label="Settings" onClick={() => { onNav("settings"); setMenu(false); }} />
                      <div style={{ height: 1, background: "var(--line-soft)", margin: "5px 0" }} />
                      <MenuRow icon={<LifeBuoy size={17} />} label="Contact support" onClick={() => { onNav("support"); setMenu(false); }} />
                      <MenuRow icon={<LogOut size={17} />} label="Sign out" danger onClick={onSignOut} />
                    </div>
                  </>
                )}
              </div>
            </div>
          </header>

          <div className="sw-content">{content}</div>
        </div>
      </div>

      {/* Mobile nav drawer */}
      {mobileNav && (
        <div style={{ position: "fixed", inset: 0, zIndex: 80 }}>
          <div onClick={() => setMobileNav(false)} style={{ position: "absolute", inset: 0, background: "rgba(23,35,58,.45)" }} aria-hidden />
          <div style={{ position: "absolute", top: 0, left: 0, bottom: 0, width: "min(280px, 82vw)", background: "var(--card)", boxShadow: "0 20px 60px rgba(23,35,58,.25)", padding: 16, display: "flex", flexDirection: "column", gap: 4, overflowY: "auto" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 9 }}><LogoMark size={26} /><span className="sw-brand-name" style={{ fontSize: 17 }}>AfaqWay</span></span>
              <button type="button" onClick={() => setMobileNav(false)} aria-label="Close" style={{ width: 34, height: 34, borderRadius: 11, border: "1px solid var(--line)", background: "var(--card)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--ink-soft)" }}><X size={18} /></button>
            </div>
            {PRIMARY_NAV.map((n) => navItem(n.id, n.label, n.icon))}
            <div style={{ height: 1, background: "var(--line-soft)", margin: "6px 0" }} />
            {navItem("messages", "Messages", <MessageCircle size={NAV_ICON} />)}
            {navItem("notifications", "Notifications", <Bell size={NAV_ICON} />)}
            {navItem("subscription", "Subscription", <CreditCard size={NAV_ICON} />)}
            {navItem("profile", "Profile", <UserRound size={NAV_ICON} />)}
            {navItem("settings", "Settings", <SettingsIcon size={NAV_ICON} />)}
            {navItem("support", "Support", <LifeBuoy size={NAV_ICON} />)}
            <button type="button" className="sw-navitem danger" onClick={onSignOut}><span className="sw-navico"><LogOut size={NAV_ICON} /></span>Sign out</button>
          </div>
        </div>
      )}
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
