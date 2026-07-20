"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

// A stable per-device id (shared across tabs on the same device via localStorage).
function deviceId(): string {
  try {
    let id = localStorage.getItem("af_device_id");
    if (!id) { id = crypto.randomUUID(); localStorage.setItem("af_device_id", id); }
    return id;
  } catch { return "device"; }
}

// Enforce ONE active session per account in real time: on mount this device claims
// the account (writes its id to profiles.active_session_id); if another device later
// claims it, this device is signed out. Same-device tabs share the id, so they don't
// kick each other.
export function useSingleSession(userId: string | null | undefined) {
  const router = useRouter();
  useEffect(() => {
    if (!userId) return;
    const myId = deviceId();
    let active = true;
    void supabase.from("profiles").update({ active_session_id: myId }).eq("id", userId);
    const ch = supabase.channel(`session-${userId}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "profiles", filter: `id=eq.${userId}` }, (payload) => {
        const other = (payload.new as { active_session_id?: string | null }).active_session_id;
        if (active && other && other !== myId) {
          active = false;
          void supabase.auth.signOut();
          router.replace("/signup?reason=another-device");
        }
      })
      .subscribe();
    return () => { active = false; supabase.removeChannel(ch); };
  }, [userId, router]);
}
