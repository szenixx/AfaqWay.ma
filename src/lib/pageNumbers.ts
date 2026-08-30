/* First, last, and the window around the current page. Anything longer gets
   an ellipsis rather than a row of numbers nobody reads. Shared by every
   HeroUI Pagination in the admin workspace (Wallet's transactions, Payments
   Review) so the "how many page links show" rule can't drift between them. */
export function pageNumbers(current: number, total: number): (number | "gap")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const out: (number | "gap")[] = [1];
  if (current > 3) out.push("gap");
  for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) out.push(i);
  if (current < total - 2) out.push("gap");
  out.push(total);
  return out;
}
