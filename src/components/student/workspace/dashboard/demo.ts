/* Demo content for the rebuilt dashboard.

   Structure first: the point of this pass is that the layout, proportions and
   hierarchy are right. Every value here is placeholder and is meant to be
   swapped for real data once the composition is signed off, which is why it
   all lives in one file instead of being scattered through the components. */

export const STUDENT = {
  name: "Abderrahmane",
  fullName: "Abderrahmane Almoustansir",
  email: "abderrahmane@afaqway.com",
};

/* The two circular metrics. Each carries a role, not just a number:
   application progress is the brand's own measure, documents are green
   because green means verified everywhere else on the platform. */
export const GOAL = { value: 85, label: "Application progress", tone: "primary" as const };
export const SCORE = { value: 62, label: "Documents verified", tone: "green" as const };

/* The compact list. Tone follows state, so the colour means something:
   green done · primary in progress · gold needs attention · neutral upcoming. */
export type Stage = { name: string; pct: number; state: "done" | "active" | "attention" | "upcoming" };
export const COURSES: Stage[] = [
  { name: "Pre-application", pct: 100, state: "done" },
  { name: "University admission", pct: 45, state: "active" },
  { name: "Migration documents", pct: 20, state: "attention" },
  { name: "Arrival", pct: 0, state: "upcoming" },
];

/* FRAME 8 — the media rows. */
export type MediaRow = {
  id: string; title: string; members: string; size: string;
  /* Same four roles as the stage list, so a colour means the same thing
     wherever it appears on the page. */
  state: "done" | "active" | "attention" | "upcoming";
};
export const MEDIA: MediaRow[] = [
  { id: "m1", title: "Choosing your programme", members: "32 members", size: "2.3MB", state: "done" },
  { id: "m2", title: "Preparing your documents", members: "28 members", size: "1.8MB", state: "active" },
  { id: "m3", title: "The migration application", members: "24 members", size: "3.1MB", state: "attention" },
  { id: "m4", title: "Life in Lithuania", members: "19 members", size: "4.6MB", state: "upcoming" },
  { id: "m5", title: "Your first week", members: "15 members", size: "2.0MB", state: "upcoming" },
];

/* FRAME 13 — today's event. */
export const EVENT = {
  kicker: "Today",
  title: "Advisor consultation",
  detail: "Review your university application",
  time: "14:30",
  duration: "30 min",
  people: ["A", "S", "M"],
};
