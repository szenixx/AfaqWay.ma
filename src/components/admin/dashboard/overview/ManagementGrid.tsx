"use client";

/* The management row: the students table (≈62%) beside the two queues that
   tell an admin what to do next (≈38%, stacked). */

import { Avatar, Button, Card, Chip, Skeleton, Table, Tooltip } from "@heroui/react";
import { ArrowRight, MessageSquare, Receipt } from "lucide-react";
import { countryByCode } from "@/components/profile-setup/countries";
import type { Student } from "./data";

const initials = (n: string | null) =>
  (n ?? "?").trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase() || "?";

const planLabel = (p: string | null) =>
  p === "full_service" ? "Full Service" : p === "self_service" ? "Self Service" : "—";

/* ── Recent Students ────────────────────────────────────────────────────── */

export function RecentStudentsTable({ rows, loading, onOpen }: {
  rows: Student[]; loading: boolean; onOpen: (id: string) => void;
}) {
  const shown = rows.slice(0, 7);
  return (
    <Card className="ao-card ao-students" variant="default">
      <Card.Header className="ao-card-head">
        <div>
          <Card.Title>Recent Students</Card.Title>
          <Card.Description>Latest registrations</Card.Description>
        </div>
        <Button size="sm" variant="tertiary" onPress={() => onOpen("")}>
          View all <ArrowRight size={14} />
        </Button>
      </Card.Header>

      <Card.Content className="ao-table-wrap">
        {loading ? (
          <div className="ao-rows-skel">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-11 w-full rounded-lg" />)}
          </div>
        ) : (
          <Table aria-label="Recent students" variant="secondary">
            <Table.ScrollContainer>
              <Table.Content aria-label="Recent students" className="ao-table">
                <Table.Header>
                  <Table.Column isRowHeader>Name</Table.Column>
                  <Table.Column>Destination</Table.Column>
                  <Table.Column>Plan</Table.Column>
                  <Table.Column>Status</Table.Column>
                  <Table.Column>Joined</Table.Column>
                </Table.Header>
                <Table.Body
                  renderEmptyState={() => (
                    <div className="ao-empty">No students have registered yet.</div>
                  )}
                >
                  {shown.map((s) => (
                    <Table.Row key={s.id} id={s.id} className="ao-trow" onAction={() => onOpen(s.id)}>
                      <Table.Cell>
                        <div className="ao-person">
                          <Avatar className="size-7">
                            <Avatar.Fallback className="text-[10px]">{initials(s.full_name)}</Avatar.Fallback>
                          </Avatar>
                          <div className="ao-person-id">
                            <span className="ao-person-name">{s.full_name || "Unnamed"}</span>
                            <span className="ao-person-mail">{s.email ?? "—"}</span>
                          </div>
                        </div>
                      </Table.Cell>
                      <Table.Cell>
                        {s.destination_country
                          ? (countryByCode(s.destination_country)?.name ?? s.destination_country)
                          : "—"}
                      </Table.Cell>
                      <Table.Cell>{planLabel(s.plan)}</Table.Cell>
                      <Table.Cell>
                        <Chip
                          color={s.plan_status === "active" ? "success" : "default"}
                          size="sm" variant="soft"
                        >
                          {s.plan_status === "active" ? "ACTIVE" : "LEAD"}
                        </Chip>
                      </Table.Cell>
                      <Table.Cell className="ao-nums">
                        {new Date(s.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}
                      </Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table.Content>
            </Table.ScrollContainer>
          </Table>
        )}
      </Card.Content>
    </Card>
  );
}

/* ── Payment Reviews ──────────────────────────────────────────────────────
   The live receipt queue, reading the same `payments` table the Payment
   Reviews page writes to — a receipt submitted while this page is open shows
   up on its own. When the queue is clear the card shows the most recent
   decisions instead of going blank, and the count top-right is the full
   history so an admin can see the queue in proportion. */

const MONEY = (a: number | null, c: string | null) =>
  `${(a ?? 0).toLocaleString("en-GB")} ${c ?? "MAD"}`;

const STATUS_CHIP = {
  approved: { color: "success" as const, label: "Approved" },
  rejected: { color: "danger" as const, label: "Rejected" },
  pending: { color: "warning" as const, label: "Pending" },
};

type Review = {
  id: string; user_id: string; studentName: string;
  amount: number | null; currency: string | null; method: string | null;
  status: string; created_at: string; isNew: boolean;
};

export function PaymentReviewsCard({ payments, loading, onReview }: {
  payments: { waiting: Review[]; recent: Review[]; total: number; approved: number };
  loading: boolean; onReview: (id?: string) => void;
}) {
  const queue = payments.waiting;
  const showing = queue.length ? queue : payments.recent;

  return (
    <Card className="ao-card ao-pending" variant="default">
      <Card.Header className="ao-card-head">
        <div>
          <Card.Title>Payment Reviews</Card.Title>
          <Card.Description>
            {queue.length ? `${queue.length} awaiting your decision` : "Queue is clear"}
          </Card.Description>
        </div>
        {!loading && (
          <Tooltip>
            <Tooltip.Trigger>
              <Chip color={queue.length ? "warning" : "default"} size="sm" variant="soft">
                {payments.total}
              </Chip>
            </Tooltip.Trigger>
            <Tooltip.Content>{payments.total} receipts all time · {payments.approved} approved</Tooltip.Content>
          </Tooltip>
        )}
      </Card.Header>

      <Card.Content className="ao-queue">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10 w-full rounded-lg" />)
        ) : showing.length === 0 ? (
          <p className="ao-empty">No receipts have been submitted yet.</p>
        ) : (
          showing.slice(0, 4).map((r) => {
            const st = STATUS_CHIP[r.status as keyof typeof STATUS_CHIP] ?? STATUS_CHIP.pending;
            return (
              <button key={r.id} type="button" className="ao-queue-row" onClick={() => onReview(r.id)}>
                <span className="ao-queue-ico ao-t-warning" aria-hidden><Receipt size={14} /></span>
                <div className="ao-queue-id">
                  <span className="ao-queue-label">
                    <span>{r.studentName}</span>
                    {r.isNew && <em className="ao-new">NEW</em>}
                  </span>
                  <span className="ao-queue-count">
                    {MONEY(r.amount, r.currency)}{r.method ? ` · ${r.method}` : ""}
                  </span>
                </div>
                {r.status === "pending"
                  ? <Chip color="warning" size="sm" variant="primary">Review</Chip>
                  : <Chip color={st.color} size="sm" variant="soft">{st.label}</Chip>}
              </button>
            );
          })
        )}
      </Card.Content>
    </Card>
  );
}

/* ── Awaiting Reply ───────────────────────────────────────────────────────
   One number: how many students have written in and are still waiting for an
   admin to open the message. `seen_at` is null on those messages, so this is
   read straight from the chat table rather than estimated. */

export function AwaitingReply({ awaiting, loading, onOpen }: {
  awaiting: { count: number; users: { id: string; name: string; at: string }[] };
  loading: boolean; onOpen: (userId?: string) => void;
}) {
  const n = awaiting.count;
  return (
    <Card className="ao-card ao-await" variant="default">
      <Card.Header className="ao-card-head">
        <div>
          <Card.Title>Waiting for a reply</Card.Title>
          <Card.Description>Messages no admin has opened</Card.Description>
        </div>
        <Button size="sm" variant="tertiary" onPress={() => onOpen()} aria-label="Open messages">
          <MessageSquare size={14} />
        </Button>
      </Card.Header>

      <Card.Content className="ao-await-body">
        {loading ? (
          <Skeleton className="h-12 w-20 rounded-lg" />
        ) : (
          <>
            <button
              type="button" className={`ao-await-num${n > 0 ? " on" : ""}`}
              onClick={() => onOpen(awaiting.users[0]?.id)}
              disabled={n === 0}
            >
              {n}
            </button>
            <span className="ao-await-cap">
              {n === 0 ? "Nobody is waiting" : n === 1 ? "student is waiting" : "students are waiting"}
            </span>
          </>
        )}

        {!loading && n > 0 && (
          <ul className="ao-await-list">
            {awaiting.users.slice(0, 3).map((u) => (
              <li key={u.id}>
                <button type="button" onClick={() => onOpen(u.id)}>
                  <Avatar className="size-6">
                    <Avatar.Fallback className="text-[9px]">{initials(u.name)}</Avatar.Fallback>
                  </Avatar>
                  <span className="ao-await-name">{u.name}</span>
                  <ArrowRight size={13} />
                </button>
              </li>
            ))}
            {awaiting.users.length > 3 && (
              <li className="ao-await-more">+{awaiting.users.length - 3} more</li>
            )}
          </ul>
        )}
      </Card.Content>
    </Card>
  );
}
