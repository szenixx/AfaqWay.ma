"use client";

/* User Management.

   Rebuilt on HeroUI v3, wearing the same `afq-hui` theme as the rest of the
   admin workspace: Card, Table, Chip, Avatar, Select, Pagination and Modal do
   the structure. Data and behaviour are unchanged — the same `profiles`
   query, the same plan-change guard, the same ban confirm, the same Program
   modal. The one detail view a row opens — UserDetails — is its own,
   already-built module and is unchanged here; this file is the roster around
   it. */

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Avatar, Button, Card, Chip, Input, Label, ListBox, Modal, Pagination, SearchField, Select,
  Skeleton, Table, Tabs, TextField, Tooltip,
} from "@heroui/react";
import {
  Ban, Check, Download, Eye, GraduationCap, Mail, MessageCircle, Pencil, Users, UserCheck, UserX,
} from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { UserDetails } from "./users/UserDetails";
import { COUNTRIES, countryByCode } from "@/components/profile-setup/countries";
import { plansForCountry, PLAN_LABEL } from "@/config/pricing";
import { planById } from "@/lib/plans";
import { PROGRAMS } from "@/lib/programs/catalog";
import { pageNumbers } from "@/lib/pageNumbers";
import { fetchStatExclusions, isStaffProfile } from "@/lib/admin";
import { trendBadge } from "@/components/ds";
import { ConfirmDialog, type ConfirmTone } from "./ConfirmDialog";

type U = {
  id: string; user_number: number | null; full_name: string | null; email: string | null; city: string | null;
  plan: string | null; banned: boolean; whatsapp_country_code: string | null; whatsapp_number: string | null;
  destination_country: string | null;
};
type PRow = { id: string; banned: boolean; created_at: string | null; plan_status: string | null; plan_activated_at: string | null };
type AdminProgram = { name: string; university: string; price: string; source: "catalog" | "custom" };
type TrendBadge = { value: string; dir: "up" | "down" | "flat" } | undefined;

/* Session-stable clock for the 30/60-day trend windows: the comparison must
   not shift between renders, and it keeps render pure. */
const NOW = Date.now();
const PER_PAGE = 10;

const awu = (n: number | null) => "AWU-" + String(n ?? 0).padStart(3, "0");
const planLabel = (p: string | null) => p === "full_service" ? "Full Service" : p === "self_service" ? "Self Service" : "—";
const initials = (n: string | null) =>
  (n ?? "?").trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase() || "?";

function Kpi({ label, value, tone, icon, badge, control, loading }: {
  label: string; value: number; tone: "blue" | "green" | "red"; icon: React.ReactNode;
  badge?: TrendBadge; control?: React.ReactNode; loading: boolean;
}) {
  return (
    <Card className={`um-kpi um-t-${tone}`} variant="default">
      <div className="um-kpi-top">
        <span className="um-kpi-label">{label}</span>
        <span aria-hidden className="um-kpi-ico">{icon}</span>
      </div>
      <div className="um-kpi-bottom">
        {loading ? <Skeleton className="h-7 w-14 rounded-md" /> : <span className="um-kpi-value">{value.toLocaleString("en-GB")}</span>}
        {!loading && badge && (
          <Chip color={badge.dir === "up" ? "success" : badge.dir === "down" ? "danger" : "default"} size="sm" variant="soft">
            {badge.value}
          </Chip>
        )}
      </div>
      {control && <div className="um-kpi-year">{control}</div>}
    </Card>
  );
}

export default function UserManagement({ initialPlan, initialCountry, title, onOpenChat }: {
  initialPlan?: "self_service" | "full_service"; initialCountry?: string; title?: string; onOpenChat?: (userId: string) => void;
} = {}) {
  const planLock = initialPlan ?? null;
  const countryLock = initialCountry ?? null;
  const [rows, setRows] = useState<U[]>([]);
  const [allProfiles, setAllProfiles] = useState<PRow[]>([]);
  const [year, setYear] = useState(String(new Date(NOW).getFullYear()));
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [edit, setEdit] = useState<U | null>(null);
  const [track, setTrack] = useState<U | null>(null);
  const [program, setProgram] = useState<U | null>(null);
  const [countryFilter, setCountryFilter] = useState<"all" | string>(initialCountry ?? "all");
  const [planFilter, setPlanFilter] = useState<"all" | string>(initialPlan ?? "all");
  const [sortBy, setSortBy] = useState<"recent" | "name" | "plan" | "country">("recent");
  const [page, setPage] = useState(1);
  const [confirm, setConfirm] = useState<{ title: string; body: string; tone: ConfirmTone; onYes: () => void } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    /* Staff, and an explicitly excluded tester account, are left out of both
       the table and the statistics. */
    const staff = await fetchStatExclusions();
    const { data } = await supabase.from("profiles")
      .select("id, user_number, full_name, email, city, plan, banned, whatsapp_country_code, whatsapp_number, destination_country")
      .eq("plan_status", "active").order("plan_activated_at", { ascending: false });
    setRows(((data ?? []) as U[]).filter((u) => !isStaffProfile(staff, u.email)));
    const { data: everyone } = await supabase.from("profiles").select("id, email, banned, created_at, plan_status, plan_activated_at");
    setAllProfiles(((everyone ?? []) as (PRow & { email: string | null })[]).filter((p) => !isStaffProfile(staff, p.email)) as PRow[]);
    setLoading(false);
  }, []);
  // Fetching from Supabase is the "subscribe to an external system" case; the
  // state set here is the query result, not derived render state.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void load(); }, [load]);

  const stats = useMemo(() => {
    const byCountry: Record<string, number> = {};
    rows.forEach((r) => { const c = r.destination_country || "—"; byCountry[c] = (byCountry[c] ?? 0) + 1; });
    return { total: rows.length, banned: rows.filter((r) => r.banned).length, byCountry };
  }, [rows]);

  const cards = useMemo(() => {
    const now = NOW, day = 86_400_000;
    const since = (d: number) => now - d * day;
    const inRange = (t: string | null | undefined, from: number, to: number) => {
      const v = t ? new Date(t).getTime() : 0;
      return v >= from && v < to;
    };
    const total = allProfiles.length;
    const newThisMonth = allProfiles.filter((p) => inRange(p.created_at, since(30), now)).length;
    const newPrevMonth = allProfiles.filter((p) => inRange(p.created_at, since(60), since(30))).length;

    const activeInYear = allProfiles.filter((p) => p.plan_status === "active" && new Date(p.plan_activated_at ?? p.created_at ?? 0).getFullYear() === Number(year)).length;
    const activePrevYear = allProfiles.filter((p) => p.plan_status === "active" && new Date(p.plan_activated_at ?? p.created_at ?? 0).getFullYear() === Number(year) - 1).length;

    const banned = allProfiles.filter((p) => p.banned).length;
    const bannedShare = total ? Math.round((banned / total) * 100) : 0;

    const years = [...new Set(allProfiles.map((p) => new Date(p.plan_activated_at ?? p.created_at ?? 0).getFullYear()).filter((y) => y > 2000))]
      .sort((a, b) => b - a).map((y) => ({ value: String(y), label: String(y) }));

    return {
      total, banned, bannedShare, activeInYear,
      growth: trendBadge(newThisMonth, newPrevMonth), activeGrowth: trendBadge(activeInYear, activePrevYear),
      years: years.length ? years : [{ value: year, label: year }],
    };
  }, [allProfiles, year]);

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) =>
      (!planLock || r.plan === planLock)
      && (countryFilter === "all" || r.destination_country === countryFilter)
      && (planFilter === "all" || r.plan === planFilter)
      && (!q || (r.full_name ?? "").toLowerCase().includes(q) || (r.email ?? "").toLowerCase().includes(q)));
  }, [rows, query, countryFilter, planFilter, planLock]);

  const availablePlans = useMemo(() => plansForCountry(countryFilter === "all" ? null : countryFilter), [countryFilter]);

  const sorted = useMemo(() => {
    const copy = list.slice();
    if (sortBy === "name") copy.sort((a, b) => (a.full_name ?? "").localeCompare(b.full_name ?? ""));
    else if (sortBy === "plan") copy.sort((a, b) => (a.plan ?? "").localeCompare(b.plan ?? ""));
    else if (sortBy === "country") copy.sort((a, b) => (a.destination_country ?? "").localeCompare(b.destination_country ?? ""));
    return copy; // "recent" keeps the query order, newest activation first
  }, [list, sortBy]);

  const pages = Math.max(1, Math.ceil(sorted.length / PER_PAGE));
  const current = Math.min(page, pages);
  const shown = sorted.slice((current - 1) * PER_PAGE, current * PER_PAGE);
  const reset = (fn: () => void) => { fn(); setPage(1); };

  async function patch(id: string, p: Record<string, unknown>) { await supabase.from("profiles").update(p).eq("id", id); void load(); }
  async function saveEdit() {
    if (!edit) return;
    await supabase.from("profiles").update({ full_name: edit.full_name, city: edit.city, whatsapp_number: edit.whatsapp_number }).eq("id", edit.id);
    setEdit(null); void load();
  }
  const askPlanChange = (u: U, v: string) => setConfirm({
    title: "Change this user's plan?", tone: "warning",
    body: "Only change a plan if the user has actually paid for it. Changing a plan the user hasn't paid for is not allowed.",
    onYes: () => { void patch(u.id, { plan: v }); setConfirm(null); },
  });
  const askBan = (u: U) => setConfirm({
    title: u.banned ? "Unban this user?" : "Ban this user?", tone: "danger",
    body: u.banned ? "They will regain access to their workspace." : "They will lose access to their workspace until you unban them.",
    onYes: () => { void patch(u.id, { banned: !u.banned }); setConfirm(null); },
  });

  function exportExcel() {
    const head = ["Name", "ID", "Email", "Plan", "Amount paid", "City", "Chosen country"];
    const body = rows.map((r) => [
      r.full_name ?? "", awu(r.user_number), r.email ?? "", planLabel(r.plan),
      planById(r.plan) ? `${planById(r.plan)!.price} DH` : "", r.city ?? "",
      r.destination_country ? (countryByCode(r.destination_country)?.name ?? r.destination_country) : "",
    ]);
    const csv = [head, ...body].map((row) => row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\r\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `afaqway-paid-users-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <div className={`afq-hui um-root${planLock ? " is-locked" : ""}`}>
      <header className="um-head">
        <div>
          <h1 className="um-head-title">{title ?? "User Management"}</h1>
          <p className="um-head-sub">{sorted.length} of {rows.length} {rows.length === 1 ? "user" : "users"}</p>
        </div>
        {!planLock && (
          <Tooltip>
            <Tooltip.Trigger>
              <Button isDisabled={rows.length === 0} onPress={exportExcel} size="sm" variant="secondary">
                <Download size={14} /> Export Excel
              </Button>
            </Tooltip.Trigger>
            <Tooltip.Content>Download the paid-user roster as CSV</Tooltip.Content>
          </Tooltip>
        )}
      </header>

      {!planLock && (
        /* One wrapper, always: `.um-root` is a 3-row CSS grid (header / this
           block / the table), and a bare Fragment here would hand the grid
           two separate top-level children whenever the country pills also
           render — the pills would land in the table's own `1fr` row and
           stretch to fill it, which is exactly the oversized "Lithuania: 1"
           card this replaces. Wrapping keeps the grid's child count fixed
           at 3 no matter how many countries exist, from zero upward. */
        <div className="um-top">
          {loading ? (
            <div className="um-skel-kpis">
              {Array.from({ length: 3 }).map((_, i) => <Skeleton className="h-24 w-full rounded-2xl" key={i} />)}
            </div>
          ) : (
            <div className="um-kpis">
              <Kpi badge={cards.growth} icon={<Users size={15} />} label="Total Users" loading={loading} tone="blue" value={cards.total} />
              <Kpi
                badge={cards.activeGrowth} icon={<UserCheck size={15} />} label="Active Users" loading={loading} tone="green"
                value={cards.activeInYear}
                control={(
                  <Select className="um-select" onSelectionChange={(k) => setYear(String(k))} selectedKey={year}>
                    <Label className="sr-only">Year</Label>
                    <Select.Trigger><Select.Value /><Select.Indicator /></Select.Trigger>
                    <Select.Popover>
                      <ListBox>
                        {cards.years.map((y) => <ListBox.Item id={y.value} key={y.value} textValue={y.label}>{y.label}<ListBox.ItemIndicator /></ListBox.Item>)}
                      </ListBox>
                    </Select.Popover>
                  </Select>
                )}
              />
              <Kpi
                badge={cards.banned ? { value: `${cards.bannedShare}% of users`, dir: "down" } : undefined}
                icon={<UserX size={15} />} label="Banned Users" loading={loading} tone="red" value={cards.banned}
              />
            </div>
          )}
          {Object.keys(stats.byCountry).length > 0 && (
            <div className="um-countries">
              {Object.entries(stats.byCountry).sort((a, b) => b[1] - a[1]).map(([c, n]) => (
                <Chip color="default" key={c} size="sm" variant="soft">{c === "—" ? "No country" : (countryByCode(c)?.name ?? c)}: {n}</Chip>
              ))}
            </div>
          )}
        </div>
      )}

      <Card className="um-card" variant="default">
        <Card.Content className="um-card-body">
          <div className="um-filters">
            {!countryLock && (
              <Select className="um-select" onSelectionChange={(k) => reset(() => { setCountryFilter(String(k)); setPlanFilter("all"); })} selectedKey={countryFilter}>
                <Label className="sr-only">Country</Label>
                <Select.Trigger><Select.Value /><Select.Indicator /></Select.Trigger>
                <Select.Popover>
                  <ListBox>
                    <ListBox.Item id="all" textValue="All countries">All countries<ListBox.ItemIndicator /></ListBox.Item>
                    {COUNTRIES.filter((c) => c.available).map((c) => (
                      <ListBox.Item id={c.code} key={c.code} textValue={c.name}>{c.name}<ListBox.ItemIndicator /></ListBox.Item>
                    ))}
                  </ListBox>
                </Select.Popover>
              </Select>
            )}
            {!planLock && countryFilter !== "all" && availablePlans.length > 0 && (
              <Select className="um-select" onSelectionChange={(k) => reset(() => setPlanFilter(String(k)))} selectedKey={planFilter}>
                <Label className="sr-only">Plan</Label>
                <Select.Trigger><Select.Value /><Select.Indicator /></Select.Trigger>
                <Select.Popover>
                  <ListBox>
                    <ListBox.Item id="all" textValue="All plans">All plans<ListBox.ItemIndicator /></ListBox.Item>
                    {availablePlans.map((p) => (
                      <ListBox.Item id={p} key={p} textValue={PLAN_LABEL[p]}>{PLAN_LABEL[p]}<ListBox.ItemIndicator /></ListBox.Item>
                    ))}
                  </ListBox>
                </Select.Popover>
              </Select>
            )}
            <Select className="um-select" onSelectionChange={(k) => setSortBy(String(k) as typeof sortBy)} selectedKey={sortBy}>
              <Label className="sr-only">Sort</Label>
              <Select.Trigger><Select.Value /><Select.Indicator /></Select.Trigger>
              <Select.Popover>
                <ListBox>
                  <ListBox.Item id="recent" textValue="Most recent">Most recent<ListBox.ItemIndicator /></ListBox.Item>
                  <ListBox.Item id="name" textValue="Name A–Z">Name A–Z<ListBox.ItemIndicator /></ListBox.Item>
                  <ListBox.Item id="plan" textValue="Plan">Plan<ListBox.ItemIndicator /></ListBox.Item>
                  <ListBox.Item id="country" textValue="Country">Country<ListBox.ItemIndicator /></ListBox.Item>
                </ListBox>
              </Select.Popover>
            </Select>
            <SearchField aria-label="Search by name or email" className="um-search" onChange={(v) => reset(() => setQuery(v))} value={query}>
              <SearchField.Group>
                <SearchField.SearchIcon />
                <SearchField.Input placeholder="Search by name or email" />
                <SearchField.ClearButton />
              </SearchField.Group>
            </SearchField>
          </div>

          {loading ? (
            <div className="um-rows-skel">
              {Array.from({ length: 7 }).map((_, i) => <Skeleton className="h-12 w-full rounded-lg" key={i} />)}
            </div>
          ) : (
            <Table aria-label="Users" variant="secondary">
              <Table.ScrollContainer className="um-table-wrap">
                <Table.Content aria-label="Users" className="um-table">
                  <Table.Header>
                    <Table.Column isRowHeader>User</Table.Column>
                    <Table.Column>Contact</Table.Column>
                    <Table.Column>Country</Table.Column>
                    <Table.Column>Plan</Table.Column>
                    <Table.Column>City</Table.Column>
                    <Table.Column>Controls</Table.Column>
                  </Table.Header>
                  <Table.Body renderEmptyState={() => (
                    <div className="um-empty"><p>No paid users yet. They appear here once a payment is approved.</p></div>
                  )}>
                    {shown.map((u) => (
                      <Table.Row className="um-trow" id={u.id} key={u.id}>
                        <Table.Cell>
                          <div className="um-person">
                            <Avatar className="size-8">
                              <Avatar.Fallback className="text-[11px]">{initials(u.full_name)}</Avatar.Fallback>
                            </Avatar>
                            <div className="um-person-id">
                              <span className="um-person-name">
                                {u.full_name || "Unnamed"}
                                {u.banned && <Chip color="danger" size="sm" variant="soft">Suspended</Chip>}
                              </span>
                              <span className="um-person-num">{awu(u.user_number)}</span>
                            </div>
                          </div>
                        </Table.Cell>
                        <Table.Cell>
                          <div className="um-contact">
                            <span>{u.email || "—"}</span>
                            {u.whatsapp_number && <em>{`${u.whatsapp_country_code ?? ""}${u.whatsapp_number}`}</em>}
                          </div>
                        </Table.Cell>
                        <Table.Cell>{u.destination_country ? (countryByCode(u.destination_country)?.name ?? u.destination_country) : "—"}</Table.Cell>
                        <Table.Cell>
                          <Select
                            className="um-select" onSelectionChange={(k) => askPlanChange(u, String(k))}
                            selectedKey={u.plan ?? undefined}
                          >
                            <Label className="sr-only">Plan</Label>
                            <Select.Trigger><Select.Value /><Select.Indicator /></Select.Trigger>
                            <Select.Popover>
                              <ListBox>
                                <ListBox.Item id="self_service" textValue="Self Service">Self Service<ListBox.ItemIndicator /></ListBox.Item>
                                <ListBox.Item id="full_service" textValue="Full Service">Full Service<ListBox.ItemIndicator /></ListBox.Item>
                              </ListBox>
                            </Select.Popover>
                          </Select>
                        </Table.Cell>
                        <Table.Cell>{u.city || "—"}</Table.Cell>
                        <Table.Cell>
                          <div className="um-controls">
                            <Tooltip>
                              <Tooltip.Trigger>
                                <Button aria-label="View details" isIconOnly onPress={() => setTrack(u)} size="sm" variant="tertiary"><Eye size={14} /></Button>
                              </Tooltip.Trigger>
                              <Tooltip.Content>View details</Tooltip.Content>
                            </Tooltip>
                            <Tooltip>
                              <Tooltip.Trigger>
                                <Button aria-label="Edit details" isIconOnly onPress={() => setEdit(u)} size="sm" variant="secondary"><Pencil size={14} /></Button>
                              </Tooltip.Trigger>
                              <Tooltip.Content>Edit details</Tooltip.Content>
                            </Tooltip>
                            <Tooltip>
                              <Tooltip.Trigger>
                                <Button aria-label="Change program" isIconOnly onPress={() => setProgram(u)} size="sm" variant="secondary"><GraduationCap size={14} /></Button>
                              </Tooltip.Trigger>
                              <Tooltip.Content>Change program / major</Tooltip.Content>
                            </Tooltip>
                            {onOpenChat && (
                              <Tooltip>
                                <Tooltip.Trigger>
                                  <Button aria-label="Chat" isIconOnly onPress={() => onOpenChat(u.id)} size="sm" variant="secondary"><MessageCircle size={14} /></Button>
                                </Tooltip.Trigger>
                                <Tooltip.Content>Chat</Tooltip.Content>
                              </Tooltip>
                            )}
                            <Tooltip>
                              <Tooltip.Trigger>
                                <Button
                                  aria-label="Email" isDisabled={!u.email} isIconOnly size="sm" variant="tertiary"
                                  onPress={() => { if (u.email) window.location.href = `mailto:${u.email}`; }}
                                >
                                  <Mail size={14} />
                                </Button>
                              </Tooltip.Trigger>
                              <Tooltip.Content>Email</Tooltip.Content>
                            </Tooltip>
                            <Tooltip>
                              <Tooltip.Trigger>
                                <Button aria-label={u.banned ? "Unban" : "Ban"} isIconOnly onPress={() => askBan(u)} size="sm" variant="danger-soft"><Ban size={14} /></Button>
                              </Tooltip.Trigger>
                              <Tooltip.Content>{u.banned ? "Unban" : "Ban"}</Tooltip.Content>
                            </Tooltip>
                          </div>
                        </Table.Cell>
                      </Table.Row>
                    ))}
                  </Table.Body>
                </Table.Content>
              </Table.ScrollContainer>
            </Table>
          )}
        </Card.Content>

        {!loading && pages > 1 && (
          <Card.Footer className="um-tx-foot">
            <Pagination size="sm">
              <Pagination.Summary>
                {(current - 1) * PER_PAGE + 1}–{Math.min(current * PER_PAGE, sorted.length)} of {sorted.length}
              </Pagination.Summary>
              <Pagination.Content>
                <Pagination.Item>
                  <Pagination.Previous isDisabled={current === 1} onPress={() => setPage(current - 1)}><Pagination.PreviousIcon /></Pagination.Previous>
                </Pagination.Item>
                {pageNumbers(current, pages).map((n, i) => n === "gap" ? (
                  <Pagination.Item key={`gap-${i}`}><Pagination.Ellipsis /></Pagination.Item>
                ) : (
                  <Pagination.Item key={n}><Pagination.Link isActive={n === current} onPress={() => setPage(n)}>{n}</Pagination.Link></Pagination.Item>
                ))}
                <Pagination.Item>
                  <Pagination.Next isDisabled={current === pages} onPress={() => setPage(current + 1)}><Pagination.NextIcon /></Pagination.Next>
                </Pagination.Item>
              </Pagination.Content>
            </Pagination>
          </Card.Footer>
        )}
      </Card>

      {edit && (
        <Modal>
          <Modal.Backdrop isOpen onOpenChange={(open) => { if (!open) setEdit(null); }}>
            <Modal.Container>
              <Modal.Dialog className="sm:max-w-[440px]">
                <Modal.CloseTrigger />
                <Modal.Header>
                  <Modal.Icon className="um-modal-ico"><Pencil className="size-5" /></Modal.Icon>
                  <Modal.Heading>Edit user</Modal.Heading>
                </Modal.Header>
                <Modal.Body>
                  <div className="um-modal-form">
                    <TextField fullWidth onChange={(v) => setEdit({ ...edit, full_name: v })} value={edit.full_name ?? ""}>
                      <Label>Full name</Label>
                      <Input variant="secondary" />
                    </TextField>
                    <TextField fullWidth onChange={(v) => setEdit({ ...edit, city: v })} value={edit.city ?? ""}>
                      <Label>City</Label>
                      <Input variant="secondary" />
                    </TextField>
                    <TextField fullWidth onChange={(v) => setEdit({ ...edit, whatsapp_number: v })} value={edit.whatsapp_number ?? ""}>
                      <Label>WhatsApp number</Label>
                      <Input variant="secondary" />
                    </TextField>
                  </div>
                </Modal.Body>
                <Modal.Footer className="um-modal-foot">
                  <Button onPress={() => setEdit(null)} size="sm" variant="tertiary">Cancel</Button>
                  <Button onPress={saveEdit} size="sm" variant="primary">Save</Button>
                </Modal.Footer>
              </Modal.Dialog>
            </Modal.Container>
          </Modal.Backdrop>
        </Modal>
      )}

      {track && (
        <UserDetails
          onClose={() => setTrack(null)} onOpenChat={onOpenChat}
          user={{
            id: track.id, user_number: track.user_number, full_name: track.full_name, email: track.email,
            plan: track.plan, city: track.city, destination_country: track.destination_country,
            whatsapp_country_code: track.whatsapp_country_code, whatsapp_number: track.whatsapp_number,
            banned: track.banned,
          }}
        />
      )}
      {program && <ProgramModal onClose={() => setProgram(null)} onSaved={() => setProgram(null)} user={program} />}
      {confirm && (
        <ConfirmDialog
          body={confirm.body} iconClassName={`um-modal-ico um-modal-ico--${confirm.tone}`}
          onClose={() => setConfirm(null)} onYes={confirm.onYes} title={confirm.title} tone={confirm.tone}
        />
      )}
    </div>
  );
}

/* Program change: browse the real programs dataset (like onboarding) OR add a
   custom program name + price. Saved onto the user's profile so it shows in
   their Settings/Profile. */
function ProgramModal({ user, onClose, onSaved }: { user: { id: string; full_name: string | null }; onClose: () => void; onSaved: () => void }) {
  const [tab, setTab] = useState<"browse" | "custom">("browse");
  const [q, setQ] = useState("");
  const [picked, setPicked] = useState<number | null>(null);
  const [customName, setCustomName] = useState("");
  const [customUni, setCustomUni] = useState("");
  const [customPrice, setCustomPrice] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const results = useMemo(() => {
    const s = q.trim().toLowerCase();
    return PROGRAMS.filter((p) => !s || `${p.name} ${p.university} ${p.field}`.toLowerCase().includes(s)).slice(0, 40);
  }, [q]);

  const canSave = tab === "browse" ? picked !== null : (customName.trim().length > 1 && customPrice.trim().length > 0);

  async function save() {
    let data: AdminProgram | null = null;
    if (tab === "browse" && picked !== null) {
      const p = PROGRAMS.find((x) => x.id === picked);
      if (p) data = { name: p.name, university: p.university, price: p.tuition_eur ? `${p.tuition_eur} €/yr` : "—", source: "catalog" };
    } else if (tab === "custom") {
      data = { name: customName.trim(), university: customUni.trim(), price: customPrice.trim(), source: "custom" };
    }
    if (!data) return;
    setSaving(true);
    const { data: cur } = await supabase.from("profiles").select("country_flow_answers").eq("id", user.id).maybeSingle();
    const cfa = ((cur?.country_flow_answers as Record<string, unknown>) ?? {});
    cfa.admin_program = data;
    await supabase.from("profiles").update({ country_flow_answers: cfa }).eq("id", user.id);
    setSaving(false); setSaved(true);
    setTimeout(onSaved, 900);
  }

  return (
    <Modal>
      <Modal.Backdrop isOpen onOpenChange={(open) => { if (!open) onClose(); }}>
        <Modal.Container>
          <Modal.Dialog className="sm:max-w-[560px]">
            <Modal.CloseTrigger />
            <Modal.Header>
              <Modal.Icon className="um-modal-ico"><GraduationCap className="size-5" /></Modal.Icon>
              <Modal.Heading>Change program</Modal.Heading>
            </Modal.Header>
            <Modal.Body>
              <p className="um-head-sub" style={{ margin: "-4px 0 10px" }}>{user.full_name || "User"} · pick from the data or add a custom one</p>

              <Tabs className="um-program-tabs" onSelectionChange={(k) => setTab(String(k) as "browse" | "custom")} selectedKey={tab}>
                <Tabs.ListContainer>
                  <Tabs.List aria-label="Program source">
                    <Tabs.Tab id="browse">Browse programs<Tabs.Indicator /></Tabs.Tab>
                    <Tabs.Tab id="custom">Add custom<Tabs.Indicator /></Tabs.Tab>
                  </Tabs.List>
                </Tabs.ListContainer>
                <Tabs.Panel id="browse" style={{ paddingTop: 12 }}>
                  <TextField fullWidth onChange={setQ} value={q}>
                    <Label className="sr-only">Search programs</Label>
                    <Input placeholder="Search program, university or field" variant="secondary" />
                  </TextField>
                  <div className="um-program-list" style={{ marginTop: 10 }}>
                    {results.map((p) => (
                      <button
                        className={`um-program-row${picked === p.id ? " is-picked" : ""}`} key={p.id}
                        onClick={() => setPicked(p.id)} type="button"
                      >
                        <span className="um-program-ico"><GraduationCap size={15} /></span>
                        <span style={{ flex: 1, minWidth: 0 }}>
                          <span className="um-program-name">{p.name}</span>
                          <span className="um-program-meta">{p.university} · {p.degree} · {p.tuition_eur ? `${p.tuition_eur} €/yr` : "—"}</span>
                        </span>
                        {picked === p.id && <Check color="#2E3BC7" size={16} />}
                      </button>
                    ))}
                    {results.length === 0 && <div className="um-program-empty">No matching programs.</div>}
                  </div>
                </Tabs.Panel>
                <Tabs.Panel id="custom" style={{ paddingTop: 12 }}>
                  <div className="um-modal-form">
                    <TextField fullWidth onChange={setCustomName} value={customName}>
                      <Label>Program name</Label>
                      <Input placeholder="e.g. MSc Data Science" variant="secondary" />
                    </TextField>
                    <TextField fullWidth onChange={setCustomUni} value={customUni}>
                      <Label>University (optional)</Label>
                      <Input placeholder="e.g. Vilnius University" variant="secondary" />
                    </TextField>
                    <TextField fullWidth onChange={setCustomPrice} value={customPrice}>
                      <Label>Tuition price</Label>
                      <Input placeholder="e.g. 4000 €/yr" variant="secondary" />
                    </TextField>
                  </div>
                </Tabs.Panel>
              </Tabs>
            </Modal.Body>
            <Modal.Footer className="um-modal-foot">
              {saved && <span className="um-saved"><Check size={15} />Saved to the user</span>}
              <Button onPress={onClose} size="sm" variant="tertiary">Cancel</Button>
              <Button isDisabled={!canSave || saving} onPress={save} size="sm" variant="primary">{saving ? "Saving…" : "Save program"}</Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
