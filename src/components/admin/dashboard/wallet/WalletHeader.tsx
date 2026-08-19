"use client";

/* The page header: name on the left, the only two actions this page has on the
   right. Compact, the same height as the Overview's own header. */

import { Button, Chip, Tooltip } from "@heroui/react";
import { Download, ShieldCheck } from "lucide-react";

export function WalletHeader({ pending, loading, onExport, onReviews }: {
  pending: number; loading: boolean;
  onExport: () => void; onReviews: () => void;
}) {
  return (
    <header className="wa-head">
      <div className="wa-head-id">
        <h1 className="wa-head-title">Wallet</h1>
        <p className="wa-head-sub">Revenue, transactions and payment activity.</p>
      </div>

      <div className="wa-head-actions">
        {/* Only surfaced when there is actually a queue to clear. */}
        {!loading && pending > 0 && (
          <Button onPress={onReviews} size="sm" variant="primary">
            <ShieldCheck size={14} />
            Review {pending} receipt{pending === 1 ? "" : "s"}
          </Button>
        )}
        {!loading && pending === 0 && (
          <Chip color="success" size="sm" variant="soft">Queue clear</Chip>
        )}

        <Tooltip>
          <Tooltip.Trigger>
            <Button isDisabled={loading} onPress={onExport} size="sm" variant="secondary">
              <Download size={14} />
              Export
            </Button>
          </Tooltip.Trigger>
          <Tooltip.Content>Download the loaded transactions as CSV</Tooltip.Content>
        </Tooltip>
      </div>
    </header>
  );
}
