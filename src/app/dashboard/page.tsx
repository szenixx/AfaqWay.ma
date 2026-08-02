"use client";

/* Student workspace entry (Lithuania demo). Auth-guards, loads the profile, then
   mounts the one universal WorkspaceShell. Content adapts to the user's plan
   (self_service vs full_service). See docs/workspace-architecture.md. */

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { Loader } from "@/components/ds";
import { fetchAdminRole } from "@/lib/admin";
import { fileUrl } from "@/lib/storage/client";
import { setAvatarUrl } from "@/lib/avatar";
import { loadAvatarFieldsFor } from "@/lib/avatarProfile";
import WorkspaceShell, { type Nav } from "@/components/student/workspace/WorkspaceShell";
import type { WsProfile, WsPayment } from "@/components/student/workspace/Modules";
import { deriveStudy, deriveAcademic } from "@/lib/studyApplication";
import { useNotificationToasts } from "@/lib/notifications";
import { useChatUnread } from "@/lib/chatUnread";
import { useSingleSession } from "@/lib/useSingleSession";

export default function Dashboard() {
  const router = useRouter();
  const [profile, setProfile] = useState<WsProfile | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [nav, setNav] = useState<Nav>("overview");
  useSingleSession(userId);
  // Live count of advisor messages, cleared while the chat is open.
  const chatUnread = useChatUnread(userId, nav === "messages");

  const buildProfile = useCallback(async (uid: string, userEmail: string | null): Promise<WsProfile | null> => {
    const { data } = await supabase.from("profiles").select("full_name, email, onboarding_completed_at, plan, plan_status, user_number, banned, city, date_of_birth, whatsapp_country_code, whatsapp_number, destination_country, country_flow_answers, avatar_path, tester").eq("id", uid).single();
    const row = (data ?? {}) as Record<string, unknown>;
    if (!data) return null;
    const num = typeof row.user_number === "number" ? row.user_number : 0;
    const cc = (row.whatsapp_country_code as string) || "";
    const wn = (row.whatsapp_number as string) || "";
    const cfa = (row.country_flow_answers as Record<string, unknown> | null) ?? null;
    const study = deriveStudy(cfa, (row.destination_country as string) ?? null);
    const academic = deriveAcademic(cfa);
    const te = (cfa?.timing_education as Record<string, unknown> | undefined);
    const ps = (cfa?.program_setup as Record<string, unknown> | undefined);
    // Avatar columns are read separately so the workspace keeps working before
    // the avatar migration is applied.
    const av = await loadAvatarFieldsFor(uid);
    const avatarPath = (row.avatar_path as string) || "";
    const avatarUrl = avatarPath ? await fileUrl(avatarPath, "avatars", undefined, 86400) : null;
    // One profile picture per user: publish it so every avatar on the platform
    // renders the same image (and updates the moment a new one is uploaded).
    setAvatarUrl(avatarUrl);

    // The latest approved payment = active paid subscription (verified badge,
    // service information card, invoice).
    const { data: payRow } = await supabase.from("payments")
      .select("id, method, amount, currency, created_at, reviewed_at, reference")
      .eq("user_id", uid).eq("status", "approved")
      .order("reviewed_at", { ascending: false }).limit(1).maybeSingle();
    const pr = payRow as Record<string, unknown> | null;
    const payment: WsPayment | null = pr ? {
      id: pr.id as string,
      method: (pr.method as string) ?? "",
      amount: Number(pr.amount ?? 0),
      currency: (pr.currency as string) ?? "MAD",
      createdAt: pr.created_at as string,
      reviewedAt: (pr.reviewed_at as string) ?? null,
      reference: (pr.reference as string) ?? null,
    } : null;

    return {
      fullName: (row.full_name as string) ?? null,
      email: (row.email as string) ?? userEmail ?? null,
      plan: (row.plan as string) ?? null,
      userId: uid,
      profileId: "AWU-" + String(num).padStart(3, "0"),
      city: (row.city as string) ?? null,
      whatsapp: wn ? `${cc} ${wn}`.trim() : null,
      dob: (row.date_of_birth as string) ?? null,
      program: study?.program ?? null,
      study,
      academic,
      avatarUrl,
      diplomaField: (te?.last_degree_field as string) ?? "",
      englishLevel: (ps?.english_level as string) ?? "",
      verified: !!payment,
      payment,
      tester: Boolean(row.tester),
      gender: (av?.gender as string) ?? null,
      avatarSeed: av?.avatar_seed ?? null,
      avatarStyle: av?.avatar_style ?? null,
      avatarType: av?.avatar_type ?? null,
    };
  }, []);

  const reload = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const p = await buildProfile(user.id, user.email ?? null);
    if (p) setProfile(p);
  }, [buildProfile]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace("/signup"); return; }
      const { role } = await fetchAdminRole(user.email);
      if (cancelled) return;
      if (role) { router.replace("/admin"); return; }
      const { data: gate } = await supabase.from("profiles").select("onboarding_completed_at, banned").eq("id", user.id).single();
      if (cancelled) return;
      const g = (gate ?? {}) as Record<string, unknown>;
      if (!gate) { await supabase.auth.signOut(); router.replace("/signup"); return; }
      if (g.banned) { await supabase.auth.signOut(); router.replace("/signup?reason=inactive"); return; }
      if (!g.onboarding_completed_at) { router.replace("/profile-setup"); return; }
      const p = await buildProfile(user.id, user.email ?? null);
      if (cancelled || !p) return;
      setUserId(user.id);
      setProfile(p);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [router, buildProfile]);

  async function signOut() { await supabase.auth.signOut(); router.replace("/signup"); }

  async function onProgramRequest(r: { program: string; university: string; reason: string }) {
    if (!profile) return false;
    const uni = r.university ? ` at ${r.university}` : "";
    const { error } = await supabase.from("admin_reports").insert({
      type: "program_change",
      title: "Program change request",
      body: `${profile.fullName || "A student"} (${profile.profileId}) requests: ${r.program}${uni}. Reason: ${r.reason}`,
      target_page: "users",
      target_id: profile.userId,
    });
    return !error;
  }

  /* Every notification that arrives also floats in from the top of the screen.
     Its action opens the page the notification points at — for a journey
     decision or an advisor message that is the conversation, which then scrolls
     itself to the first unread message. */
  useNotificationToasts(userId, (link) => setNav(link as Nav));

  if (loading || !profile) {
    return <div style={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--paper)" }}><Loader size={56} block label="Loading your workspace" /></div>;
  }

  return (
    <WorkspaceShell
      profile={profile}
      nav={nav}
      onNav={setNav}
      chatUnread={chatUnread}
      onSignOut={signOut}
      onProgramRequest={onProgramRequest}
      onReload={reload}
    />
  );
}
