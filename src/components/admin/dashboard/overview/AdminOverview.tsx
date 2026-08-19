"use client";

/* Admin Operations Overview.

   Rebuilt on HeroUI v3: Card, Table, Chip, Avatar, Button, Tooltip, Dropdown,
   ProgressCircle, Separator and Skeleton do the structure and the
   interaction; AfaqWay's palette and spacing are applied through the scoped
   theme in admin-overview.css, so the page looks like this platform rather
   than like the library's defaults.

   The whole page is fixed to the viewport: nothing scrolls except the
   students table inside its own card. The activity feed was dropped — it
   listed the same registrations the Recent Students table already shows. */

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { useOverviewData } from "./data";
import { AdminHeader } from "./AdminHeader";
import { OverviewStats } from "./OverviewStats";
import { DestinationsCard, StudentActivityCard, StudentJourneyCard } from "./AnalyticsGrid";
import { AwaitingReply, PaymentReviewsCard, RecentStudentsTable } from "./ManagementGrid";

export default function AdminOverview({ isSuper = false, onNav }: {
  isSuper?: boolean; onNav?: (target: string, id?: string) => void;
}) {
  const d = useOverviewData();
  const go = (target: string, id?: string) => onNav?.(target, id);

  /* The signed-in administrator's real identity — the same lookup the old
     SuperAdminBar did, kept so the header names a person rather than a role. */
  const [me, setMe] = useState<{ name: string; id: string } | null>(null);
  useEffect(() => {
    void (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from("admins").select("name")
        .eq("email", (user.email ?? "").toLowerCase()).maybeSingle();
      setMe({
        name: (data?.name as string) || (user.email?.split("@")[0] ?? "Super Admin"),
        id: user.id,
      });
    })();
  }, []);
  const adminName = me?.name ?? "Super Admin";
  const adminId = me ? `SA-${me.id.replace(/-/g, "").slice(0, 6).toUpperCase()}` : "…";

  return (
    /* `afq-hui` scopes HeroUI's semantic tokens to this subtree — the rest of
       the platform keeps its own :root untouched. */
    <div className="afq-hui ao-root">
      <AdminHeader
        adminId={adminId} isSuper={isSuper} name={adminName} onNav={(key) => go(key)}
      />

      <OverviewStats d={d} />

      <section className="ao-analytics" aria-label="Analytics">
        <StudentActivityCard loading={d.loading} range={d.weeklyRange} trend={d.weeklyTrend} weekly={d.weekly} />
        <StudentJourneyCard funnel={d.funnel} loading={d.loading} />
        <DestinationsCard countries={d.countries} loading={d.loading} />
      </section>

      <section className="ao-manage" aria-label="Management">
        <RecentStudentsTable loading={d.loading} rows={d.recent} onOpen={(id) => go("users", id)} />
        <div className="ao-manage-side">
          <PaymentReviewsCard loading={d.loading} payments={d.payments} onReview={(id) => go("reviews", id)} />
          <AwaitingReply awaiting={d.awaiting} loading={d.loading} onOpen={(id) => go(id ? "users" : "chat", id)} />
        </div>
      </section>
    </div>
  );
}
