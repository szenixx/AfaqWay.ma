/* Lithuania demo workspace data. One universal workspace: the SAME structure is
   reused for every country later (see docs/workspace-architecture.md). Only the
   content here is Lithuania-specific. Plan-aware copy lives inline as {self, full}
   pairs so both plans share one layout and only the wording/handling differs. */

export type DocStatus = "approved" | "under_review" | "needs_changes" | "pending" | "uploaded";

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

export const FAQ: { q: string; a: string }[] = [
  { q: "How long does the whole process take?", a: "For Lithuania, most students complete every stage in 3 to 5 months depending on intake and interview scheduling." },
  { q: "What happens after I upload a document?", a: "A real reviewer checks it, usually within 48 hours, and marks it Approved, Under review, or Needs changes." },
  { q: "Can I switch my program later?", a: "Yes. Go to Settings, request a program change, and our team updates your file." },
  { q: "What's the difference between the two plans?", a: "Self-Service, you complete each step and we review it. Full-Service, a dedicated advisor drives the whole file for you." },
];
