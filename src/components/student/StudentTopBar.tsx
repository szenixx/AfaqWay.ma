"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { X, Check, MessageCircle, Menu } from "lucide-react";
import { LogoMark } from "@/components/hero/OnboardingHeroPanel";
import { planById } from "@/lib/plans";

/* Paid-user workspace top bar — homepage pill style. Nav: Dashboard · Roadmap,
   then a chat icon and a profile menu. Profile menu (top→bottom): User ID,
   Profile, Subscription (opens a doc-style modal), Help center, Sign out. */

type Nav = "dashboard" | "roadmap" | "chat" | "profile" | "help";
type Props = { nav: Nav; onNav: (n: Nav) => void; userId?: string; plan?: string | null; fullName?: string | null; chatUnread?: boolean };

const navItems: { id: Nav; label: string }[] = [
  { id: "dashboard", label: "Dashboard" },
  { id: "roadmap", label: "Roadmap" },
];

function SubscriptionModal({ plan, onClose }: { plan: string | null | undefined; onClose: () => void }) {
  const p = planById(plan);
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(23,35,58,.55)", overflowY: "auto", padding: "48px 16px" }}>
      <button type="button" onClick={onClose} aria-label="Close" style={{ position: "fixed", top: 16, right: 16, zIndex: 101, width: 40, height: 40, borderRadius: 999, border: "none", cursor: "pointer", background: "var(--card)", boxShadow: "var(--shadow-card)", color: "var(--ink)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <X size={20} />
      </button>
      <div style={{ maxWidth: 640, margin: "0 auto", background: "var(--card)", border: "1px solid var(--line)", borderRadius: 16, boxShadow: "var(--shadow-card)", padding: "34px 38px" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", marginBottom: 20 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 9 }}><LogoMark size={30} /><span style={{ font: "700 22px/1 var(--font-sans)", color: "var(--ink)" }}>AfaqWay</span></div>
          <div style={{ font: "400 13px/19px var(--font-sans)", color: "var(--ink-soft)", marginTop: 8 }}>Your active subscription</div>
        </div>
        <div style={{ height: 1, background: "var(--line-soft)", marginBottom: 20 }} />
        {!p ? (
          <p style={{ font: "400 14px/21px var(--font-sans)", color: "var(--ink-soft)", textAlign: "center" }}>No active plan found.</p>
        ) : (
          <>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "center", gap: 8, marginBottom: 4 }}>
              <span style={{ font: "700 24px/30px var(--font-sans)", color: "var(--ink)" }}>{p.name}</span>
              <span style={{ font: "600 15px/22px var(--font-sans)", color: "var(--indigo-600)" }}>{p.price.toLocaleString("en-US")} {p.currency}</span>
            </div>
            <p style={{ font: "400 13px/19px var(--font-sans)", color: "var(--ink-soft)", textAlign: "center", marginBottom: 20 }}>{p.tagline}</p>
            <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 10 }}>
              {p.features.map((f, i) => (
                <li key={i} style={{ display: "flex", gap: 10, font: "400 13.5px/20px var(--font-sans)", color: "var(--ink)" }}>
                  <span aria-hidden style={{ flex: "none", width: 20, height: 20, borderRadius: 999, background: "var(--indigo-tint)", color: "var(--indigo-600)", display: "flex", alignItems: "center", justifyContent: "center", marginTop: 1 }}>
                    <Check size={12} />
                  </span>{f}
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}

export default function StudentTopBar({ nav, onNav, userId, plan, fullName, chatUnread }: Props) {
  const router = useRouter();
  const [menu, setMenu] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [sub, setSub] = useState(false);
  async function signOut() { await supabase.auth.signOut(); router.replace("/signup"); }

  const navBtn = (id: Nav, label: string) => (
    <button key={id} type="button" onClick={() => { onNav(id); setMobile(false); }} className="af-navlink"
      style={{ background: "none", border: "none", cursor: "pointer", font: "600 14px/20px var(--font-sans)", color: nav === id ? "var(--indigo-600)" : "var(--ink)", padding: "4px 0", borderBottom: nav === id ? "2px solid var(--indigo-600)" : "2px solid transparent" }}>{label}</button>
  );

  return (
    <>
      <div style={{ display: "flex", justifyContent: "center", paddingTop: 20, position: "relative", zIndex: 30 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 22, background: "var(--card)", border: "1px solid var(--line)", borderRadius: 999, boxShadow: "var(--shadow-card)", padding: "9px 18px", height: 60, boxSizing: "border-box", maxWidth: "calc(100vw - 24px)" }}>
          <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: 8 }}><LogoMark size={28} /><span style={{ font: "700 19px/1 var(--font-sans)", color: "var(--ink)" }}>AfaqWay</span></Link>

          {/* Desktop nav */}
          <div className="af-nav-desktop" style={{ alignItems: "center", gap: 22 }}>
            {navItems.map((n) => navBtn(n.id, n.label))}
            <span style={{ width: 1, height: 24, background: "var(--line)" }} />
            <button type="button" onClick={() => onNav("chat")} aria-label="Messages" style={{ position: "relative", background: nav === "chat" ? "var(--indigo-tint)" : "none", border: "none", cursor: "pointer", color: nav === "chat" ? "var(--indigo-600)" : "var(--ink-soft)", width: 36, height: 36, borderRadius: 999, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <MessageCircle size={20} />
              {chatUnread && <span style={{ position: "absolute", top: 6, right: 6, width: 9, height: 9, borderRadius: 999, background: "var(--red)", border: "2px solid var(--card)" }} />}
            </button>
            <div style={{ position: "relative" }}>
              <button type="button" onClick={() => setMenu((v) => !v)} aria-label="Profile menu" style={{ width: 36, height: 36, borderRadius: 999, background: "var(--indigo-100)", color: "var(--indigo-600)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", font: "700 14px/1 var(--font-sans)" }}>
                {(fullName || "U").trim().charAt(0).toUpperCase()}
              </button>
              {menu && <ProfileMenu userId={userId} plan={plan} onClose={() => setMenu(false)} onNav={onNav} onSub={() => { setSub(true); setMenu(false); }} onSignOut={signOut} />}
            </div>
          </div>

          {/* Mobile hamburger */}
          <button className="af-hamburger" onClick={() => setMobile((v) => !v)} aria-label="Menu" style={{ background: "none", border: "none", padding: 6, cursor: "pointer", color: "var(--ink-soft)", alignItems: "center" }}>
            {mobile ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {mobile && (
          <>
            <div onClick={() => setMobile(false)} style={{ position: "fixed", inset: 0, zIndex: 15 }} aria-hidden />
            <div style={{ position: "absolute", top: 92, left: "50%", transform: "translateX(-50%)", width: "min(360px, calc(100vw - 24px))", background: "var(--card)", border: "1px solid var(--line)", borderRadius: 16, boxShadow: "0 10px 30px rgba(23,35,58,.12)", padding: 10, zIndex: 20 }}>
              {[...navItems, { id: "chat" as Nav, label: "Messages" }].map((n) => (
                <button key={n.id} type="button" onClick={() => { onNav(n.id); setMobile(false); }} style={rowStyle(nav === n.id)}>{n.label}</button>
              ))}
              <div style={{ height: 1, background: "var(--line-soft)", margin: "6px 0" }} />
              <div style={{ font: "600 11px/16px var(--font-sans)", color: "var(--ink-faint)", padding: "4px 12px" }}>ID {userId ?? "—"}</div>
              <button type="button" onClick={() => { onNav("profile"); setMobile(false); }} style={rowStyle(false)}>Profile</button>
              <button type="button" onClick={() => { setSub(true); setMobile(false); }} style={rowStyle(false)}>Subscription</button>
              <button type="button" onClick={() => { onNav("help"); setMobile(false); }} style={rowStyle(false)}>Help center</button>
              <button type="button" onClick={signOut} style={{ ...rowStyle(false), color: "var(--red)" }}>Sign out</button>
            </div>
          </>
        )}
      </div>
      {sub && <SubscriptionModal plan={plan} onClose={() => setSub(false)} />}
    </>
  );
}

function rowStyle(on: boolean): React.CSSProperties {
  return { width: "100%", textAlign: "left", display: "block", padding: "10px 12px", borderRadius: 9, border: "none", background: on ? "var(--indigo-tint)" : "transparent", color: on ? "var(--indigo-text)" : "var(--ink)", cursor: "pointer", font: "600 14px/20px var(--font-sans)" };
}

function ProfileMenu({ userId, onClose, onNav, onSub, onSignOut }: { userId?: string; plan?: string | null; onClose: () => void; onNav: (n: Nav) => void; onSub: () => void; onSignOut: () => void }) {
  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 30 }} aria-hidden />
      <div style={{ position: "absolute", top: "calc(100% + 10px)", right: 0, minWidth: 220, background: "var(--card)", border: "1px solid var(--line)", borderRadius: 12, boxShadow: "var(--shadow-card)", padding: 6, zIndex: 40 }}>
        <div style={{ padding: "8px 12px", borderBottom: "1px solid var(--line-soft)", marginBottom: 4, font: "600 11px/16px var(--font-sans)", color: "var(--ink-faint)" }}>User ID: <span style={{ color: "var(--ink)" }}>{userId ?? "—"}</span></div>
        <button type="button" onClick={() => { onNav("profile"); onClose(); }} style={rowStyle(false)}>Profile</button>
        <button type="button" onClick={onSub} style={{ ...rowStyle(false), padding: "7px 12px", font: "500 13px/18px var(--font-sans)", color: "var(--ink-soft)" }}>Subscription</button>
        <div style={{ height: 1, background: "var(--line-soft)", margin: "4px 0" }} />
        <button type="button" onClick={() => { onNav("help"); onClose(); }} style={rowStyle(false)}>Help center</button>
        <button type="button" onClick={onSignOut} style={{ ...rowStyle(false), color: "var(--red)" }}>Sign out</button>
      </div>
    </>
  );
}
