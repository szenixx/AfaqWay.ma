-- Emoji reactions and read receipts on the advisor <-> student chat.
-- Applied live via the Supabase MCP on 2026-08-02; this file is the record.

-- Reactions: emoji -> jsonb array of side identifiers ('user' | 'admin') that
-- reacted with it. Seen: stamped once the OTHER side has read the message,
-- never unset.
alter table public.messages
  add column if not exists reactions jsonb not null default '{}'::jsonb,
  add column if not exists seen_at timestamptz;

-- Toggle a reaction on a message. SECURITY DEFINER so neither side needs a raw
-- UPDATE grant on messages: every write to `reactions` goes through here,
-- which is what keeps the toggle atomic and every other column untouched.
create or replace function public.react_to_message(p_message_id uuid, p_emoji text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  is_admin boolean := public.current_is_admin();
  actor text;
  owner_id uuid;
  cur jsonb;
  list jsonb;
  nxt jsonb;
begin
  if uid is null then return jsonb_build_object('ok', false, 'reason', 'auth'); end if;
  if p_emoji is null or length(p_emoji) = 0 or length(p_emoji) > 8 then
    return jsonb_build_object('ok', false, 'reason', 'emoji');
  end if;

  select user_id, reactions into owner_id, cur from public.messages where id = p_message_id;
  if owner_id is null then return jsonb_build_object('ok', false, 'reason', 'not_found'); end if;

  if is_admin then
    actor := 'admin';
  elsif owner_id = uid then
    actor := 'user';
  else
    return jsonb_build_object('ok', false, 'reason', 'forbidden');
  end if;

  list := coalesce(cur -> p_emoji, '[]'::jsonb);
  if list @> to_jsonb(actor) then
    select coalesce(jsonb_agg(v), '[]'::jsonb) into list
      from jsonb_array_elements_text(list) v where v <> actor;
  else
    list := list || to_jsonb(actor);
  end if;

  if jsonb_array_length(list) = 0 then
    nxt := cur - p_emoji;
  else
    nxt := jsonb_set(cur, array[p_emoji], list, true);
  end if;

  update public.messages set reactions = nxt where id = p_message_id;
  return jsonb_build_object('ok', true, 'reactions', nxt);
end $$;

-- Marks every message from the OTHER side as seen, up to now. Called by
-- whichever side just opened the thread: a student marks admin messages
-- seen, an admin marks a student's messages seen.
create or replace function public.mark_messages_seen(p_user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  is_admin boolean := public.current_is_admin();
begin
  if uid is null then return jsonb_build_object('ok', false, 'reason', 'auth'); end if;

  if is_admin then
    update public.messages set seen_at = now()
      where user_id = p_user_id and sender = 'user' and seen_at is null;
  elsif uid = p_user_id then
    update public.messages set seen_at = now()
      where user_id = p_user_id and sender = 'admin' and seen_at is null;
  else
    return jsonb_build_object('ok', false, 'reason', 'forbidden');
  end if;

  return jsonb_build_object('ok', true);
end $$;

grant execute on function public.react_to_message(uuid, text) to authenticated;
grant execute on function public.mark_messages_seen(uuid) to authenticated;
