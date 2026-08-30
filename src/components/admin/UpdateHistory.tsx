"use client";

import { useState } from "react";
import { History, Trash2 } from "lucide-react";
import { Button, Chip, Popover, Tooltip } from "@heroui/react";
import { BrandLogo } from "@/components/ds";
import { AdminDialog } from "@/components/admin/AdminDialog";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { deleteUpdate, clearUpdates, type PlatformUpdate } from "@/lib/notifications";

/* Previously sent announcements, in a compact popover beside Add Update.

   Deleting an announcement removes the record, not the notifications students
   already received: those are theirs, and quietly retracting something people
   have read would be worse than leaving the history tidy. Clearing everything
   asks first, because it cannot be undone.

   HeroUI's Popover owns the open/outside-click/Escape handling that this
   used to hand-roll with its own document listener. */

export function UpdateHistory({ updates, onChanged, canManage }: {
  updates: PlatformUpdate[];
  onChanged: () => void;
  /** Only a super admin may delete; everyone else browses. */
  canManage: boolean;
}) {
  const [confirmClear, setConfirmClear] = useState(false);
  const [reading, setReading] = useState<PlatformUpdate | null>(null);
  const [busy, setBusy] = useState(false);

  const removeOne = async (id: string) => {
    setBusy(true);
    await deleteUpdate(id);
    await onChanged();
    setBusy(false);
  };

  const clearAll = async () => {
    setBusy(true);
    await clearUpdates();
    await onChanged();
    setBusy(false);
    setConfirmClear(false);
  };

  const stamp = (iso: string) =>
    new Date(iso).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

  return (
    <>
      <Popover>
        <Button size="sm" variant="tertiary">
          <History size={14} /> Update History
          {updates.length > 0 && <Chip color="default" size="sm" variant="soft">{updates.length}</Chip>}
        </Button>
        <Popover.Content className="afq-uh-pop">
          <Popover.Dialog>
            <div className="afq-uh-head">
              <Popover.Heading>Previous updates</Popover.Heading>
              {canManage && updates.length > 0 && (
                <Button onPress={() => setConfirmClear(true)} size="sm" variant="tertiary">Clear all</Button>
              )}
            </div>

            {updates.length === 0 ? (
              <div className="afq-empty"><History size={16} /><p>No updates have been sent yet.</p></div>
            ) : (
              <ul className="afq-uh-list">
                {updates.map((u) => (
                  <li className="afq-queue-row" key={u.id}>
                    <button className="afq-uh-item" onClick={() => setReading(u)} type="button">
                      <span className="afq-queue-name">{u.title}</span>
                      <time className="afq-queue-meta">{stamp(u.created_at)}</time>
                    </button>
                    {canManage && (
                      <Tooltip>
                        <Tooltip.Trigger>
                          <Button aria-label={`Delete "${u.title}"`} isDisabled={busy} isIconOnly onPress={() => removeOne(u.id)} size="sm" variant="danger-soft">
                            <Trash2 size={13} />
                          </Button>
                        </Tooltip.Trigger>
                        <Tooltip.Content>Delete</Tooltip.Content>
                      </Tooltip>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Popover.Dialog>
        </Popover.Content>
      </Popover>

      {/* Reading one update back, in the same voice the student received it. */}
      {reading && (
        <AdminDialog
          description={stamp(reading.created_at)}
          footer={<Button onPress={() => setReading(null)} size="sm" variant="primary">Close</Button>}
          onClose={() => setReading(null)}
          title={reading.title}
        >
          <div className="afq-mini-card" style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <BrandLogo size={30} />
            <span style={{ display: "flex", flexDirection: "column" }}>
              <b className="afq-mini-title">AfaqWay</b>
              <span className="afq-mini-sub">{reading.author_email ?? "AfaqWay Platform"}</span>
            </span>
          </div>
          {reading.body && <p className="afq-dialog-desc" style={{ marginTop: 12 }}>{reading.body}</p>}
          {reading.attachments?.length > 0 && (
            <p className="afq-mini-sub" style={{ marginTop: 8 }}>{reading.attachments.length} attachment(s)</p>
          )}
        </AdminDialog>
      )}

      {confirmClear && (
        <ConfirmDialog
          body="This removes every announcement record. Students keep the notifications they already received, and nothing is sent to them. This cannot be undone."
          confirmLabel={busy ? "Clearing…" : `Clear ${updates.length} update(s)`}
          iconClassName="afq-dialog-ico afq-dialog-ico--danger"
          onClose={() => setConfirmClear(false)}
          onYes={clearAll}
          title="Clear the whole update history?"
          tone="danger"
        />
      )}
    </>
  );
}

export default UpdateHistory;
