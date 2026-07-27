-- 06 · Enable row level security. Safe to re-run.
alter table public.journey_stages          enable row level security;
alter table public.journey_steps           enable row level security;
alter table public.journey_blocks          enable row level security;
alter table public.journey_reminders       enable row level security;
alter table public.journey_progress        enable row level security;
alter table public.journey_stage_approvals enable row level security;
alter table public.journey_versions        enable row level security;
