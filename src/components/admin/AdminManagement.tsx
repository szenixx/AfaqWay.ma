"use client";

/* Admin Management.

   Rebuilt from zero on the exact shape Overview's own working table uses
   (RecentStudentsTable, in dashboard/overview/ManagementGrid.tsx): one Card,
   Card.Header, Card.Content, one Table — nothing else between them. The
   previous two passes both centred on the HeroUI Tabs component's own
   internal width behaviour, which could only be checked from its source
   CSS, never from a live render; removing it outright removes that whole
   class of doubt. Which roster is showing is now two plain Buttons and a
   piece of state, not a compound component with parts this page doesn't
   control.

   Data and behaviour are unchanged — the same `admins` table, the same
   three actions (ban, force a password reset, remove), the same protection
   on the primary super-admin's own row. */

import { useCallback, useEffect, useState } from "react";
import {
  Avatar, Button, Card, Chip, Input, Label, ListBox, Modal, Select, Skeleton, Table, TextField, Tooltip,
} from "@heroui/react";
import { Pencil, Plus, RotateCcw, ShieldOff, ShieldUser, Trash2, UserCog } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { ConfirmDialog, type ConfirmTone } from "./ConfirmDialog";

type Admin = {
  id: string; email: string; role: string; name: string | null; phone: string | null;
  describe_role: string | null; banned: boolean; must_reset_pw: boolean; created_at: string;
};
type Form = { id?: string; name: string; email: string; phone: string; role: string; describe_role: string };
const EMPTY: Form = { name: "", email: "", phone: "", role: "admin", describe_role: "" };
const MASTER_EMAIL = "index.abde06@gmail.com"; // primary super-admin — no one can act on this console

const initials = (n: string | null, email: string) =>
  (n ?? email).trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase() || "?";

export default function AdminManagement() {
  const [rows, setRows] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"super" | "admin">("super");
  const [form, setForm] = useState<Form | null>(null);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [confirm, setConfirm] = useState<{ title: string; body: string; tone: ConfirmTone; onYes: () => void } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("admins")
      .select("id, email, role, name, phone, describe_role, banned, must_reset_pw, created_at")
      .order("created_at", { ascending: true });
    setRows((data ?? []) as Admin[]);
    setLoading(false);
  }, []);
  // Fetching from Supabase is the "subscribe to an external system" case; the
  // state set here is the query result, not derived render state.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void load(); }, [load]);

  async function save() {
    if (!form) return;
    if (!form.email.trim()) { setErr("Email is required."); return; }
    setSaving(true); setErr("");
    const { data: { user } } = await supabase.auth.getUser();
    const payload = {
      email: form.email.trim().toLowerCase(), name: form.name.trim() || null,
      phone: form.phone.trim() || null, role: form.role, describe_role: form.describe_role.trim() || null,
    };
    const res = form.id
      ? await supabase.from("admins").update(payload).eq("id", form.id)
      : await supabase.from("admins").insert({ ...payload, added_by: user?.id });
    setSaving(false);
    if (res.error) { setErr(res.error.message); return; }
    setForm(null); void load();
  }
  async function patch(id: string, p: Record<string, unknown>) { await supabase.from("admins").update(p).eq("id", id); void load(); }
  async function removeNow(id: string) { await supabase.from("admins").delete().eq("id", id); void load(); }

  const openForm = (a: Admin) => setForm({ id: a.id, name: a.name ?? "", email: a.email, phone: a.phone ?? "", role: a.role, describe_role: a.describe_role ?? "" });
  const askBan = (a: Admin) => setConfirm({
    title: a.banned ? "Unban this admin?" : "Ban this admin?", tone: "danger",
    body: a.banned ? "They will regain access to the workspace." : "They will lose access to the workspace until you unban them.",
    onYes: () => { void patch(a.id, { banned: !a.banned }); setConfirm(null); },
  });
  const askForce = (a: Admin) => setConfirm({
    title: a.must_reset_pw ? "Cancel forced reset?" : "Force password reset?", tone: "warning",
    body: a.must_reset_pw ? "They will no longer be asked to reset their password." : "They will be asked to set a new password on their next login.",
    onYes: () => { void patch(a.id, { must_reset_pw: !a.must_reset_pw }); setConfirm(null); },
  });
  const askRemove = (a: Admin) => setConfirm({
    title: "Remove this admin?", tone: "danger", body: "They will immediately lose access to the workspace. This can't be undone.",
    onYes: () => { void removeNow(a.id); setConfirm(null); },
  });

  const supers = rows.filter((a) => a.role === "superadmin");
  const admins = rows.filter((a) => a.role !== "superadmin");
  const shown = tab === "super" ? supers : admins;

  return (
    <div className="afq-hui am-root">
      <header className="am-head">
        <div>
          <h1 className="am-head-title">Admin Management</h1>
          <p className="am-head-sub">Add and manage the admins who drive student applications. A new admin gets access by signing up with the email you register here.</p>
        </div>
        <Button onPress={() => setForm(EMPTY)} size="sm" variant="primary">
          <Plus size={14} /> Add admin
        </Button>
      </header>

      {/* One Card, Card.Header, Card.Content, one Table — the exact shape
          Overview's RecentStudentsTable uses, and the exact shape that
          already renders full-width there. Which roster shows is a plain
          state toggle, not a second compound component. */}
      <Card className="am-card" variant="default">
        <Card.Header className="am-card-head">
          <div className="am-switch" role="group" aria-label="Admin roster">
            <Button
              onPress={() => setTab("super")} size="sm"
              variant={tab === "super" ? "secondary" : "tertiary"}
            >
              <ShieldUser size={14} /> Super admins ({supers.length})
            </Button>
            <Button
              onPress={() => setTab("admin")} size="sm"
              variant={tab === "admin" ? "secondary" : "tertiary"}
            >
              <UserCog size={14} /> Admins ({admins.length})
            </Button>
          </div>
        </Card.Header>

        <Card.Content className="am-table-wrap">
          {loading ? (
            <div className="am-rows-skel">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton className="h-11 w-full rounded-lg" key={i} />)}
            </div>
          ) : (
            <Table aria-label="Administrators" variant="secondary">
              <Table.ScrollContainer>
                <Table.Content aria-label="Administrators" className="am-table">
                  <Table.Header>
                    <Table.Column isRowHeader>Admin</Table.Column>
                    <Table.Column>Contact</Table.Column>
                    <Table.Column>Flags</Table.Column>
                    <Table.Column>Describe role</Table.Column>
                    <Table.Column>Controls</Table.Column>
                  </Table.Header>
                  <Table.Body renderEmptyState={() => (
                    <div className="am-empty"><p>{tab === "super" ? "No super admins yet." : "No admins yet."}</p></div>
                  )}>
                    {shown.map((a) => {
                      const protectedRow = a.email === MASTER_EMAIL;
                      return (
                        <Table.Row className="am-trow" id={a.id} key={a.id}>
                          <Table.Cell>
                            <div className="am-person">
                              <Avatar className="size-8">
                                <Avatar.Fallback className="text-[11px]">{initials(a.name, a.email)}</Avatar.Fallback>
                              </Avatar>
                              <div className="am-person-id">
                                <span className="am-person-name">{a.name || "Unnamed"}</span>
                                <span className="am-person-mail">{a.email}</span>
                              </div>
                            </div>
                          </Table.Cell>
                          <Table.Cell>{a.phone || "—"}</Table.Cell>
                          <Table.Cell>
                            <span className="am-flags">
                              <Chip color={a.role === "superadmin" ? "accent" : "default"} size="sm" variant="soft">
                                {a.role === "superadmin" ? "Super admin" : "Admin"}
                              </Chip>
                              {a.must_reset_pw && <Chip color="warning" size="sm" variant="soft">Reset pending</Chip>}
                              {a.banned && <Chip color="danger" size="sm" variant="soft">Banned</Chip>}
                            </span>
                          </Table.Cell>
                          <Table.Cell className="am-person-mail">{a.describe_role || "—"}</Table.Cell>
                          <Table.Cell>
                            {protectedRow ? (
                              <span className="am-protected">Protected</span>
                            ) : (
                              <div className="am-controls">
                                <Tooltip>
                                  <Tooltip.Trigger>
                                    <Button aria-label="Edit admin" isIconOnly onPress={() => openForm(a)} size="sm" variant="secondary">
                                      <Pencil size={14} />
                                    </Button>
                                  </Tooltip.Trigger>
                                  <Tooltip.Content>Edit details</Tooltip.Content>
                                </Tooltip>
                                <Tooltip>
                                  <Tooltip.Trigger>
                                    <Button aria-label={a.must_reset_pw ? "Cancel forced reset" : "Force password reset"} isIconOnly onPress={() => askForce(a)} size="sm" variant="tertiary">
                                      <RotateCcw size={14} />
                                    </Button>
                                  </Tooltip.Trigger>
                                  <Tooltip.Content>{a.must_reset_pw ? "Cancel forced reset" : "Force password reset"}</Tooltip.Content>
                                </Tooltip>
                                <Tooltip>
                                  <Tooltip.Trigger>
                                    <Button aria-label={a.banned ? "Unban admin" : "Ban admin"} isIconOnly onPress={() => askBan(a)} size="sm" variant="tertiary">
                                      <ShieldOff size={14} />
                                    </Button>
                                  </Tooltip.Trigger>
                                  <Tooltip.Content>{a.banned ? "Unban" : "Ban"}</Tooltip.Content>
                                </Tooltip>
                                <Tooltip>
                                  <Tooltip.Trigger>
                                    <Button aria-label="Remove admin" isIconOnly onPress={() => askRemove(a)} size="sm" variant="danger-soft">
                                      <Trash2 size={14} />
                                    </Button>
                                  </Tooltip.Trigger>
                                  <Tooltip.Content>Remove</Tooltip.Content>
                                </Tooltip>
                              </div>
                            )}
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
      </Card>

      {form && (
        <Modal>
          <Modal.Backdrop isOpen onOpenChange={(open) => { if (!open) { setForm(null); setErr(""); } }}>
            <Modal.Container>
              <Modal.Dialog className="sm:max-w-[460px]">
                <Modal.CloseTrigger />
                <Modal.Header>
                  <Modal.Icon className="am-modal-ico"><UserCog className="size-5" /></Modal.Icon>
                  <Modal.Heading>{form.id ? "Edit admin" : "Add admin"}</Modal.Heading>
                </Modal.Header>
                <Modal.Body>
                  <div className="am-modal-form">
                    <TextField fullWidth onChange={(v) => setForm({ ...form, name: v })} value={form.name}>
                      <Label>Full name</Label>
                      <Input variant="secondary" />
                    </TextField>
                    <TextField fullWidth onChange={(v) => setForm({ ...form, email: v })} type="email" value={form.email}>
                      <Label>Email (login)</Label>
                      <Input placeholder="name@email.com" variant="secondary" />
                    </TextField>
                    <TextField fullWidth onChange={(v) => setForm({ ...form, phone: v })} value={form.phone}>
                      <Label>Phone number</Label>
                      <Input variant="secondary" />
                    </TextField>
                    <Select onSelectionChange={(k) => setForm({ ...form, role: String(k) })} selectedKey={form.role}>
                      <Label>Role</Label>
                      <Select.Trigger><Select.Value /><Select.Indicator /></Select.Trigger>
                      <Select.Popover>
                        <ListBox>
                          <ListBox.Item id="admin" textValue="Admin">Admin<ListBox.ItemIndicator /></ListBox.Item>
                          <ListBox.Item id="superadmin" textValue="Super admin">Super admin<ListBox.ItemIndicator /></ListBox.Item>
                        </ListBox>
                      </Select.Popover>
                    </Select>
                    <TextField fullWidth onChange={(v) => setForm({ ...form, describe_role: v })} value={form.describe_role}>
                      <Label>Describe role (keywords)</Label>
                      <Input placeholder="e.g. reviews documents, drives Full Service files" variant="secondary" />
                    </TextField>
                  </div>
                  {err && <p className="am-modal-err">{err}</p>}
                </Modal.Body>
                <Modal.Footer className="am-modal-foot">
                  <Button onPress={() => { setForm(null); setErr(""); }} size="sm" variant="tertiary">Cancel</Button>
                  <Button isDisabled={saving} onPress={save} size="sm" variant="primary">{saving ? "Saving…" : "Save"}</Button>
                </Modal.Footer>
              </Modal.Dialog>
            </Modal.Container>
          </Modal.Backdrop>
        </Modal>
      )}

      {confirm && (
        <ConfirmDialog
          body={confirm.body} iconClassName={`am-modal-ico am-modal-ico--${confirm.tone}`}
          onClose={() => setConfirm(null)} onYes={confirm.onYes} title={confirm.title} tone={confirm.tone}
        />
      )}
    </div>
  );
}
