"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CalendarDays, CircleCheck, Clock3, Download, ExternalLink, Eye, FileText, GraduationCap,
  History, Mail, MapPin, Phone, Route, TriangleAlert,
} from "lucide-react";
import { UserAvatar } from "@/components/ds";
import { Button, Chip, Input, Label, ListBox, Modal, SearchField, Select, Skeleton, TextField } from "@heroui/react";
import { AdminDialog } from "@/components/admin/AdminDialog";
import { fileUrl, openFilePreview } from "@/lib/storage/client";
import { useIsOnline } from "@/lib/presence";
import { assembleRoadmap, roadmapProgress, type JourneyStage, DOC_STATUS, STATE_BADGE } from "@/lib/journey";
import type { PillTone } from "@/components/ds/Pill";
import { TrpStatusCard } from "@/components/admin/journey/TrpStatusCard";
import { OutboxCard, outboxPhone } from "@/components/admin/journey/OutboxCard";
import {
  fetchApprovals, fetchDocuments, fetchEvents, fetchProgress, fetchStages, fetchSteps,
  reviewDocument, stepRequirements, subscribeJourney,
  type DbDocument, type DbEvent, type DbStep, type DocStatus, type Plan,
} from "@/lib/journeyDb";
import { ScheduleManager } from "@/components/schedule/ScheduleManager";
import { refreshReviewAlerts } from "@/lib/reviewAlerts";

/* The one User Details module.

   Rendered identically from every users table and from the chat profile panel.
   There is no second implementation and no per-page variant: give it a user id
   and it reads the live Journey Engine, the Documents module and the schedule
   for that person.

   The bespoke pieces — the profile header's fact grid, the timeline — have
   no HeroUI equivalent and stay exactly as they were; the modal shell, tabs,
   toolbar, chips and buttons around them now speak the same HeroUI +
   .afq-hui language as the rest of the workspace, because this module is
   also what opens over the chat's info panel. Previewing a document opens it
   in a new tab, the platform's one "Preview" action. */

export type UserDetailsUser = {
  id: string;
  user_number?: number | null;
  full_name: string | null;
  email: string | null;
  plan: string | null;
  city?: string | null;
  destination_country?: string | null;
  whatsapp_country_code?: string | null;
  whatsapp_number?: string | null;
  banned?: boolean | null;
  created_at?: string | null;
  avatar_url?: string | null;
  program?: string | null;
  university?: string | null;
  /** Raw target degree, so the admin sees the same roadmap the student does. */
  target_degree?: string | null;
  advisor?: string | null;
  nationality?: string | null;
};

type Tab = "journey" | "documents" | "schedule";

const stamp = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—";

/** The journey's tones, translated once into the tokens the timeline's small
 *  state dots paint themselves with. */
const TONE_VAR: Record<PillTone, string> = {
  green: "var(--success)", amber: "var(--warning)", red: "var(--danger)",
  indigo: "var(--accent)", purple: "var(--accent)", grey: "var(--ink-faint)",
};
const DOC_CHIP: Record<DocStatus, "default" | "accent" | "warning" | "danger" | "success"> = {
  pending: "default", uploaded: "accent", under_review: "warning", needs_changes: "danger", approved: "success",
};

/** A document row joined with the step that asked for it. */
type DocRow = {
  key: string; name: string; stepTitle: string; stageTitle: string;
  upload: DbDocument | null; status: DocStatus;
};

export function UserDetails({ user, onClose, onOpenChat, onNavigate }: {
  user: UserDetailsUser;
  onClose: () => void;
  onOpenChat?: (userId: string) => void;
  /** Admin shortcuts, e.g. to the Journey Manager or the review queue. */
  onNavigate?: (page: "journey-manager" | "review-queue") => void;
}) {
  const [tab, setTab] = useState<Tab>("journey");
  const [stages, setStages] = useState<JourneyStage[]>([]);
  const [docs, setDocs] = useState<DocRow[]>([]);
  const [events, setEvents] = useState<DbEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [docQuery, setDocQuery] = useState("");
  const [docFilter, setDocFilter] = useState<"all" | DocStatus>("all");
  const [docSort, setDocSort] = useState<"recent" | "name" | "status">("recent");
  /* Which document is being sent back, and why. A rejection without a reason
     tells the student nothing, so the comment is asked for rather than
     optional. */
  const [rejecting, setRejecting] = useState<DbDocument | null>(null);
  const [rejectWhy, setRejectWhy] = useState("");
  const [busyDoc, setBusyDoc] = useState<string | null>(null);
  const online = useIsOnline(user.id);

  const load = useCallback(async () => {
    const plan = (user.plan ?? "self_service") as Plan;
    const dbStages = await fetchStages(plan, "LT", false, user.target_degree);
    const dbSteps = await fetchSteps(dbStages.map((s) => s.id));
    const [progress, approvals, uploads, timeline] = await Promise.all([
      fetchProgress(user.id), fetchApprovals(user.id), fetchDocuments(user.id), fetchEvents(user.id),
    ]);
    setStages(assembleRoadmap(dbStages, dbSteps, progress, approvals));
    setEvents(timeline);

    // Requirements come from the steps; uploads come from the student.
    const stageTitle = new Map(dbStages.map((s) => [s.id, s.title]));
    const byKey = new Map(uploads.map((u) => [`${u.step_id}:${u.doc_key}`, u]));
    const rows: DocRow[] = [];
    for (const step of dbSteps as DbStep[]) {
      for (const r of stepRequirements(step)) {
        const upload = byKey.get(`${step.id}:${r.key}`) ?? null;
        rows.push({
          key: `${step.id}:${r.key}`, name: r.name || r.key,
          stepTitle: step.title, stageTitle: stageTitle.get(step.stage_id) ?? "",
          upload, status: (upload?.status ?? "pending") as DocStatus,
        });
      }
    }
    setDocs(rows);
    setLoading(false);
  }, [user.id, user.plan, user.target_degree]);
  // Fetching from Supabase is the "subscribe to an external system" case; the
  // state set here is the query result, not derived render state.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void load(); }, [load]);
  useEffect(() => subscribeJourney(() => { void load(); }), [load]);

  const overall = roadmapProgress(stages);
  const currentStage = stages.find((s) => s.state === "current" || s.state === "waiting_approval");
  const currentStep = currentStage?.steps.find((s) => s.state === "pending" || s.state === "submitted" || s.state === "rejected");
  const allSteps = stages.flatMap((s) => s.steps.map((step) => ({ ...step, stageTitle: s.title })));
  const completed = allSteps.filter((s) => s.state === "completed");
  const rejected = allSteps.filter((s) => s.state === "rejected");
  const waiting = allSteps.filter((s) => s.state === "submitted");

  const visibleDocs = useMemo(() => {
    const q = docQuery.trim().toLowerCase();
    const list = docs.filter((d) =>
      (docFilter === "all" || d.status === docFilter) &&
      (!q || `${d.name} ${d.stepTitle} ${d.stageTitle}`.toLowerCase().includes(q)));
    return list.sort((a, b) => {
      if (docSort === "name") return a.name.localeCompare(b.name);
      if (docSort === "status") return a.status.localeCompare(b.status);
      return (b.upload?.updated_at ?? "").localeCompare(a.upload?.updated_at ?? "");
    });
  }, [docs, docQuery, docFilter, docSort]);

  const openStored = async (path: string, name: string, download: boolean) => {
    const url = await fileUrl(path, download ? name : undefined);
    if (url) window.open(url, "_blank", "noopener,noreferrer");
  };

  /* The one place a document is decided. reviewDocument writes the verdict AND
     notifies the student — it existed but had no caller, which is why an
     upload never came back to anybody. */
  const decide = useCallback(async (doc: DbDocument, status: DocStatus, comment = "") => {
    setBusyDoc(doc.id);
    try {
      await reviewDocument(doc.id, status, comment);
      await load();
      // Same reasoning as the step/stage decisions: drop the sidebar badge
      // right away rather than depending on this table's Realtime event.
      // TEMP DEBUG line below — remove alongside the rest of the [badge-debug] tracing.
      console.log("[badge-debug] UserDetails.decide: document decision written, calling refreshReviewAlerts()");
      void refreshReviewAlerts();
    } finally {
      setBusyDoc(null);
      setRejecting(null);
      setRejectWhy("");
    }
  }, [load]);

  const phone = `${user.whatsapp_country_code ?? ""}${user.whatsapp_number ?? ""}`.trim();

  const TABS: { id: Tab; label: string; Icon: typeof Route }[] = [
    { id: "journey", label: "Journey", Icon: Route },
    { id: "documents", label: "Documents", Icon: FileText },
    { id: "schedule", label: "Schedule", Icon: CalendarDays },
  ];

  return (
    <Modal>
      <Modal.Backdrop isOpen onOpenChange={(v) => { if (!v) onClose(); }}>
        <Modal.Container>
          <Modal.Dialog aria-label={`${user.full_name ?? "User"} details`} className="sm:max-w-[980px]">
            <Modal.CloseTrigger />

            <Modal.Header>
              {/* ── Profile header ── */}
              <div className="usr-head">
                <UserAvatar size={62} user={{ id: user.id, name: user.full_name, avatarUrl: user.avatar_url ?? null, online }} />
                <div className="usr-id">
                  <div className="usr-name">
                    {user.full_name || "Unnamed student"}
                    <Chip color={online ? "success" : "default"} size="sm" variant="soft">{online ? "Online" : "Offline"}</Chip>
                  </div>
                  <div className="usr-contact">
                    {user.email && <span><Mail size={13} />{user.email}</span>}
                    {phone && <span><Phone size={13} />{phone}</span>}
                    {user.city && <span><MapPin size={13} />{user.city}</span>}
                  </div>
                </div>

                <dl className="usr-facts">
                  <div><dt>Plan</dt><dd>{user.plan === "full_service" ? "Full Service" : user.plan === "self_service" ? "Self Service" : "—"}</dd></div>
                  <div><dt>Nationality</dt><dd>{user.nationality || "Morocco"}</dd></div>
                  <div><dt>University</dt><dd>{user.university || user.program || "Not assigned"}</dd></div>
                  <div><dt>Current stage</dt><dd>{currentStage ? `${currentStage.index}. ${currentStage.title}` : "Not started"}</dd></div>
                  <div><dt>Progress</dt><dd>{overall.pct}% · {overall.done}/{overall.total}</dd></div>
                  <div><dt>Status</dt><dd>{user.banned ? "Suspended" : "Active"}</dd></div>
                  <div><dt>Advisor</dt><dd>{user.advisor || "Unassigned"}</dd></div>
                  <div><dt>Joined</dt><dd>{stamp(user.created_at)}</dd></div>
                </dl>

                <div className="usr-bar"><span style={{ width: `${overall.pct}%` }} /></div>

                <div aria-label="User sections" className="stp-seg" role="group">
                  {TABS.map(({ id, label, Icon }) => (
                    <Button key={id} onPress={() => setTab(id)} size="sm" variant={tab === id ? "secondary" : "tertiary"}>
                      <Icon size={14} />{label}
                      {id === "documents" && docs.length > 0 && (
                        <Chip color="default" size="sm" variant="soft">{docs.filter((d) => d.status === "approved").length}/{docs.length}</Chip>
                      )}
                    </Button>
                  ))}
                </div>
              </div>
            </Modal.Header>

            <Modal.Body>
              <div className="stp-body">
                {loading ? <Skeleton className="h-48 w-full rounded-2xl" /> : tab === "journey" ? (
                  <>
                    <div className="usr-tiles">
                      <span><b>{completed.length}</b>Completed</span>
                      <span><b>{waiting.length}</b>Pending review</span>
                      <span><b>{rejected.length}</b>Rejected</span>
                      <span><b>{overall.total - completed.length}</b>Remaining</span>
                    </div>

                    <div className="usr-shortcuts">
                      {onNavigate && <Button onPress={() => onNavigate("journey-manager")} size="sm" variant="secondary"><Route size={14} /> Journey Manager</Button>}
                      {onNavigate && <Button onPress={() => onNavigate("review-queue")} size="sm" variant="secondary"><Clock3 size={14} /> Review Queue</Button>}
                      <Button onPress={() => setTab("documents")} size="sm" variant="secondary"><FileText size={14} /> Documents</Button>
                      {onOpenChat && <Button onPress={() => onOpenChat(user.id)} size="sm" variant="secondary"><ExternalLink size={14} /> Open chat</Button>}
                    </div>

                    {currentStep && (
                      <p className="stp-hint stp-hint-grey">
                        <Clock3 size={14} />Current step: <b style={{ marginLeft: 4 }}>{currentStep.title}</b>
                      </p>
                    )}

                    {/* The Full Service half of the final decision: for those students
                        the Excel gives the outcome entirely to an administrator. */}
                    <TrpStatusCard degree={user.target_degree} plan={user.plan ?? null} userId={user.id} />

                    {/* What the journey has said, or is queued to say, on every channel.
                        The WhatsApp rows have no sender yet, so they are sent by hand
                        from here rather than sitting in a table nobody looks at. */}
                    <OutboxCard phone={outboxPhone(user)} userId={user.id} />

                    <h4 className="lrn-sub">Journey timeline</h4>
                    {stages.length === 0 ? (
                      <p className="stp-hint stp-hint-grey"><Route size={14} />No journey published for this plan yet.</p>
                    ) : (
                      <ol className="usr-timeline">
                        {stages.map((stage) => (
                          <li className={`usr-stage ${stage.state}`} key={stage.id}>
                            <div className="usr-stage-head">
                              <b>{stage.index}. {stage.title}</b>
                              <span className="usr-stage-count">{stage.done}/{stage.total}</span>
                            </div>
                            <ul className="usr-steps">
                              {stage.steps.map((step) => (
                                <li key={step.id}>
                                  {/* Dot only: the timeline is a dense list and the
                                      title carries the meaning; the state still
                                      reaches a screen reader through the hidden label. */}
                                  <span aria-hidden className="usr-act-dot" style={{ background: TONE_VAR[STATE_BADGE[step.state].tone] }} />
                                  <span className="sr-only">{STATE_BADGE[step.state].label}</span>
                                  <span>{step.title}</span>
                                </li>
                              ))}
                            </ul>
                          </li>
                        ))}
                      </ol>
                    )}

                    <h4 className="lrn-sub" style={{ marginTop: 18 }}><History size={14} style={{ verticalAlign: -2, marginRight: 6 }} />Recent activity</h4>
                    {events.length === 0
                      ? <p className="stp-hint stp-hint-grey"><History size={14} />No activity recorded yet.</p>
                      : (
                        <ul className="usr-activity">
                          {events.slice(0, 10).map((e) => (
                            <li key={e.id}>
                              <span className={`usr-act-dot actor-${e.actor}`} />
                              <span className="usr-act-main">
                                <b>{e.kind.replace(/_/g, " ")}</b>
                                {e.message && <em>{e.message.split("\n")[0]}</em>}
                              </span>
                              <time>{stamp(e.created_at)}</time>
                            </li>
                          ))}
                        </ul>
                      )}
                  </>
                ) : tab === "documents" ? (
                  <>
                    <div className="usr-docbar">
                      <SearchField aria-label="Search documents" onChange={setDocQuery} style={{ flex: 1, minWidth: 160 }} value={docQuery}>
                        <SearchField.Group>
                          <SearchField.SearchIcon />
                          <SearchField.Input placeholder="Search documents" />
                          <SearchField.ClearButton />
                        </SearchField.Group>
                      </SearchField>
                      <Select onSelectionChange={(k) => setDocFilter(String(k) as typeof docFilter)} selectedKey={docFilter} style={{ minWidth: 150 }}>
                        <Label className="sr-only">Filter by status</Label>
                        <Select.Trigger><Select.Value /><Select.Indicator /></Select.Trigger>
                        <Select.Popover>
                          <ListBox>
                            {[
                              { value: "all", label: "All statuses" }, { value: "approved", label: "Verified" },
                              { value: "uploaded", label: "Uploaded" }, { value: "under_review", label: "Under review" },
                              { value: "needs_changes", label: "Rejected" }, { value: "pending", label: "Pending" },
                            ].map((o) => <ListBox.Item id={o.value} key={o.value} textValue={o.label}>{o.label}<ListBox.ItemIndicator /></ListBox.Item>)}
                          </ListBox>
                        </Select.Popover>
                      </Select>
                      <Select onSelectionChange={(k) => setDocSort(String(k) as typeof docSort)} selectedKey={docSort} style={{ minWidth: 140 }}>
                        <Label className="sr-only">Sort</Label>
                        <Select.Trigger><Select.Value /><Select.Indicator /></Select.Trigger>
                        <Select.Popover>
                          <ListBox>
                            {[{ value: "recent", label: "Most recent" }, { value: "name", label: "Name" }, { value: "status", label: "Status" }]
                              .map((o) => <ListBox.Item id={o.value} key={o.value} textValue={o.label}>{o.label}<ListBox.ItemIndicator /></ListBox.Item>)}
                          </ListBox>
                        </Select.Popover>
                      </Select>
                    </div>

                    {visibleDocs.length === 0 ? (
                      <p className="stp-hint stp-hint-grey"><FileText size={14} />No documents match this view.</p>
                    ) : (
                      <ul className="stp-docs">
                        {visibleDocs.map((d) => (
                          <li className="stp-doc" key={d.key}>
                            <span className={`stp-doc-ico tone-${DOC_STATUS[d.status].state}`}>
                              {d.status === "approved" ? <CircleCheck size={16} />
                                : d.status === "needs_changes" ? <TriangleAlert size={16} />
                                : d.status === "under_review" ? <Clock3 size={16} /> : <FileText size={16} />}
                            </span>
                            <span className="stp-doc-main">
                              <span className="stp-doc-name">{d.name}</span>
                              <span className="stp-doc-sub">{d.stageTitle} · {d.stepTitle}</span>
                              <span className="stp-doc-sub">
                                Uploaded {stamp(d.upload?.created_at)}
                                {/* reviewed_at/review_comment survive a re-upload on purpose — the
                                    guard preserves the prior decision's audit trail rather than
                                    wiping it — but that only describes a FILE THAT'S GONE the
                                    moment status is back to uploaded/under_review. Showing them
                                    here for a document sitting in the queue right now reads as
                                    "this was already handled," which is exactly backwards. */}
                                {d.upload?.reviewed_at && (d.status === "approved" || d.status === "needs_changes") &&
                                  ` · verified ${stamp(d.upload.reviewed_at)}`}
                              </span>
                              {d.upload?.review_comment && (d.status === "approved" || d.status === "needs_changes") && (
                                <span className="stp-doc-msg">{d.upload.review_comment}</span>
                              )}
                            </span>
                            <Chip className="stp-doc-pill" color={DOC_CHIP[d.status]} size="sm" variant="soft">{DOC_STATUS[d.status].label}</Chip>
                            <span className="stp-doc-acts">
                              {d.upload?.file_path && (
                                <>
                                  <Button onPress={() => void openFilePreview(d.upload!.file_path)} size="sm" variant="tertiary"><Eye size={14} /> Preview</Button>
                                  <Button onPress={() => openStored(d.upload!.file_path, d.upload!.file_name, true)} size="sm" variant="tertiary"><Download size={14} /> Download</Button>
                                </>
                              )}
                              {/* An uploaded document can be decided here. Approved
                                  documents keep a way back, because a mistaken
                                  approval otherwise has no undo. */}
                              {d.upload?.file_path && d.status !== "approved" && (
                                <Button isDisabled={busyDoc === d.upload.id} onPress={() => void decide(d.upload!, "approved")} size="sm" variant="primary">
                                  <CircleCheck size={14} /> Approve
                                </Button>
                              )}
                              {d.upload?.file_path && d.status !== "needs_changes" && (
                                <Button
                                  isDisabled={busyDoc === d.upload.id} onPress={() => { setRejecting(d.upload); setRejectWhy(""); }}
                                  size="sm" variant={d.status === "approved" ? "tertiary" : "danger-soft"}
                                >
                                  <TriangleAlert size={14} /> {d.status === "approved" ? "Undo" : "Request changes"}
                                </Button>
                              )}
                              {!d.upload?.file_path && <span className="stp-doc-sub">Not uploaded</span>}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}

                    {rejecting && (
                      <AdminDialog
                        description="The student is notified straight away and can re-upload."
                        footer={(
                          <>
                            <Button onPress={() => setRejecting(null)} size="sm" variant="tertiary">Cancel</Button>
                            <Button
                              isDisabled={!rejectWhy.trim() || busyDoc === rejecting.id}
                              onPress={() => void decide(rejecting, "needs_changes", rejectWhy.trim())} size="sm" variant="danger"
                            >
                              Request changes
                            </Button>
                          </>
                        )}
                        icon={<TriangleAlert className="size-5" />}
                        onClose={() => setRejecting(null)}
                        size="sm"
                        title="Send this document back?"
                        tone="warning"
                      >
                        <TextField fullWidth onChange={setRejectWhy} value={rejectWhy}>
                          <Label>Reason</Label>
                          <Input placeholder="e.g. The scan is cut off at the bottom — please re-upload the full page." variant="secondary" />
                          <p className="afq-mini-sub">A rejection with no reason just sends the student round again.</p>
                        </TextField>
                      </AdminDialog>
                    )}

                  </>
                ) : (
                  <ScheduleManager role="advisor" userId={user.id} />
                )}
              </div>
            </Modal.Body>

            <Modal.Footer>
              <Button onPress={onClose} size="sm" variant="tertiary">Close</Button>
              {onOpenChat && (
                <Button onPress={() => onOpenChat(user.id)} size="sm" variant="primary"><GraduationCap size={15} /> Message this student</Button>
              )}
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}

export default UserDetails;
