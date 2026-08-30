"use client";

/* Payments Review.

   Rebuilt on HeroUI v3, wearing the same `afq-hui` theme as the rest of the
   admin workspace: Card, Tabs, Table, Chip, Avatar, Pagination and Modal do
   the structure. Filters, search, a real Table with pagination and a
   dedicated review Modal replace the old stacked-card list and inline
   reject textarea.

   Viewing a receipt opens it in a new browser tab — the platform's one
   "Preview" action — rather than an in-app viewer, so this module carries
   no viewer state of its own. */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Avatar, Button, Card, Chip, Label, ListBox, Modal, Pagination,
  SearchField, Select, Separator, Skeleton, Table, Tabs, TextArea, TextField, Tooltip,
} from "@heroui/react";
import {
  Clock, CircleX, Eye, Receipt, RotateCcw, ShieldCheck, Wallet,
} from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { Flag } from "@/components/ds";
import { trendBadge } from "@/components/ds";
import { orderedPayMethods, planById, methodById } from "@/lib/plans";
import { COUNTRIES, countryByCode } from "@/components/profile-setup/countries";
import { deleteUserFile, openFilePreview } from "@/lib/storage/client";
import { pageNumbers } from "@/lib/pageNumbers";
import { emailPaymentReceipt } from "@/lib/email/client";
import { ConfirmDialog } from "./ConfirmDialog";

type Payment = {
  id: string; user_id: string; plan: string; amount: number; currency: string; method: string;
  status: string; receipt_path: string | null; reference: string | null; rejection_comment: string | null;
  created_at: string; reviewed_at: string | null;
};
type UserInfo = { full_name: string | null; email: string | null; destination_country: string | null };
type TrendBadge = { value: string; dir: "up" | "down" | "flat" } | undefined;

/* Session-stable clock for the 30/60-day trend windows: the comparison must
   not shift between renders, and it keeps render pure. */
const NOW = Date.now();
const PER_PAGE = 8;

const initials = (n: string | null | undefined) =>
  (n ?? "?").trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase() || "?";

const PSTATUS: Record<string, { label: string; color: "success" | "warning" | "danger" | "default" }> = {
  approved: { label: "Approved", color: "success" },
  under_review: { label: "Under review", color: "warning" },
  rejected: { label: "Rejected", color: "danger" },
  cancelled: { label: "Cancelled", color: "default" },
};
const statusOf = (s: string) => PSTATUS[s] ?? { label: s.charAt(0).toUpperCase() + s.slice(1), color: "default" as const };

const DATE_FILTERS = [
  { id: "all", label: "All time", days: 0 },
  { id: "7", label: "Last 7 days", days: 7 },
  { id: "30", label: "Last 30 days", days: 30 },
  { id: "90", label: "Last 90 days", days: 90 },
];

function Kpi({ label, value, tone, icon, badge, loading }: {
  label: string; value: number; tone: "blue" | "green" | "amber" | "red"; icon: React.ReactNode;
  badge?: TrendBadge; loading: boolean;
}) {
  return (
    <Card className={`pr-kpi pr-t-${tone}`} variant="default">
      <div className="pr-kpi-top">
        <span className="pr-kpi-label">{label}</span>
        <span aria-hidden className="pr-kpi-ico">{icon}</span>
      </div>
      <div className="pr-kpi-bottom">
        {loading ? <Skeleton className="h-7 w-14 rounded-md" /> : <span className="pr-kpi-value">{value.toLocaleString("en-GB")}</span>}
        {!loading && badge && (
          <Chip color={badge.dir === "up" ? "success" : badge.dir === "down" ? "danger" : "default"} size="sm" variant="soft">
            {badge.value}
          </Chip>
        )}
      </div>
    </Card>
  );
}

/* The review interface itself: status and amount lead, then who, then what
   they paid with and what they sent as evidence, then the decision, then the
   history. Everything reads from the row the table already has — nothing is
   re-fetched here. */
function PaymentDetailModal({ payment, user, busy, onClose, onViewReceipt, onDecide }: {
  payment: Payment; user: UserInfo | undefined; busy: boolean;
  onClose: () => void; onViewReceipt: () => void; onDecide: (status: "approved" | "rejected", comment?: string) => void;
}) {
  const [rejecting, setRejecting] = useState(false);
  const [comment, setComment] = useState("");
  const st = statusOf(payment.status);
  const plan = planById(payment.plan);
  const method = methodById(payment.method);
  const pending = payment.status === "under_review";

  return (
    <Modal>
      <Modal.Backdrop isOpen onOpenChange={(open) => { if (!open) onClose(); }}>
        <Modal.Container>
          <Modal.Dialog className="sm:max-w-[480px]">
            <Modal.CloseTrigger />
            <Modal.Header>
              <Modal.Icon className="pr-modal-ico"><Receipt className="size-5" /></Modal.Icon>
              <Modal.Heading>Payment review</Modal.Heading>
            </Modal.Header>

            <Modal.Body>
              {/* 1 — status and amount */}
              <div className="pr-modal-top">
                <span className="pr-modal-amount">
                  {payment.amount.toLocaleString("en-US")} {payment.currency === "MAD" ? "DH" : payment.currency}
                </span>
                <Chip color={st.color} size="sm" variant="soft">{st.label}</Chip>
              </div>

              {/* 2 — the student */}
              <div className="pr-modal-person">
                <Avatar className="size-9">
                  <Avatar.Fallback className="text-xs">{initials(user?.full_name)}</Avatar.Fallback>
                </Avatar>
                <div className="pr-person-id">
                  <span className="pr-person-name">{user?.full_name || "Unnamed user"}</span>
                  <span className="pr-person-mail">{user?.email || payment.user_id}</span>
                </div>
              </div>

              {/* 3, 4 — plan and method */}
              <div className="pr-modal-chips">
                <Chip color="accent" size="sm" variant="soft">{plan?.name ?? payment.plan}</Chip>
                <Chip color="default" size="sm" variant="soft">{method?.name ?? payment.method}</Chip>
                {user?.destination_country && (
                  <Chip color="default" size="sm" variant="soft">
                    {countryByCode(user.destination_country)?.name ?? user.destination_country}
                  </Chip>
                )}
              </div>

              <Separator />

              <dl className="pr-modal-rows">
                <div><dt>Reference</dt><dd>#{(payment.reference ?? payment.id.replace(/-/g, "").slice(0, 8)).toUpperCase()}</dd></div>
              </dl>

              {/* 5 — the evidence */}
              <Button fullWidth isDisabled={!payment.receipt_path} onPress={onViewReceipt} size="sm" variant="secondary">
                <Eye size={14} /> {payment.receipt_path ? "View receipt" : "No receipt on file"}
              </Button>

              {payment.status === "rejected" && payment.rejection_comment && (
                <p className="pr-modal-reason">Reason given: {payment.rejection_comment}</p>
              )}

              {/* 7 — the short, honest history: submitted, then decided */}
              <ul className="pr-modal-timeline">
                <li><Clock size={13} /> Submitted <b>{new Date(payment.created_at).toLocaleString()}</b></li>
                {payment.reviewed_at && (
                  <li><ShieldCheck size={13} /> Reviewed <b>{new Date(payment.reviewed_at).toLocaleString()}</b></li>
                )}
              </ul>

              {/* 6 — the decision, when there is one left to make */}
              {pending && rejecting && (
                <TextField className="pr-modal-reject-field" fullWidth onChange={setComment} value={comment}>
                  <Label>Reason shown to the student</Label>
                  <TextArea placeholder="e.g. amount doesn't match, receipt unreadable…" rows={3} />
                </TextField>
              )}
            </Modal.Body>

            <Modal.Footer className="pr-modal-foot">
              {!pending ? (
                <Button size="sm" slot="close" variant="tertiary">Close</Button>
              ) : rejecting ? (
                <>
                  <Button onPress={() => { setRejecting(false); setComment(""); }} size="sm" variant="tertiary">Back</Button>
                  <Button isDisabled={busy} onPress={() => onDecide("rejected", comment)} size="sm" variant="danger">
                    Confirm reject
                  </Button>
                </>
              ) : (
                <>
                  <Button size="sm" slot="close" variant="tertiary">Close</Button>
                  <Button onPress={() => setRejecting(true)} size="sm" variant="danger-soft">Reject</Button>
                  <Button isDisabled={busy} onPress={() => onDecide("approved")} size="sm" variant="primary">
                    {busy ? "…" : "Approve"}
                  </Button>
                </>
              )}
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}

export default function PaymentReviews({ highlightId, onHighlightDone }: { highlightId?: string | null; onHighlightDone?: () => void } = {}) {
  const [all, setAll] = useState<Payment[]>([]);
  const [users, setUsers] = useState<Record<string, UserInfo>>({});
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"pending" | "history">("pending");
  const [query, setQuery] = useState("");
  const [countryFilter, setCountryFilter] = useState<"all" | string>("all");
  const [planFilter, setPlanFilter] = useState<"all" | "self_service" | "full_service">("all");
  const [methodFilter, setMethodFilter] = useState<"all" | string>("all");
  const [methodSort, setMethodSort] = useState<Record<string, number>>({});
  const [dateFilter, setDateFilter] = useState<"all" | "7" | "30" | "90">("all");
  const [page, setPage] = useState(1);
  const [detail, setDetail] = useState<Payment | null>(null);
  const [busy, setBusy] = useState("");
  const [since, setSince] = useState(0);
  const [askReset, setAskReset] = useState(false);
  const loadedOnce = useRef(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("payments")
      .select("id, user_id, plan, amount, currency, method, status, receipt_path, reference, rejection_comment, created_at, reviewed_at")
      .order("created_at", { ascending: false });
    const list = (data ?? []) as Payment[];
    setAll(list);
    const ids = [...new Set(list.map((r) => r.user_id))];
    if (ids.length) {
      const { data: profs } = await supabase.from("profiles").select("id, full_name, email, destination_country").in("id", ids);
      const map: Record<string, UserInfo> = {};
      (profs ?? []).forEach((p) => {
        const r = p as { id: string; full_name: string | null; email: string | null; destination_country: string | null };
        map[r.id] = { full_name: r.full_name, email: r.email, destination_country: r.destination_country };
      });
      setUsers(map);
    }
    setLoading(false);
    loadedOnce.current = true;
  }, []);
  // Fetching from Supabase is the "subscribe to an external system" case; the
  // state set here is the query result, not derived render state.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void load(); }, [load]);

  /* The Methods filter must list every method in the exact order Payment
     Methods admin shows them — same `sort` column, same order everywhere,
     so a superadmin reordering methods there is never contradicted here. */
  useEffect(() => {
    void (async () => {
      const { data } = await supabase.from("payment_methods").select("id, sort");
      const map: Record<string, number> = {};
      (data ?? []).forEach((r) => { const x = r as { id: string; sort: number }; map[x.id] = x.sort; });
      setMethodSort(map);
    })();
  }, []);

  /* Live, not on reload: a receipt submitted while an admin has this page
     open must appear without navigating away and back. */
  useEffect(() => {
    const ch = supabase
      .channel("admin-payment-reviews")
      .on("postgres_changes", { event: "*", schema: "public", table: "payments" }, () => { void load(); });
    ch.subscribe();
    return () => { void supabase.removeChannel(ch); };
  }, [load]);

  /* A report's "Check" jumps here and opens that exact payment's review
     modal — a more reliable destination than flashing a row once the list
     can be paginated out from under it. */
  useEffect(() => {
    if (!highlightId || !loadedOnce.current) return;
    const pay = all.find((r) => r.id === highlightId);
    if (!pay) return;
    // Reacting to a deep link handed down as a prop, not deriving render state.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTab(pay.status === "under_review" ? "pending" : "history");
    setQuery(""); setCountryFilter("all"); setPlanFilter("all"); setMethodFilter("all"); setDateFilter("all"); setPage(1);
    setDetail(pay);
    onHighlightDone?.();
  }, [highlightId, all, onHighlightDone]);

  const stats = useMemo(() => {
    const after = (t: string | null) => !since || (t ? new Date(t).getTime() >= since : false);
    const now = NOW, day = 86_400_000;
    const window = (rows: Payment[], field: "created_at" | "reviewed_at", from: number, to: number) =>
      rows.filter((r) => { const v = r[field] ? new Date(r[field] as string).getTime() : 0; return v >= from && v < to; }).length;

    const visible = all.filter((r) => after(r.status === "under_review" ? r.created_at : r.reviewed_at));
    const cancelled = visible.filter((r) => r.status === "rejected" || r.status === "cancelled");
    const approved = visible.filter((r) => r.status === "approved");
    const pending = visible.filter((r) => r.status === "under_review");

    const trend = (rows: Payment[], field: "created_at" | "reviewed_at") =>
      trendBadge(window(rows, field, now - 30 * day, now), window(rows, field, now - 60 * day, now - 30 * day));

    return {
      pending: pending.length, approved: approved.length, rejected: cancelled.length, total: visible.length,
      totalTrend: trend(visible, "created_at"), approvedTrend: trend(approved, "reviewed_at"),
      pendingTrend: trend(pending, "created_at"), cancelledTrend: trend(cancelled, "reviewed_at"),
    };
  }, [all, since]);

  const reset = (fn: () => void) => { fn(); setPage(1); };
  const methodOptions = useMemo(() => orderedPayMethods(methodSort), [methodSort]);
  const clearFilters = () => reset(() => {
    setQuery(""); setCountryFilter("all"); setPlanFilter("all"); setMethodFilter("all"); setDateFilter("all");
  });

  const filtered = useMemo(() => {
    const dateCut = DATE_FILTERS.find((d) => d.id === dateFilter)?.days ?? 0;
    const since_ = dateCut ? NOW - dateCut * 86_400_000 : 0;
    const base = all.filter((r) =>
      (tab === "pending" ? r.status === "under_review" : r.status !== "under_review")
      && (countryFilter === "all" || users[r.user_id]?.destination_country === countryFilter)
      && (planFilter === "all" || r.plan === planFilter)
      && (methodFilter === "all" || r.method === methodFilter)
      && (!since_ || new Date(r.created_at).getTime() >= since_));
    const q = query.trim().toLowerCase();
    if (!q) return base;
    return base.filter((r) =>
      (r.reference ?? "").toLowerCase().includes(q)
      || (users[r.user_id]?.email ?? "").toLowerCase().includes(q)
      || (users[r.user_id]?.full_name ?? "").toLowerCase().includes(q));
  }, [all, tab, query, users, countryFilter, planFilter, methodFilter, dateFilter]);

  const pages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const current = Math.min(page, pages);
  const shown = filtered.slice((current - 1) * PER_PAGE, current * PER_PAGE);

  function viewReceipt(path: string | null) {
    if (!path) return;
    void openFilePreview(path);
  }

  async function decide(r: Payment, status: "approved" | "rejected", comment?: string) {
    setBusy(r.id);
    const { data: { user } } = await supabase.auth.getUser();
    const patch: Record<string, unknown> = { status, reviewed_at: new Date().toISOString(), reviewed_by: user?.id };
    if (status === "rejected") {
      patch.rejection_comment = comment?.trim() || "Your receipt could not be verified.";
      if (r.receipt_path) { await deleteUserFile(r.receipt_path).catch(() => {}); patch.receipt_path = null; }
    }
    await supabase.from("payments").update(patch).eq("id", r.id);

    if (status === "approved") {
      const u = users[r.user_id];
      const plan = planById(r.plan);
      const method = methodById(r.method);
      if (u?.email) {
        void emailPaymentReceipt({
          to: u.email, studentName: u.full_name, planName: plan?.name ?? r.plan,
          amount: `${r.amount.toLocaleString("en-US")} ${r.currency === "MAD" ? "DH" : r.currency}`,
          method: method?.name ?? r.method, reference: r.reference,
        });
      }
    }

    setBusy(""); setDetail(null);
    void load();
  }

  return (
    <div className="afq-hui pr-root">
      <header className="pr-head">
        <div>
          <h1 className="pr-head-title">Payments Review</h1>
          <p className="pr-head-sub">Verify receipts, approve or decline, and keep the ledger honest.</p>
        </div>
        <Tooltip>
          <Tooltip.Trigger>
            <Button onPress={() => setAskReset(true)} size="sm" variant="tertiary">
              <RotateCcw size={14} /> Reset stats
            </Button>
          </Tooltip.Trigger>
          <Tooltip.Content>Reset the statistics counters</Tooltip.Content>
        </Tooltip>
      </header>

      {loading ? (
        <div className="pr-skel-kpis">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton className="h-24 w-full rounded-2xl" key={i} />)}
        </div>
      ) : (
        <div className="pr-kpis">
          <Kpi badge={stats.totalTrend} icon={<Wallet size={15} />} label="Total Payments" loading={loading} tone="blue" value={stats.total} />
          <Kpi badge={stats.approvedTrend} icon={<ShieldCheck size={15} />} label="Approved" loading={loading} tone="green" value={stats.approved} />
          <Kpi badge={stats.pendingTrend} icon={<Clock size={15} />} label="Pending" loading={loading} tone="amber" value={stats.pending} />
          <Kpi badge={stats.cancelledTrend} icon={<CircleX size={15} />} label="Cancelled" loading={loading} tone="red" value={stats.rejected} />
        </div>
      )}

      <Card className="pr-card" variant="default">
        <Card.Content className="pr-card-body">
          <Tabs className="pr-tabs" onSelectionChange={(k) => reset(() => setTab(String(k) as "pending" | "history"))} selectedKey={tab}>
            <Tabs.ListContainer>
              <Tabs.List aria-label="Payment status">
                <Tabs.Tab id="pending">Pending ({stats.pending})<Tabs.Indicator /></Tabs.Tab>
                <Tabs.Tab id="history">History<Tabs.Indicator /></Tabs.Tab>
              </Tabs.List>
            </Tabs.ListContainer>
          </Tabs>

          <div className="pr-filters">
            <SearchField aria-label="Search payments" className="pr-search" onChange={(v) => reset(() => setQuery(v))} value={query}>
              <SearchField.Group>
                <SearchField.SearchIcon />
                <SearchField.Input placeholder="Student, email, reference" />
                <SearchField.ClearButton />
              </SearchField.Group>
            </SearchField>

            <Select className="pr-select" onSelectionChange={(k) => reset(() => { setCountryFilter(String(k)); setPlanFilter("all"); })} selectedKey={countryFilter}>
              <Label className="sr-only">Country</Label>
              <Select.Trigger><Select.Value /><Select.Indicator /></Select.Trigger>
              <Select.Popover>
                <ListBox>
                  <ListBox.Item id="all" textValue="All countries">All countries<ListBox.ItemIndicator /></ListBox.Item>
                  {COUNTRIES.map((c) => (
                    <ListBox.Item id={c.code} key={c.code} textValue={c.name}>
                      <span className="pr-opt"><Flag size="sm" stripes={c.stripes} />{c.name}</span>
                      <ListBox.ItemIndicator />
                    </ListBox.Item>
                  ))}
                </ListBox>
              </Select.Popover>
            </Select>

            {countryFilter !== "all" && (
              <Select className="pr-select" onSelectionChange={(k) => reset(() => setPlanFilter(k as typeof planFilter))} selectedKey={planFilter}>
                <Label className="sr-only">Plan</Label>
                <Select.Trigger><Select.Value /><Select.Indicator /></Select.Trigger>
                <Select.Popover>
                  <ListBox>
                    <ListBox.Item id="all" textValue="All plans">All plans<ListBox.ItemIndicator /></ListBox.Item>
                    <ListBox.Item id="self_service" textValue="Self Service">Self Service<ListBox.ItemIndicator /></ListBox.Item>
                    <ListBox.Item id="full_service" textValue="Full Service">Full Service<ListBox.ItemIndicator /></ListBox.Item>
                  </ListBox>
                </Select.Popover>
              </Select>
            )}

            {methodOptions.length > 1 && (
              <Select className="pr-select" onSelectionChange={(k) => reset(() => setMethodFilter(String(k)))} selectedKey={methodFilter}>
                <Label className="sr-only">Method</Label>
                <Select.Trigger><Select.Value /><Select.Indicator /></Select.Trigger>
                <Select.Popover>
                  <ListBox>
                    <ListBox.Item id="all" textValue="All methods">All methods<ListBox.ItemIndicator /></ListBox.Item>
                    {/* Every configured method, not only ones with a receipt on file yet —
                        the roster the filter offers, same as Wallet's own method legend,
                        in the same order Payment Methods admin shows them. */}
                    {methodOptions.map((m) => (
                      <ListBox.Item id={m.id} key={m.id} textValue={m.name}>
                        <span className="pr-opt">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img alt="" className="pr-opt-logo" src={m.logoSrc} />
                          {m.name}
                        </span>
                        <ListBox.ItemIndicator />
                      </ListBox.Item>
                    ))}
                  </ListBox>
                </Select.Popover>
              </Select>
            )}

            <Select className="pr-select" onSelectionChange={(k) => reset(() => setDateFilter(String(k) as typeof dateFilter))} selectedKey={dateFilter}>
              <Label className="sr-only">Date</Label>
              <Select.Trigger><Select.Value /><Select.Indicator /></Select.Trigger>
              <Select.Popover>
                <ListBox>
                  {DATE_FILTERS.map((d) => (
                    <ListBox.Item id={d.id} key={d.id} textValue={d.label}>{d.label}<ListBox.ItemIndicator /></ListBox.Item>
                  ))}
                </ListBox>
              </Select.Popover>
            </Select>
          </div>

          {loading ? (
            <div className="pr-rows-skel">
              {Array.from({ length: 7 }).map((_, i) => <Skeleton className="h-12 w-full rounded-lg" key={i} />)}
            </div>
          ) : (
            <Table aria-label="Payments" variant="secondary">
              <Table.ScrollContainer className="pr-table-wrap">
                <Table.Content aria-label="Payments" className="pr-table">
                  <Table.Header>
                    <Table.Column isRowHeader>Student</Table.Column>
                    <Table.Column>Plan</Table.Column>
                    <Table.Column>Amount</Table.Column>
                    <Table.Column>Method</Table.Column>
                    <Table.Column>Status</Table.Column>
                    <Table.Column>Submitted</Table.Column>
                  </Table.Header>
                  <Table.Body renderEmptyState={() => (
                    <div className="pr-empty">
                      <Wallet size={19} />
                      <p>{tab === "pending" ? "No pending payments right now." : "No processed payments yet."}</p>
                      {(query || countryFilter !== "all" || planFilter !== "all" || methodFilter !== "all" || dateFilter !== "all") && (
                        <Button onPress={clearFilters} size="sm" variant="tertiary">Clear filters</Button>
                      )}
                    </div>
                  )}>
                    {shown.map((r) => {
                      const u = users[r.user_id];
                      const plan = planById(r.plan);
                      const method = methodById(r.method);
                      const st = statusOf(r.status);
                      return (
                        <Table.Row className="pr-row" id={r.id} key={r.id} onAction={() => setDetail(r)}>
                          <Table.Cell>
                            <div className="pr-person">
                              <Avatar className="size-7">
                                <Avatar.Fallback className="text-[10px]">{initials(u?.full_name)}</Avatar.Fallback>
                              </Avatar>
                              <div className="pr-person-id">
                                <span className="pr-person-name">{u?.full_name || "Unnamed user"}</span>
                                <span className="pr-person-mail">{u?.email || r.user_id}</span>
                              </div>
                            </div>
                          </Table.Cell>
                          <Table.Cell>{plan?.name ?? r.plan}</Table.Cell>
                          <Table.Cell className="pr-amount">{r.amount.toLocaleString("en-US")} {r.currency === "MAD" ? "DH" : r.currency}</Table.Cell>
                          <Table.Cell>{method?.name ?? r.method}</Table.Cell>
                          <Table.Cell><Chip color={st.color} size="sm" variant="soft">{st.label}</Chip></Table.Cell>
                          <Table.Cell className="pr-nums">
                            {new Date(r.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}
                          </Table.Cell>
                        </Table.Row>
                      );
                    })}
                  </Table.Body>
                </Table.Content>
              </Table.ScrollContainer>
            </Table>
          )}
        </Card.Content>

        {!loading && pages > 1 && (
          <Card.Footer className="pr-tx-foot">
            <Pagination className="pr-pager" size="sm">
              <Pagination.Summary>
                {(current - 1) * PER_PAGE + 1}–{Math.min(current * PER_PAGE, filtered.length)} of {filtered.length}
              </Pagination.Summary>
              <Pagination.Content>
                <Pagination.Item>
                  <Pagination.Previous isDisabled={current === 1} onPress={() => setPage(current - 1)}>
                    <Pagination.PreviousIcon />
                  </Pagination.Previous>
                </Pagination.Item>
                {pageNumbers(current, pages).map((n, i) => n === "gap" ? (
                  <Pagination.Item key={`gap-${i}`}><Pagination.Ellipsis /></Pagination.Item>
                ) : (
                  <Pagination.Item key={n}>
                    <Pagination.Link isActive={n === current} onPress={() => setPage(n)}>{n}</Pagination.Link>
                  </Pagination.Item>
                ))}
                <Pagination.Item>
                  <Pagination.Next isDisabled={current === pages} onPress={() => setPage(current + 1)}>
                    <Pagination.NextIcon />
                  </Pagination.Next>
                </Pagination.Item>
              </Pagination.Content>
            </Pagination>
          </Card.Footer>
        )}
      </Card>

      {detail && (
        <PaymentDetailModal
          busy={busy === detail.id} onClose={() => setDetail(null)}
          onDecide={(status, comment) => void decide(detail, status, comment)}
          onViewReceipt={() => viewReceipt(detail.receipt_path)}
          payment={detail} user={users[detail.user_id]}
        />
      )}

      {askReset && (
        <ConfirmDialog
          body="The counters go back to zero from now on. Your pending and history of requests are kept."
          confirmLabel="Reset" iconClassName="pr-modal-ico" onClose={() => setAskReset(false)}
          onYes={() => { setSince(Date.now()); setAskReset(false); }} title="Reset the statistics?" tone="warning"
        />
      )}
    </div>
  );
}
