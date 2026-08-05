"use client";

import { toast } from "sonner";
import {
  CheckCircle2, XCircle, AlertTriangle, FileText, Route,
  MessageCircle, CreditCard, Megaphone, Calendar, Bell,
} from "lucide-react";
import { createElement } from "react";
import type { Notification } from "./notifications";

/* Sonner is used verbatim here — its own icons, frame, type, animation, not
 * the platform design system. That's deliberate for this one surface (the
 * user asked for sonner's own look, not a re-skin), unlike the ds Toast used
 * everywhere else in the app.
 *
 * A notification row only carries `kind` reliably; the specific outcome
 * (approved / rejected / needs changes) is folded into `title` by whichever
 * write created it (see journeyDb.reviewDocument, journeyNotify.notify) —
 * journey decisions are intentionally generic at the notification-centre
 * level ("no outcome, no advisor"), so keyword sniffing only sharpens the
 * icon for the kinds that actually spell it out (documents today). */

type Verdict = "approved" | "rejected" | "changes";

function verdictOf(text: string): Verdict | null {
  const t = text.toLowerCase();
  if (/\breject/.test(t)) return "rejected";
  if (/\bneeds? changes?\b|\bchanges? requested\b/.test(t)) return "changes";
  if (/\bapprov|\bverified\b|\baccepted\b/.test(t)) return "approved";
  return null;
}

const ICON_SIZE = 18;

/* Explicit hex, not DS tokens — this surface is the one place asked to stay
 * outside the design system. Four hues only, one per bucket, never blue. */
const HUE = { green: "#16A34A", orange: "#F97316", yellow: "#CA8A04", red: "#DC2626" };

/** `onOpen` is called with the notification's own `link` if the reader clicks
 *  the toast's action — a notification must never be a dead end, same rule
 *  the ds Toast followed. */
export function raiseSonnerNotification(n: Notification, onOpen?: (link: string) => void) {
  const action = n.link && onOpen ? { label: "Open", onClick: () => onOpen(n.link) } : undefined;
  const opts = { description: n.body || undefined, action };
  const icon = (Glyph: typeof CheckCircle2, color: string) => createElement(Glyph, { size: ICON_SIZE, color, strokeWidth: 2.25 });

  const verdict = verdictOf(`${n.title} ${n.body ?? ""}`);
  if (verdict === "approved") return void toast(n.title, { ...opts, icon: icon(CheckCircle2, HUE.green) });
  if (verdict === "rejected") return void toast(n.title, { ...opts, icon: icon(XCircle, HUE.red) });
  if (verdict === "changes") return void toast(n.title, { ...opts, icon: icon(AlertTriangle, HUE.orange) });

  const ICON_BY_KIND: Record<Notification["kind"], typeof CheckCircle2> = {
    document: FileText, journey: Route, message: MessageCircle,
    payment: CreditCard, update: Megaphone, schedule: Calendar, system: Bell,
  };
  toast(n.title, { ...opts, icon: icon(ICON_BY_KIND[n.kind] ?? Bell, HUE.yellow) });
}
