"use client";

import { supabase } from "@/lib/supabase/client";

/* Client entry point for the subscription invoice. The PDF itself is built on
   the server from the caller's own records (see /api/invoice). */

export async function downloadInvoice(): Promise<void> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error("You are signed out. Please sign in again.");

  const res = await fetch("/api/invoice", { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error ?? "Could not generate your invoice.");
  }

  const blob = await res.blob();
  const name = /filename="([^"]+)"/.exec(res.headers.get("content-disposition") ?? "")?.[1] ?? "AfaqWay-invoice.pdf";
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
}
