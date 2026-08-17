import "server-only";
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import { planById, methodById } from "@/lib/plans";
import { CURRENCY_SHORT, formatPrice } from "@/config/pricing";
import { countryByCode } from "@/components/profile-setup/countries";

/* Official subscription invoice.
   Built server-side from the authenticated user's own profile and approved
   payment, so a downloaded PDF can only ever contain that user's data. */

export type InvoiceData = {
  invoiceId: string;
  paymentDate: string;
  paymentTime: string;
  reviewDate: string;
  fullName: string;
  userId: string;
  email: string;
  city: string;
  country: string;
  destination: string;
  plan: string;
  method: string;
  amount: string;
};

/* Design-system colours, as PDF rgb(). */
const INK = rgb(0.09, 0.137, 0.227); // #17233A
const INK_SOFT = rgb(0.353, 0.42, 0.522); // #5A6B85
const INK_FAINT = rgb(0.525, 0.584, 0.671); // #8695AB
const INDIGO = rgb(0.231, 0.255, 0.788); // #3B41C9 — brand primary
const LINE = rgb(0.863, 0.886, 0.918); // #DCE2EA
const TINT = rgb(0.886, 0.890, 0.973); // #E2E3F8

const PAGE_W = 595.28; // A4
const PAGE_H = 841.89;
const MARGIN = 56;
const CONTENT_W = PAGE_W - MARGIN * 2;

const dt = (iso: string | null): { date: string; time: string } => {
  if (!iso) return { date: "—", time: "—" };
  const d = new Date(iso);
  return {
    date: d.toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric", timeZone: "UTC" }),
    time: d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "UTC" }) + " UTC",
  };
};

type PaymentRow = {
  id: string; plan: string; amount: number; currency: string; method: string;
  status: string; created_at: string; reviewed_at: string | null; reference: string | null;
};
type ProfileRow = {
  full_name: string | null; email: string | null; city: string | null;
  destination_country: string | null; user_number: number | null; plan: string | null;
};

/** Shapes the raw rows into the exact strings printed on the invoice. */
export function buildInvoiceData(profile: ProfileRow, payment: PaymentRow): InvoiceData {
  const paid = dt(payment.created_at);
  const reviewed = dt(payment.reviewed_at);
  const destination = countryByCode(profile.destination_country ?? "")?.name ?? profile.destination_country ?? "—";
  return {
    invoiceId: payment.reference ?? `INV-${payment.id.slice(0, 8).toUpperCase()}`,
    paymentDate: paid.date,
    paymentTime: paid.time,
    reviewDate: reviewed.date,
    fullName: profile.full_name || "—",
    userId: "AWU-" + String(profile.user_number ?? 0).padStart(3, "0"),
    email: profile.email || "—",
    city: profile.city || "—",
    country: "Morocco",
    destination,
    plan: planById(payment.plan ?? profile.plan)?.name ?? payment.plan ?? "—",
    method: methodById(payment.method)?.name ?? payment.method,
    // The amount actually charged, stored on the payment. New payments take
    // their price from src/config/pricing.ts; issued invoices keep theirs.
    amount: formatPrice(payment.amount, payment.currency === "MAD" ? CURRENCY_SHORT : payment.currency),
  };
}

/* ── Drawing helpers ──────────────────────────────────────────────────────── */

function centered(page: PDFPage, text: string, y: number, font: PDFFont, size: number, color = INK) {
  const w = font.widthOfTextAtSize(text, size);
  page.drawText(text, { x: (PAGE_W - w) / 2, y, size, font, color });
}

/** The AfaqWay mark: the two chevrons of the logo, drawn as vector strokes. */
function drawLogo(page: PDFPage, cx: number, top: number, size: number) {
  const scale = size / 96;
  page.drawSvgPath("M29 28 48 45 67 28", { x: cx - size / 2, y: top, scale, borderColor: INDIGO, borderWidth: 13 * scale });
  page.drawSvgPath("M29 54 48 71 67 54", { x: cx - size / 2, y: top, scale, borderColor: INDIGO, borderWidth: 13 * scale });
}

function sectionTitle(page: PDFPage, text: string, y: number, font: PDFFont): number {
  page.drawRectangle({ x: MARGIN, y: y - 4, width: CONTENT_W, height: 26, color: TINT });
  page.drawText(text.toUpperCase(), { x: MARGIN + 12, y: y + 4, size: 9.5, font, color: INDIGO });
  return y - 18;
}

function row(page: PDFPage, label: string, value: string, y: number, reg: PDFFont, bold: PDFFont): number {
  page.drawText(label, { x: MARGIN + 12, y, size: 10, font: reg, color: INK_SOFT });
  const w = bold.widthOfTextAtSize(value, 10);
  page.drawText(value, { x: PAGE_W - MARGIN - 12 - w, y, size: 10, font: bold, color: INK });
  page.drawLine({ start: { x: MARGIN + 12, y: y - 7 }, end: { x: PAGE_W - MARGIN - 12, y: y - 7 }, thickness: 0.5, color: LINE });
  return y - 22;
}

/** Word-wraps a paragraph and returns the y position below it. */
function paragraph(page: PDFPage, text: string, y: number, font: PDFFont, size: number, color = INK_SOFT): number {
  const maxW = CONTENT_W - 24;
  let line = "";
  let cursor = y;
  for (const word of text.split(" ")) {
    const candidate = line ? `${line} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, size) > maxW) {
      page.drawText(line, { x: MARGIN + 12, y: cursor, size, font, color });
      cursor -= size + 4;
      line = word;
    } else line = candidate;
  }
  if (line) { page.drawText(line, { x: MARGIN + 12, y: cursor, size, font, color }); cursor -= size + 4; }
  return cursor;
}

/* ── Document ─────────────────────────────────────────────────────────────── */

export async function renderInvoicePdf(d: InvoiceData): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.setTitle(`AfaqWay invoice ${d.invoiceId}`);
  pdf.setAuthor("AfaqWay");
  pdf.setSubject("Subscription invoice");

  const page = pdf.addPage([PAGE_W, PAGE_H]);
  const reg = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

  // Header — logo, platform name, one-line description, all centered.
  drawLogo(page, PAGE_W / 2, MARGIN, 46);
  let y = PAGE_H - MARGIN - 62;
  centered(page, "AfaqWay", y, bold, 24);
  y -= 18;
  centered(page, "Study abroad guidance for Moroccan students, from application to arrival.", y, reg, 9.5, INK_SOFT);
  y -= 26;
  centered(page, "SUBSCRIPTION INVOICE", y, bold, 11, INDIGO);
  y -= 16;
  page.drawLine({ start: { x: MARGIN, y }, end: { x: PAGE_W - MARGIN, y }, thickness: 1, color: LINE });
  y -= 30;

  y = sectionTitle(page, "Invoice information", y, bold);
  y = row(page, "Invoice ID", d.invoiceId, y, reg, bold);
  y = row(page, "Payment date", d.paymentDate, y, reg, bold);
  y = row(page, "Payment time", d.paymentTime, y, reg, bold);
  y = row(page, "Review date", d.reviewDate, y, reg, bold);
  y -= 14;

  y = sectionTitle(page, "Customer information", y, bold);
  y = row(page, "Full name", d.fullName, y, reg, bold);
  y = row(page, "User ID", d.userId, y, reg, bold);
  y = row(page, "Email address", d.email, y, reg, bold);
  y = row(page, "City", d.city, y, reg, bold);
  y = row(page, "Country", d.country, y, reg, bold);
  y -= 14;

  y = sectionTitle(page, "Subscription information", y, bold);
  y = row(page, "Destination country", d.destination, y, reg, bold);
  y = row(page, "Subscription plan", d.plan, y, reg, bold);
  y = row(page, "Payment method", d.method, y, reg, bold);
  y -= 6;

  // Amount paid — the figure the reader looks for, on a tinted band.
  page.drawRectangle({ x: MARGIN, y: y - 12, width: CONTENT_W, height: 40, color: TINT });
  page.drawText("Amount paid", { x: MARGIN + 12, y: y + 2, size: 11, font: bold, color: INDIGO });
  const aw = bold.widthOfTextAtSize(d.amount, 16);
  page.drawText(d.amount, { x: PAGE_W - MARGIN - 12 - aw, y: y - 2, size: 16, font: bold, color: INDIGO });
  y -= 46;

  // Footer confirmation.
  page.drawLine({ start: { x: MARGIN, y }, end: { x: PAGE_W - MARGIN, y }, thickness: 0.5, color: LINE });
  y -= 22;
  y = paragraph(
    page,
    "This invoice was generated directly by the AfaqWay platform from the records held in the student's account. The information shown above is accurate as recorded at the time of generation, and the payment it refers to has been received and verified by our team. This document serves as the official invoice for the subscription described above and requires no signature.",
    y, reg, 9.5,
  );
  y -= 10;
  page.drawText(`Generated by AfaqWay · afaqway.com · Invoice ${d.invoiceId}`, { x: MARGIN + 12, y, size: 8.5, font: reg, color: INK_FAINT });

  return pdf.save();
}
