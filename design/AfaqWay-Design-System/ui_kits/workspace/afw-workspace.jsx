/* AfaqWay Workspace UI kit — icons, fake data and screens. Recreates the
   student User Workspace (design.md §18). Composes the DS primitives from the
   bundle namespace; icons are inline lucide-shaped glyphs. Exports Shell + the
   screens to window for index.html. */
const NS = window.AfaqWayDesignSystem_898d90;
const { Button, Pill, Status, StatCard, InfoCard, CompactCard, ActionCard, Accordion, MorphingDialog, MorphingDialogTrigger, MorphingDialogContent, MorphingDialogClose } = NS;
const { useState } = React;

/* ── Icons (lucide outline, currentColor) ── */
const I = (p) => <svg width={p.s || 20} height={p.s || 20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={p.w || 1.9} strokeLinecap="round" strokeLinejoin="round" style={p.style}>{p.children}</svg>;
const Chev = ({ s = 26 }) => <svg width={s} height={s} viewBox="0 0 96 96"><g fill="none" stroke="currentColor" strokeWidth="13" strokeLinecap="square"><path d="M29 28 48 45 67 28"/><path d="M29 54 48 71 67 54"/></g></svg>;
const IGrid = (p) => <I {...p}><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/></I>;
const IMap = (p) => <I {...p}><path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2z"/><path d="M9 4v14M15 6v14"/></I>;
const IFile = (p) => <I {...p}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></I>;
const ICal = (p) => <I {...p}><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M3 10h18M8 2v4M16 2v4"/></I>;
const ICompass = (p) => <I {...p}><circle cx="12" cy="12" r="10"/><path d="m16.2 7.8-2.9 6.6-6.6 2.9 2.9-6.6z"/></I>;
const IMsg = (p) => <I {...p}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></I>;
const IBell = (p) => <I {...p}><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/></I>;
const ISearch = (p) => <I {...p}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></I>;
const IUpload = (p) => <I {...p}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M17 8l-5-5-5 5M12 3v12"/></I>;
const ICheck = (p) => <I {...p}><path d="M20 6 9 17l-5-5"/></I>;
const IClock = (p) => <I {...p}><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></I>;
const IArrow = (p) => <I {...p}><path d="M5 12h14M13 6l6 6-6 6"/></I>;
const IPlane = (p) => <I {...p}><path d="M17.8 19.2 16 11l3.5-3.5a2.1 2.1 0 0 0-3-3L13 8 4.8 6.2a.6.6 0 0 0-.6 1l3.7 3.9-2 2-2.2-.5a.5.5 0 0 0-.5.9l2.5 1.6 1.6 2.5a.5.5 0 0 0 .9-.5l-.5-2.2 2-2 3.9 3.7a.6.6 0 0 0 1-.6z"/></I>;
const IHome = (p) => <I {...p}><path d="M3 9.5 12 3l9 6.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/></I>;
const IPanel = (p) => <I {...p}><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18"/></I>;

/* ── Fake journey data ── */
const STAGES = [
  { name: "Application", pct: 100, state: "completed", steps: "5/5" },
  { name: "Admission", pct: 100, state: "completed", steps: "4/4" },
  { name: "Visa & TRP", pct: 62, state: "processing", steps: "5/8" },
  { name: "Arrival", pct: 0, state: "draft", steps: "0/6" },
];
const TASKS = [
  { title: "Upload translated diploma", due: "Due Thursday", state: "pending", icon: <IFile s={16}/> },
  { title: "Book VFS visa appointment", due: "This week", state: "waiting", icon: <ICal s={16}/> },
  { title: "Pay TRP state fee", due: "Before 12 Aug", state: "submitted", icon: <ICheck s={16}/> },
];
const DOCS = [
  { name: "Passport", desc: "Bio page, valid 18+ months", state: "approved" },
  { name: "Translated diploma", desc: "Certified EN/LT translation", state: "processing" },
  { name: "Bank statement", desc: "Proof of funds, last 3 months", state: "pending" },
  { name: "Health insurance", desc: "Valid for the full study period", state: "draft" },
];

/* ── Sidebar ── */
const NAV = [
  { id: "overview", label: "Overview", icon: IGrid },
  { id: "journey", label: "My Journey", icon: IMap },
  { id: "documents", label: "Documents", icon: IFile },
  { id: "schedule", label: "Schedule", icon: ICal },
  { id: "explore", label: "Explore Lithuania", icon: ICompass },
];

function Sidebar({ nav, setNav, collapsed }) {
  return (
    <aside style={{ width: collapsed ? 60 : 256, flex: "none", background: "var(--surface-sidebar)", backdropFilter: "blur(var(--blur-lg)) saturate(1.5)", WebkitBackdropFilter: "blur(var(--blur-lg)) saturate(1.5)", border: "1px solid rgba(255,255,255,.9)", borderRadius: "var(--radius-2xl)", boxShadow: "var(--shadow-lg)", padding: "14px 10px", display: "flex", flexDirection: "column", gap: 4, transition: "width 200ms linear" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 8px 14px" }}>
        <span style={{ color: "var(--indigo-600)", display: "flex" }}><Chev s={30}/></span>
        {!collapsed && <span style={{ font: "700 20px/1 var(--font-sans)", color: "var(--ink)", letterSpacing: "-.01em" }}>AfaqWay</span>}
      </div>
      {!collapsed && <div style={{ font: "600 10px/1 var(--font-sans)", letterSpacing: ".07em", textTransform: "uppercase", color: "var(--ink-faint)", padding: "6px 10px" }}>Workspace</div>}
      {NAV.map((n) => {
        const active = nav === n.id;
        const Ico = n.icon;
        return (
          <button key={n.id} onClick={() => setNav(n.id)} title={n.label}
            style={{ position: "relative", display: "flex", alignItems: "center", gap: 12, justifyContent: collapsed ? "center" : "flex-start", padding: collapsed ? "11px 0" : "11px 12px", borderRadius: 14, border: "none", cursor: "pointer", background: active ? "var(--indigo-tint)" : "transparent", color: active ? "var(--indigo-text)" : "var(--ink-soft)", font: `${active ? 600 : 500} 13px/1 var(--font-sans)`, textAlign: "left" }}>
            {active && !collapsed && <span style={{ position: "absolute", left: 0, top: 10, bottom: 10, width: 3, borderRadius: 999, background: "var(--indigo-600)" }}/>}
            <Ico s={20} w={active ? 2.1 : 1.9}/>{!collapsed && n.label}
          </button>
        );
      })}
      <div style={{ marginTop: "auto" }}>
        {!collapsed && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 8px", borderTop: "1px solid var(--line-soft)" }}>
            <span style={{ width: 34, height: 34, borderRadius: 999, background: "linear-gradient(180deg,#EEF2F9,#E1E8F3)", border: "1px solid rgba(59,65,201,.1)", display: "flex", alignItems: "center", justifyContent: "center", font: "700 13px/1 var(--font-sans)", color: "var(--indigo-600)" }}>AE</span>
            <div style={{ minWidth: 0 }}>
              <div style={{ font: "600 12.5px/16px var(--font-sans)", color: "var(--ink)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>Amine El Fassi</div>
              <div style={{ font: "400 10.5px/14px var(--font-sans)", color: "var(--ink-faint)" }}>Kaunas · VMU</div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}

/* ── Panel frame ── */
function Panel({ title, action, children, style }) {
  return (
    <section className="card" style={{ padding: 20, ...style }}>
      {(title || action) && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <h2 style={{ font: "var(--text-section-title)", color: "var(--ink)", margin: 0 }}>{title}</h2>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

/* ── Screens ── */
function Overview() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14 }}>
        <StatCard value="65%" title="Journey progress" icon={<IMap s={16}/>} trend={{ value: "On track", up: true }}/>
        <StatCard value="9/23" title="Steps done" icon={<ICheck s={16}/>} accent="var(--green)"/>
        <StatCard value="3" title="Docs to upload" icon={<IFile s={16}/>} accent="var(--amber)"/>
        <StatCard value="12 Aug" title="Next deadline" icon={<IClock s={16}/>} accent="var(--red)"/>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 16, alignItems: "start" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Panel title="Your journey" action={<Button variant="ghost" size="md" onClick={()=>{}}>View journey</Button>}>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {STAGES.map((s) => (
                <div key={s.name} style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <Status state={s.state} dotOnly/>
                  <span style={{ font: "600 13.5px/18px var(--font-sans)", color: "var(--ink)", width: 120 }}>{s.name}</span>
                  <div style={{ flex: 1, height: 6, borderRadius: 999, background: "var(--grey-tint)", overflow: "hidden" }}>
                    <div style={{ width: `${s.pct}%`, height: "100%", borderRadius: 999, background: s.pct === 100 ? "var(--green)" : "var(--indigo-600)" }}/>
                  </div>
                  <span style={{ font: "500 11.5px/16px var(--font-sans)", color: "var(--ink-faint)", width: 34, textAlign: "right" }}>{s.steps}</span>
                </div>
              ))}
            </div>
          </Panel>
          <Panel title="Upcoming tasks">
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {TASKS.map((t) => (
                <div key={t.title} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", border: "1px solid var(--line)", borderRadius: 14, background: "var(--card)" }}>
                  <span style={{ flex: "none", width: 34, height: 34, borderRadius: 11, background: "var(--indigo-tint)", color: "var(--indigo-600)", display: "flex", alignItems: "center", justifyContent: "center" }}>{t.icon}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ font: "600 13px/18px var(--font-sans)", color: "var(--ink)" }}>{t.title}</div>
                    <div style={{ font: "400 11px/15px var(--font-sans)", color: "var(--ink-faint)" }}>{t.due}</div>
                  </div>
                  <Status state={t.state} size="xs" variant="soft"/>
                </div>
              ))}
            </div>
          </Panel>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ borderRadius: 28, padding: 22, background: "var(--indigo-600)", color: "#fff", boxShadow: "var(--elev-2)" }}>
            <div style={{ font: "600 10.5px/14px var(--font-sans)", letterSpacing: ".07em", textTransform: "uppercase", opacity: .8 }}>Your plan</div>
            <div style={{ font: "700 20px/26px var(--font-sans)", marginTop: 8 }}>Guided · Lithuania</div>
            <div style={{ font: "400 12.5px/18px var(--font-sans)", opacity: .85, marginTop: 4 }}>Full journey support with human document review.</div>
            <div style={{ marginTop: 16 }}><Button variant="neutral" size="md" onClick={()=>{}}>Manage plan</Button></div>
          </div>
          <ActionCard icon={<IUpload s={20}/>} title="Documents due" description="3 documents are waiting for upload before your visa stage." ctaLabel="Upload now"/>
        </div>
      </div>
    </div>
  );
}

function Journey() {
  const [open, setOpen] = useState("Visa & TRP");
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14 }}>
        {STAGES.map((s) => (
          <button key={s.name} onClick={() => setOpen(s.name)} className="af-card af-card-compact"
            style={{ textAlign: "left", padding: 16, borderRadius: 16, border: `1px solid ${open === s.name ? "var(--indigo-line)" : "var(--line)"}`, background: "var(--card)", cursor: "pointer", boxShadow: "var(--shadow-card)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ font: "700 13.5px/18px var(--font-sans)", color: "var(--ink)" }}>{s.name}</span>
              <Status state={s.state} dotOnly/>
            </div>
            <div style={{ height: 5, borderRadius: 999, background: "var(--grey-tint)", overflow: "hidden", margin: "12px 0 6px" }}>
              <div style={{ width: `${s.pct}%`, height: "100%", background: s.pct === 100 ? "var(--green)" : "var(--indigo-600)" }}/>
            </div>
            <span style={{ font: "500 11px/15px var(--font-sans)", color: "var(--ink-faint)" }}>{s.steps} steps</span>
          </button>
        ))}
      </div>
      <Panel title={`${open} — steps`}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {[
            { n: 1, t: "Gather visa documents", s: "completed" },
            { n: 2, t: "Book VFS appointment", s: "processing" },
            { n: 3, t: "Attend biometrics", s: "waiting" },
            { n: 4, t: "Submit TRP application", s: "draft" },
          ].map((st) => (
            <div key={st.n} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", border: "1px solid var(--line)", borderRadius: 16 }}>
              <span style={{ flex: "none", width: 30, height: 30, borderRadius: 999, display: "flex", alignItems: "center", justifyContent: "center", font: "700 13px/1 var(--font-sans)", background: st.s === "completed" ? "var(--green-tint)" : "var(--indigo-tint)", color: st.s === "completed" ? "var(--green)" : "var(--indigo-600)", border: `1px solid ${st.s === "completed" ? "var(--green-line)" : "var(--indigo-line)"}` }}>{st.s === "completed" ? <ICheck s={15}/> : st.n}</span>
              <span style={{ flex: 1, font: "700 14px/20px var(--font-sans)", color: "var(--ink)" }}>{st.t}</span>
              <Status state={st.s} size="sm" variant="outline"/>
              <Button variant="ghost" size="md" icon={<IArrow s={15}/>} onClick={()=>{}}>Details</Button>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

function DocRow({ d }) {
  return (
    <MorphingDialog>
      <MorphingDialogTrigger className="af-card af-card-compact" style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", border: "1px solid var(--line)", borderRadius: 16, background: "var(--card)" }}>
        <span style={{ flex: "none", width: 40, height: 40, borderRadius: 12, background: "var(--indigo-tint)", color: "var(--indigo-600)", display: "flex", alignItems: "center", justifyContent: "center" }}><IFile s={18}/></span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ font: "700 14px/20px var(--font-sans)", color: "var(--ink)" }}>{d.name}</div>
          <div style={{ font: "400 12px/17px var(--font-sans)", color: "var(--ink-soft)" }}>{d.desc}</div>
        </div>
        <Status state={d.state} size="sm" variant="outline"/>
        <Button variant={d.state === "approved" ? "neutral" : "primary"} size="md" icon={d.state === "approved" ? null : <IUpload s={15}/>} onClick={(e) => e.stopPropagation()}>{d.state === "approved" ? "Replace" : "Upload"}</Button>
      </MorphingDialogTrigger>
      <MorphingDialogContent style={{ background: "var(--card)", padding: 22, boxShadow: "var(--shadow-lg)" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ width: 44, height: 44, borderRadius: 13, background: "var(--indigo-tint)", color: "var(--indigo-600)", display: "flex", alignItems: "center", justifyContent: "center" }}><IFile s={20}/></span>
            <div style={{ font: "700 16px/22px var(--font-sans)", color: "var(--ink)" }}>{d.name}</div>
          </div>
          <MorphingDialogClose/>
        </div>
        <p style={{ font: "400 13px/20px var(--font-sans)", color: "var(--ink-soft)", marginTop: 14 }}>{d.desc}</p>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 18 }}>
          <Status state={d.state} size="sm" variant="soft"/>
          <Button variant={d.state === "approved" ? "neutral" : "primary"} size="md" icon={d.state === "approved" ? null : <IUpload s={15}/>} onClick={()=>{}}>{d.state === "approved" ? "Replace file" : "Upload file"}</Button>
        </div>
      </MorphingDialogContent>
    </MorphingDialog>
  );
}

function Documents() {
  return (
    <Panel title="Documents — Visa & TRP" action={<Pill tone="indigo">Active stage</Pill>}>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {DOCS.map((d) => <DocRow key={d.name} d={d}/>)}
      </div>
    </Panel>
  );
}

function Messages() {
  const { Bubble, BubbleContent, Message, MessageAvatar, MessageContent, MessageFooter, BubbleReactions } = NS;
  const [msgs, setMsgs] = useState([
    { me: false, t: "Hi Amine — your diploma translation has arrived and is under review. I'll confirm within a day.", at: "09:12" },
    { me: true, t: "Thank you! Should I book the VFS appointment now or wait?", at: "09:14" },
    { me: false, t: "Go ahead and book it — pick any slot after the 8th.", at: "09:15" },
  ]);
  const [draft, setDraft] = useState("");
  const send = () => { if (!draft.trim()) return; setMsgs((m) => [...m, { me: true, t: draft, at: "now" }]); setDraft(""); };
  return (
    <div className="card" style={{ padding: 0, overflow: "hidden", display: "flex", flexDirection: "column", height: 520, background: "#fff" }}>
      <div className="chat-header">
        <span style={{ width: 40, height: 40, borderRadius: 999, background: "var(--indigo-600)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}><Chev s={22}/></span>
        <div>
          <div className="chat-header-name">AfaqWay Advisor</div>
          <div className="chat-header-sub"><Status state="online" size="xs" variant="plain"/></div>
        </div>
      </div>
      <div className="chat-thread" style={{ flex: 1, background: "#fff", display: "flex", flexDirection: "column", gap: 12, padding: 18, overflowY: "auto" }}>
        {msgs.map((m, i) => (
          <Message key={i} align={m.me ? "end" : "start"}>
            {!m.me && <MessageAvatar>AW</MessageAvatar>}
            <MessageContent align={m.me ? "end" : "start"}>
              <Bubble align={m.me ? "end" : "start"}>
                <BubbleContent variant={m.me ? "default" : "secondary"}>{m.t}</BubbleContent>
              </Bubble>
              <MessageFooter align={m.me ? "end" : "start"}>{m.at}</MessageFooter>
            </MessageContent>
          </Message>
        ))}
      </div>
      <div className="chat-composer">
        <div className="af-composer">
          <input className="af-composer-input" placeholder="Message your advisor…" value={draft}
            onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()}/>
          <button className="chat-send" onClick={send}>Send<IArrow s={15}/></button>
        </div>
      </div>
    </div>
  );
}

const TITLES = { overview: "Overview", journey: "My Journey", documents: "Documents", schedule: "Schedule", explore: "Explore Lithuania" };
const SCREENS = { overview: Overview, journey: Journey, documents: Documents };

function Shell() {
  const [nav, setNav] = useState("overview");
  const [collapsed, setCollapsed] = useState(false);
  const [msg, setMsg] = useState(false);
  const Screen = msg ? Messages : (SCREENS[nav] || Overview);
  return (
    <div style={{ minHeight: "100vh", background: "var(--sw-gradient)", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", width: 460, height: 460, borderRadius: 999, background: "var(--blob-1)", filter: "blur(var(--blur-xl))", top: -180, left: -120, zIndex: 0 }}/>
      <div style={{ position: "absolute", width: 420, height: 420, borderRadius: 999, background: "var(--blob-2)", filter: "blur(var(--blur-xl))", bottom: -200, right: -140, zIndex: 0 }}/>
      <div style={{ position: "relative", zIndex: 1, display: "flex", gap: 18, padding: 18, minHeight: "100vh", boxSizing: "border-box" }}>
        <Sidebar nav={nav} setNav={(id) => { setNav(id); setMsg(false); }} collapsed={collapsed}/>
        <main style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <button onClick={() => setCollapsed((v) => !v)} aria-label="Toggle sidebar" style={{ width: 38, height: 38, borderRadius: 12, border: "1px solid var(--line)", background: "var(--card)", color: "var(--ink-soft)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}><IPanel s={18}/></button>
            <h1 style={{ font: "var(--text-page-title)", color: "var(--ink)", margin: 0, flex: 1 }}>{msg ? "Messages" : TITLES[nav]}</h1>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <button onClick={() => setMsg(true)} aria-label="Messages" style={{ width: 40, height: 40, borderRadius: 999, border: "1px solid var(--line)", background: msg ? "var(--indigo-tint)" : "var(--card)", color: msg ? "var(--indigo-600)" : "var(--ink-soft)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><IMsg s={19}/></button>
              <button aria-label="Notifications" style={{ position: "relative", width: 40, height: 40, borderRadius: 999, border: "1px solid var(--line)", background: "var(--card)", color: "var(--ink-soft)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <IBell s={19}/><span style={{ position: "absolute", top: 7, right: 8, width: 8, height: 8, borderRadius: 999, background: "var(--red)", border: "2px solid var(--card)" }}/>
              </button>
            </div>
          </div>
          <Screen/>
        </main>
      </div>
    </div>
  );
}

Object.assign(window, { AfwShell: Shell });
