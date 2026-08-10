"use client";

import { useCallback, useEffect, useState } from "react";
import {
  BookOpen, CircleCheck, Clock3, Download, ExternalLink, FileText, Info, TriangleAlert, Upload,
} from "lucide-react";
import { AnimatedModal, Loader, Status } from "@/components/ds";
import { fileUrl } from "@/lib/storage/client";
import { fetchDocuments, mergeStepMeta, subscribeJourney, type DbDocument } from "@/lib/journeyDb";
import { noteStepOpened } from "@/lib/journeyEvents";
import { stepDocuments, type JourneyStage, type JourneyStep, DOC_STATUS } from "@/lib/journey";
import type { StudyApp } from "@/lib/studyApplication";
import { JrButton } from "./parts";
import { ReviewBanner, bannerKindFor } from "./ReviewBanner";
import { StepBlocks } from "./StepBlocks";

/* Journey step details.

   Deliberately plain: the title, the description, and two sections behind a
   segmented bar. Learn first, always, so a student reads the guidance before
   diving into paperwork; Required Documents second.

   Uploading never happens here. The Documents module is the single upload
   location, and this modal hands the student over to it with the step already
   selected. */

type Tab = "docs" | "learn";


/** Opens a stored file in a new tab, signing the URL on demand. */
async function openStored(path: string, name: string, download: boolean) {
  const url = await fileUrl(path, "documents", download ? name : undefined);
  if (url) window.open(url, "_blank", "noopener,noreferrer");
}

export function JourneyStepModal({ stage, step, open, onClose, onOpenDocuments, onOpenChat, userId, plan, study }: {
  stage: JourneyStage;
  step: JourneyStep;
  open: boolean;
  onClose: () => void;
  /** Opens the Documents module filtered to this step. */
  onOpenDocuments: (stage: JourneyStage, step: JourneyStep) => void;
  /** Opens the chat on the advisor conversation, at the latest review message. */
  onOpenChat?: () => void;
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
  const docs = stepDocuments(step, uploads);
  const banner = bannerKindFor(step);
  const [tab, setTab] = useState<Tab>("learn");

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

  return (
    <AnimatedModal open={open} onClose={onClose} className="jr-modal" ariaLabel={step.title}>
      <header className="stp-head">
        <div className="stp-eyebrow">Stage {stage.index} · {stage.title} · Step {step.index}</div>
        <h2 className="stp-title">{step.title}</h2>
        {step.description && <p className="stp-desc">{step.description}</p>}

        <nav className="stp-seg" role="tablist" aria-label="Step sections">
          <button
            type="button" role="tab" aria-selected={tab === "learn"}
            className={`stp-segbtn${tab === "learn" ? " active" : ""}`} onClick={() => setTab("learn")}
          >
            <BookOpen size={14} />Learn
          </button>
          <button
            type="button" role="tab" aria-selected={tab === "docs"}
            className={`stp-segbtn${tab === "docs" ? " active" : ""}`} onClick={() => setTab("docs")}
          >
            <FileText size={14} />Required Documents
            {docs.required > 0 && <span className="stp-segcount">{docs.verified}/{docs.required}</span>}
          </button>
        </nav>
      </header>

      <div className="jr-modal-body stp-body">
        {banner && !bannerSeen && (
          <ReviewBanner
            kind={banner} message={step.reviewComment}
            onOpenChat={() => { setBannerSeen(true); onOpenChat?.(); }}
          />
        )}

        {tab === "learn" ? (
          <StepBlocks
            stepId={step.id} fallback="Your advisor has not added any guidance to this step yet."
            plan={plan} study={study}
            /* "Keep the banner visible until the student marks the step as
               completed." Once it is done, the warning has served its purpose
               and only adds noise to a step they are revisiting. */
            hideBanner={step.state === "completed"}
          />
        ) : loading ? (
          <Loader block />
        ) : docs.required === 0 ? (
          <p className="stp-hint">
            <Info size={14} />
            There are no document requirements for this step. Read the Learn section, then complete it.
          </p>
        ) : (
          <>
            {/* Small inline reminder, no frame, no background. */}
            <p className="stp-hint"><Info size={14} />Upload all required documents before completing this step.</p>

            <ul className="stp-docs">
              {docs.docs.map(({ requirement, upload, status }) => (
                <li key={requirement.key} className="stp-doc">
                  <span className={`stp-doc-ico tone-${DOC_STATUS[status].state}`}>
                    {status === "approved" ? <CircleCheck size={16} />
                      : status === "needs_changes" ? <TriangleAlert size={16} />
                      : status === "under_review" ? <Clock3 size={16} /> : <FileText size={16} />}
                  </span>

                  <span className="stp-doc-main">
                    <span className="stp-doc-name">
                      {requirement.name || requirement.key}
                      {!requirement.required && <em>optional</em>}
                    </span>
                    {requirement.description && <span className="stp-doc-sub">{requirement.description}</span>}
                    {requirement.instructions && <span className="stp-doc-sub">{requirement.instructions}</span>}
                    {upload?.review_comment && <span className="stp-doc-msg">{upload.review_comment}</span>}
                  </span>

                  <Status state={DOC_STATUS[status].state} label={DOC_STATUS[status].label} className="stp-doc-pill" />

                  <span className="stp-doc-acts">
                    {requirement.templatePath && (
                      <JrButton icon={<Download size={14} />} onClick={() => openStored(requirement.templatePath, requirement.templateName || "template", true)}>
                        Template
                      </JrButton>
                    )}
                    {upload?.file_path && (
                      <>
                        <JrButton icon={<ExternalLink size={14} />} onClick={() => openStored(upload.file_path, upload.file_name, false)}>View</JrButton>
                        <JrButton icon={<Download size={14} />} onClick={() => openStored(upload.file_path, upload.file_name, true)}>Download</JrButton>
                      </>
                    )}
                    <JrButton
                      tone={upload?.file_path ? "outline" : "primary"} icon={<Upload size={14} />}
                      onClick={() => onOpenDocuments(stage, step)}
                    >
                      {upload?.file_path ? "Replace" : "Upload"}
                    </JrButton>
                  </span>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      <footer className="jr-modal-foot">
        <JrButton tone="quiet" size="md" onClick={onClose}>Close</JrButton>
        {docs.required > 0 && (
          <JrButton tone="primary" size="md" icon={<ExternalLink size={15} />} onClick={() => onOpenDocuments(stage, step)}>
            Open Documents module
          </JrButton>
        )}
      </footer>
    </AnimatedModal>
  );
}

export default JourneyStepModal;
