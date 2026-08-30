"use client";

/* One confirm dialog for the whole admin workspace.

   Ban a user, force a password reset, remove an admin, change someone's
   plan — every "are you sure" moment across Admin Management, Payments
   Review and User Management differs only in title, body and tone, so this
   is the one place that shape is built rather than three or four near-
   identical Modals. */

import { Button, Modal } from "@heroui/react";
import { ShieldAlert } from "lucide-react";

export type ConfirmTone = "danger" | "warning";

export function ConfirmDialog({ title, body, tone, iconClassName, confirmLabel = "Yes, continue", onYes, onClose }: {
  title: string; body: string; tone: ConfirmTone; iconClassName: string;
  confirmLabel?: string; onYes: () => void; onClose: () => void;
}) {
  return (
    <Modal>
      <Modal.Backdrop isOpen onOpenChange={(open) => { if (!open) onClose(); }}>
        <Modal.Container>
          <Modal.Dialog className="sm:max-w-[420px]">
            <Modal.CloseTrigger />
            <Modal.Header>
              <Modal.Icon className={iconClassName}><ShieldAlert className="size-5" /></Modal.Icon>
              <Modal.Heading>{title}</Modal.Heading>
            </Modal.Header>
            <Modal.Body>
              <p className="afq-confirm-body">{body}</p>
            </Modal.Body>
            <Modal.Footer className="afq-confirm-foot">
              <Button onPress={onClose} size="sm" variant="tertiary">Cancel</Button>
              <Button onPress={onYes} size="sm" variant={tone === "danger" ? "danger" : "primary"}>
                {confirmLabel}
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
