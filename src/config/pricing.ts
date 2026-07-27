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
    self_service: 2900,
    full_service: 6700,
  },
};

export const DEFAULT_DESTINATION: DestinationCode = "LT";

/** The price of a plan for a destination. Falls back to the open country. */
export function priceOf(plan: PlanId, destination: DestinationCode = DEFAULT_DESTINATION): number {
  return PRICES[destination]?.[plan] ?? PRICES[DEFAULT_DESTINATION][plan];
}

/** "2,900 DH" — the one place amounts are formatted for display. */
export function formatPrice(amount: number, currency: string = CURRENCY_SHORT): string {
  return `${amount.toLocaleString("en-US")} ${currency}`;
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
