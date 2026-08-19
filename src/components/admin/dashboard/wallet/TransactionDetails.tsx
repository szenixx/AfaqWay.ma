"use client";

/* One receipt, in full.

   A modal rather than a route: inspecting a payment is a glance, and losing
   the filtered table behind it would cost more than it gives. Everything shown
   is read from the row the table already has — nothing is fetched, and no
   action is offered that the platform cannot actually perform. */

import { Button, Chip, Modal, Separator } from "@heroui/react";
import { ArrowRight, Receipt } from "lucide-react";
import type { Payment } from "@/components/admin/dashboard/kit";
import { dateLong, isCredit, methodName, money, planLabel, reference, statusOf } from "./parts";

export function TransactionDetails({ payment, studentName, onClose, onReview, onViewStudent }: {
  payment: Payment | null;
  studentName: string | null;
  onClose: () => void;
  onReview: (id: string) => void;
  onViewStudent: (userId: string) => void;
}) {
  const p = payment;
  const st = p ? statusOf(p.status) : null;

  return (
    <Modal>
      <Modal.Backdrop isOpen={Boolean(p)} onOpenChange={(open) => { if (!open) onClose(); }}>
        <Modal.Container>
          <Modal.Dialog className="wa-modal sm:max-w-[440px]">
            <Modal.CloseTrigger />
            <Modal.Header>
              <Modal.Icon className="wa-modal-ico"><Receipt className="size-5" /></Modal.Icon>
              <Modal.Heading>Transaction</Modal.Heading>
            </Modal.Header>

            <Modal.Body>
              {p && st && (
                <>
                  <div className="wa-modal-amount">
                    <span className={`wa-modal-value ${isCredit(p) ? "is-credit" : ""}`}>
                      {isCredit(p) ? "+" : ""}{money(p.amount)}
                    </span>
                    <Chip color={st.color} size="sm" variant="soft">{st.label}</Chip>
                  </div>

                  <Separator className="wa-sep" />

                  <dl className="wa-modal-rows">
                    <div><dt>Reference</dt><dd className="wa-ref">{reference(p)}</dd></div>
                    <div><dt>Student</dt><dd>{studentName ?? "Unknown student"}</dd></div>
                    <div><dt>Plan</dt><dd>{planLabel(p.plan)}</dd></div>
                    <div><dt>Method</dt><dd>{methodName(p.method)}</dd></div>
                    <div><dt>Type</dt><dd>{isCredit(p) ? "Credit" : "Hold"}</dd></div>
                    <div><dt>Submitted</dt><dd>{dateLong(p.created_at)}</dd></div>
                  </dl>
                </>
              )}
            </Modal.Body>

            <Modal.Footer className="wa-modal-foot">
              {/* Only what exists: the review queue handles the receipt, the
                  users page handles the person. There is no receipt file to
                  download from here. */}
              {p && p.status === "under_review" && (
                <Button onPress={() => onReview(p.id)} size="sm" variant="primary">
                  Review receipt <ArrowRight size={14} />
                </Button>
              )}
              {p && (
                <Button onPress={() => onViewStudent(p.user_id)} size="sm" variant="secondary">
                  View student
                </Button>
              )}
              <Button size="sm" slot="close" variant="tertiary">Close</Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
