"use client";

import { useCallback, useEffect, useState } from "react";
import {
  CircleCheck, Clock3, Download, ExternalLink, FileText, MessageCircle, TriangleAlert, Upload,
} from "lucide-react";
import { AnimatedModal, Loader, Status } from "@/components/ds";
import { fileUrl, uploadUserFile } from "@/lib/storage/client";
import { fetchDocuments, logEvent, mergeStepMeta, saveDocument, subscribeJourney, type DbDocument, type DocRequirement, type DocStatus } from "@/lib/journeyDb";
import { noteStepOpened, autoAdvanceStepOnDocsComplete } from "@/lib/journeyEvents";
import { stepDocuments, type JourneyStage, type JourneyStep, DOC_STATUS } from "@/lib/journey";
import type { StudyApp } from "@/lib/studyApplication";
import { JrButton } from "./parts";
import { ReviewBanner, bannerKindFor } from "./ReviewBanner";
import { StepBlocks } from "./StepBlocks";
import { ReplaceDialog } from "../documents/ReplaceDialog";

/* One step, start to finish, in one place.

   Three numbered sections in a fixed order, because that is the order a
   student actually needs them in: what am I being asked to do, how do I do
   it, and what do I hand in. Everything the step needs is here — including
   the upload itself, which used to bounce the student out to the Documents
   module mid-task.

   A step with no document requirement drops section 3 entirely and gets a
   "Mark as Done" button instead; there is nothing to hand in, so asking for
   an upload would be a dead control. */

const DOC_ICON = (status: DocStatus) =>
  status === "approved" ? <CircleCheck size={17} />
    : status === "needs_changes" ? <TriangleAlert size={17} />
      : status === "under_review" || status === "uploaded" ? <Clock3 size={17} />
        : <FileText size={17} />;

/** Opens a stored file in a new tab, signing the URL on demand. */
async function openStored(path: string, name: string, download: boolean) {
  const url = await fileUrl(path, download ? name : undefined);
  if (url) window.open(url, "_blank", "noopener,noreferrer");
}

export function JourneyStepModal({ stage, step, open, onClose, onOpenChat, onMarkDone, onChanged, highlightChat, userId, plan, study }: {
  stage: JourneyStage;
  step: JourneyStep;
  open: boolean;
  onClose: () => void;
  /** Opens the chat on the advisor conversation. */
  onOpenChat?: () => void;
  /** Raises the chat button to gold — set for the final, support-led stage. */
  highlightChat?: boolean;
  /** Completes a step that needs no upload, through the roadmap's own rules. */
  onMarkDone?: () => void;
  /** Tells the roadmap to re-read progress after an upload changed something. */
  onChanged?: () => void;
  userId: string;
  /** Used to resolve plan-specific and programme-derived Learn content. */
  plan?: string | null;
  study?: StudyApp | null;
}) {
  /* Dismissed once the student has read the advisor's message; the decision
     itself stays visible in the step's own status. */
  const [bannerSeen, setBannerSeen] = useState(false);
  const [uploads, setUploads] = useState<DbDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);
  const [picking, setPicking] = useState<{ requirement: DocRequirement; status: DocStatus; existingName?: string } | null>(null);
  const docs = stepDocuments(step, uploads);
  const banner = bannerKindFor(step);

  const needsDocs = step.requirements.length > 0;
  const settled = step.state === "completed" || step.state === "skipped";
  const awaitingReview = step.state === "submitted";

  const load = useCallback(async () => {
    setUploads(await fetchDocuments(userId, [step.id]));
    setLoading(false);
  }, [userId, step.id]);
  // Fetching from Supabase is the "subscribe to an external system" case; the
  // state set here is the query result, not derived render state.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void load(); }, [load]);
  // An advisor verifying a document must show up here without a refresh.
  useEffect(() => subscribeJourney(() => { void load(); }), [load]);

  /* "Pin the notification at the top of the Notifications page UNTIL the student
     opens this Journey step", and "if the student has not opened the step within
     48 hours, send one reminder". Opening it is therefore an event in its own
     right: it unpins the warning and withdraws the nudge that is no longer true. */
  useEffect(() => {
    if (!open || step.meta.openedAt) return;
    void (async () => {
      await noteStepOpened(userId, step.id, step.meta);
      await mergeStepMeta(userId, step.id, { ...step.meta, openedAt: new Date().toISOString() });
    })();
  }, [open, userId, step.id, step.meta]);

  /* Upload happens here now, not in the Documents module. The file is stored,
     recorded against this step, and — once every required document is in —
     the step submits itself for review, so finishing the last upload is the
     same action as handing the step in. */
  const uploadFor = async (requirement: DocRequirement, file: File) => {
    setUploadingKey(requirement.key);
    try {
      const up = await uploadUserFile(file, { folder: "documents" });
      await saveDocument({
        user_id: userId, step_id: step.id, doc_key: requirement.key,
        name: requirement.name, file_path: up.path, file_name: up.fileName,
        mime_type: up.mimeType, size_bytes: up.size, status: "uploaded",
      });
      await logEvent({
        user_id: userId, step_id: step.id, stage_id: stage.id,
        kind: "document_uploaded", actor: "student",
        message: `Uploaded ${requirement.name || requirement.key}.`,
      });

      const fresh = await fetchDocuments(userId, [step.id]);
      setUploads(fresh);
      setPicking(null);

      const have = new Set(fresh.filter((d) => d.file_path).map((d) => d.doc_key));
      const missing = step.requirements.filter((r) => r.required && !have.has(r.key));
      if (missing.length === 0) await autoAdvanceStepOnDocsComplete(userId, step, stage.id, stage.title);
      onChanged?.();
    } finally {
      setUploadingKey(null);
    }
  };

  return (
    <AnimatedModal open={open} onClose={onClose} className="jr-modal stpx-modal" ariaLabel={step.title}>
      <header className="stpx-head">
        <div className="stpx-eyebrow">Stage {stage.index} · {stage.title} · Step {step.index}</div>
        <h2 className="stpx-title">{step.title}</h2>
        <Status state={settled ? "completed" : awaitingReview ? "waiting" : "pending"}
          label={settled ? "Completed" : awaitingReview ? "Waiting review" : "In progress"} />
      </header>

      <div className="jr-modal-body stpx-body">
        {banner && !bannerSeen && (
          <ReviewBanner
            kind={banner} message={step.reviewComment}
            onOpenChat={() => { setBannerSeen(true); onOpenChat?.(); }}
          />
        )}

        {/* ── 1 · What you need to do ── */}
        <section className="stpx-sec">
          <div className="stpx-sec-head"><span className="stpx-num">1</span><h3>What you need to do</h3></div>
          <p className="stpx-lead">
            {step.description || "Your advisor has not added a description for this step yet."}
          </p>
        </section>

        {/* ── 2 · How to complete it ── */}
        <section className="stpx-sec">
          <div className="stpx-sec-head"><span className="stpx-num">2</span><h3>How to complete it</h3></div>
          <StepBlocks
            stepId={step.id} fallback="Your advisor has not added any guidance to this step yet."
            plan={plan} study={study}
            /* "Keep the banner visible until the student marks the step as
               completed." Once it is done, the warning has served its purpose
               and only adds noise to a step they are revisiting. */
            hideBanner={step.state === "completed"}
          />
        </section>

        {/* ── 3 · Required documents — only when the step actually asks for one ── */}
        {needsDocs && (
          <section className="stpx-sec">
            <div className="stpx-sec-head">
              <span className="stpx-num">3</span><h3>Required documents</h3>
              <span className="stpx-count">{docs.verified}/{docs.required} verified</span>
            </div>

            {/* How far along, without having to count rows. Counts anything
                handed in — uploaded or already verified — because from the
                student's side both mean "done with that one". */}
            {!loading && docs.required > 0 && (() => {
              const handedIn = docs.docs.filter((d) => d.requirement.required && d.upload?.file_path).length;
              const pct = Math.round((handedIn / docs.required) * 100);
              return (
                <div className={`stpx-prog${handedIn >= docs.required ? " done" : ""}`}>
                  <span className="stpx-prog-track"><span className="stpx-prog-fill" style={{ width: `${pct}%` }} /></span>
                  <span className="stpx-prog-label">{handedIn} of {docs.required} uploaded</span>
                </div>
              );
            })()}

            {loading ? <Loader block /> : (
              <ul className="stpx-docs">
                {docs.docs.map(({ requirement, upload, status }) => (
                  <li key={requirement.key} className={`stpx-doc tone-${DOC_STATUS[status].state}`}>
                    <span className="stpx-doc-ico">{DOC_ICON(status)}</span>
                    <div className="stpx-doc-main">
                      <div className="stpx-doc-name">
                        {requirement.name || requirement.key}
                        {!requirement.required && <em>optional</em>}
                      </div>
                      {requirement.description && <p className="stpx-doc-sub">{requirement.description}</p>}
                      {requirement.instructions && <p className="stpx-doc-sub">{requirement.instructions}</p>}
                      {upload?.review_comment && <p className="stpx-doc-msg">{upload.review_comment}</p>}
                      <div className="stpx-doc-meta">
                        <Status state={DOC_STATUS[status].state} label={DOC_STATUS[status].label} size="xs" />
                        {upload?.file_name && <span className="stpx-doc-file">{upload.file_name}</span>}
                      </div>
                    </div>
                    <div className="stpx-doc-acts">
                      {requirement.templatePath && (
                        <JrButton icon={<Download size={14} />} onClick={() => openStored(requirement.templatePath, requirement.templateName || "template", true)}>
                          Template
                        </JrButton>
                      )}
                      {upload?.file_path && (
                        <JrButton icon={<ExternalLink size={14} />} onClick={() => openStored(upload.file_path, upload.file_name, false)}>View</JrButton>
                      )}
                      <JrButton
                        tone={upload?.file_path ? "outline" : "primary"}
                        icon={<Upload size={15} />}
                        disabled={uploadingKey === requirement.key}
                        onClick={() => setPicking({ requirement, status, existingName: upload?.file_name ?? undefined })}
                      >
                        {uploadingKey === requirement.key ? "Uploading…" : upload?.file_path ? "Replace" : "Upload"}
                      </JrButton>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            {!loading && !settled && !awaitingReview && (
              <p className="stpx-hint">
                Upload every required document and this step is handed to your advisor automatically.
              </p>
            )}
          </section>
        )}
      </div>

      {/* In the final stage the advisor IS the step — settling into a new
          country is handled by talking to a person, not by uploading
          anything — so the chat button is raised to gold there rather than
          sitting quiet alongside actions that no longer apply. Same label,
          same icon; only the emphasis changes. */}
      <footer className={`jr-modal-foot stpx-foot${highlightChat ? " chat-gold" : ""}`}>
        <JrButton tone="quiet" size="md" icon={<MessageCircle size={15} />} onClick={() => onOpenChat?.()}>
          Chat with advisor
        </JrButton>
        <div className="stpx-foot-right">
          <JrButton tone="quiet" size="md" onClick={onClose}>Close</JrButton>
          {/* A step with nothing to upload is finished by saying so — in its
              own words where it has them. Stage 5's first step is a support
              request, not a report of work done, so "Mark as Done" would be
              actively wrong there; step.cta carries the right wording. */}
          {!needsDocs && !settled && !awaitingReview && onMarkDone && (
            <JrButton
              tone="primary" size="md"
              icon={step.support ? <MessageCircle size={15} /> : <CircleCheck size={15} />}
              onClick={onMarkDone}
            >
              {step.cta
                || (step.completion === "decision" ? "Report my decision"
                  : step.completion === "self" ? "Mark as Completed" : "Mark as Done")}
            </JrButton>
          )}
        </div>
      </footer>

      {picking && (
        <ReplaceDialog
          requirement={picking.requirement}
          status={picking.status}
          existingName={picking.existingName}
          onCancel={() => setPicking(null)}
          onConfirm={(file) => uploadFor(picking.requirement, file)}
        />
      )}
    </AnimatedModal>
  );
}

export default JourneyStepModal;
