"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldAlert, RotateCcw, SkipForward, ArrowRightToLine, RefreshCw, Bell, CheckCheck } from "lucide-react";
import { AnimatedModal, DialogHead, DialogFoot, DialogCard, Select } from "@/components/ds";
import { JrButton } from "@/components/student/workspace/journey/parts";
import { supabase } from "@/lib/supabase/client";
import { isTesterEmail } from "@/lib/tester";
import {
  verifyTesterCode, restartOnboarding, skipJourneyStage, jumpJourneyStage, resetJourneyStage,
  sendTestNotification, markAllTestNotificationsRead, type NotifyScenario,
} from "@/lib/tester/client";

/* The tester-only control centre — see /api/tester/* for the server side of
   every action here. Nothing in this file is the security boundary: it is
   rendered at all only when isTesterEmail(email) is true, but that is a
   convenience, not a guarantee — every route it calls independently
   re-verifies caller.isTester from the caller's own Supabase session before
   touching anything, so hiding this component is not the only thing
   standing between a normal account and these actions. */

/** Live, in-page onboarding navigation — only available while the tester is
    actually on /profile-setup, since the screen list is computed there and
    nowhere else. Restart does not need this: it reloads the page. */
export type OnboardingLive = {
  screens: { id: string; title: string }[];
  currentId: string;
  onSkipStep: () => void;
  onJumpStep: (id: string) => void;
};

const NOTIF_SCENARIOS: { key: NotifyScenario; label: string }[] = [
  { key: "platform_update", label: "Platform update" },
  { key: "journey_approved", label: "Journey approved" },
  { key: "journey_rejected", label: "Journey rejected" },
  { key: "journey_changes", label: "Journey needs changes" },
  { key: "advisor_reminder", label: "Advisor reminder" },
  { key: "unread", label: "Unread notification" },
];

export function TesterControls({ email, live }: { email: string | null | undefined; live?: OnboardingLive }) {
  if (!isTesterEmail(email)) return null;
  return <TesterControlsInner live={live} />;
}

function TesterControlsInner({ live }: { live?: OnboardingLive }) {
  const router = useRouter();
  const [stage, setStage] = useState<"closed" | "code" | "panel">("closed");
  const [digits, setDigits] = useState(["", "", "", ""]);
  const [codeErr, setCodeErr] = useState("");
  const [checking, setChecking] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ tone: "ok" | "err"; text: string } | null>(null);
  const [stages, setStages] = useState<{ value: string; label: string }[]>([]);
  const [pickedStage, setPickedStage] = useState("");
  const refs = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)];

  /* For the "Jump to stage" / "Reset stage" pickers only — a display list.
     The actual mutation re-derives the stage set itself, server-side, so a
     stale or mismatched list here is a labelling inconvenience, never a
     correctness issue. */
  const loadStages = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: profile } = await supabase.from("profiles").select("plan, destination_country").eq("id", user.id).maybeSingle();
    const plan = (profile as { plan?: string | null } | null)?.plan;
    if (!plan) { setStages([]); return; }
    const country = (profile as { destination_country?: string | null } | null)?.destination_country || "LT";
    const { data } = await supabase.from("journey_stages").select("id, title, sort_order")
      .eq("country", country).eq("plan", plan).eq("status", "published").order("sort_order");
    const rows = (data ?? []) as { id: string; title: string; sort_order: number }[];
    setStages(rows.map((s) => ({ value: s.id, label: `${s.sort_order}. ${s.title}` })));
  }, []);
  // Fetching from Supabase is the "subscribe to an external system" case; the
  // state set here is the query result, not derived render state.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { if (stage === "panel") void loadStages(); }, [stage, loadStages]);

  function openGate() { setStage("code"); setDigits(["", "", "", ""]); setCodeErr(""); }
  function close() { setStage("closed"); setMsg(null); setBusy(null); }

  async function submitCode(code: string) {
    setChecking(true); setCodeErr("");
    try {
      const res = await verifyTesterCode(code);
      if (res.ok) { setStage("panel"); setDigits(["", "", "", ""]); }
      else throw new Error();
    } catch {
      setCodeErr("Incorrect code. Try again.");
      setDigits(["", "", "", ""]);
      refs[0].current?.focus();
    } finally {
      setChecking(false);
    }
  }
  function setDigit(i: number, raw: string) {
    const v = raw.replace(/\D/g, "").slice(-1);
    const next = [...digits]; next[i] = v; setDigits(next);
    if (v && i < 3) refs[i + 1].current?.focus();
    if (next.every((d) => d !== "")) void submitCode(next.join(""));
  }

  async function run(key: string, fn: () => Promise<Record<string, unknown>>, okText: string) {
    setBusy(key); setMsg(null);
    try {
      const res = await fn();
      const note = typeof res.note === "string" ? res.note : "";
      setMsg({ tone: "ok", text: note || okText });
    } catch (err) {
      setMsg({ tone: "err", text: err instanceof Error ? err.message : "Something went wrong." });
    } finally {
      setBusy(null);
    }
  }

  async function doRestart() {
    setBusy("restart"); setMsg(null);
    try {
      await restartOnboarding();
      // Re-fetches the profile fresh rather than hand-resetting local state
      // in two different pages — the onboarding page's own load effect
      // already knows how to land on the first unanswered screen.
      if (live) window.location.reload();
      else router.push("/profile-setup");
    } catch (err) {
      setMsg({ tone: "err", text: err instanceof Error ? err.message : "Something went wrong." });
      setBusy(null);
    }
  }

  return (
    <>
      {/* Onboarding already has its own compact rounded-pill trigger for the
          top-right corner (the Log out button uses it); reused here rather
          than adding a second red button style to that surface. The
          workspace topbar's icon buttons are a different shape, so it gets
          its own .tstr-trigger to match instead. */}
      <button
        type="button"
        className={live ? "onb-pill onb-pill-round onb-pill-danger" : "tstr-trigger"}
        onClick={openGate} aria-label="Tester / Admin Controls" title="Tester / Admin Controls"
      >
        <ShieldAlert size={live ? 15 : 18} strokeWidth={2} />
      </button>

      <AnimatedModal open={stage === "code"} onClose={close} className="dlg tstr-code-dlg" ariaLabel="Tester Controls">
        <DialogHead title="Tester Controls">Enter the 4-digit tester code to continue.</DialogHead>
        <div className="dlg-body">
          <div className="tstr-code-row">
            {digits.map((d, i) => (
              <input
                key={i} ref={refs[i]} value={d ? "•" : ""} inputMode="numeric" maxLength={1} autoFocus={i === 0}
                onChange={(e) => setDigit(i, e.target.value)}
                onKeyDown={(e) => { if (e.key === "Backspace" && !digits[i] && i > 0) refs[i - 1].current?.focus(); }}
                className="af tstr-code-box" aria-label={`Digit ${i + 1} of 4`}
              />
            ))}
          </div>
          <div className="tstr-code-status">{checking ? "Checking…" : codeErr}</div>
        </div>
        <DialogFoot><JrButton tone="quiet" size="md" onClick={close}>Cancel</JrButton></DialogFoot>
      </AnimatedModal>

      <AnimatedModal open={stage === "panel"} onClose={close} className="dlg tstr-panel" ariaLabel="Tester Controls">
        <DialogHead eyebrow="QA only — excluded from every statistic" title="Tester Controls">
          Every action below runs the real onboarding, journey and notification code, only on this account.
        </DialogHead>
        <div className="dlg-body">
          {msg && <div className={`tstr-msg tstr-msg-${msg.tone}`}>{msg.text}</div>}

          <DialogCard title="Onboarding">
            <div className="tstr-row">
              <JrButton tone="danger" size="sm" icon={<RotateCcw size={14} />} disabled={busy !== null} onClick={doRestart}>
                {busy === "restart" ? "Restarting…" : "Restart onboarding"}
              </JrButton>
              {live && (
                <>
                  <JrButton tone="outline" size="sm" icon={<SkipForward size={14} />} disabled={busy !== null} onClick={live.onSkipStep}>
                    Skip current step
                  </JrButton>
                  <Select
                    value={live.currentId} onChange={live.onJumpStep}
                    options={live.screens.map((s) => ({ value: s.id, label: s.title }))}
                    ariaLabel="Jump to onboarding step" placeholder="Jump to step…"
                  />
                </>
              )}
            </div>
            {!live && <p className="tstr-hint">Step skip and jump only work while onboarding itself is open.</p>}
          </DialogCard>

          <DialogCard title="Journey">
            <div className="tstr-row">
              <JrButton tone="outline" size="sm" icon={<SkipForward size={14} />} disabled={busy !== null}
                onClick={() => run("skip", () => skipJourneyStage(), "Current stage completed — the next one is now open.")}
              >
                {busy === "skip" ? "Working…" : "Skip current stage"}
              </JrButton>
            </div>
            <div className="tstr-row">
              <Select value={pickedStage} onChange={setPickedStage} options={stages} ariaLabel="Stage" placeholder="Choose a stage…" />
              <JrButton tone="outline" size="sm" icon={<ArrowRightToLine size={14} />} disabled={busy !== null || !pickedStage}
                onClick={() => run("jump", () => jumpJourneyStage(pickedStage), "Jumped to that stage.")}
              >
                Jump to stage
              </JrButton>
              <JrButton tone="quiet" size="sm" icon={<RefreshCw size={14} />} disabled={busy !== null || !pickedStage}
                onClick={() => run("reset", () => resetJourneyStage(pickedStage), "Stage reset to pending.")}
              >
                Reset stage
              </JrButton>
            </div>
            {!stages.length && <p className="tstr-hint">No plan or journey assigned to this account yet.</p>}
          </DialogCard>

          <DialogCard title="Notifications">
            <div className="tstr-row tstr-wrap">
              {NOTIF_SCENARIOS.map((s) => (
                <JrButton key={s.key} tone="quiet" size="sm" icon={<Bell size={14} />} disabled={busy !== null}
                  onClick={() => run(s.key, () => sendTestNotification(s.key), `Sent: ${s.label}.`)}
                >
                  {s.label}
                </JrButton>
              ))}
              <JrButton tone="outline" size="sm" icon={<CheckCheck size={14} />} disabled={busy !== null}
                onClick={() => run("mark_all_read", () => markAllTestNotificationsRead(), "All notifications marked as read.")}
              >
                Mark all as read
              </JrButton>
            </div>
          </DialogCard>
        </div>
        <DialogFoot><JrButton tone="quiet" size="md" onClick={close}>Close</JrButton></DialogFoot>
      </AnimatedModal>
    </>
  );
}

export default TesterControls;
