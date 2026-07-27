-- 16 · Let a chat message carry the decision it announces.
--
-- Additive only: one nullable jsonb column. Safe to run more than once.
--
-- A review decision already arrives in the chat as text. To colour the message
-- by outcome and send the student to the exact stage and step, the message has
-- to say which decision it is. Parsing the wording would break the moment the
-- copy is edited or translated, so the decision travels as data.
--
-- Shape written by lib/journeyNotify.ts:
--   { "kind": "decision", "outcome": "approved" | "rejected" | "changes_requested",
--     "stageId": uuid, "stepId": uuid, "stageTitle": text, "stepTitle": text }

alter table public.messages add column if not exists meta jsonb;

-- Only decision messages are ever looked up by outcome, so the index skips the
-- ordinary conversation.
create index if not exists messages_decision
  on public.messages ((meta ->> 'outcome'))
  where meta ? 'outcome';

notify pgrst, 'reload schema';
