/* Reset the platform to real-users-only, again.

   Deletes every account that is neither staff (a row in public.admins) nor
   the one excluded tester account, and everything that account owns.

   Deleting from auth.users is enough on its own: profiles, payments,
   messages and roadmap_status already cascade on user_id, and the seven
   tables hardened in 01_user_cascade.sql (journey_progress, journey_documents,
   journey_events, journey_stage_approvals, notifications, schedule_events,
   journey_outbox) now cascade too. One DELETE at the top removes a demo
   account and everything under it in one pass, exactly what that migration
   was for.

   NOT touched, on purpose:
     - public.admins and the accounts it lists (staff keep working).
     - abderrahmane.almoustansir@gmail.com (the tester account — code now
       excludes it from every statistic; this migration keeps the row so the
       account itself stays functional, per src/lib/admin.ts's
       EXCLUDED_TESTER_EMAILS).
     - The journey TEMPLATE — stages, steps, blocks. Those carry no user_id;
       they are authored configuration, not user data.

   Run this in the Supabase SQL editor (it needs auth.users, which the
   anon/service key from the app cannot reach). Safe to re-run: a second pass
   simply matches zero rows once the platform is already clean. */

delete from auth.users
where id in (
  select p.id
  from public.profiles p
  where lower(p.email) not in (
    select lower(email) from public.admins
    union
    select 'abderrahmane.almoustansir@gmail.com'
  )
);
