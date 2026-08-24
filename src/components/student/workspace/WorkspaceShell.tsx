"use client";

/* Universal student workspace shell: glass sidebar (~19%) + header greeting +
   avatar menu, matching the admin Overview/Wallet dashboards. Renders one module
   at a time. Same shell for every country/plan — only module content changes. */

import { usePresenceBroadcast } from "@/lib/presence";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  House, Map as MapIcon, FileText, LifeBuoy,
  CreditCard, UserRound, Settings as SettingsIcon, LogOut, ChevronDown,
  ChevronLeft, ChevronRight, CalendarDays, Bell,
} from "lucide-react";
import { ChatBubbleIcon } from "@svg-animated-icons/react";
import { MobileNavigationHeader } from "./MobileNavigationHeader";
import { DeviceAdvice } from "./DeviceAdvice";
import RightPanel from "./RightPanel";
import { DashboardWorkspace } from "./dashboard/DashboardWorkspace";
import { Dock, DockItem } from "@/components/godui/dock";
import Schedule from "./schedule/Schedule";
import StudentChat from "@/components/student/StudentChat";
import { planById } from "@/lib/plans";
import { supabase } from "@/lib/supabase/client";
import { useAvatarUrl } from "@/lib/avatar";
import { nextScheduleEvent } from "@/lib/schedule";
import { useNotifications } from "@/lib/notifications";
import { UserAvatar, BrandLogo, AnimatedModal, DialogHead, DialogFoot } from "@/components/ds";
import { JrButton } from "./journey/parts";
import { Toaster as SonnerToaster } from "sonner";
import { AnimatedGridPattern } from "@/components/home/AnimatedGridPattern";
import { NotificationInbox } from "./NotificationInbox";
import { TesterControls } from "@/components/tester/TesterControls";
import {
  Journey, Documents, Support,
  Subscription, Profile, Settings, type WsProfile,
} from "./Modules";

export type Nav =
  | "overview" | "journey" | "documents"
  | "messages" | "support" | "subscription" | "profile" | "settings" | "schedule";

const NAV_ICON = 20;
const PRIMARY_NAV: { id: Nav; label: string; icon: React.ReactNode }[] = [
  { id: "overview", label: "Overview", icon: <House size={NAV_ICON} /> },
  { id: "journey", label: "My Journey", icon: <MapIcon size={NAV_ICON} /> },
  { id: "documents", label: "Documents", icon: <FileText size={NAV_ICON} /> },
  { id: "schedule", label: "Schedule", icon: <CalendarDays size={NAV_ICON} /> },
];

/* The collapsed sidebar's nav, in render order. The sliding active pill is
   positioned from an index into this list, so it stays correct as long as
   this matches what the nav actually renders — hence one list, used for
   both. */
/* Messages is deliberately absent: it is reached from the top-bar icon and
   the mobile launcher, not from the rail, so the sliding pill only has to
   track the primary destinations. */
const MINI_NAV: Nav[] = PRIMARY_NAV.map((n) => n.id);

const firstName = (n: string | null) => (n ? n.trim().split(" ")[0] : "there");

/* The only pages the sidebar defaults to (and stays) expanded on — everywhere
   else it starts collapsed and snaps back shut the moment a module is picked. */
const SIDEBAR_EXPANDED_NAV = new Set<Nav>(["profile", "settings", "support", "subscription", "messages"]);

/* Title shown next to the back/forward buttons in the top bar. */
const MODULE_TITLE: Record<Nav, string> = {
  overview: "Overview", journey: "My Journey", documents: "Documents", schedule: "Schedule",
  messages: "Messages", support: "Support",
  subscription: "Subscription", profile: "Profile", settings: "Settings",
};

export default function WorkspaceShell({
  profile, nav, onNav, chatUnread, onSignOut, onProgramRequest, onReload,
}: {
  profile: WsProfile; nav: Nav; onNav: (n: Nav) => void;
  /** Unread advisor messages. The only red badge in the workspace. */
  chatUnread: number; onSignOut: () => void;
  onProgramRequest: (r: { program: string; university: string; reason: string }) => Promise<boolean>;
  onReload: () => Promise<void>;
}) {
  const [menu, setMenu] = useState(false);
  const [confirmSignOut, setConfirmSignOut] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [acctOpen, setAcctOpen] = useState(false);
  /* Drives both the bell's red dot and its "keeps moving until read"
     animation — the same live count the popover itself reads, so the two
     never disagree about whether something is still unread. */
  const { unread: notifUnread } = useNotifications(profile.userId);
  const [sidebarMini, setSidebarMini] = useState(() => !SIDEBAR_EXPANDED_NAV.has(nav));
  /* Announce this student as online for as long as the workspace is open. */
  usePresenceBroadcast(profile.userId, { name: profile.fullName, role: "student" });
  const full = profile.plan === "full_service";
  /* -1 when the current page has no collapsed-nav entry (Profile, Settings…),
     which hides the pill rather than parking it on an unrelated item. */
  const miniActiveIndex = MINI_NAV.indexOf(nav);
  const avatarUrl = useAvatarUrl(profile.avatarUrl);
  const router = useRouter();

  /* `onNav` is a real navigation (router.push, from the page above), so every
     call here already lands in the browser's own history — the top bar's
     back/forward buttons just replay that real history instead of a
     hand-rolled copy of it. */
  const navigate = (n: Nav) => {
    if (n === nav) return;
    onNav(n);
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
  /* Whatever the sidebar was doing before, picking a destination resets it to
     that destination's own default: expanded on Profile/Settings/Support/
     Subscription, collapsed everywhere else — so opening the sidebar to jump
     to a module always snaps it back shut once you land, and it's not
     re-litigated by how you got there (sidebar click, avatar menu, browser
     back/forward, a notification link…), only by where you ended up. */
  useEffect(() => { setSidebarMini(!SIDEBAR_EXPANDED_NAV.has(nav)); }, [nav]);

  const navItem = (id: Nav, label: string, icon: React.ReactNode, opts?: { onClick?: () => void; badge?: number; dotOnly?: boolean }) => (
    <button
      key={id} type="button" data-label={label} title={sidebarMini ? label : undefined}
      className={`sw-navitem${nav === id ? " active" : ""}`}
      onClick={opts?.onClick ?? (() => navigate(id))}
    >
      <span className="sw-navico">{icon}</span>
      <span className="sw-navlabel">{label}</span>
      {!!opts?.badge && (opts.dotOnly
        ? <span className="sw-navdot" aria-label={`${opts.badge} unread`} />
        : <span className="sw-navbadge">{opts.badge > 9 ? "9+" : opts.badge}</span>)}
    </button>
  );

  /* The mobile hamburger dropdown reuses MenuRow — the exact same row the
     desktop avatar menu (.sw-menu) renders — so mobile's combined menu
     looks and behaves like that same menu, not a separate design. Picking
     an Account child also collapses Account back down, so the menu always
     reopens fresh instead of remembering it was left expanded last time. */
  const mobileRow = (id: Nav, label: string, icon: React.ReactNode, opts?: { onClick?: () => void; inAccount?: boolean }) => (
    <MenuRow
      key={id} icon={icon} label={label}
      onClick={opts?.onClick ?? (() => { navigate(id); if (opts?.inAccount) setAcctOpen(false); })}
    />
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
      /* The dashboard is its own Application Workspace: it brings its own
         centre column AND its own right utility panel, so it does not go
         through withPanel like Journey and Documents do. */
      case "overview": return <DashboardWorkspace profile={profile} onNav={(n) => navigate(n as Nav)} />;
      // Journey and Documents share the reusable right panel.
      case "journey": return withPanel(<Journey profile={profile} onNav={(n) => navigate(n as Nav)} />, "journey");
      case "documents": return withPanel(<Documents profile={profile} onNav={(id) => onNav(id as Nav)} />, "documents");
      case "schedule": return <Schedule profile={profile} onNav={(n) => navigate(n as Nav)} />;
      case "support": return <Support onNav={(n) => navigate(n as Nav)} />;
      case "subscription": return <Subscription profile={profile} />;
      case "profile": return <Profile profile={profile} onNav={(n) => navigate(n as Nav)} />;
      case "settings": return <Settings profile={profile} onProgramRequest={onProgramRequest} onReload={onReload} />;
      case "messages": return <StudentChat userId={profile.userId} full={full} onNav={(id) => onNav(id as Nav)} />;
      default: return null;
    }
  })();

  return (
    <div className="sw-root af-desktop-zoom">
      {/* Canvas: the home hero's own animated grid — same background across
          every module, not just the marketing page. */}
      <div aria-hidden style={{ position: "absolute", inset: 0, zIndex: 0, pointerEvents: "none" }}>
        <AnimatedGridPattern />
      </div>
      {/* One stack for the whole workspace; every module raises toasts into it.
          Sonner's own look (frame, type, animation) — not the ds Toast used
          everywhere else in the app — per explicit request for this surface.
          White frame with only the icon carrying colour (green/orange/yellow/
          red per sonnerNotify.ts, never blue) rather than sonner's own
          richColors, which tints the whole toast body per variant. */}
      <SonnerToaster
        position="top-center" closeButton expand
        toastOptions={{ style: { background: "#fff", borderRadius: "16px", border: "1.5px solid #E2E4EA", boxShadow: "0 18px 44px rgba(23,35,58,.16)" } }}
      />
      <div className="sw-shell">
        {/* Sidebar */}
        <aside className={`sw-sidebar${sidebarMini ? " mini" : ""}`}>
          {/* Mark and wordmark side by side, centred on the sidebar itself —
              no frame, no card. The collapse control is a real item in the same
              row rather than floating over it, so the lockup can never grow
              underneath it. */}
          <div className="sw-brandrow">
            {/* Sized to the rail rather than to a generic icon scale: the
                collapsed mark fills most of the 80px column, and the rail is
                zoomed out, so a smaller mark reads as lost in it. */}
            {sidebarMini ? <BrandLogo size={44} /> : (
              <Link href="/" className="sw-brand" aria-label="AfaqWay home">
                <BrandLogo size={44} />
                <span className="sw-brand-name">AfaqWay</span>
              </Link>
            )}
            <button
              type="button" className="sw-sidebar-close" onClick={() => setSidebarMini((v) => !v)}
              aria-label={sidebarMini ? "Expand sidebar" : "Collapse sidebar"} title="Toggle sidebar (⌘B)"
            >{sidebarMini ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}</button>
          </div>
          <nav className="sw-nav">
            {/* The items live in their own shrink-wrapped box, and the pill is
                positioned inside THAT rather than inside the nav. The nav is
                vertically centred, so a pill anchored to the nav would sit at
                its top edge while the items sat in the middle — the offset
                only has a fixed relationship to the first item here. */}
            {sidebarMini ? (
              /* Collapsed, the rail is a dock: icons magnify under the pointer
                 and name themselves on hover, which is what makes an icon-only
                 rail navigable. Expanded, the labels are already there, so the
                 sliding pill stays. */
              <Dock className="sw-dock" orientation="vertical">
                {PRIMARY_NAV.map((n) => (
                  <DockItem
                    key={n.id} active={nav === n.id} label={n.label}
                    onClick={() => navigate(n.id)}
                  >
                    {n.icon}
                  </DockItem>
                ))}
              </Dock>
            ) : (
              <div className="sw-nav-items" style={{ "--sw-active-i": miniActiveIndex } as React.CSSProperties}>
                {/* One pill that slides between items instead of each item
                    painting its own background, so switching module reads as
                    movement rather than a hard swap. */}
                {miniActiveIndex >= 0 && <span className="sw-nav-pill" aria-hidden />}
                {PRIMARY_NAV.map((n) => navItem(n.id, n.label, n.icon))}
                {/* Everything above is a place in the journey; below is
                    everything waiting for the student's attention.
                    Notifications has no nav entry of its own — the bell in the
                    top bar (with its popover) is the only way to reach them. */}
              </div>
            )}
          </nav>
          {/* Always last, always the same target size as a nav item, and
              pushed to the floor by the flexible space above it. */}
          <button
            type="button" className="sw-navitem sw-logout" onClick={() => setConfirmSignOut(true)}
            title={sidebarMini ? "Sign out" : undefined} aria-label="Sign out"
          >
            <span className="sw-navico"><LogOut size={NAV_ICON} /></span>
            <span className="sw-navlabel">Sign out</span>
          </button>
        </aside>

        {/* Main */}
        <div className="sw-main">
          {/* Header */}
          <header className="sw-header">
            {/* mobile logo + menu */}
            {/* Back / forward through visited modules, then the current module name. */}
            <div className="sw-topnav">
              <button type="button" className="sw-navbtn" onClick={() => router.back()} aria-label="Back" title="Back"><ChevronLeft size={20} /></button>
              <button type="button" className="sw-navbtn" onClick={() => router.forward()} aria-label="Forward" title="Forward"><ChevronRight size={20} /></button>
              <span className="sw-topnav-sep" aria-hidden />
              <span className="sw-topnav-title">{MODULE_TITLE[nav]}</span>
            </div>
            <div style={{ flex: 1 }} />
            <div style={{ display: "flex", alignItems: "center", gap: 10, flex: "none" }}>
              {/* Renders nothing for every account but the one QA tester
                  email — see src/lib/tester.ts. */}
              <TesterControls email={profile.email} />
              <div style={{ position: "relative" }}>
                {/* Every notification still reaches the student as a toast
                    and lives in the conversation, but the bell itself still
                    rings gently for as long as something here is unread, with
                    its own dot. It only settles once the popover (or the
                    thing it links to) marks the row read. */}
                <button type="button" data-notif-trigger className={`sw-iconbtn${notifOpen ? " active" : ""}${notifUnread > 0 ? " unread" : ""}`} onClick={() => setNotifOpen((v) => !v)} aria-label="Notifications">
                  <span className="sw-bell-ico"><Bell size={22} /></span>
                  {notifUnread > 0 && <span className="sw-dot sw-dot-plain" aria-hidden />}
                </button>
                {notifOpen && (
                  <NotificationInbox
                    userId={profile.userId}
                    onOpen={(link) => navigate(link as Nav)}
                    onClose={() => setNotifOpen(false)}
                  />
                )}
              </div>
              <button type="button" className={`sw-iconbtn${nav === "messages" ? " active" : ""}${chatUnread > 0 ? " unread" : ""}`} onClick={() => navigate("messages")} aria-label="Messages">
                <ChatBubbleIcon disableHover className="sw-topbar-icon" />
                {chatUnread > 0 && nav !== "messages" && <span className="sw-dot">{chatUnread > 9 ? "9+" : chatUnread}</span>}
              </button>
              <div style={{ position: "relative" }}>
                <button type="button" className="sw-profile" onClick={() => setMenu((v) => !v)} aria-label="Account menu">
                  {/* Same framed-ring treatment as the Profile page's own hero
                      avatar (.pf-avatar) — a centred, lifted focal point
                      instead of a bare flat circle, scaled down for the
                      header. */}
                  <span className="sw-profile-avatar">
                    <UserAvatar size={40} user={{ id: profile.userId, name: profile.fullName, avatarUrl, gender: profile.gender, avatarSeed: profile.avatarSeed, avatarStyle: profile.avatarStyle, verified: profile.verified }} />
                  </span>
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
                      {/* Opens the confirmation rather than signing out on the spot: the
                          sidebar's own Sign out already asks, and two entry points to
                          the same destructive action should not behave differently. */}
                      <MenuRow icon={<LogOut size={17} />} label="Sign out" danger onClick={() => { setMenu(false); setConfirmSignOut(true); }} />
                    </div>
                  </>
                )}
              </div>
            </div>
          </header>

          <div className={`sw-content${nav === "messages" ? " sw-content-full" : ""}`}>{content}</div>
        </div>
      </div>

      {/* Mobile navigation — floating pill bar (same design as onboarding /
          home) + dismissable dialog. Messages is deliberately absent here:
          it already has its own floating launcher (below) and top-bar icon.
          Profile, Payments and Settings live inside the collapsible Account
          card instead of as three more top-level rows. */}
      {confirmSignOut && (
        <AnimatedModal open onClose={() => setConfirmSignOut(false)} className="dlg" ariaLabel="Sign out">
          <DialogHead title="Sign out of AfaqWay?">
            You will need to sign in again to reach your workspace. Nothing you have uploaded or
            sent is lost.
          </DialogHead>
          <DialogFoot>
            <JrButton tone="quiet" size="md" onClick={() => setConfirmSignOut(false)}>Stay signed in</JrButton>
            <JrButton tone="danger" size="md" icon={<LogOut size={15} />} onClick={onSignOut}>Sign out</JrButton>
          </DialogFoot>
        </AnimatedModal>
      )}

      <MobileNavigationHeader
        activeKey={nav}
        rightExtra={
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {/* Renders nothing for every account but the one QA tester email
                (src/lib/tester.ts) — this is the mobile bar, a separate
                component from the desktop topbar above, so it needs its own
                copy of this line to appear in phone mode at all. */}
            <TesterControls email={profile.email} />
            <div style={{ position: "relative" }}>
              <button type="button" data-notif-trigger className={`sw-iconbtn plain${notifOpen ? " active" : ""}${notifUnread > 0 ? " unread" : ""}`} onClick={() => setNotifOpen((v) => !v)} aria-label="Notifications">
                <span className="sw-bell-ico"><Bell size={22} /></span>
                {notifUnread > 0 && <span className="sw-dot sw-dot-plain" aria-hidden />}
              </button>
              {notifOpen && (
                <NotificationInbox
                  userId={profile.userId}
                  onOpen={(link) => navigate(link as Nav)}
                  onClose={() => setNotifOpen(false)}
                />
              )}
            </div>
          </div>
        }
      >
        {/* Account first: Profile, Payments, Settings and Support live one
            level down, indented under it, instead of four more top-level
            rows — everything else is the exact same MenuRow the desktop
            avatar menu uses. */}
        <button
          type="button"
          className={`sw-menu-row mnav-acct-toggle${acctOpen ? " open" : ""}`}
          aria-expanded={acctOpen}
          onClick={(e) => { e.stopPropagation(); setAcctOpen((v) => !v); }}
        >
          <span style={{ display: "flex", color: "var(--ink-soft)" }}><UserRound size={17} /></span>
          Account
          <ChevronDown size={15} className="mnav-acct-chev" />
        </button>
        {acctOpen && (
          <div className="mnav-subgroup">
            {mobileRow("profile", "Profile", <UserRound size={17} />, { inAccount: true })}
            {mobileRow("subscription", "Payments", <CreditCard size={17} />, { inAccount: true })}
            {mobileRow("settings", "Settings", <SettingsIcon size={17} />, { inAccount: true })}
            {mobileRow("support", "Support", <LifeBuoy size={17} />, { inAccount: true })}
          </div>
        )}

        <div style={{ height: 1, background: "var(--line-soft)", margin: "5px 0" }} />

        {PRIMARY_NAV.map((n) => mobileRow(n.id, n.label, n.icon))}

        <div style={{ height: 1, background: "var(--line-soft)", margin: "5px 0" }} />

        <MenuRow icon={<LogOut size={17} />} label="Sign out" danger onClick={() => setConfirmSignOut(true)} />
      </MobileNavigationHeader>

      {/* Sits directly under the mobile bar. Rendered unconditionally; the
          CSS hides it above the mobile breakpoint, so there is no second
          source of truth for "is this a phone". */}
      <DeviceAdvice />

      {/* Mobile-only floating chat launcher, WhatsApp-extension-style: fixed
          bottom-right corner over the page. Hidden once already inside
          Messages. */}
      {nav !== "messages" && (
        <button type="button" className={`sw-mobile-fab${chatUnread > 0 ? " unread" : ""}`} onClick={() => navigate("messages")} aria-label="Messages">
          <ChatBubbleIcon disableHover className="sw-topbar-icon" />
          {chatUnread > 0 && <span className="sw-mobile-fab-dot" aria-hidden />}
        </button>
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
