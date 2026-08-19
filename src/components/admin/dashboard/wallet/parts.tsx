"use client";

/* Shared vocabulary for the wallet page: money, status and method naming.

   One place, because a status chip in the table, a row in the attention queue
   and a line in the details modal must never disagree about what "under
   review" looks like. */

import { methodById } from "@/lib/plans";
import type { Payment } from "@/components/admin/dashboard/kit";

/* The platform bills in dirhams. Amounts are whole units — there are no
   fractional receipts in this table — so no decimals are invented. */
export const money = (n: number | null | undefined) =>
  `${Math.round(n ?? 0).toLocaleString("en-GB")} DH`;

export const methodName = (m: string | null) => methodById(m)?.name ?? m ?? "—";

export const planLabel = (p: string | null) =>
  p === "full_service" ? "Full Service" : p === "self_service" ? "Self Service" : "—";

/* The four states the `payments` table actually writes. Anything else falls
   through to neutral rather than being guessed at. */
export const STATUS = {
  approved:     { label: "Completed", color: "success" as const },
  under_review: { label: "Pending",   color: "warning" as const },
  rejected:     { label: "Failed",    color: "danger"  as const },
  refunded:     { label: "Refunded",  color: "default" as const },
};

export const statusOf = (s: string) =>
  STATUS[s as keyof typeof STATUS] ?? { label: s || "—", color: "default" as const };

/* Money moves one way in this ledger: a receipt is income. "Credit" is the
   approved receipt, anything not approved has not moved money yet. */
export const isCredit = (p: Payment) => p.status === "approved";

export const dateShort = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short" });

export const dateLong = (iso: string) =>
  new Date(iso).toLocaleString("en-GB", {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });

/* A receipt has no human-facing reference of its own, so the row is keyed by
   the first block of its uuid — stable, short, and enough for an admin to
   quote back when two receipts look alike. */
export const reference = (p: Payment) => `#${p.id.replace(/-/g, "").slice(0, 8).toUpperCase()}`;

export const initials = (n: string | null | undefined) =>
  (n ?? "?").trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase() || "?";
