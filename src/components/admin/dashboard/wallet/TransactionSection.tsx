"use client";

/* Transactions — the operational half of the wallet.

   Filters, a HeroUI Table and pagination over the receipts the wallet query
   already pulled. Everything is client-side over that window: no new query,
   no new business logic, and the same rows the old MiniTable showed. */

import { useMemo, useState } from "react";
import {
  Avatar, Button, Card, Chip, Label, ListBox, Pagination,
  SearchField, Select, Skeleton, Table,
} from "@heroui/react";
import { ArrowDownLeft, ArrowUpRight, Receipt } from "lucide-react";
import type { Payment } from "@/components/admin/dashboard/kit";
import { countryByCode } from "@/components/profile-setup/countries";
import { planById } from "@/lib/plans";
import { dateShort, initials, isCredit, methodName, money, planLabel, reference, statusOf } from "./parts";

const PER_PAGE = 8;

/* First, last, and the window around the current page. Anything longer gets an
   ellipsis rather than a row of numbers nobody reads. */
function pageNumbers(current: number, total: number): (number | "gap")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const out: (number | "gap")[] = [1];
  if (current > 3) out.push("gap");
  for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) out.push(i);
  if (current < total - 2) out.push("gap");
  out.push(total);
  return out;
}

const STATUS_FILTERS = [
  { id: "all", label: "All statuses" },
  { id: "approved", label: "Completed" },
  { id: "under_review", label: "Pending" },
  { id: "rejected", label: "Failed" },
];


export function TransactionSection({ rows, names, countryOf, loading, onOpen }: {
  rows: Payment[];
  names: Record<string, string>;
  /* student id → destination code. Whatever destinations the platform is
     actually selling, nothing hard-coded. */
  countryOf: Record<string, string>;
  loading: boolean;
  onOpen: (p: Payment) => void;
}) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [plan, setPlan] = useState("all");
  const [country, setCountry] = useState("all");
  const [page, setPage] = useState(1);

  /* Built from the data, so a new destination appears the day its first
     receipt lands and no country is privileged in the code. */
  const countries = useMemo(() => {
    const seen = new Map<string, string>();
    rows.forEach((p) => {
      const c = countryOf[p.user_id];
      if (c && !seen.has(c)) seen.set(c, countryByCode(c)?.name ?? c);
    });
    return [...seen].sort((a, b) => a[1].localeCompare(b[1]));
  }, [rows, countryOf]);

  /* The plans this destination is actually sold under. A country with one plan
     has nothing to choose between, so the control never appears for it — and a
     country that gains a second plan gets the control with no code change. */
  const plansHere = useMemo(() => {
    if (country === "all") return [];
    const seen = new Map<string, string>();
    rows.forEach((p) => {
      if (countryOf[p.user_id] !== country || !p.plan) return;
      if (!seen.has(p.plan)) seen.set(p.plan, planById(p.plan)?.name ?? p.plan);
    });
    return [...seen].sort((a, b) => a[1].localeCompare(b[1]));
  }, [rows, countryOf, country]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((p) => {
      if (status !== "all" && p.status !== status) return false;
      if (plan !== "all" && p.plan !== plan) return false;
      if (country !== "all" && countryOf[p.user_id] !== country) return false;
      if (!q) return true;
      /* Name, method and reference: the three things an admin actually has to
         hand when someone asks about a payment. */
      return (names[p.user_id] ?? "").toLowerCase().includes(q)
        || methodName(p.method).toLowerCase().includes(q)
        || reference(p).toLowerCase().includes(q);
    });
  }, [rows, names, countryOf, query, status, plan, country]);

  const pages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  /* A filter that shortens the list must never strand the reader on a page
     that no longer exists. */
  const current = Math.min(page, pages);
  const shown = filtered.slice((current - 1) * PER_PAGE, current * PER_PAGE);

  const reset = (fn: () => void) => { fn(); setPage(1); };
  /* Picking a destination clears the plan under it: the old value may not
     exist here, and a filter nobody can see must never still be filtering. */
  const pickCountry = (code: string) => reset(() => { setCountry(code); setPlan("all"); });

  return (
    <Card className="wa-card wa-tx" variant="default">
      <Card.Header className="wa-card-head">
        <div>
          <Card.Title>Transactions</Card.Title>
          <Card.Description>
            {loading ? "Loading receipts…"
              : `${filtered.length.toLocaleString("en-GB")} of ${rows.length.toLocaleString("en-GB")} receipts`}
          </Card.Description>
        </div>

        <div className="wa-filters">
          <SearchField
            aria-label="Search transactions"
            className="wa-search"
            onChange={(v) => reset(() => setQuery(v))}
            value={query}
          >
            <SearchField.Group>
              <SearchField.SearchIcon />
              <SearchField.Input placeholder="Student, method, reference" />
              <SearchField.ClearButton />
            </SearchField.Group>
          </SearchField>

          {/* Destination leads: it is the widest cut, and everything narrower
              only makes sense inside one. */}
          {countries.length > 1 && (
            <Select
              className="wa-select"
              onSelectionChange={(k) => pickCountry(String(k))}
              selectedKey={country}
            >
              <Label className="sr-only">Destination</Label>
              <Select.Trigger><Select.Value /><Select.Indicator /></Select.Trigger>
              <Select.Popover>
                <ListBox>
                  <ListBox.Item id="all" textValue="All destinations">
                    All destinations<ListBox.ItemIndicator />
                  </ListBox.Item>
                  {countries.map(([code, name]) => (
                    <ListBox.Item id={code} key={code} textValue={name}>
                      {name}<ListBox.ItemIndicator />
                    </ListBox.Item>
                  ))}
                </ListBox>
              </Select.Popover>
            </Select>
          )}

          {/* Only inside a destination, and only when that destination is sold
              under more than one plan. */}
          {plansHere.length > 1 && (
            <Select
              className="wa-select"
              onSelectionChange={(k) => reset(() => setPlan(String(k)))}
              selectedKey={plan}
            >
              <Label className="sr-only">Plan</Label>
              <Select.Trigger><Select.Value /><Select.Indicator /></Select.Trigger>
              <Select.Popover>
                <ListBox>
                  <ListBox.Item id="all" textValue="All plans">
                    All plans<ListBox.ItemIndicator />
                  </ListBox.Item>
                  {plansHere.map(([id, name]) => (
                    <ListBox.Item id={id} key={id} textValue={name}>
                      {name}<ListBox.ItemIndicator />
                    </ListBox.Item>
                  ))}
                </ListBox>
              </Select.Popover>
            </Select>
          )}

          <Select
            className="wa-select"
            onSelectionChange={(k) => reset(() => setStatus(String(k)))}
            selectedKey={status}
          >
            <Label className="sr-only">Status</Label>
            <Select.Trigger><Select.Value /><Select.Indicator /></Select.Trigger>
            <Select.Popover>
              <ListBox>
                {STATUS_FILTERS.map((s) => (
                  <ListBox.Item id={s.id} key={s.id} textValue={s.label}>
                    {s.label}<ListBox.ItemIndicator />
                  </ListBox.Item>
                ))}
              </ListBox>
            </Select.Popover>
          </Select>
        </div>
      </Card.Header>

      <Card.Content className="wa-table-wrap">
        {loading ? (
          <div className="wa-rows-skel">
            {Array.from({ length: 7 }).map((_, i) => <Skeleton className="h-12 w-full rounded-lg" key={i} />)}
          </div>
        ) : (
          <Table aria-label="Wallet transactions" variant="secondary">
            <Table.ScrollContainer>
              <Table.Content aria-label="Wallet transactions" className="wa-table">
                <Table.Header>
                  <Table.Column isRowHeader>Transaction</Table.Column>
                  <Table.Column>Type</Table.Column>
                  <Table.Column>Amount</Table.Column>
                  <Table.Column>Status</Table.Column>
                  <Table.Column>Date</Table.Column>
                  <Table.Column>Reference</Table.Column>
                </Table.Header>
                <Table.Body renderEmptyState={() => (
                  <div className="wa-empty">
                    <Receipt size={19} />
                    <p>{rows.length === 0
                      ? "No payments have been recorded yet."
                      : "No transactions match these filters."}</p>
                    {rows.length > 0 && (
                      <Button
                        onPress={() => { setQuery(""); setStatus("all"); setPlan("all"); setCountry("all"); setPage(1); }}
                        size="sm" variant="tertiary"
                      >
                        Clear filters
                      </Button>
                    )}
                  </div>
                )}>
                  {shown.map((p) => {
                    const st = statusOf(p.status);
                    const credit = isCredit(p);
                    return (
                      <Table.Row className="wa-trow" id={p.id} key={p.id} onAction={() => onOpen(p)}>
                        <Table.Cell>
                          <div className="wa-person">
                            <Avatar className="size-7">
                              <Avatar.Fallback className="text-[10px]">
                                {initials(names[p.user_id])}
                              </Avatar.Fallback>
                            </Avatar>
                            <div className="wa-person-id">
                              <span className="wa-person-name">{names[p.user_id] ?? "Unknown student"}</span>
                              <span className="wa-person-meta">
                                {planLabel(p.plan)} · {methodName(p.method)}
                              </span>
                            </div>
                          </div>
                        </Table.Cell>
                        <Table.Cell>
                          <span className={`wa-type ${credit ? "is-credit" : "is-hold"}`}>
                            {credit ? <ArrowDownLeft size={13} /> : <ArrowUpRight size={13} />}
                            {credit ? "Credit" : "Hold"}
                          </span>
                        </Table.Cell>
                        <Table.Cell className={`wa-amount ${credit ? "is-credit" : ""}`}>
                          {credit ? "+" : ""}{money(p.amount)}
                        </Table.Cell>
                        <Table.Cell>
                          <Chip color={st.color} size="sm" variant="soft">{st.label}</Chip>
                        </Table.Cell>
                        <Table.Cell className="wa-nums">{dateShort(p.created_at)}</Table.Cell>
                        <Table.Cell className="wa-ref">{reference(p)}</Table.Cell>
                      </Table.Row>
                    );
                  })}
                </Table.Body>
              </Table.Content>
            </Table.ScrollContainer>
          </Table>
        )}
      </Card.Content>

      {/* Only when there is more than one page to move between. */}
      {!loading && pages > 1 && (
        <Card.Footer className="wa-tx-foot">
          <Pagination className="wa-pager" size="sm">
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
  );
}
