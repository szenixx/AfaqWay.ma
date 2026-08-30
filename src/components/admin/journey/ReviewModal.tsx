"use client";

import { useCallback, useEffect, useState } from "react";
import {
  BookOpen, CircleCheck, Clock3, Eye, FileText, History, Info, MessageSquare,
  TriangleAlert,
} from "lucide-react";
import { Button, Chip, Skeleton, Tabs } from "@heroui/react";
import {
  fetchBlocks, fetchDocuments, fetchEvents,
  stepRequirements, subscribeJourney,
  type DbBlock, type DbDocument, type DbEvent, type DbStep, type DocStatus,
} from "@/lib/journeyDb";
import { AdminDialog } from "@/components/admin/AdminDialog";
import { openFilePreview } from "@/lib/storage/client";
import { JourneyBlock } from "@/components/student/workspace/journey/StepBlocks";

/* Read-only review of a student's step submission.

   Everything an administrator needs in order to decide: who the student is,
   what they wrote, when they submitted, the documents they uploaded with their
   verification state, the Learn content they were shown, and the timeline of
   their actions.

   It deliberately holds no controls. Approve, Reject and Request Changes each
   open their own dialog from the review queue, so information and action never
   share a screen. */

const stamp = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";

const DOC_CHIP: Record<DocStatus, { label: string; color: "success" | "warning" | "danger" | "default" }> = {
  approved: { label: "Approved", color: "success" },
  under_review: { label: "Under review", color: "warning" },
  needs_changes: { label: "Needs changes", color: "danger" },
  uploaded: { label: "Uploaded", color: "warning" },
  pending: { label: "Not uploaded", color: "default" },
};

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
  const [tab, setTab] = useState("submission");
  const [docs, setDocs] = useState<DbDocument[]>([]);
  const [blocks, setBlocks] = useState<DbBlock[]>([]);
  const [events, setEvents] = useState<DbEvent[]>([]);
  const [loading, setLoading] = useState(true);

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
    <AdminDialog
      description={target.stageTitle}
      footer={(
        <>
          <span className="afq-mini-sub" style={{ marginRight: "auto" }}>
            <Info size={13} /> Read-only. Approve, Reject and Request Changes are in the review queue.
          </span>
          <Button onPress={onClose} size="sm" variant="primary">Close</Button>
        </>
      )}
      icon={<Eye className="size-5" />}
      onClose={onClose}
      size="xl"
      title={target.step.title}
    >
      <dl className="afq-rows" style={{ marginBottom: 14 }}>
        <div><dt>Student</dt><dd>{target.student}</dd></div>
        <div><dt>Email</dt><dd>{target.studentEmail || "—"}</dd></div>
        <div><dt>Submitted</dt><dd>{stamp(target.submittedAt)}</dd></div>
        <div><dt>Completed</dt><dd>{stamp(target.completedAt)}</dd></div>
      </dl>

      <Tabs onSelectionChange={(k) => setTab(String(k))} selectedKey={tab} variant="secondary">
        <Tabs.ListContainer>
          <Tabs.List aria-label="Review sections">
            <Tabs.Tab id="submission"><MessageSquare size={14} /> Submission<Tabs.Indicator /></Tabs.Tab>
            <Tabs.Tab id="documents">
              <FileText size={14} /> Documents
              {requirements.length > 0 && <Chip color="default" size="sm" variant="soft">{verified}/{requirements.length}</Chip>}
              <Tabs.Indicator />
            </Tabs.Tab>
            <Tabs.Tab id="learn"><BookOpen size={14} /> Learn content<Tabs.Indicator /></Tabs.Tab>
            <Tabs.Tab id="timeline"><History size={14} /> Timeline<Tabs.Indicator /></Tabs.Tab>
          </Tabs.List>
        </Tabs.ListContainer>

        <Tabs.Panel id="submission">
          {target.step.description
            ? <p className="afq-dialog-desc">{target.step.description}</p>
            : <p className="afq-mini-sub"><Info size={14} /> This step has no description.</p>}

          {/* The completion comment is what a step without documents is
              judged on, so it only belongs here when there are none. */}
          {requirements.length === 0 && (
            target.studentComment
              ? (
                <>
                  <div className="afq-mini-title" style={{ marginTop: 14 }}>Student completion comment</div>
                  <p className="afq-dialog-desc"><MessageSquare size={14} /> {target.studentComment}</p>
                </>
              )
              : <p className="afq-mini-sub" style={{ marginTop: 14 }}>
                  <MessageSquare size={14} /> The student submitted this step without a comment.
                </p>
          )}

          {target.advisorNote && (
            <>
              <div className="afq-mini-title" style={{ marginTop: 14 }}>Internal advisor note</div>
              <p className="afq-dialog-desc">{target.advisorNote}</p>
            </>
          )}
        </Tabs.Panel>

        <Tabs.Panel id="documents">
          {loading ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {Array.from({ length: 2 }).map((_, i) => <Skeleton className="h-16 w-full rounded-2xl" key={i} />)}
            </div>
          ) : requirements.length === 0 ? (
            <p className="afq-mini-sub"><FileText size={14} /> No documents required on this step. Add requirements in the Step Editor.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {requirements.map((r) => {
                const up = uploadFor(r.key);
                const st = (up?.status ?? "pending") as DocStatus;
                const chip = DOC_CHIP[st];
                return (
                  <div className="afq-mini-card" key={r.key}>
                    <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                      <span aria-hidden style={{ color: chip.color === "success" ? "#256B49" : chip.color === "danger" ? "#8C2E1E" : chip.color === "warning" ? "#8A5A08" : "#8695AB" }}>
                        {st === "approved" ? <CircleCheck size={16} />
                          : st === "needs_changes" ? <TriangleAlert size={16} />
                          : st === "under_review" ? <Clock3 size={16} /> : <FileText size={16} />}
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="afq-mini-title">
                          {r.name || r.key}
                          {!r.required && <span className="afq-mini-sub"> · Optional</span>}
                        </div>
                        {r.description && <p className="afq-mini-sub">{r.description}</p>}
                        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginTop: 4 }}>
                          <Chip color={chip.color} size="sm" variant="soft">{chip.label}</Chip>
                          {up && <span className="afq-mini-sub">{up.file_name}</span>}
                          {up && <span className="afq-mini-sub">{stamp(up.updated_at)}</span>}
                        </div>
                        {up?.review_comment && <p className="afq-dialog-desc">{up.review_comment}</p>}
                      </div>
                      {up?.file_path ? (
                        <Button onPress={() => void openFilePreview(up.file_path)} size="sm" variant="tertiary">
                          <Eye size={14} /> Preview
                        </Button>
                      ) : (
                        <span className="afq-mini-sub">Nothing uploaded yet</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Tabs.Panel>

        <Tabs.Panel id="learn">
          <div className="afq-mini-title" style={{ marginBottom: 10 }}><BookOpen size={14} /> What the student was shown</div>
          {blocks.length === 0
            ? <p className="afq-mini-sub">No content blocks on this step.</p>
            : blocks.map((b) => (
                <div key={b.id} style={{ opacity: b.enabled ? 1 : 0.5, marginBottom: 10 }}>
                  {b.audience === "advisor" && <Chip color="default" size="sm" style={{ marginBottom: 6 }} variant="soft">Advisor only</Chip>}
                  <JourneyBlock block={b} />
                </div>
              ))}
        </Tabs.Panel>

        <Tabs.Panel id="timeline">
          {events.length === 0 ? (
            <p className="afq-mini-sub"><History size={14} /> No activity yet. Submissions, skips and decisions appear here.</p>
          ) : (
            <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 10 }}>
              {events.map((e) => (
                <li className="afq-mini-card" key={e.id} style={{ flexDirection: "row", alignItems: "flex-start" }}>
                  <span aria-hidden style={{ width: 6, height: 6, borderRadius: 999, background: "var(--accent)", marginTop: 6, flex: "none" }} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <b className="afq-mini-title">{e.actor === "student" ? target.student : e.actor_email || "Administrator"}</b>
                      <span className="afq-mini-sub">{e.kind.replace(/_/g, " ")}</span>
                      <time className="afq-mini-sub">{stamp(e.created_at)}</time>
                    </div>
                    {e.message && <p className="afq-dialog-desc">{e.message}</p>}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Tabs.Panel>
      </Tabs>
    </AdminDialog>
  );
}

export default ReviewModal;
