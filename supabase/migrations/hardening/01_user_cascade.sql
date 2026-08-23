/* Deleting a user must delete what that user owns.

   These tables all carry `user_id uuid NOT NULL` and none of them had a
   foreign key to auth.users, so removing an account left every row it owned
   behind with no owner. The platform had 121 progress rows, 134 events, 88
   notifications and 23 documents belonging to accounts that no longer
   existed, and every admin counter kept reporting them.

   Four tables already cascade correctly and are deliberately NOT touched
   here: profiles, payments, messages and roadmap_status.

   `journey_outbox` is included beyond the six that were reported. It queues
   unsent notifications per user and had the same missing constraint, so a
   deleted account would otherwise leave sends queued for a person who is no
   longer there.

   Safe to re-run: each constraint is added only if it does not already
   exist, so this never duplicates a relationship or replaces one that other
   code depends on. */

do $$
declare
  t text;
  tables text[] := array[
    'journey_progress',
    'journey_documents',
    'journey_events',
    'journey_stage_approvals',
    'notifications',
    'schedule_events',
    'journey_outbox'
  ];
begin
  foreach t in array tables loop
    /* Only when this table has no auth.users foreign key on user_id already.
       Checking the definition rather than the name means a constraint added
       under any name is still recognised. */
    if not exists (
      select 1
      from pg_constraint con
      join pg_class cl on cl.oid = con.conrelid
      join pg_namespace n on n.oid = cl.relnamespace
      where con.contype = 'f'
        and n.nspname = 'public'
        and cl.relname = t
        and pg_get_constraintdef(con.oid) ilike '%(user_id)%'
        and pg_get_constraintdef(con.oid) ilike '%auth.users%'
    ) then
      execute format(
        'alter table public.%I
           add constraint %I foreign key (user_id)
           references auth.users(id) on delete cascade',
        t, t || '_user_id_fkey'
      );
      raise notice 'cascade added: %', t;
    else
      raise notice 'already cascades, skipped: %', t;
    end if;
  end loop;
end $$;

/* Every one of these columns is filtered by user_id on read, and a cascade
   delete has to find the rows it is removing. Without an index that is a
   sequential scan per table on every account deletion. */
create index if not exists journey_progress_user_id_idx        on public.journey_progress (user_id);
create index if not exists journey_documents_user_id_idx       on public.journey_documents (user_id);
create index if not exists journey_events_user_id_idx          on public.journey_events (user_id);
create index if not exists journey_stage_approvals_user_id_idx on public.journey_stage_approvals (user_id);
create index if not exists notifications_user_id_idx           on public.notifications (user_id);
create index if not exists schedule_events_user_id_idx         on public.schedule_events (user_id);
create index if not exists journey_outbox_user_id_idx          on public.journey_outbox (user_id);
