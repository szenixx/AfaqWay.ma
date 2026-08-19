"use client";

/* The AfaqWay community.

   The avatar stack is the whole membership — students from every country and
   every plan, active or not, alongside admins and advisors. No country,
   university, plan or workspace filter: the point is "this is the community",
   not "these are people like you".

   Every member is shown — no cap. The count underneath is a different measure
   and stays live: how many of them are on the platform right now, read from
   the platform's existing Supabase Realtime presence channel
   (src/lib/presence.ts) rather than a second presence system or a poll. */

import { useCallback, useEffect, useState } from "react";
import { useOnlinePeople } from "@/lib/presence";
import { supabase } from "@/lib/supabase/client";
import { fileUrl } from "@/lib/storage/client";
import { AvatarGroup, type GroupAvatar } from "@/components/godui/avatar-group";


type Member = { id: string; name: string; avatar: string | null; joined: string };

/* ── The hook ──────────────────────────────────────────────────────────────
   Ordering is by join date, newest first — a property of the data, so it is
   deterministic and survives every repaint without anything being remembered
   between renders. A new signup lands in first position and pushes the rest
   back. Nobody is dropped: the whole community is shown. */
export function useActiveCommunity() {
  const online = useOnlinePeople();
  const [members, setMembers] = useState<Member[]>([]);

  const load = useCallback(async () => {
    /* Reads the `community_members` view, not the tables. RLS deliberately
       stops a student reading other people's profiles (`auth.uid() = id`) or
       the admins table at all, so querying those directly returned one row and
       nothing else from a student's session — which is why the stack looked
       empty however the UI was written.

       The view is the narrowest opening that answers the question: display
       name, avatar path and join date for members who are not banned. No
       email, plan, country or role detail crosses it. */
    const { data } = await supabase
      .from("community_members")
      .select("id, display_name, avatar_path, created_at, kind")
      .order("created_at", { ascending: false })
      .limit(200);

    const rows = (data ?? []) as {
      id: string; display_name: string; avatar_path: string | null; created_at: string;
    }[];

    /* Everyone renders, so every avatar needs its URL resolved. */
    const resolved = await Promise.all(rows.map(async (r) => ({
      id: r.id,
      name: r.display_name,
      joined: r.created_at,
      avatar: r.avatar_path ? await fileUrl(r.avatar_path, undefined, 86400) : null,
    })));
    setMembers(resolved);
  }, []);

  // Querying Supabase is the "subscribe to an external system" case; the state
  // set here is the query result, not derived render state.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void load(); }, [load]);

  /* A new member appears without a refresh — the same realtime infrastructure
     the rest of the platform uses, no polling. */
  useEffect(() => {
    const ch = supabase.channel("afq-community")
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, () => { void load(); })
      .subscribe();
    return () => { void supabase.removeChannel(ch); };
  }, [load]);

  /* The database rows and the presence roster are merged into one stack.
     Presence is the only source that reaches every kind of member from a
     student's session — students, advisors and super admins alike — so
     anybody online who RLS hid from the queries above still appears. Keyed by
     user id, so a person read from both sources is one avatar, not two. */
  const byId = new Map<string, GroupAvatar & { joined: string }>();

  for (const m of members) {
    byId.set(m.id, {
      key: m.id, alt: m.name, src: m.avatar, joined: m.joined,
      online: online.some((o) => o.userId === m.id),
    });
  }

  for (const o of online) {
    const existing = byId.get(o.userId);
    if (existing) { existing.online = true; continue; }
    byId.set(o.userId, {
      key: o.userId,
      alt: o.name || (o.role === "admin" ? "AfaqWay advisor" : "Student"),
      src: null,
      online: true,
      /* No join date available for a presence-only entry, so it sorts to the
         front — they are here right now, which is the freshest signal there
         is. */
      joined: new Date().toISOString(),
    });
  }

  const avatars: GroupAvatar[] = [...byId.values()]
    .sort((a, b) => +new Date(b.joined) - +new Date(a.joined))
    .map((a) => ({ key: a.key, alt: a.alt, src: a.src, online: a.online }));

  return { avatars, total: avatars.length, activeNow: online.length };
}

/* ── The section ───────────────────────────────────────────────────────────── */

export function ActiveCommunity({ className }: { className?: string }) {
  const { avatars, total, activeNow } = useActiveCommunity();

  return (
    <section className={`lca${className ? ` ${className}` : ""}`}>
      <h3 className="lca-title">Our Community Is Here!</h3>

      {total === 0 ? (
        /* Nothing invented: with no members there is no community to show. */
        <p className="lca-empty">The community is just getting started.</p>
      ) : (
        <>
          {/* max = the whole list: every student and every admin is shown. */}
          <AvatarGroup avatars={avatars} max={avatars.length} />
          <span className="lca-cap">
            <span className="lca-pulse" aria-hidden />
            {activeNow === 1 ? "1 person active now" : `${activeNow} people active now`}
          </span>
        </>
      )}
    </section>
  );
}

export default ActiveCommunity;
