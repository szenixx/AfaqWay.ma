-- 03 · Tables, in dependency order. Safe to re-run.
--
-- Column names deliberately avoid PostgreSQL keywords and function names:
-- sort_order (not "position"), repeat_rule (not "repeat"),
-- prev_value / next_value (not "previous"/"next"), review_comment (not "comment").
-- user_id has no foreign key to auth.users on purpose: it needs no cascade here
-- and referencing another schema is the most common cause of a failed run.

create table if not exists public.journey_stages (
  id           uuid primary key default gen_random_uuid(),
  country      text not null default 'LT',
  plan         text not null default 'self_service',
  sort_order   integer not null default 0,
  title        text not null,
  description  text not null default '',
  icon         text not null default 'route',
  tone         text not null default 'blue',
  status       text not null default 'draft',
  rules        jsonb not null default '{}'::jsonb,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table if not exists public.journey_steps (
  id             uuid primary key default gen_random_uuid(),
  stage_id       uuid not null references public.journey_stages (id) on delete cascade,
  sort_order     integer not null default 0,
  title          text not null,
  subtitle       text not null default '',
  description    text not null default '',
  status         text not null default 'draft',
  required       boolean not null default true,
  estimated_time text not null default '',
  due_at         timestamptz,
  document_keys  text[] not null default '{}'::text[],
  rules          jsonb not null default '{}'::jsonb,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create table if not exists public.journey_blocks (
  id          uuid primary key default gen_random_uuid(),
  step_id     uuid not null references public.journey_steps (id) on delete cascade,
  sort_order  integer not null default 0,
  kind        text not null default 'paragraph',
  enabled     boolean not null default true,
  title       text not null default '',
  body        text not null default '',
  data        jsonb not null default '{}'::jsonb,
  audience    text not null default 'student',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists public.journey_reminders (
  id          uuid primary key default gen_random_uuid(),
  step_id     uuid not null references public.journey_steps (id) on delete cascade,
  kind        text not null default 'custom',
  title       text not null,
  message     text not null default '',
  due_at      timestamptz,
  repeat_rule text not null default 'none',
  priority    text not null default 'normal',
  channels    text[] not null default '{dashboard}'::text[],
  enabled     boolean not null default true,
  created_at  timestamptz not null default now()
);

create table if not exists public.journey_progress (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null,
  step_id      uuid not null references public.journey_steps (id) on delete cascade,
  state        text not null default 'pending',
  completed_at timestamptz,
  updated_at   timestamptz not null default now()
);

create table if not exists public.journey_stage_approvals (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null,
  stage_id       uuid not null references public.journey_stages (id) on delete cascade,
  state          text not null default 'waiting',
  reviewed_by    uuid,
  reviewed_at    timestamptz,
  review_comment text not null default '',
  created_at     timestamptz not null default now()
);

create table if not exists public.journey_versions (
  id           uuid primary key default gen_random_uuid(),
  entity       text not null,
  entity_id    uuid not null,
  editor_email text,
  field        text,
  prev_value   jsonb,
  next_value   jsonb,
  summary      text not null default '',
  created_at   timestamptz not null default now()
);
