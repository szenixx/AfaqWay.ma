"use client";

/* What each notification LOOKS like.

   One place, so the popover and anywhere else that lists notifications cannot
   drift apart on which icon or colour a kind gets. Identity is derived from
   the notification's own data — never hardcoded per row — so a kind added to
   the table shows up here with a defined look rather than a generic bell. */

import {
  AlertTriangle, Bell, Calendar, CheckCircle2, CreditCard, FileText,
  MessageCircle, Route, XCircle,
} from "lucide-react";
import { LogoMark } from "@/components/ds/LogoMark";
import type { Notification } from "@/lib/notifications";

/** The stage outcome a journey notification refers to, when it carries one. */
export type JourneyStatus = "approved" | "rejected" | "changes";

export type NotifIdentity = {
  /** Drives the tile's colour via a data attribute, never an inline style. */
  tone: "brand" | "green" | "red" | "amber" | "grey" | "indigo" | "purple";
  icon: React.ReactNode;
};

/* The status rides in `meta`, not in the title.
 *
 * journeyNotify deliberately keeps the wording generic — the verdict belongs
 * in the conversation, next to the step it concerns and with a reply box under
 * it, and duplicating it here gave the student two copies of the same news.
 * That decision stands: the colour differentiates the row at a glance while
 * the words still send them to the conversation to read it properly.
 *
 * Reading `meta` defensively means a row written before the column existed
 * simply comes back without a status and takes the neutral journey identity. */
export function journeyStatus(n: Notification): JourneyStatus | null {
  const s = n.meta?.status;
  return s === "approved" || s === "rejected" || s === "changes" ? s : null;
}

const JOURNEY: Record<JourneyStatus, NotifIdentity> = {
  approved: { tone: "green", icon: <CheckCircle2 size={16} /> },
  rejected: { tone: "red", icon: <XCircle size={16} /> },
  changes: { tone: "amber", icon: <AlertTriangle size={16} /> },
};

export function notifIdentity(n: Notification): NotifIdentity {
  switch (n.kind) {
    /* Platform news, in the platform's own mark. The one notification type
       that speaks as AfaqWay rather than about the student's file. */
    case "update":
      return { tone: "brand", icon: <LogoMark size={17} color="currentColor" /> };

    /* Still a journey notification whatever the outcome: the route icon is
       what says WHICH kind it is, and only when a status is attached does the
       icon change to say how it went. */
    case "journey": {
      const s = journeyStatus(n);
      return s ? JOURNEY[s] : { tone: "indigo", icon: <Route size={16} /> };
    }

    /* Advisor-message reminders. Grey on purpose, so an unanswered message
       reads as a nudge and never competes with a platform announcement or a
       decision on the student's file. */
    case "message":
      return { tone: "grey", icon: <MessageCircle size={16} /> };

    case "document": return { tone: "purple", icon: <FileText size={16} /> };
    case "schedule": return { tone: "indigo", icon: <Calendar size={16} /> };
    case "payment": return { tone: "green", icon: <CreditCard size={16} /> };
    default: return { tone: "grey", icon: <Bell size={16} /> };
  }
}
