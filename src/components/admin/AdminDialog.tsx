"use client";

/* One dialog shape for the whole Admin Workspace (Messages/Chat excepted —
   it keeps its own, untouched). Header (icon, title, optional description,
   close), body, footer — the same three-part structure TransactionDetails,
   PaymentReviews' review modal and every dialog since have already been
   hand-building per file. This is that shape, extracted once, so the next
   dozen conversions reuse it instead of repeating it.

   Sizes are a fixed, literal set rather than a numeric prop: Tailwind's
   scanner only picks up class names that appear as literal text in source,
   so an interpolated `sm:max-w-[${n}px]` would silently fail to generate
   the utility in production. Four named sizes cover every case here. */

import type { ReactNode } from "react";
import { Modal } from "@heroui/react";

const SIZE_CLASS = {
  sm: "sm:max-w-[420px]",
  md: "sm:max-w-[480px]",
  lg: "sm:max-w-[580px]",
  xl: "sm:max-w-[720px]",
} as const;

export type DialogTone = "accent" | "success" | "warning" | "danger";

export function AdminDialog({
  icon, tone = "accent", title, description, size = "md", onClose, children, footer,
}: {
  icon?: ReactNode; tone?: DialogTone; title: ReactNode; description?: ReactNode;
  size?: keyof typeof SIZE_CLASS; onClose: () => void; children?: ReactNode; footer?: ReactNode;
}) {
  return (
    <Modal>
      <Modal.Backdrop isOpen onOpenChange={(open) => { if (!open) onClose(); }}>
        <Modal.Container>
          <Modal.Dialog className={SIZE_CLASS[size]}>
            <Modal.CloseTrigger />
            <Modal.Header>
              {icon && <Modal.Icon className={`afq-dialog-ico afq-dialog-ico--${tone}`}>{icon}</Modal.Icon>}
              <div>
                <Modal.Heading>{title}</Modal.Heading>
                {description && <p className="afq-dialog-desc">{description}</p>}
              </div>
            </Modal.Header>
            {children && <Modal.Body>{children}</Modal.Body>}
            {footer && <Modal.Footer className="afq-dialog-foot">{footer}</Modal.Footer>}
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
