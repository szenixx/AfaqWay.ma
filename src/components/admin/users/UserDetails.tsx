"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CalendarDays, CircleCheck, Clock3, Download, ExternalLink, Eye, FileText, GraduationCap,
  History, Mail, MapPin, Phone, Route, TriangleAlert, X,
} from "lucide-react";
import { AnimatedModal, Input, Loader, Select, UserAvatar, ImageZoom, Status } from "@/components/ds";
import { fileUrl } from "@/lib/storage/client";
import { useIsOnline } from "@/lib/presence";
import { assembleRoadmap, roadmapProgress, type JourneyStage, DOC_STATUS, STATE_BADGE, STATE_STATUS } from "@/lib/journey";
import {
  fetchApprovals, fetchDocuments, fetchEvents, fetchProgress, fetchStages, fetchSteps,
  stepRequirements, subscribeJourney,
  type DbDocument, type DbEvent, type DbStep, type DocStatus, type Plan,
} from "@/lib/journeyDb";
import { JrButton } from "@/components/student/workspace/journey/parts";
import { ScheduleManager } from "@/components/schedule/ScheduleManager";

/* The one User Details module.

   Rendered identically from every users table and from the chat profile panel.
   There is no second implementation and no per-page variant: give it a user id
   and it reads the live Journey Engine, the Documents module and the schedule
   for that person. */

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
  const [preview, setPreview] = useState<DbDocument | null>(null);
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
    const url = await fileUrl(path, "documents", download ? name : undefined);
    if (url) window.open(url, "_blank", "noopener,noreferrer");
  };

  const phone = `${user.whatsapp_country_code ?? ""}${user.whatsapp_number ?? ""}`.trim();

  return (
    <AnimatedModal open onClose={onClose} className="jr-modal usr" ariaLabel={`${user.full_name ?? "User"} details`}>
      {/* ── Profile header ── */}
      <header className="usr-head">
        <UserAvatar user={{ id: user.id, name: user.full_name, avatarUrl: user.avatar_url ?? null, online }} size={62} />
        <div className="usr-id">
          <div className="usr-name">
            {user.full_name || "Unnamed student"}
            <Status state={online ? "online" : "offline"} />
          </div>
          <div className="usr-contact">
            {user.email && <span><Mail size={13} />{user.email}</span>}
            {phone && <span><Phone size={13} />{phone}</span>}
            {user.city && <span><MapPin size={13} />{user.city}</span>}
          </div>
        </div>
        <button type="button" className="dv-tool" onClick={onClose} aria-label="Close"><X size={16} /></button>

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

        <nav className="stp-seg" role="tablist" aria-label="User sections">
          {([
            { id: "journey" as Tab, label: "Journey", Icon: Route },
            { id: "documents" as Tab, label: "Documents", Icon: FileText },
            { id: "schedule" as Tab, label: "Schedule", Icon: CalendarDays },
          ]).map(({ id, label, Icon }) => (
            <button
              key={id} type="button" role="tab" aria-selected={tab === id}
              className={`stp-segbtn${tab === id ? " active" : ""}`} onClick={() => setTab(id)}
            >
              <Icon size={14} />{label}
              {id === "documents" && docs.length > 0 && <span className="stp-segcount">{docs.filter((d) => d.status === "approved").length}/{docs.length}</span>}
            </button>
          ))}
        </nav>
      </header>

      <div className="jr-modal-body stp-body">
        {loading ? <Loader block /> : tab === "journey" ? (
          <>
            <div className="usr-tiles">
              <span><b>{completed.length}</b>Completed</span>
              <span><b>{waiting.length}</b>Pending review</span>
              <span><b>{rejected.length}</b>Rejected</span>
              <span><b>{overall.total - completed.length}</b>Remaining</span>
            </div>

            <div className="usr-shortcuts">
              {onNavigate && <JrButton tone="outline" icon={<Route size={14} />} onClick={() => onNavigate("journey-manager")}>Journey Manager</JrButton>}
              {onNavigate && <JrButton tone="outline" icon={<Clock3 size={14} />} onClick={() => onNavigate("review-queue")}>Review Queue</JrButton>}
              <JrButton tone="outline" icon={<FileText size={14} />} onClick={() => setTab("documents")}>Documents</JrButton>
              {onOpenChat && <JrButton tone="outline" icon={<ExternalLink size={14} />} onClick={() => onOpenChat(user.id)}>Open chat</JrButton>}
            </div>

            {currentStep && (
              <p className="stp-hint stp-hint-grey">
                <Clock3 size={14} />Current step: <b style={{ marginLeft: 4 }}>{currentStep.title}</b>
              </p>
            )}

            <h4 className="lrn-sub">Journey timeline</h4>
            {stages.length === 0 ? (
              <p className="stp-hint stp-hint-grey"><Route size={14} />No journey published for this plan yet.</p>
            ) : (
              <ol className="usr-timeline">
                {stages.map((stage) => (
                  <li key={stage.id} className={`usr-stage ${stage.state}`}>
                    <div className="usr-stage-head">
                      <b>{stage.index}. {stage.title}</b>
                      <span className="usr-stage-count">{stage.done}/{stage.total}</span>
                    </div>
                    <ul className="usr-steps">
                      {stage.steps.map((step) => (
                        <li key={step.id}>
                          {/* Dot only: the timeline is a dense list and the
                              title carries the meaning; the state reaches a
                              screen reader through the indicator's label. */}
                          <Status state={STATE_STATUS[step.state]} label={STATE_BADGE[step.state].label} dotOnly />
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
              <Input value={docQuery} onChange={(e) => setDocQuery(e.target.value)} placeholder="Search documents" aria-label="Search documents" containerStyle={{ flex: 1, minWidth: 160 }} />
              <Select
                value={docFilter} onChange={(v) => setDocFilter(v as typeof docFilter)} ariaLabel="Filter by status"
                containerStyle={{ minWidth: 150 }}
                options={[
                  { value: "all", label: "All statuses" }, { value: "approved", label: "Verified" },
                  { value: "uploaded", label: "Uploaded" }, { value: "under_review", label: "Under review" },
                  { value: "needs_changes", label: "Rejected" }, { value: "pending", label: "Pending" },
                ]}
              />
              <Select
                value={docSort} onChange={(v) => setDocSort(v as typeof docSort)} ariaLabel="Sort"
                containerStyle={{ minWidth: 140 }}
                options={[{ value: "recent", label: "Most recent" }, { value: "name", label: "Name" }, { value: "status", label: "Status" }]}
              />
            </div>

            {visibleDocs.length === 0 ? (
              <p className="stp-hint stp-hint-grey"><FileText size={14} />No documents match this view.</p>
            ) : (
              <ul className="stp-docs">
                {visibleDocs.map((d) => (
                  <li key={d.key} className="stp-doc">
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
                        {d.upload?.reviewed_at && ` · verified ${stamp(d.upload.reviewed_at)}`}
                      </span>
                      {d.upload?.review_comment && <span className="stp-doc-msg">{d.upload.review_comment}</span>}
                    </span>
                    <Status state={DOC_STATUS[d.status].state} label={DOC_STATUS[d.status].label} className="stp-doc-pill" />
                    <span className="stp-doc-acts">
                      {d.upload?.file_path && (
                        <>
                          <JrButton icon={<Eye size={14} />} onClick={() => setPreview(d.upload)}>Preview</JrButton>
                          <JrButton icon={<Download size={14} />} onClick={() => openStored(d.upload!.file_path, d.upload!.file_name, true)}>Download</JrButton>
                        </>
                      )}
                      {!d.upload?.file_path && <span className="stp-doc-sub">Not uploaded</span>}
                    </span>
                  </li>
                ))}
              </ul>
            )}

            {preview && (
              <div className="usr-preview">
                <div className="dv-bar">
                  <span className="dv-name">{preview.file_name}</span>
                  <button type="button" className="dv-tool" onClick={() => setPreview(null)} aria-label="Close preview"><X size={15} /></button>
                </div>
                <DocFrame doc={preview} />
              </div>
            )}
          </>
        ) : (
          <ScheduleManager userId={user.id} role="advisor" />
        )}
      </div>

      <footer className="jr-modal-foot">
        <JrButton tone="quiet" size="md" onClick={onClose}>Close</JrButton>
        {onOpenChat && (
          <JrButton tone="primary" size="md" icon={<GraduationCap size={15} />} onClick={() => onOpenChat(user.id)}>
            Message this student
          </JrButton>
        )}
      </footer>
    </AnimatedModal>
  );
}

/** Signed inline preview of one stored file. */
function DocFrame({ doc }: { doc: DbDocument }) {
  const [url, setUrl] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const load = useCallback(async () => { setUrl(await fileUrl(doc.file_path, "documents")); }, [doc.file_path]);
  // Fetching the signed URL is the "subscribe to an external system" case.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void load(); }, [load]);

  if (!url) return <div className="dv-stage"><Loader block /></div>;
  const isImage = /\.(png|jpe?g|gif|webp|avif)$/i.test(doc.file_name);
  return (
    <div className="dv-stage">
      {/* Read-only, but still zoomable: an administrator reading a passport
          here needs the same gestures as one reviewing it. */}
      <ImageZoom zoom={zoom} onZoomChange={setZoom} label={doc.file_name}>
        {isImage
          // eslint-disable-next-line @next/next/no-img-element
          ? <img className="dv-img" src={url} alt={doc.file_name} />
          : <iframe className="dv-pdf" src={`${url}#toolbar=0`} title={doc.file_name} />}
      </ImageZoom>
    </div>
  );
}

export default UserDetails;
