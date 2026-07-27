-- 02 · Helper functions. No table dependencies, safe to re-run.

-- An admin is a non-banned row in public.admins matching the caller's email.
-- Written defensively: if public.admins is missing the function returns false
-- instead of erroring, so policies never break.
create or replace function public.is_admin()
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $fn$
declare
  ok boolean := false;
begin
  begin
    select exists (
      select 1
        from public.admins a
       where lower(a.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
         and coalesce(a.banned, false) = false
    ) into ok;
  exception when undefined_table or undefined_column then
    ok := false;
  end;
  return coalesce(ok, false);
end;
$fn$;

-- Keeps updated_at honest on every write.
create or replace function public.journey_touch()
returns trigger
language plpgsql
as $fn$
begin
  new.updated_at := now();
  return new;
end;
$fn$;
