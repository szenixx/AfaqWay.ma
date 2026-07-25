import {
  User, Mail, Phone, Lock, Shield, Flag, Globe, MapPin, Building2, GraduationCap,
  BookOpen, Calendar, Languages, Coins, Award, BookUser, FileText, Search, Filter,
  CircleCheck, CreditCard, Hash, Landmark, Wallet, MessageSquare, Pencil, Type,
} from "lucide-react";

/* One glyph per kind of field, one size, one colour (the platform indigo, set in
   ds.css). Every Input and Select takes its leading icon from here, so the same
   concept never appears with two different icons. */

export const FIELD_ICON_SIZE = 17;

const MAP = {
  name: User, firstName: User, lastName: User, gender: User,
  email: Mail, phone: Phone, password: Lock, confirmPassword: Shield,
  nationality: Flag, country: Globe, city: MapPin, address: MapPin,
  university: Landmark, faculty: Building2, degree: GraduationCap,
  program: BookOpen, field: BookOpen, intake: Calendar, dob: Calendar, date: Calendar,
  language: Languages, currency: Coins, scholarship: Award, passport: BookUser,
  document: FileText, search: Search, filter: Filter, status: CircleCheck,
  plan: CreditCard, payment: Wallet, reference: Hash, message: MessageSquare,
  text: Type, note: Pencil,
} as const;

export type FieldIconName = keyof typeof MAP;

/** Leading icon for a field, at the platform's single control icon size. */
export function fieldIcon(name: FieldIconName, size: number = FIELD_ICON_SIZE) {
  const Ico = MAP[name];
  return <Ico size={size} />;
}

/* Keyword → icon, for fields whose labels come from data (the onboarding flow
   registry, admin filters). Keeps dynamic fields on the same icon vocabulary
   as hand-written ones instead of leaving them bare. */
const KEYWORDS: [RegExp, FieldIconName][] = [
  [/e-?mail/i, "email"],
  [/phone|whatsapp|mobile|tel\b/i, "phone"],
  [/password/i, "password"],
  [/nationality/i, "nationality"],
  [/country|destination/i, "country"],
  [/city|town|address|where/i, "city"],
  [/universit|school|institution/i, "university"],
  [/facult|department/i, "faculty"],
  [/degree|diploma|qualification|level of study/i, "degree"],
  [/language|english|french/i, "language"],
  [/currency/i, "currency"],
  [/programme|program|field of study|major|subject|study/i, "program"],
  [/intake|start|when|semester|year|date|birth/i, "intake"],
  [/scholarship|funding|grant/i, "scholarship"],
  [/passport/i, "passport"],
  [/budget|tuition|price|amount|fee/i, "payment"],
  [/plan|subscription/i, "plan"],
  [/status/i, "status"],
  [/search/i, "search"],
  [/filter/i, "filter"],
  [/document|file|upload/i, "document"],
  [/reason|note|comment|message|describe/i, "note"],
  [/name/i, "name"],
];

/** Best-matching leading icon for a free-text label. Falls back to a neutral
    text glyph so a field is never left without one. */
export function iconForLabel(label: string, size: number = FIELD_ICON_SIZE) {
  const hit = KEYWORDS.find(([re]) => re.test(label));
  return fieldIcon(hit ? hit[1] : "text", size);
}
