/* Lithuania demo workspace data. One universal workspace: the SAME structure is
   reused for every country later (see docs/workspace-architecture.md). Only the
   content here is Lithuania-specific. Plan-aware copy lives inline as {self, full}
   pairs so both plans share one layout and only the wording/handling differs. */

export type DocStatus = "approved" | "under_review" | "needs_changes" | "pending" | "uploaded";
export type StageStatus = "done" | "active" | "locked" | "todo";

export type PlanCopy = { self: string; full: string };

export type JourneyStage = {
  key: string;
  title: string;
  status: StageStatus;
  // what the student sees under each stage, per plan
  desc: PlanCopy;
  tasks: { label: string; done: boolean }[];
  eta: string;
};

/* The Lithuania path — six stages, identical layout for both plans. Self-Service
   the student completes each task; Full-Service an advisor drives it. */
export const JOURNEY: JourneyStage[] = [
  {
    key: "university", title: "University Application", status: "active", eta: "In progress",
    desc: {
      self: "Submit your application to your shortlisted Lithuanian universities and upload each required document for review.",
      full: "Our advisor is preparing and submitting your university applications for you. Track the progress here.",
    },
    tasks: [
      { label: "Choose target universities", done: true },
      { label: "Upload transcript & diploma", done: true },
      { label: "Motivation letter reviewed", done: false },
      { label: "Application submitted", done: false },
    ],
  },
  {
    key: "interview", title: "University Interview", status: "todo", eta: "~2 weeks",
    desc: {
      self: "Prepare for and attend your online admission interview with the university.",
      full: "We schedule your interview and coach you through it with a full preparation session.",
    },
    tasks: [
      { label: "Interview scheduled", done: false },
      { label: "Preparation session", done: false },
      { label: "Interview completed", done: false },
    ],
  },
  {
    key: "migris", title: "Migration Office (Migris)", status: "todo", eta: "~4 weeks",
    desc: {
      self: "Create your Migris account and file the mediation request for your national visa.",
      full: "Our team files your Migris mediation request and monitors it until approval.",
    },
    tasks: [
      { label: "Migris account created", done: false },
      { label: "Mediation request filed", done: false },
      { label: "Mediation approved", done: false },
    ],
  },
  {
    key: "vfs", title: "VFS Application", status: "todo", eta: "~6 weeks",
    desc: {
      self: "Book your VFS appointment, prepare your visa file and attend in person.",
      full: "We assemble your complete VFS file and book the appointment on your behalf.",
    },
    tasks: [
      { label: "VFS appointment booked", done: false },
      { label: "Visa file prepared", done: false },
      { label: "Biometrics submitted", done: false },
    ],
  },
  {
    key: "migris-interview", title: "Migris Interview", status: "todo", eta: "~8 weeks",
    desc: {
      self: "Attend the migration interview and answer questions about your study plan.",
      full: "We prepare you fully for the migration interview and rehearse the likely questions.",
    },
    tasks: [
      { label: "Interview scheduled", done: false },
      { label: "Preparation completed", done: false },
      { label: "Interview passed", done: false },
    ],
  },
  {
    key: "trp", title: "Residence Permit (TRP)", status: "locked", eta: "~12 weeks",
    desc: {
      self: "Collect your temporary residence permit and complete your arrival registration.",
      full: "We guide your permit collection and handle your full post-arrival setup for you.",
    },
    tasks: [
      { label: "Permit approved", done: false },
      { label: "Permit collected", done: false },
      { label: "Arrival registration", done: false },
    ],
  },
];

export type RequiredDoc = {
  key: string;
  name: string;
  desc: string;
  status: DocStatus;
  updated: string;
};

/* Required documents. Self-Service: the student uploads for review. Full-Service:
   the same list, but the admin applies them for the student. */
export const REQUIRED_DOCS: RequiredDoc[] = [
  { key: "passport", name: "Passport (bio page)", desc: "Valid for at least 15 months", status: "approved", updated: "2 days ago" },
  { key: "transcript", name: "Academic transcript", desc: "Official grades, translated", status: "approved", updated: "2 days ago" },
  { key: "diploma", name: "Diploma / Baccalauréat", desc: "Certified copy + translation", status: "under_review", updated: "5 hours ago" },
  { key: "motivation", name: "Motivation letter", desc: "One page, English", status: "needs_changes", updated: "1 day ago" },
  { key: "english", name: "English proof (Duolingo / IELTS)", desc: "Score report", status: "under_review", updated: "3 hours ago" },
  { key: "photo", name: "Passport photo", desc: "White background, 35×45mm", status: "pending", updated: "—" },
  { key: "funds", name: "Proof of funds", desc: "Bank statement, last 3 months", status: "pending", updated: "—" },
  { key: "insurance", name: "Health insurance", desc: "Covers full study period", status: "pending", updated: "—" },
];

export const DOC_LABEL: Record<DocStatus, string> = {
  approved: "Approved", under_review: "Under review", needs_changes: "Needs changes", pending: "Pending", uploaded: "Uploaded",
};
export const DOC_TONE: Record<DocStatus, "green" | "amber" | "red" | "grey" | "indigo"> = {
  approved: "green", under_review: "amber", needs_changes: "red", pending: "grey", uploaded: "indigo",
};

export type Notif = { id: string; kind: "doc" | "journey" | "message" | "deadline" | "system"; title: string; body: string; time: string; read: boolean };
export const NOTIFICATIONS: Notif[] = [
  { id: "n1", kind: "doc", title: "Document approved", body: "Your academic transcript was approved by our reviewer.", time: "2h ago", read: false },
  { id: "n2", kind: "message", title: "New message from your advisor", body: "We reviewed your motivation letter, one small change needed.", time: "5h ago", read: false },
  { id: "n3", kind: "journey", title: "Journey updated", body: "Stage 1, University Application, is now in progress.", time: "1d ago", read: false },
  { id: "n4", kind: "deadline", title: "Upcoming deadline", body: "VFS appointments for autumn intake open in 3 weeks.", time: "1d ago", read: true },
  { id: "n5", kind: "doc", title: "Document needs changes", body: "Your motivation letter needs a small revision before approval.", time: "1d ago", read: true },
  { id: "n6", kind: "system", title: "Welcome to your workspace", body: "Everything for your Lithuania journey lives here in one place.", time: "3d ago", read: true },
];

export type Activity = { icon: "doc" | "check" | "message" | "flag"; text: string; time: string };
export const RECENT_ACTIVITY: Activity[] = [
  { icon: "check", text: "Academic transcript approved", time: "2h ago" },
  { icon: "message", text: "Advisor replied in Messages", time: "5h ago" },
  { icon: "doc", text: "Diploma uploaded for review", time: "1d ago" },
  { icon: "flag", text: "Started University Application stage", time: "1d ago" },
];

export type Task = { label: string; due: string; tone: "amber" | "indigo" | "grey" | "red" };
export const UPCOMING_TASKS: Task[] = [
  { label: "Revise motivation letter", due: "Due in 2 days", tone: "red" },
  { label: "Upload passport photo", due: "Due this week", tone: "amber" },
  { label: "Prepare proof of funds", due: "Due in 2 weeks", tone: "indigo" },
  { label: "Book VFS appointment", due: "Due in 3 weeks", tone: "grey" },
];

export type ExploreSection = { key: string; title: string; icon: string; blurb: string; items: { name: string; note: string }[] };
export const EXPLORE: ExploreSection[] = [
  { key: "universities", title: "Universities", icon: "GraduationCap", blurb: "Top Lithuanian universities for international students.", items: [
    { name: "Vilnius University", note: "Oldest in the Baltics, strong in IT & business" },
    { name: "Kaunas University of Technology (KTU)", note: "Engineering & technology focus" },
    { name: "Vytautas Magnus University", note: "Liberal arts, many English programs" },
    { name: "Mykolas Romeris University", note: "Law, public administration, psychology" },
  ] },
  { key: "cities", title: "Cities", icon: "Building2", blurb: "Where students live and study.", items: [
    { name: "Vilnius", note: "Capital, biggest student hub" },
    { name: "Kaunas", note: "Second city, very student-friendly" },
    { name: "Klaipėda", note: "Coastal, calmer and cheaper" },
  ] },
  { key: "housing", title: "Housing", icon: "Home", blurb: "Where to stay and what it costs.", items: [
    { name: "University dormitory", note: "€120–200 / month, book early" },
    { name: "Shared flat", note: "€200–350 / month per room" },
    { name: "Studio apartment", note: "€350–550 / month" },
  ] },
  { key: "cost", title: "Cost of Living", icon: "Wallet", blurb: "A realistic monthly budget.", items: [
    { name: "Food & groceries", note: "€200–300 / month" },
    { name: "Transport pass", note: "€10 / month (student)" },
    { name: "Total student budget", note: "€500–800 / month" },
  ] },
  { key: "transport", title: "Transportation", icon: "Bus", blurb: "Getting around.", items: [
    { name: "Public transport", note: "Buses & trolleybuses, student discount" },
    { name: "Trains", note: "Vilnius–Kaunas in ~1 hour" },
    { name: "Bikes & scooters", note: "Widely available in cities" },
  ] },
  { key: "health", title: "Healthcare", icon: "HeartPulse", blurb: "Staying covered.", items: [
    { name: "Health insurance", note: "Required for your visa" },
    { name: "Public clinics", note: "Available once registered" },
    { name: "Pharmacies (Vaistinė)", note: "Common and well stocked" },
  ] },
  { key: "banking", title: "Banking", icon: "Landmark", blurb: "Money once you arrive.", items: [
    { name: "Revolut / Paysera", note: "Easy to open before arrival" },
    { name: "Swedbank / SEB", note: "Major local banks" },
    { name: "Cash", note: "Card is accepted almost everywhere" },
  ] },
  { key: "life", title: "Student Life", icon: "Users", blurb: "Life beyond class.", items: [
    { name: "Student organizations", note: "ESN & faculty clubs" },
    { name: "Events & festivals", note: "Active year-round" },
    { name: "Community", note: "Growing North-African student community" },
  ] },
  { key: "tips", title: "Tips", icon: "Lightbulb", blurb: "Small things that help a lot.", items: [
    { name: "Learn a few Lithuanian words", note: "Locals appreciate it" },
    { name: "Dress for winter", note: "It gets cold, plan ahead" },
    { name: "Keep document copies", note: "Digital + printed, always" },
  ] },
];

export const FAQ: { q: string; a: string }[] = [
  { q: "How long does the whole process take?", a: "For Lithuania, most students complete every stage in 3 to 5 months depending on intake and interview scheduling." },
  { q: "What happens after I upload a document?", a: "A real reviewer checks it, usually within 48 hours, and marks it Approved, Under review, or Needs changes." },
  { q: "Can I switch my program later?", a: "Yes. Go to Settings, request a program change, and our team updates your file." },
  { q: "What's the difference between the two plans?", a: "Self-Service, you complete each step and we review it. Full-Service, a dedicated advisor drives the whole file for you." },
];
