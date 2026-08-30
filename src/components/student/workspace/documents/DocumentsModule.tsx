"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  CircleCheckBig, Clock3, Download, ExternalLink, FileText, Layers, TriangleAlert, Upload,
} from "lucide-react";
import { Loader, Status } from "@/components/ds";
import { fileUrl, openFilePreview, uploadUserFile } from "@/lib/storage/client";
import {
  fetchApprovals, fetchDocuments, fetchProgress, fetchStages, fetchSteps, logEvent,
  saveDocument, stepRequirements, subscribeJourney,
  type DbDocument, type DbStep, type DocRequirement, type DocStatus, type Plan,
} from "@/lib/journeyDb";
import { assembleRoadmap, DOC_STATUS, type JourneyStep } from "@/lib/journey";
import { autoAdvanceStepOnDocsComplete } from "@/lib/journeyEvents";
import { JrButton } from "../journey/parts";
import { ReplaceDialog } from "./ReplaceDialog";
import type { WsProfile } from "../Modules";

/* Documents — the single upload location for the whole platform.

   The list is not a fixed catalogue. Every requirement here was defined by an
   administrator on a Journey step, so adding a requirement to a step makes it
   appear for the student, and an advisor's verification appears back on the
   step. Nothing is uploaded anywhere else. */

type Row = {
  requirement: DocRequirement;
  step: DbStep;
  stageTitle: string;
  upload: DbDocument | null;
  status: DocStatus;
};


/* Icon and tone only show up in the mobile "quick action" card layout
   (see .dm-segico in globals.css) — the desktop pill row stays exactly as
   it was, text-only. */
const FILTERS: { id: "all" | DocStatus; label: string; icon: React.ReactNode; color: string; tint: string }[] = [
  { id: "all", label: "All", icon: <Layers size={15} />, color: "var(--indigo-600)", tint: "var(--indigo-tint)" },
  { id: "approved", label: "Completed", icon: <CircleCheckBig size={15} />, color: "var(--green)", tint: "var(--green-tint)" },
  { id: "under_review", label: "Under review", icon: <Clock3 size={15} />, color: "var(--amber)", tint: "var(--amber-tint)" },
  { id: "needs_changes", label: "Needs changes", icon: <TriangleAlert size={15} />, color: "var(--red)", tint: "var(--red-tint)" },
  { id: "pending", label: "Not uploaded", icon: <FileText size={15} />, color: "var(--ink-faint)", tint: "var(--subtle)" },
];

export function Documents({ profile, onNav }: { profile: WsProfile; onNav?: (id: string) => void }) {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | DocStatus>("all");
  const [focusStepId, setFocusStepId] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [stage, setStage] = useState<{ index: number; title: string } | null>(null);
  /* Replace opens a dialog first, never the file picker straight away. */
  const [replacing, setReplacing] = useState<Row | null>(null);
  // The assembled step behind each row (state, completion rules) — kept in a
  // ref rather than state, since it's read right after load() resolves, not
  // rendered from directly.
  const stepsRef = useRef<Map<string, JourneyStep>>(new Map());
  const activeStageRef = useRef<{ id: string; title: string } | null>(null);

  const load = useCallback(async () => {
    const plan = (profile.plan ?? "self_service") as Plan;
    const stages = await fetchStages(plan, "LT", false, profile.academic?.targetDegree);
    const steps = await fetchSteps(stages.map((s) => s.id));
    const [uploads, progress, approvals] = await Promise.all([
      fetchDocuments(profile.userId), fetchProgress(profile.userId), fetchApprovals(profile.userId),
    ]);

    /* Only the stage the student is working on. Finished stages are history and
       future ones are not theirs to prepare yet, so both are hidden entirely.
       When the stage advances, this list follows on its own. */
    const roadmap = assembleRoadmap(stages, steps, progress, approvals, {
      plan: profile.plan, tester: profile.tester,
    });
    const active = roadmap.find((st) => st.state === "current" || st.state === "waiting_approval") ?? roadmap[0];
    const activeSteps = (steps as DbStep[]).filter((st) => st.stage_id === active?.id);
    // A step's own completion state, from the assembled roadmap — the raw
    // DbStep list above has no notion of "done", only what was configured.
    const assembledById = new Map((active?.steps ?? []).map((s) => [s.id, s]));
    stepsRef.current = assembledById;
    activeStageRef.current = active ? { id: active.id, title: active.title } : null;

    const byKey = new Map(uploads.map((u) => [`${u.step_id}:${u.doc_key}`, u]));
    const list: Row[] = [];
    for (const step of activeSteps) {
      for (const requirement of stepRequirements(step)) {
        const upload = byKey.get(`${step.id}:${requirement.key}`) ?? null;
        const stepState = assembledById.get(step.id)?.state;
        const rawStatus = (upload?.status ?? "pending") as DocStatus;
        // The step being done is the stronger signal: once an advisor has
        // moved a step past pending, its documents read as resolved here
        // too, rather than lingering as "Not uploaded" for a step that
        // didn't need one, or "Under review" after the step itself closed.
        // Submitting the step (mark as done) is the same signal one notch
        // earlier: the upload itself only ever starts life as "uploaded" —
        // nothing sets it to "under_review" until an admin opens
        // UserDetails and changes it by hand — so without this, a document
        // the student just submitted sat outside every filter but "All"
        // until an admin happened to look at it.
        const status: DocStatus =
          (stepState === "completed" || stepState === "skipped") ? "approved"
          : (stepState === "submitted" && rawStatus === "uploaded") ? "under_review"
          : rawStatus;
        list.push({ requirement, step, stageTitle: active?.title ?? "", upload, status });
      }
    }
    setRows(list);
    setStage(active ? { index: active.index, title: active.title } : null);
    setLoading(false);
    return list;
  }, [profile.plan, profile.userId, profile.tester, profile.academic?.targetDegree]);
  // Fetching from Supabase is the "subscribe to an external system" case; the
  // state set here is the query result, not derived render state.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void load(); }, [load]);
  // A new requirement or a verification shows up without a refresh.
  useEffect(() => subscribeJourney(() => { void load(); }), [load]);

  /* The Journey module hands over the exact step it wants uploaded. */
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("af.journey.focus");
      if (!raw) return;
      sessionStorage.removeItem("af.journey.focus");
      const focus = JSON.parse(raw) as { stepId?: string };
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (focus.stepId) setFocusStepId(focus.stepId);
    } catch { /* storage blocked or malformed */ }
  }, []);

  /* The dialog validated the file; this only stores it and hands the student
     back to the step they came from. */
  const uploadFor = async (row: Row, file: File) => {
    setBusy(row.requirement.key);
    setError("");
    try {
      const up = await uploadUserFile(file, { folder: "documents" });
      await saveDocument({
        user_id: profile.userId, step_id: row.step.id, doc_key: row.requirement.key,
        name: row.requirement.name, file_path: up.path, file_name: up.fileName,
        mime_type: up.mimeType, size_bytes: up.size, status: "uploaded",
      });
      await logEvent({
        user_id: profile.userId, step_id: row.step.id, stage_id: row.step.stage_id,
        kind: "document_uploaded", actor: "student", message: `Uploaded ${row.requirement.name || row.requirement.key}.`,
      });
      const freshRows = await load();

      // Every required document for this step now has something uploaded —
      // advance the step the same way its own button would, without making
      // the student go back to Journey to press it.
      const stillMissing = freshRows.some((r) =>
        r.step.id === row.step.id && r.requirement.required && !r.upload);
      if (!stillMissing) {
        const step = stepsRef.current.get(row.step.id);
        const stage = activeStageRef.current;
        if (step && stage) {
          const advanced = await autoAdvanceStepOnDocsComplete(profile.userId, step, stage.id, stage.title);
          if (advanced) await load();
        }
      }

      setReplacing(null);
      setBusy(null);

      /* Back to the Journey with this step reopened, so the student sees the
         new verification state in context instead of a bare document list. */
      if (onNav) {
        try {
          sessionStorage.setItem("af.journey.open", JSON.stringify({ stepId: row.step.id, stageId: row.step.stage_id }));
        } catch { /* storage blocked */ }
        onNav("journey");
      }
    } catch (err) {
      setBusy(null);
      throw err instanceof Error ? err : new Error("Upload failed. Please try again.");
    }
  };

  const open = async (path: string, name: string, download: boolean) => {
    const url = await fileUrl(path, download ? name : undefined);
    if (url) window.open(url, "_blank", "noopener,noreferrer");
  };

  const scoped = focusStepId ? rows.filter((r) => r.step.id === focusStepId) : rows;
  const visible = scoped.filter((r) => filter === "all" || r.status === filter);
  const count = (s: DocStatus) => rows.filter((r) => r.status === s).length;

  if (loading) return <Loader size={48} block label="Loading your documents" />;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <header className="dm-head">
        <div style={{ minWidth: 0 }}>
          {/* The stage reads as part of the title, at the same size and with no
              frame around it: "Documents — Stage 1: Pre-Application". */}
          <h2 className="dm-title">
            Documents
            {stage && <span className="dm-title-stage">Stage {stage.index}: {stage.title}</span>}
          </h2>
          <p className="dm-sub">Everything your current stage needs.</p>
        </div>
      </header>

      {error && <p className="stp-hint"><TriangleAlert size={14} />{error}</p>}

      <div className="dm-seg" role="tablist" aria-label="Filter documents">
        {FILTERS.map((f) => (
          <button
            key={f.id} type="button" role="tab" aria-selected={filter === f.id}
            onClick={() => setFilter(f.id)}
            className={`dm-segbtn${filter === f.id ? " active" : ""}`}
          >
            {/* Desktop-hidden — only the mobile "quick action" card layout
                (globals.css) shows this icon; the desktop pill row is
                unchanged, text + count only. */}
            <span className="dm-segico" style={{ color: f.color, background: f.tint }}>{f.icon}</span>
            <span className="dm-seglabel">{f.label}</span>
            <span className="dm-segcount">{f.id === "all" ? rows.length : count(f.id as DocStatus)}</span>
          </button>
        ))}
      </div>

      {rows.length === 0 ? (
        <p className="stp-hint stp-hint-grey">
          <FileText size={14} />No documents are required in your current stage.
        </p>
      ) : visible.length === 0 ? (
        <p className="stp-hint stp-hint-grey">
          <FileText size={14} />Nothing matches this filter.
        </p>
      ) : (
        <ul className="dm-cards">
          {visible.map((row) => {
            const { requirement: r, upload, status } = row;
            return (
              /* Same treatment as the subscription plan card: tinted surface in
                 the platform colours with the file mark oversized behind it. */
              <li key={`${row.step.id}:${r.key}`} className={`dm-card tone-${DOC_STATUS[status].state}`}>
                <span aria-hidden className="dm-card-bg"><FileText size={150} /></span>
                <span className="dm-card-ico">
                  {status === "approved" ? <CircleCheckBig size={18} />
                    : status === "needs_changes" ? <TriangleAlert size={18} />
                    : status === "under_review" ? <Clock3 size={18} /> : <FileText size={18} />}
                </span>
                <div className="dm-card-body">
                  <div className="jr-doc-name">
                    {r.name || r.key}
                    {!r.required && <span className="jr-doc-opt">Optional</span>}
                  </div>
                  <p className="stp-doc-sub">{row.stageTitle} · {row.step.title}</p>
                  {r.description && <p className="jr-doc-desc">{r.description}</p>}
                  {r.instructions && <p className="jr-doc-desc">{r.instructions}</p>}
                  <div className="jr-doc-meta">
                    <Status state={DOC_STATUS[status].state} label={DOC_STATUS[status].label} />
                    {r.acceptedTypes && <span>{r.acceptedTypes.toUpperCase()}</span>}
                    {r.maxSizeMb > 0 && <span>max {r.maxSizeMb} MB</span>}
                    {upload?.file_name && <span>{upload.file_name}</span>}
                  </div>
                  {upload?.review_comment && <p className="jr-doc-note">{upload.review_comment}</p>}
                </div>
                <div className="dm-card-acts">
                  {r.templatePath && (
                    <JrButton icon={<Download size={14} />} onClick={() => open(r.templatePath, r.templateName || "template", true)}>
                      Template
                    </JrButton>
                  )}
                  {upload?.file_path && (
                    <>
                      <JrButton icon={<ExternalLink size={14} />} onClick={() => void openFilePreview(upload.file_path)}>View</JrButton>
                      <JrButton icon={<Download size={14} />} onClick={() => open(upload.file_path, upload.file_name, true)}>Download</JrButton>
                    </>
                  )}
                  <JrButton
                    tone={upload?.file_path ? "outline" : "primary"} icon={<Upload size={14} />}
                    disabled={busy === r.key} onClick={() => setReplacing(row)}
                  >
                    {busy === r.key ? "Uploading…" : upload?.file_path ? "Replace" : "Upload"}
                  </JrButton>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      {replacing && (
        <ReplaceDialog
          requirement={replacing.requirement}
          status={replacing.status}
          existingName={replacing.upload?.file_name}
          onCancel={() => setReplacing(null)}
          onConfirm={(file) => uploadFor(replacing, file)}
        />
      )}
    </div>
  );
}

export default Documents;
