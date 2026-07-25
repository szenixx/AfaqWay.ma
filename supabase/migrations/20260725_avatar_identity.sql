-- Avatar identity on the user profile.
-- Safe to run more than once. Existing users get a deterministic seed so their
-- generated avatar is stable from the first render; anyone who already uploaded
-- a photo keeps it (avatar_path still wins over the generated avatar).

alter table public.profiles
  add column if not exists gender text,
  add column if not exists avatar_type text not null default 'generated',
  add column if not exists avatar_seed text,
  add column if not exists avatar_style text not null default 'neutral';

-- Value constraints, added separately so re-running never fails.
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'profiles_gender_check') then
    alter table public.profiles
      add constraint profiles_gender_check
      check (gender is null or gender in ('male','female','prefer_not_to_say'));
  end if;

  if not exists (select 1 from pg_constraint where conname = 'profiles_avatar_type_check') then
    alter table public.profiles
      add constraint profiles_avatar_type_check
      check (avatar_type in ('generated','uploaded'));
  end if;
end $$;

-- Backfill: one permanent seed per user, and the correct avatar mode.
update public.profiles
   set avatar_seed = coalesce(avatar_seed,
         'afaq-' || lpad(((abs(hashtext(id::text)) % 900000) + 100000)::text, 6, '0')),
       avatar_style = case
         when gender = 'male'   then 'masculine'
         when gender = 'female' then 'feminine'
         else coalesce(avatar_style, 'neutral')
       end,
       avatar_type  = case when coalesce(avatar_path, '') <> '' then 'uploaded' else 'generated' end;

-- Verify:
--   select gender, avatar_type, avatar_style, avatar_seed from public.profiles limit 5;
