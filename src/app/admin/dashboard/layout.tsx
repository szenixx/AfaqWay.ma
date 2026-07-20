"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import { fetchAdminRole } from "@/lib/admin";
import { LogoMark } from "@/components/hero/OnboardingHeroPanel";

const svg = (d: React.ReactNode) => <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" style={{ flex: "none" }}>{d}</svg>;
const NAV = [
  { href: "/admin/dashboard/overview", label: "Overview", icon: svg(<><rect x="3" y="3" width="6" height="7" rx="1.5" /><rect x="11" y="3" width="6" height="4" rx="1.5" /><rect x="11" y="10" width="6" height="7" rx="1.5" /><rect x="3" y="13" width="6" height="4" rx="1.5" /></>) },
  { href: "/admin/dashboard/wallet", label: "Wallet", icon: svg(<><rect x="3" y="5" width="14" height="11" rx="2.5" /><path d="M3 8h14M13.5 12h.01" /></>) },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace("/signup"); return; }
      const { role } = await fetchAdminRole(user.email);
      if (cancelled) return;
      if (!role) { router.replace("/dashboard"); return; }
      setReady(true);
    })();
    return () => { cancelled = true; };
  }, [router]);

  if (!ready) return <div style={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", background: "#EBEEF4", color: "var(--ink-faint)", font: "400 15px var(--font-sans)" }}>Loading dashboard…</div>;

  const today = new Date().toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="dash-root">
      <div className="dash-shell">
        <aside className="dash-sidebar">
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 8px" }}>
            <span style={{ width: 34, height: 34, borderRadius: 11, flex: "none", background: "var(--indigo-tint)", display: "flex", alignItems: "center", justifyContent: "center" }}><LogoMark size={20} /></span>
            <div>
              <div style={{ font: "700 14px/1 var(--font-sans)", color: "var(--ink)" }}>AfaqWay</div>
              <div style={{ font: "600 9px/13px var(--font-sans)", letterSpacing: ".06em", textTransform: "uppercase", color: "var(--indigo-600)", marginTop: 2 }}>Dashboard</div>
            </div>
          </div>
          <nav style={{ display: "flex", flexDirection: "column", gap: 5, flex: 1 }}>
            {NAV.map((n) => (
              <Link key={n.href} href={n.href} className={`dash-navitem${pathname === n.href ? " active" : ""}`}>{n.icon}{n.label}</Link>
            ))}
          </nav>
          <Link href="/admin" className="dash-navitem" style={{ color: "var(--ink-soft)" }}>
            {svg(<path d="M12 5l-5 5 5 5M7 10h9" />)}Back to console
          </Link>
        </aside>

        <div className="dash-main">
          <header className="dash-header">
            <div style={{ minWidth: 0 }}>
              <div style={{ font: "700 17px/22px var(--font-sans)", color: "var(--ink)" }}>{pathname?.endsWith("wallet") ? "Wallet Management" : "Overall Management"}</div>
              <div style={{ font: "400 12px/16px var(--font-sans)", color: "var(--ink-faint)" }}>{today}</div>
            </div>
            <div style={{ marginLeft: "auto", display: "inline-flex", background: "var(--subtle)", border: "1px solid var(--line)", borderRadius: 999, padding: 3 }}>
              {NAV.map((n) => (
                <Link key={n.href} href={n.href} style={{ height: 32, padding: "0 16px", display: "inline-flex", alignItems: "center", borderRadius: 999, font: "600 12.5px/1 var(--font-sans)", textDecoration: "none", background: pathname === n.href ? "var(--card)" : "transparent", color: pathname === n.href ? "var(--indigo-600)" : "var(--ink-soft)", boxShadow: pathname === n.href ? "var(--shadow-card)" : "none" }}>{n.label}</Link>
              ))}
            </div>
          </header>
          <div className="dash-content">{children}</div>
        </div>
      </div>
    </div>
  );
}
