-- 15 · Stop a student rewriting their own account fields.
--
-- SECURITY FIX. Found during the production audit: the profiles UPDATE policy
-- lets a user write their own row, which is correct for their name and city,
-- but it also let them write the fields that decide what they have paid for and
-- whether they are allowed in at all. Confirmed live against a fresh account:
--
--   plan          self_service -> full_service   (paid plan, without paying)
--   plan_status   none         -> active
--   banned        true         -> false          (un-ban themselves)
--   user_number   1168         -> 999            (collides with another user)
--   email         theirs       -> anything
--
-- RLS grants access per ROW; which COLUMNS a row's owner may change is not
-- something a policy can express, so it takes a trigger. Same shape as the
-- journey guards in migration 09.
--
-- Safe to run more than once. Additive: no column or policy is dropped.

create or replace function public.profiles_guard()
returns trigger
language plpgsql
security definer
set search_path = public
as $fn$
begin
  -- Administrators, the service role and the SQL editor keep full control.
  if public.journey_privileged() then
    return new;
  end if;

  /* Everything commercial or identifying is pinned to what it already was.
     A student may still edit their name, city, WhatsApp number, date of birth,
     gender, avatar, onboarding answers and destination: those are theirs. */
  new.plan               := old.plan;
  new.plan_status        := old.plan_status;
  new.plan_activated_at  := old.plan_activated_at;
  new.banned             := old.banned;
  new.user_number        := old.user_number;
  new.email              := old.email;
  new.id                 := old.id;

  return new;
end;
$fn$;

drop trigger if exists profiles_guard_trg on public.profiles;
create trigger profiles_guard_trg before update on public.profiles
  for each row execute function public.profiles_guard();

-- A brand-new profile may not arrive already paid for. The row is created by
-- the user themselves during onboarding, so the same rule applies on insert.
create or replace function public.profiles_insert_guard()
returns trigger
language plpgsql
security definer
set search_path = public
as $fn$
begin
  if public.journey_privileged() then
    return new;
  end if;

  /* Touch as little as possible: a normal signup is left exactly as the
     application and the column defaults created it. Only an attempt to arrive
     already paid for, or already un-bannable, is rewritten. The app treats any
     value other than 'active' as unpaid. */
  if coalesce(new.plan_status, '') = 'active' then
    new.plan_status       := 'none';
    new.plan              := null;
    new.plan_activated_at := null;
  end if;
  new.banned := coalesce(new.banned, false);
  return new;
end;
$fn$;

drop trigger if exists profiles_insert_guard_trg on public.profiles;
create trigger profiles_insert_guard_trg before insert on public.profiles
  for each row execute function public.profiles_insert_guard();

-- Verify as an ordinary user: each of these must come back unchanged.
--   update public.profiles set plan = 'full_service', banned = false where id = auth.uid();
--   select plan, plan_status, banned, user_number, email from public.profiles where id = auth.uid();

notify pgrst, 'reload schema';
