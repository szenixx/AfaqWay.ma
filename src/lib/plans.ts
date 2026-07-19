/* Plan catalog + payment methods (Lithuania / MAD). Feature copy from
   /Paid.Plan/plan.prompt.md. Reused across countries later. */

export type PlanId = "self_service" | "full_service";

export interface Plan {
  id: PlanId;
  name: string;
  price: number;
  currency: string;
  popular: boolean;
  tagline: string;
  highlights: string[]; // the few shown on the card
  features: string[]; // full English list (for the doc)
  featuresAr: string[]; // full Arabic list (meaning, not literal)
}

export const PLANS: Plan[] = [
  {
    id: "self_service",
    name: "Self Service",
    price: 2200,
    currency: "DH",
    popular: true,
    tagline: "For students who drive it themselves.",
    highlights: [
      "Free program-matching before you pay",
      "Personalized 6-stage roadmap",
      "Human review on every document",
      "Learning resources on every step",
      "24/7 support access",
    ],
    features: [
      "Free program-matching guidance before you pay for anything",
      "A personalized 6-stage roadmap with step-by-step checklists you tick off yourself",
      "Human document review on every upload, a real reviewer, not a robot (avg 48h)",
      "Learning resources on every step: links, PDFs, videos, and plain-language explanations",
      "Full visibility into document status: Under review, Needs changes, or Approved",
      "24/7 support access",
    ],
    featuresAr: [
      "توجيه مجاني لاختيار البرنامج المناسب قبل أن تدفع أي شيء",
      "خارطة طريق مخصّصة من 6 مراحل مع قوائم مهام تنجزها بنفسك خطوة بخطوة",
      "مراجعة بشرية لكل وثيقة ترفعها، مراجِع حقيقي وليس آلة (بمعدّل 48 ساعة)",
      "موارد تعليمية في كل خطوة: روابط وملفات PDF وفيديوهات وشروحات مبسّطة",
      "رؤية كاملة لحالة كل وثيقة: قيد المراجعة، تحتاج تعديلات، أو مقبولة",
      "دعم متاح على مدار الساعة طوال أيام الأسبوع",
    ],
  },
  {
    id: "full_service",
    name: "Full Service",
    price: 4400,
    currency: "DH",
    popular: false,
    tagline: "We handle it, you just track it.",
    highlights: [
      "Everything in Self Service, done for you",
      "A dedicated admin runs your whole file",
      "Live tracker of your application",
      "Service and support after you arrive",
      "Interview preparation coaching",
    ],
    features: [
      "Free program-matching guidance before you pay for anything",
      "A personalized 6-stage roadmap with step-by-step checklists",
      "Human document review on every upload, a real reviewer, not a robot (avg 48h)",
      "Learning resources on every step: links, PDFs, videos, and plain-language explanations",
      "Full visibility into document status: Under review, Needs changes, or Approved",
      "24/7 support access",
      "The platform drives every step for you, not just guides it",
      "A dedicated admin manages your entire application file",
      "Live tracker showing exactly where your application stands",
      "Dedicated service and support after you arrive in your study country",
      "Document requests and updates sent to you by chat",
      "Full interview preparation coaching for university and migration interviews",
      "Post-arrival support checklist after your residence permit is approved",
      "Priority human review and hands-on guidance from start to settled",
    ],
    featuresAr: [
      "توجيه مجاني لاختيار البرنامج المناسب قبل أن تدفع أي شيء",
      "خارطة طريق مخصّصة من 6 مراحل مع قوائم مهام خطوة بخطوة",
      "مراجعة بشرية لكل وثيقة ترفعها، مراجِع حقيقي وليس آلة (بمعدّل 48 ساعة)",
      "موارد تعليمية في كل خطوة: روابط وملفات PDF وفيديوهات وشروحات مبسّطة",
      "رؤية كاملة لحالة كل وثيقة: قيد المراجعة، تحتاج تعديلات، أو مقبولة",
      "دعم متاح على مدار الساعة طوال أيام الأسبوع",
      "المنصّة تتولّى كل خطوة نيابةً عنك، لا تكتفي بالإرشاد فقط",
      "مستشار مخصّص يدير ملف طلبك بالكامل",
      "متابعة مباشرة تُظهر بالضبط أين وصل طلبك",
      "خدمة ومرافقة مخصّصة بعد وصولك إلى بلد الدراسة",
      "طلبات الوثائق وتحديثاتها تصلك عبر المحادثة",
      "تدريب كامل على مقابلات الجامعة ومكتب الهجرة",
      "قائمة دعم ما بعد الوصول بعد الموافقة على تصريح الإقامة",
      "مراجعة بشرية ذات أولوية ومرافقة عملية من البداية حتى الاستقرار",
    ],
  },
];

export const planById = (id: string | null | undefined) => PLANS.find((p) => p.id === id) ?? null;

export type PayMethodKind = "instant" | "manual";

export interface PayMethod {
  id: string;
  name: string;
  desc: string;
  kind: PayMethodKind;
  available: boolean; // instant methods are not linked yet
  recommended?: boolean;
  logoSrc: string; // transparent logo in public/pay/
  color: string; // main brand color of the logo
  // platform details shown for manual transfers
  account?: { beneficiary: string; rib?: string; note?: string };
}

const AFAQ_ACCOUNT = { beneficiary: "Abel SARL", rib: "007201000814730040057065" };

// Static config (logo, kind, brand color). Availability + account details can be
// overridden from the payment_methods table by the super-admin (see catalog usage).
export const PAY_METHODS: PayMethod[] = [
  { id: "cashplus", name: "Cash Plus", desc: "Pay cash at any Cash Plus agency", kind: "manual", available: true, recommended: true, logoSrc: "/pay/cashplus.png", color: "#F58220", account: { beneficiary: "Abderrahmane Almoustansir" } },
  { id: "attijari", name: "Attijariwafa Bank", desc: "Bank transfer or deposit", kind: "manual", available: true, logoSrc: "/pay/attijari.png", color: "#E9761E", account: AFAQ_ACCOUNT },
  { id: "simple", name: "Simple", desc: "Transfer via Simple", kind: "manual", available: true, logoSrc: "/pay/simple.png", color: "#2B4C9B", account: AFAQ_ACCOUNT },
  { id: "bank", name: "Bank Transfer", desc: "Transfer from any bank", kind: "manual", available: true, logoSrc: "/pay/bank.png", color: "#3A6EA5", account: AFAQ_ACCOUNT },
  { id: "paypal", name: "PayPal", desc: "Instant online payment", kind: "instant", available: false, logoSrc: "/pay/paypal.svg", color: "#003087" },
  { id: "card", name: "Credit / Debit Card", desc: "Visa or Mastercard", kind: "instant", available: false, logoSrc: "/pay/card.png", color: "#1A1F71" },
];

export const methodById = (id: string | null | undefined) => PAY_METHODS.find((m) => m.id === id) ?? null;
