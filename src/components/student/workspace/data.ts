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
