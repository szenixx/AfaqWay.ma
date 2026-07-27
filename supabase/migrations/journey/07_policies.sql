-- 07 · Policies. Plain drop-then-create, no DO blocks, so every statement is
-- independent and a re-run is always clean.
--
-- Students read published configuration and their own progress.
-- Admins (public.is_admin()) read and write everything.

-- Stages
drop policy if exists "journey_stages_read"  on public.journey_stages;
create policy "journey_stages_read" on public.journey_stages
  for select to authenticated using (status = 'published' or public.is_admin());
drop policy if exists "journey_stages_write" on public.journey_stages;
create policy "journey_stages_write" on public.journey_stages
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Steps
drop policy if exists "journey_steps_read"  on public.journey_steps;
create policy "journey_steps_read" on public.journey_steps
  for select to authenticated using (status = 'published' or public.is_admin());
drop policy if exists "journey_steps_write" on public.journey_steps;
create policy "journey_steps_write" on public.journey_steps
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Blocks: advisor-only content never reaches a student.
drop policy if exists "journey_blocks_read"  on public.journey_blocks;
create policy "journey_blocks_read" on public.journey_blocks
  for select to authenticated using ((enabled and audience = 'student') or public.is_admin());
drop policy if exists "journey_blocks_write" on public.journey_blocks;
create policy "journey_blocks_write" on public.journey_blocks
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Reminders
drop policy if exists "journey_reminders_read"  on public.journey_reminders;
create policy "journey_reminders_read" on public.journey_reminders
  for select to authenticated using (enabled or public.is_admin());
drop policy if exists "journey_reminders_write" on public.journey_reminders;
create policy "journey_reminders_write" on public.journey_reminders
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Progress: own rows only.
drop policy if exists "journey_progress_read"   on public.journey_progress;
create policy "journey_progress_read" on public.journey_progress
  for select to authenticated using (user_id = auth.uid() or public.is_admin());
drop policy if exists "journey_progress_insert" on public.journey_progress;
create policy "journey_progress_insert" on public.journey_progress
  for insert to authenticated with check (user_id = auth.uid() or public.is_admin());
drop policy if exists "journey_progress_update" on public.journey_progress;
create policy "journey_progress_update" on public.journey_progress
  for update to authenticated using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

-- Approvals: a student may look, only an admin may decide.
drop policy if exists "journey_approvals_read"   on public.journey_stage_approvals;
create policy "journey_approvals_read" on public.journey_stage_approvals
  for select to authenticated using (user_id = auth.uid() or public.is_admin());
drop policy if exists "journey_approvals_insert" on public.journey_stage_approvals;
create policy "journey_approvals_insert" on public.journey_stage_approvals
  for insert to authenticated with check (user_id = auth.uid() or public.is_admin());
drop policy if exists "journey_approvals_write"  on public.journey_stage_approvals;
create policy "journey_approvals_write" on public.journey_stage_approvals
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- Version history is admin-only.
drop policy if exists "journey_versions_read"  on public.journey_versions;
create policy "journey_versions_read" on public.journey_versions
  for select to authenticated using (public.is_admin());
drop policy if exists "journey_versions_write" on public.journey_versions;
create policy "journey_versions_write" on public.journey_versions
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
