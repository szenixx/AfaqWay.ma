/* The tester account — one identity, read the same way everywhere.

   Exactly one email is a QA/test account: never a real student, never
   counted in a statistic, and the only account the Tester Controls panel
   will open for. Every place that needs to know "is this the tester" —
   client UI, API routes, the stats exclusion in lib/admin.ts — imports this
   file rather than repeating the email, so there is one place to change it
   and no risk of two copies drifting apart. */
export const TESTER_EMAIL = "abderrahmane.almoustansir@gmail.com";

export const isTesterEmail = (email: string | null | undefined): boolean =>
  (email ?? "").trim().toLowerCase() === TESTER_EMAIL;
