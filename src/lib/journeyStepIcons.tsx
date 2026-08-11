import type { ComponentType } from "react";
import {
  IdCard, FileSignature, FileUser, MailCheck, HandCoins, MapPinned, Stamp, BadgeCheck,
  FileCheck2, Banknote, CreditCard, Send, MessagesSquare, Hourglass, HeartPulse, Landmark,
  Smartphone, Home, Bus, Briefcase, Users, Award, Camera, Languages, ShieldCheck, GraduationCap,
  Plane, Building2, CalendarClock, UserPlus, Wallet, MapPin, MessageCircle, FileText, Compass,
  ClipboardCheck, BookPlus,
} from "lucide-react";

export type StepIcon = ComponentType<{ size?: number; className?: string }>;

/* One icon per real step, keyed by the exact title text every step is
 * seeded with (scripts/journey-spec.mjs, scripts/stage5-content.mjs,
 * scripts/journey-modules.mjs) — every stage, not just one. Two titles
 * share an icon only when they are actually about the same thing (both
 * bank documents, both waiting periods, both interviews); everything else
 * gets its own, so the roadmap never repeats a mark between unrelated
 * steps. An admin-typed title that isn't in this table falls through to
 * the keyword guesses below, then to a plain generic icon — never a
 * missing icon. */
const EXACT: Record<string, StepIcon> = {
  // Stage 1 · Pre-Application
  "Explore Your Program": Compass,
  "English Certificate": Languages,
  "Motivation Letter": FileSignature,
  "CV (Resume)": FileUser,
  "Additional Courses": BookPlus,
  "Personal Photo": Camera,
  "Application Fees": Banknote,
  "Submit Your Application": Send,
  "Motivational Interview": MessagesSquare,
  "University Review": ClipboardCheck,
  "E-Sign Agreement of Studies": FileSignature,
  "Pay Tuition Fees": CreditCard,

  // Stage 2 · Document Preparation
  "Academic Documents (Apostille & Translation)": Stamp,
  "Passport & National ID Card": IdCard,
  "MIGRIS Motivation Letter": FileSignature,
  "University Acceptance Letter": MailCheck,
  "Wait for Mediation Letter": Hourglass,
  "English Language Certificate": Languages,
  "Criminal Record Certificate": ShieldCheck,
  "Health Insurance": HeartPulse,
  "Bank Statement (Last 6 Months)": Landmark,
  "Bank Maintenance Certificate (Attestation de tenue de compte)": Landmark,

  // Stage 3 · MIGRIS / Residence Permit Application
  "Create MIGRIS Account": UserPlus,
  "Complete & Submit MIGRIS Application": FileCheck2,
  "MIGRIS Application Approved": BadgeCheck,

  // Stage 4 · VFS & Travel
  "Book Your VFS Appointment": CalendarClock,
  "Book Your Flight & Hostels": Plane,
  "Attend Your VFS Appointment": Building2,
  "Residence Permit Interview": MessagesSquare,
  "Waiting for Final Decision": Hourglass,

  // Stage 5 · After Arrival in Lithuania
  "Accommodation": Home,
  "Arrived in Lithuania": MapPin,
  "Lithuanian SIM / eSIM": Smartphone,
  "University Enrollment": GraduationCap,
  "Residence Registration": MapPinned,
  "Banking": Landmark,
  "Healthcare": HeartPulse,
  "Public Transport": Bus,
  "Financial Setup": Wallet,
  "Find a Job (Optional)": Briefcase,
  "Social Integration": Users,
  "Academic Success": Award,

  // Optional module: Financial Sponsorship
  "Financial Sponsorship": HandCoins,
  "Affidavit / Sponsorship Letter": HandCoins,
  "Sponsor's Passport / ID": IdCard,
  "Bank Maintenance (Translated)": Landmark,
  "Your & Sponsor's Unabridged Copy": FileText,
  "Proof of Sponsor's Employment": Briefcase,
};

/** Substring guesses, tried in order, for any title not in the exact table
 *  above — an admin-added or per-country-variant step still gets a
 *  topically sensible icon instead of a blank generic one. */
const KEYWORDS: [RegExp, StepIcon][] = [
  [/passport|national id/i, IdCard],
  [/sponsor/i, HandCoins],
  [/bank/i, Landmark],
  [/insurance|health/i, HeartPulse],
  [/photo/i, Camera],
  [/certificate|apostille|stamp/i, Stamp],
  [/motivation|cover letter/i, FileSignature],
  [/acceptance letter|approved/i, MailCheck],
  [/letter/i, FileSignature],
  [/wait|pending|mediation/i, Hourglass],
  [/interview/i, MessagesSquare],
  [/vfs|visa office|embassy|consulate/i, Building2],
  [/flight|travel|hostel/i, Plane],
  [/appointment|book/i, CalendarClock],
  [/fee|tuition|pay/i, CreditCard],
  [/application|submit|migris account/i, Send],
  [/sim|esim|phone/i, Smartphone],
  [/accommodation|housing|arrived/i, Home],
  [/transport|bus|train/i, Bus],
  [/job|employ|career/i, Briefcase],
  [/social|community/i, Users],
  [/academic|university|enrollment|course/i, GraduationCap],
  [/cv|resume/i, FileUser],
  [/english|language/i, Languages],
  [/criminal|police/i, ShieldCheck],
  [/registration|address/i, MapPinned],
  [/fund|financial|wallet/i, Wallet],
  [/chat|support|contact/i, MessageCircle],
  [/award|success|achievement/i, Award],
];

/** The icon for one step, by its title — exact match first, then a
 *  keyword guess, then a plain document icon so a step is never iconless. */
export function iconForStep(title: string): StepIcon {
  const exact = EXACT[title.trim()];
  if (exact) return exact;
  for (const [pattern, icon] of KEYWORDS) if (pattern.test(title)) return icon;
  return FileText;
}
