"use client";

/* AfaqWay Admin — Wallet.

   Rebuilt on HeroUI v3 alongside the Operations Overview, and deliberately
   sharing its language: the same scoped `afq-hui` theme, the same card radius
   and density, the same status chips and button hierarchy. The information
   architecture is its own — money first, then the receipt ledger beside the
   queue that needs working.

   The whole page is fixed to the viewport. The only thing that scrolls is the
   transactions table inside its own card, exactly as the Overview's students
   table does.

   WHAT THIS PAGE IS NOT: the platform holds no stored balance. There is no
   float to top up, no payout to withdraw and no card on file, so no such
   control is drawn here. "Wallet" means the revenue ledger: receipts students
   submit, an administrator approves, and the figures that fall out of them. */

import { useState } from "react";
import { useWalletData, type Payment } from "@/components/admin/dashboard/kit";
import { WalletHeader } from "./WalletHeader";
import { RevenueGoals, WalletBalance, WalletStats } from "./WalletSummary";
import { TransactionSection } from "./TransactionSection";
import { NeedsAttention, PaymentMethods } from "./WalletSidebar";
import { TransactionDetails } from "./TransactionDetails";

export default function AdminWallet({ onNav, isSuper }: { onNav?: (target: string, id?: string) => void; isSuper?: boolean }) {
  const d = useWalletData();
  const [open, setOpen] = useState<Payment | null>(null);
  const go = (target: string, id?: string) => onNav?.(target, id);

  const payingUsers = d.subDist.reduce((s, x) => s + x.value, 0);

  return (
    /* `afq-hui` scopes HeroUI's semantic tokens to this subtree, so the rest of
       the platform keeps its own :root untouched. */
    <div className="afq-hui wa-root">
      <WalletHeader
        loading={d.loading}
        onExport={() => exportCsv(d.all, d.names)}
        onReviews={() => go("reviews")}
        pending={d.pending}
      />

      {/* The money and the targets it is measured against, side by side: two
          separate cards, and only the revenue wears the brand fill. */}
      <section className="wa-summary" aria-label="Revenue">
        <WalletBalance d={{
          loading: d.loading,
          monthRevenue: d.monthRevenue,
          payingUsers,
          pending: d.pending,
          successful: d.successful,
          totalRevenue: d.totalRevenue,
          series: d.revenueSeries,
          topCountry: d.revenueByCountry[0] ?? null,
          selfCount: d.subDist[0]?.value ?? 0,
          fullCount: d.subDist[1]?.value ?? 0,
        }} />
        <RevenueGoals
          isSuper={isSuper}
          failed={d.failed}
          loading={d.loading}
          monthRevenue={d.monthRevenue}
          payingUsers={payingUsers}
          successful={d.successful}
          totalRevenue={d.totalRevenue}
        />
      </section>

      <WalletStats d={{
        failed: d.failed,
        loading: d.loading,
        monthRevenue: d.monthRevenue,
        pending: d.pending,
        successful: d.successful,
        transactions: d.all.length,
      }} />

      <section className="wa-content" aria-label="Wallet activity">
        <TransactionSection
          countryOf={d.countryOf}
          loading={d.loading}
          names={d.names}
          onOpen={setOpen}
          rows={d.all}
        />

        <div className="wa-side">
          <NeedsAttention
            loading={d.loading}
            names={d.names}
            onReview={(id) => go("reviews", id)}
            rows={d.pendingRows}
          />
          <PaymentMethods dist={d.methodDist} loading={d.loading} />
        </div>
      </section>

      <TransactionDetails
        onClose={() => setOpen(null)}
        onReview={(id) => { setOpen(null); go("reviews", id); }}
        onViewStudent={(userId) => { setOpen(null); go("users", userId); }}
        payment={open}
        studentName={open ? (d.names[open.user_id] ?? null) : null}
      />
    </div>
  );
}

/* Export is a client-side dump of the rows already on screen — no endpoint, no
   server round trip, and nothing leaves that an administrator cannot already
   read on this page. */
function exportCsv(rows: Payment[], names: Record<string, string>) {
  const head = ["Reference", "Student", "Plan", "Amount", "Currency", "Method", "Status", "Date"];
  const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const body = rows.map((p) => [
    p.id, names[p.user_id] ?? "", p.plan ?? "", String(p.amount ?? 0), "MAD",
    p.method ?? "", p.status, new Date(p.created_at).toISOString(),
  ].map(esc).join(","));

  const blob = new Blob([[head.map(esc).join(","), ...body].join("\n")], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `afaqway-transactions-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
