-- 20 · Tester access: browse the whole journey without unlocking it for anyone else.
--
-- Reviewing Stage 5 means reading thirteen steps that only open after a TRP
-- approval and an admin-approved support request. Walking a real account
-- through that to check a paragraph is not workable, and faking the progress
-- rows leaves test data behind that looks like a real student's history.
--
-- So one flag, on the profile, that unlocks the roadmap FOR READING only.
--
-- What it deliberately does NOT do:
--   · it does not complete anything, and writes still go through
--     journey_progress_guard — a tester cannot approve their own review step;
--   · it does not change any other account;
--   · it cannot be set by the person it applies to. Like `plan` and `banned`,
--     it is pinned in profiles_guard, so a student cannot grant it to
--     themselves by editing their own row.

alter table public.profiles add column if not exists tester boolean not null default false;

comment on column public.profiles.tester is
  'Admin-granted. Unlocks every journey stage and step for READING only; all write guards still apply.';

-- Pinned alongside the commercial fields: the row owner may not set this.
create or replace function public.profiles_guard()
returns trigger language plpgsql security definer set search_path to 'public' as $fn$
begin
  if public.journey_privileged() then
    return new;
  end if;

  new.plan               := old.plan;
  new.plan_status        := old.plan_status;
  new.plan_activated_at  := old.plan_activated_at;
  new.banned             := old.banned;
  new.user_number        := old.user_number;
  new.email              := old.email;
  new.id                 := old.id;
  new.trp_status         := old.trp_status;
  -- Browsing the whole journey is a permission, so it is granted, never claimed.
  new.tester             := old.tester;

  return new;
end;
$fn$;

notify pgrst, 'reload schema';
