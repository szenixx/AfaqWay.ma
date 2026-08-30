"use client";

import { useCallback, useEffect, useState } from "react";
import { Bell, Check, MessageCircle, Send, Clock3, TriangleAlert, Mail } from "lucide-react";
import { Button, Chip, Skeleton, Tooltip } from "@heroui/react";
import { supabase } from "@/lib/supabase/client";
import { whatsappLink, whatsappNumber, markWhatsAppSent, type WhatsAppRow } from "@/lib/whatsapp";

/* Everything the journey has said, or is about to say, to one student.
 *
 * The outbox is the record that the platform INTENDED to send something, on
 * every channel, before any transport exists. Platform notifications and chat
 * messages are delivered by the sweep; WhatsApp and email have no sender yet and
 * park as "ready".
 *
 * That queue would be invisible without this card, which is the failure mode
 * worth avoiding: a student waiting on a WhatsApp reminder that is sitting in a
 * table nobody looks at. Until the API is connected, an administrator can send
 * any ready message by hand from here, with the exact wording the automation
 * would have used, and mark it sent so it does not go twice.
 */

type Row = WhatsAppRow & { channel: string; kind: string };

const CHANNEL_ICON: Record<string, typeof Bell> = {
  platform: Bell, chat: MessageCircle, whatsapp: Send, email: Mail,
};

/** How each queue state reads, in HeroUI's Chip colour vocabulary. */
const STATE: Record<string, { label: string; color: "success" | "warning" | "default" | "danger" }> = {
  sent: { label: "Sent", color: "success" },
  ready: { label: "Waiting to send", color: "warning" },
  pending: { label: "Scheduled", color: "default" },
  failed: { label: "Failed", color: "danger" },
  cancelled: { label: "Withdrawn", color: "default" },
};

const when = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "—";

export function OutboxCard({ userId, phone }: { userId: string; phone: string }) {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("journey_outbox")
      .select("id, user_id, event, channel, kind, title, body, link, state, due_at, sent_at, error, created_at")
      .eq("user_id", userId)
      .order("due_at", { ascending: false })
      .limit(40);
    setRows((data ?? []) as Row[]);
    setLoading(false);
  }, [userId]);
  // Reading from Supabase; the state here is the query result.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void load(); }, [load]);

  /* The manual route, until the WhatsApp API is connected: open wa.me with the
     exact text the automation wrote, then record that it went. */
  const sendByHand = async (row: Row) => {
    setBusy(row.id);
    window.open(whatsappLink(phone, row.body), "_blank", "noopener,noreferrer");
    await markWhatsAppSent(row.id);
    await load();
    setBusy(null);
  };

  if (loading) return <Skeleton className="h-24 w-full rounded-2xl" />;

  const waiting = rows.filter((r) => r.state === "ready").length;

  return (
    <div className="afq-mini-card">
      <div className="afq-mini-head">
        <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
          <Chip color="warning" size="sm" variant="soft"><Send size={13} /></Chip>
          <div style={{ minWidth: 0 }}>
            <div className="afq-mini-title">Automated messages</div>
            <div className="afq-mini-sub">
              {rows.length === 0
                ? "Nothing has been queued for this student yet."
                : waiting > 0
                  ? `${waiting} waiting for a channel that is not connected yet.`
                  : "Everything queued has been delivered or scheduled."}
            </div>
          </div>
        </div>
      </div>

      {rows.length > 0 && (
        <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 4 }}>
          {rows.map((row) => {
            const Icon = CHANNEL_ICON[row.channel] ?? Bell;
            const meta = STATE[row.state] ?? { label: row.state, color: "default" as const };
            const sendable = row.channel === "whatsapp" && (row.state === "ready" || row.state === "failed");
            return (
              <li className="afq-queue-row" key={row.id} style={{ cursor: "default" }}>
                <span aria-hidden style={{ flex: "none", color: "#8695AB" }}><Icon size={14} /></span>
                <span className="afq-queue-id">
                  <span className="afq-queue-name">{row.title || row.event}</span>
                  <span className="afq-queue-meta">{row.body.split("\n").filter(Boolean)[0]}</span>
                  <span className="afq-mini-sub">
                    {row.channel} · {row.state === "sent" ? `sent ${when(row.sent_at)}` : `due ${when(row.due_at)}`}
                    {row.error && ` · ${row.error}`}
                  </span>
                </span>
                <Chip color={meta.color} size="sm" variant="soft">{meta.label}</Chip>
                {sendable && (
                  <Tooltip isDisabled={!!phone}>
                    <Tooltip.Trigger>
                      <Button isDisabled={busy === row.id || !phone} onPress={() => sendByHand(row)} size="sm" variant="secondary">
                        <Check size={13} /> {busy === row.id ? "Opening…" : "Send now"}
                      </Button>
                    </Tooltip.Trigger>
                    <Tooltip.Content>This student has no WhatsApp number on file.</Tooltip.Content>
                  </Tooltip>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {waiting > 0 && !phone && (
        <p className="afq-dialog-desc"><TriangleAlert size={13} /> No WhatsApp number on this profile, so the waiting messages cannot be sent by hand.</p>
      )}
      {rows.some((r) => r.state === "pending") && (
        <p className="afq-dialog-desc"><Clock3 size={13} /> Scheduled messages are delivered by the database sweep, every five minutes.</p>
      )}
    </div>
  );
}

/** Convenience wrapper: builds the wa.me number from the profile fields. */
export function outboxPhone(user: { whatsapp_country_code?: string | null; whatsapp_number?: string | null }) {
  return whatsappNumber(user);
}

export default OutboxCard;
