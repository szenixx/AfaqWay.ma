"use client";

import { useCallback, useEffect, useState } from "react";
import { DOC_STATUS } from "@/lib/journey";
import {
  BookOpen, CircleCheck, Clock3, Eye, FileText, History, Info, MessageSquare,
  TriangleAlert,
} from "lucide-react";
import { AnimatedModal, Loader, Pill, Status } from "@/components/ds";
import {
  fetchBlocks, fetchDocuments, fetchEvents,
  stepRequirements, subscribeJourney,
  type DbBlock, type DbDocument, type DbEvent, type DbStep, type DocStatus,
} from "@/lib/journeyDb";
import { JourneyBlock } from "@/components/student/workspace/journey/StepBlocks";
import { JrButton } from "@/components/student/workspace/journey/parts";
import { DocumentViewer } from "./DocumentViewer";

/* Read-only review of a student's step submission.

   Everything an administrator needs in order to decide: who the student is,
   what they wrote, when they submitted, the documents they uploaded with their
   verification state, the Learn content they were shown, and the timeline of
   their actions.

   It deliberately holds no controls. Approve, Reject and Request Changes each
   open their own dialog from the review queue, so information and action never
   share a screen. */

type Tab = "submission" | "documents" | "learn" | "timeline";


const stamp = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";

export type ReviewTarget = {
  progressId: string;
  userId: string;
  student: string;
  studentEmail: string;
  stageId: string;
  stageTitle: string;
  step: DbStep;
  state: string;
  studentComment: string;
  advisorNote: string;
  submittedAt: string | null;
  completedAt: string | null;
  /** Used to offer the same message over WhatsApp. */
  whatsapp?: string | null;
};

export function ReviewModal({ target, onClose }: {
  target: ReviewTarget;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<Tab>("submission");
  const [docs, setDocs] = useState<DbDocument[]>([]);
  const [blocks, setBlocks] = useState<DbBlock[]>([]);
  const [events, setEvents] = useState<DbEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [preview, setPreview] = useState<DbDocument | null>(null);

  const requirements = stepRequirements(target.step);

  const load = useCallback(async () => {
    const [d, b, e] = await Promise.all([
      fetchDocuments(target.userId, [target.step.id]),
      fetchBlocks(target.step.id, true),
      fetchEvents(target.userId, target.step.id),
    ]);
    setDocs(d); setBlocks(b); setEvents(e);
    setLoading(false);
  }, [target.userId, target.step.id]);
  // Fetching from Supabase is the "subscribe to an external system" case; the
  // state set here is the query result, not derived render state.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void load(); }, [load]);
  useEffect(() => subscribeJourney(() => { void load(); }), [load]);

  const uploadFor = (key: string) => docs.find((d) => d.doc_key === key) ?? null;

  const verified = requirements.filter((r) => uploadFor(r.key)?.status === "approved").length;

  return (
    <AnimatedModal open onClose={onClose} className="jr-modal jm-review-modal" ariaLabel={`Review ${target.step.title}`}>
      <header className="stp-head">
        <div className="stp-eyebrow">{target.stageTitle}</div>
        <h2 className="stp-title">{target.step.title}</h2>
        <dl className="rvw-facts">
          <div><dt>Student</dt><dd>{target.student}</dd></div>
          <div><dt>Email</dt><dd>{target.studentEmail || "—"}</dd></div>
          <div><dt>Submitted</dt><dd>{stamp(target.submittedAt)}</dd></div>
          <div><dt>Completed</dt><dd>{stamp(target.completedAt)}</dd></div>
        </dl>
      </header>

      <nav className="jr-tabs" role="tablist" aria-label="Review sections">
        {([
          { id: "submission" as Tab, label: "Submission", Icon: MessageSquare },
          { id: "documents" as Tab, label: "Documents", Icon: FileText },
          { id: "learn" as Tab, label: "Learn content", Icon: BookOpen },
          { id: "timeline" as Tab, label: "Timeline", Icon: History },
        ]).map(({ id, label, Icon }) => (
          <button
            key={id} type="button" role="tab" aria-selected={tab === id}
            className={`jr-tab${tab === id ? " active" : ""}`} onClick={() => setTab(id)}
          >
            <Icon size={15} />{label}
            {id === "documents" && requirements.length > 0 && <span className="jr-tab-count">{verified}/{requirements.length}</span>}
          </button>
        ))}
      </nav>

      <div className="jr-modal-body stp-body">
        {(
          <>
            {tab === "submission" && (
              <>
                {target.step.description
                  ? <p className="lrn-p">{target.step.description}</p>
                  : <p className="stp-hint stp-hint-grey"><Info size={14} />This step has no description.</p>}

                {/* The completion comment is what a step without documents is
                    judged on, so it only belongs here when there are none. */}
                {requirements.length === 0 && (
                  target.studentComment
                    ? (
                      <>
                        <h4 className="lrn-sub" style={{ marginTop: 18 }}>Student completion comment</h4>
                        <p className="rvw-quote"><MessageSquare size={14} /><span>{target.studentComment}</span></p>
                      </>
                    )
                    : <p className="stp-hint stp-hint-grey" style={{ marginTop: 18 }}>
                        <MessageSquare size={14} />The student submitted this step without a comment.
                      </p>
                )}

                {target.advisorNote && (
                  <>
                    <h4 className="lrn-sub" style={{ marginTop: 18 }}>Internal advisor note</h4>
                    <p className="lrn-p">{target.advisorNote}</p>
                  </>
                )}
              </>
            )}

            {tab === "documents" && (loading ? <Loader block /> :
              requirements.length === 0 ? (
                <p className="stp-hint stp-hint-grey">
                  <FileText size={14} />No documents required on this step. Add requirements in the Step Editor.
                </p>
              ) : (
                <ul className="jr-doclist">
                  {requirements.map((r) => {
                    const up = uploadFor(r.key);
                    const st = (up?.status ?? "pending") as DocStatus;
                    return (
                      <li key={r.key} className="jr-doc">
                        <span className="jr-doc-ico">
                          {st === "approved" ? <CircleCheck size={16} />
                            : st === "needs_changes" ? <TriangleAlert size={16} />
                            : st === "under_review" ? <Clock3 size={16} /> : <FileText size={16} />}
                        </span>
                        <div className="jr-doc-body">
                          <div className="jr-doc-name">
                            {r.name || r.key}
                            {!r.required && <span className="jr-doc-opt">Optional</span>}
                          </div>
                          {r.description && <p className="jr-doc-desc">{r.description}</p>}
                          <div className="jr-doc-meta">
                            <Status state={DOC_STATUS[st].state} label={DOC_STATUS[st].label} />
                            {up && <span>{up.file_name}</span>}
                            {up && <span>{stamp(up.updated_at)}</span>}
                          </div>
                          {up?.review_comment && <p className="jr-doc-note">{up.review_comment}</p>}
                        </div>
                        <div className="jr-doc-acts">
                          {up?.file_path && (
                            <JrButton
                              tone="outline" icon={<Eye size={14} />}
                              onClick={() => setPreview(preview?.id === up.id ? null : up)}
                            >
                              {preview?.id === up.id ? "Hide preview" : "Preview"}
                            </JrButton>
                          )}
                          {!up?.file_path && <span className="jr-doc-desc">Nothing uploaded yet</span>}
                        </div>
                        {/* Preview, zoom, rotate, full screen and the decision, in place. */}
                        {preview?.id === up?.id && up && (
                          <DocumentViewer doc={up} onClose={() => setPreview(null)} />
                        )}
                      </li>
                    );
                  })}
                </ul>
              )
            )}

            {tab === "learn" && (loading ? <Loader block /> :
              <section className="jr-sec">
                <div className="jr-sec-head"><BookOpen size={15} />What the student was shown</div>
                {blocks.length === 0
                  ? <p className="jr-sec-text">No content blocks on this step.</p>
                  : blocks.map((b) => (
                      <div key={b.id} className={`jr-blk${b.enabled ? "" : " jr-blk-off"}`}>
                        {b.audience === "advisor" && <Pill tone="grey" style={{ marginBottom: 6 }}>Advisor only</Pill>}
                        <JourneyBlock block={b} />
                      </div>
                    ))}
              </section>
            )}

            {tab === "timeline" && (loading ? <Loader block /> :
              events.length === 0 ? (
                <p className="stp-hint stp-hint-grey">
                  <History size={14} />No activity yet. Submissions, skips and decisions appear here.
                </p>
              ) : (
                <ol className="jr-events">
                  {events.map((e) => (
                    <li key={e.id} className={`jr-event actor-${e.actor}`}>
                      <span className="jr-event-dot" />
                      <div>
                        <div className="jr-event-head">
                          <b>{e.actor === "student" ? target.student : e.actor_email || "Administrator"}</b>
                          <span>{e.kind.replace(/_/g, " ")}</span>
                          <time>{stamp(e.created_at)}</time>
                        </div>
                        {e.message && <p className="jr-event-msg">{e.message}</p>}
                      </div>
                    </li>
                  ))}
                </ol>
              )
            )}
          </>
        )}
      </div>

      <footer className="jr-modal-foot">
        <span className="stp-hint stp-hint-grey" style={{ margin: 0 }}>
          <Info size={14} />Read-only. Approve, Reject and Request Changes are in the review queue.
        </span>
        <JrButton tone="primary" size="md" onClick={onClose}>Close</JrButton>
      </footer>

    </AnimatedModal>
  );
}

export default ReviewModal;
