"use client";

/* Admin Payment Methods.

   Rebuilt on HeroUI v3, wearing the same `afq-hui` theme as Overview and
   Wallet: Card, Switch, TextField and Button do the structure, AfaqWay's own
   palette and spacing come from the scoped theme in admin-overview.css. Data
   and behaviour are unchanged from the previous version — every field, every
   write, every fallback for a method with no `payment_methods` row yet. */

import { useCallback, useEffect, useState } from "react";
import { Button, Card, Chip, Input, Label, Skeleton, Switch, TextField, Tooltip } from "@heroui/react";
import { ChevronDown, ChevronUp, CreditCard, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { PAY_METHODS, methodById } from "@/lib/plans";

type Extra = { title: string; value: string; copyable: boolean };
type PM = { id: string; enabled: boolean; beneficiary: string | null; rib: string | null; note: string | null; sort: number; extra_details: Extra[] };

function MethodCard({ pm, onSaved, canReorder, canMoveUp, canMoveDown, onMove }: {
  pm: PM; onSaved: () => void; canReorder: boolean; canMoveUp: boolean; canMoveDown: boolean;
  onMove: (dir: "up" | "down") => void;
}) {
  const meta = methodById(pm.id);
  const [beneficiary, setBeneficiary] = useState(pm.beneficiary ?? "");
  const [rib, setRib] = useState(pm.rib ?? "");
  const [note, setNote] = useState(pm.note ?? "");
  const [extra, setExtra] = useState<Extra[]>(Array.isArray(pm.extra_details) ? pm.extra_details : []);
  const [enabled, setEnabled] = useState(pm.enabled);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function save(next?: Partial<PM>) {
    setSaving(true); setSaved(false);
    const payload = {
      beneficiary: beneficiary.trim() || null, rib: rib.trim() || null, note: note.trim() || null,
      enabled, extra_details: extra.filter((e) => e.title.trim() || e.value.trim()),
      updated_at: new Date().toISOString(), ...next,
    };
    await supabase.from("payment_methods").update(payload).eq("id", pm.id);
    setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 1500);
    onSaved();
  }
  async function toggle(v: boolean) { setEnabled(v); await save({ enabled: v }); }
  const setEx = (i: number, p: Partial<Extra>) => setExtra(extra.map((e, j) => (j === i ? { ...e, ...p } : e)));

  return (
    <Card className={`pm-card${enabled ? "" : " is-off"}`} variant="default">
      <Card.Header className="pm-card-top">
        <div className="pm-card-id">
          {/* Reordering is a superadmin-only capability — the sort column
              already exists and already drives the load order, this is
              just the UI to change it, so nothing hard-codes the order. */}
          {canReorder && (
            <span className="pm-card-reorder">
              <Tooltip>
                <Tooltip.Trigger>
                  <Button aria-label="Move up" isDisabled={!canMoveUp} isIconOnly onPress={() => onMove("up")} size="sm" variant="tertiary">
                    <ChevronUp size={13} />
                  </Button>
                </Tooltip.Trigger>
                <Tooltip.Content>Move up</Tooltip.Content>
              </Tooltip>
              <Tooltip>
                <Tooltip.Trigger>
                  <Button aria-label="Move down" isDisabled={!canMoveDown} isIconOnly onPress={() => onMove("down")} size="sm" variant="tertiary">
                    <ChevronDown size={13} />
                  </Button>
                </Tooltip.Trigger>
                <Tooltip.Content>Move down</Tooltip.Content>
              </Tooltip>
            </span>
          )}
          <span className="pm-card-logo" aria-hidden>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {meta && <img alt="" src={meta.logoSrc} />}
          </span>
          <div className="pm-card-name">
            <b>{meta?.name ?? pm.id}</b>
            <span>{meta?.kind === "manual" ? "Manual transfer" : "Instant"}</span>
          </div>
        </div>

        <Tooltip>
          <Tooltip.Trigger>
            <Switch aria-label={`${meta?.name ?? pm.id} enabled at checkout`} isSelected={enabled} onChange={(v) => void toggle(v)}>
              <Switch.Content>
                <Switch.Control><Switch.Thumb /></Switch.Control>
              </Switch.Content>
            </Switch>
          </Tooltip.Trigger>
          <Tooltip.Content>{enabled ? "Visible at checkout" : "Hidden from checkout"}</Tooltip.Content>
        </Tooltip>
      </Card.Header>

      {/* Every card gets a content section, manual or instant — an instant
          method has no beneficiary/RIB to configure, but it isn't nothing:
          its own description and the same extra-details rows every method
          can carry. A header with a switch and nothing under it was reading
          as an incomplete card, not a genuinely content-free one. */}
      <Card.Content className="pm-card-body">
        {meta?.kind === "manual" ? (
          <>
            <div className="pm-fields">
              <TextField fullWidth onChange={setBeneficiary} value={beneficiary}>
                <Label>Beneficiary</Label>
                <Input variant="secondary" />
              </TextField>
              <TextField fullWidth onChange={setRib} value={rib}>
                <Label>RIB</Label>
                <Input variant="secondary" />
              </TextField>
            </div>
            <div className="pm-fields pm-fields--note">
              <TextField fullWidth onChange={setNote} value={note}>
                <Label>Note (optional)</Label>
                <Input variant="secondary" />
              </TextField>
            </div>
          </>
        ) : (
          meta?.desc && <p className="pm-card-desc">{meta.desc}</p>
        )}

        <div className="pm-extra-label">Extra details</div>
        {extra.length === 0 && <p className="pm-extra-empty">No extra details yet.</p>}
        {extra.map((e, i) => (
            <div className="pm-extra-row" key={i}>
              <TextField fullWidth onChange={(v) => setEx(i, { title: v })} value={e.title}>
                <Input placeholder="Title" variant="secondary" />
              </TextField>
              <TextField fullWidth onChange={(v) => setEx(i, { value: v })} value={e.value}>
                <Input placeholder="Detail" variant="secondary" />
              </TextField>
              <Switch aria-label="Copyable detail" className="pm-extra-switch" isSelected={e.copyable} onChange={(v) => setEx(i, { copyable: v })}>
                <Switch.Content>
                  <Switch.Control><Switch.Thumb /></Switch.Control>
                  Copy
                </Switch.Content>
              </Switch>
              <Tooltip>
                <Tooltip.Trigger>
                  <Button
                    aria-label="Remove this detail" className="pm-extra-remove" isIconOnly
                    onPress={() => setExtra(extra.filter((_, j) => j !== i))} size="sm" variant="danger-soft"
                  >
                    <Trash2 size={14} />
                  </Button>
                </Tooltip.Trigger>
                <Tooltip.Content>Remove this detail</Tooltip.Content>
              </Tooltip>
            </div>
        ))}
        <Button
          className="pm-extra-add" onPress={() => setExtra([...extra, { title: "", value: "", copyable: true }])}
          size="sm" variant="tertiary"
        >
          <Plus size={14} /> Add detail
        </Button>

        <div className="pm-card-foot">
          {saved && <Chip color="success" size="sm" variant="soft">Saved</Chip>}
          <Button isDisabled={saving} onPress={() => save()} size="sm" variant="primary">
            {saving ? "Saving…" : "Save details"}
          </Button>
        </div>
      </Card.Content>
    </Card>
  );
}

export default function PaymentMethodsAdmin({ isSuper = false }: { isSuper?: boolean } = {}) {
  const [rows, setRows] = useState<PM[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("payment_methods").select("id, enabled, beneficiary, rib, note, sort, extra_details").order("sort", { ascending: true });
    const rawRows = (data ?? []) as PM[];
    /* A row whose id no longer has a PAY_METHODS entry — a method removed
       from the platform (PayPal, or any future removal) — is dropped from
       what renders, and its row is deleted for real rather than left behind
       to resurface if PAY_METHODS ever gains a same-named id again. */
    const stale = rawRows.filter((r) => !methodById(r.id));
    if (stale.length) void supabase.from("payment_methods").delete().in("id", stale.map((r) => r.id));
    const dbRows = rawRows.filter((r) => methodById(r.id)).map((r) => ({ ...r, extra_details: Array.isArray(r.extra_details) ? r.extra_details : [] }));
    const known = new Set(dbRows.map((r) => r.id));
    const extra = PAY_METHODS.filter((m) => !known.has(m.id)).map((m, i) => ({
      id: m.id, enabled: m.available, beneficiary: m.account?.beneficiary ?? null,
      rib: m.account?.rib ?? null, note: m.account?.note ?? null, sort: 100 + i, extra_details: [],
    }));
    setRows([...dbRows, ...extra]);
    setLoading(false);
  }, []);
  // Fetching from Supabase is the "subscribe to an external system" case; the
  // state set here is the query result, not derived render state.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void load(); }, [load]);

  /* Swapping two rows' `sort` values, superadmin-only. `upsert` rather than
     `update`: a method straight out of PAY_METHODS with no row yet (the
     `extra` fallback above) has never been saved, and reordering it is the
     first write it will ever get — an `update` would silently touch zero
     rows. The full known row is sent back unchanged apart from `sort`, so
     this can never clobber a beneficiary/RIB/note/extra_details edit that
     hasn't been saved through the card's own Save button yet. */
  async function move(index: number, dir: "up" | "down") {
    const j = dir === "up" ? index - 1 : index + 1;
    const a = rows[index], b = rows[j];
    if (!a || !b) return;
    await Promise.all([
      supabase.from("payment_methods").upsert({ ...a, sort: b.sort }, { onConflict: "id" }),
      supabase.from("payment_methods").upsert({ ...b, sort: a.sort }, { onConflict: "id" }),
    ]);
    void load();
  }

  const enabledCount = rows.filter((r) => r.enabled).length;

  return (
    <div className="afq-hui pm-root">
      <header className="pm-head">
        <div>
          <h1 className="pm-head-title">Payment Methods</h1>
          <p className="pm-head-sub">Turn methods on or off, edit account details, and add copyable detail rows. Changes apply to checkout immediately.</p>
        </div>
        {!loading && (
          <Chip color={enabledCount ? "success" : "default"} size="sm" variant="soft">
            {enabledCount} of {rows.length} enabled
          </Chip>
        )}
      </header>

      {loading ? (
        <div className="pm-skel-grid">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton className="h-24 w-full rounded-2xl" key={i} />)}
        </div>
      ) : rows.length === 0 ? (
        <div className="pm-empty">
          <CreditCard size={19} />
          <p>No payment methods are configured yet.</p>
        </div>
      ) : (
        <div className="pm-grid">
          {rows.map((pm, i) => (
            <MethodCard
              canMoveDown={i < rows.length - 1} canMoveUp={i > 0} canReorder={isSuper}
              key={pm.id} onMove={(dir) => void move(i, dir)} onSaved={load} pm={pm}
            />
          ))}
        </div>
      )}
    </div>
  );
}
