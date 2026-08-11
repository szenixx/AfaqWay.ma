/* The single source of truth for what AfaqWay charges.

   Every price shown anywhere on the platform, the home page, pricing page,
   checkout, receipts, invoices, dashboards, the admin workspace and the student
   workspace, resolves back to this file. Change a number here and it changes
   everywhere, with no other edit needed.

   Prices are per destination country, because what we charge depends on where
   the student is going. Lithuania is the only country open today. */

export type PlanId = "self_service" | "full_service";

/** ISO-3166 alpha-2 of the destination country. */
export type DestinationCode = "LT";

export const CURRENCY = "MAD";
/** Short form used on cards and receipts, where "MAD" reads heavy. */
export const CURRENCY_SHORT = "DH";

export const PRICES: Record<DestinationCode, Record<PlanId, number>> = {
  LT: {
    self_service: 1790,
    full_service: 4490,
  },
};

export const DEFAULT_DESTINATION: DestinationCode = "LT";

/** The price of a plan for a destination. Falls back to the open country. */
export function priceOf(plan: PlanId, destination: DestinationCode = DEFAULT_DESTINATION): number {
  return PRICES[destination]?.[plan] ?? PRICES[DEFAULT_DESTINATION][plan];
}

/** "1,790 DH" — the one place amounts are formatted for display. */
export function formatPrice(amount: number, currency: string = CURRENCY_SHORT): string {
  return `${amount.toLocaleString("en-US")} ${currency}`;
}

/* ── University fees, which are quoted in euros ────────────────────────────
   What AfaqWay charges is in MAD, above. What a UNIVERSITY charges is in EUR,
   and the Excel asks for both figures on the fee steps:

     **Application Fee:** €XXX
     **Approx. in MAD:** XXXX MAD

   The rate is a stated constant, not a live lookup. A live rate would put a
   third-party request on a page a student reads while deciding whether they can
   afford a programme, and a silent failure there is worse than a number that is
   openly approximate. The word "Approx." is the Excel's own, and the date below
   is rendered beside the figure so it can never quietly go stale.

   Update RATE_SET_ON whenever EUR_TO_MAD changes. */

/** Middle-market EUR → MAD rate used for the indicative conversion. */
export const EUR_TO_MAD = 10.9;
/** When the rate above was last set, shown to the student beside the figure. */
export const RATE_SET_ON = "2026-08-01";

/** "€4,000" — a university fee, or "€0 (Free)" when there is none to pay. */
export function formatEur(value: number | null | undefined): string {
  return value === null || value === undefined || value === 0
    ? "€0 (Free)"
    : `€${value.toLocaleString("en-US")}`;
}

/**
 * The indicative dirham value of a euro fee, rounded to whole dirhams.
 * Returns null when there is nothing to convert, so the caller shows one line
 * rather than "€0 (Free)" followed by "0 MAD".
 */
export function eurToMad(value: number | null | undefined): number | null {
  if (value === null || value === undefined || value === 0) return null;
  return Math.round(value * EUR_TO_MAD);
}

/** The plans a destination actually offers. Drives the dependent plan filter. */
export function plansForCountry(code: string | null | undefined): PlanId[] {
  const table = PRICES[(code ?? "") as DestinationCode];
  return table ? (Object.keys(table) as PlanId[]) : [];
}

export const PLAN_LABEL: Record<PlanId, string> = {
  self_service: "Self Service",
  full_service: "Full Service",
};
