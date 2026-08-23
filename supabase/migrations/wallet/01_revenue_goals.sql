/* Revenue targets a superadmin can set, and only a superadmin can set.

   The three targets used to be formulas in the component
   (`Math.max(20000, monthRevenue * 1.4)`), which meant nobody could change
   them and they drifted upward on their own every time revenue rose. They
   live here instead so the team can state a real target and reset it.

   WHAT IS DELIBERATELY NOT HERE: revenue itself. The `current` side of every
   goal is summed from approved payments at read time and has no column in
   this table, so there is no row anyone could edit to make the platform
   report money it did not take. Approved revenue is a fact, not a setting.

   One row, always. `id` is pinned to TRUE so a second row cannot exist. */
create table if not exists public.revenue_goals (
  id                boolean primary key default true check (id),
  monthly_target    numeric(12,2) not null default 0 check (monthly_target   >= 0),
  quarterly_target  numeric(12,2) not null default 0 check (quarterly_target >= 0),
  students_target   integer       not null default 0 check (students_target  >= 0),
  updated_at        timestamptz   not null default now(),
  updated_by        text
);

insert into public.revenue_goals (id) values (true) on conflict (id) do nothing;

alter table public.revenue_goals enable row level security;

/* Any admin reads the targets: the wallet is an admin page and the bars have
   to render for everyone who can open it. */
drop policy if exists revenue_goals_read on public.revenue_goals;
create policy revenue_goals_read on public.revenue_goals
  for select using (is_admin());

/* Only a superadmin writes them. Enforced HERE and not only in the UI: a
   hidden button is not a permission, and an ordinary admin with the anon key
   could otherwise update this row directly. */
drop policy if exists revenue_goals_update on public.revenue_goals;
create policy revenue_goals_update on public.revenue_goals
  for update using (is_superadmin()) with check (is_superadmin());

/* No insert and no delete policy at all: the single row is created by this
   migration and must never be removed or duplicated. */
