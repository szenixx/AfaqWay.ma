import type { ReactNode } from "react";

export interface AccordionItem {
  id?: string;
  question: ReactNode;
  answer: ReactNode;
}

/**
 * The platform's accordion (FAQ, support). Animates a measured height then hands
 * back to auto so answers reflow; collapsed panels are inert.
 *
 * @startingPoint section="Feedback" subtitle="Measured-height FAQ expander" viewport="700x300"
 */
export interface AccordionProps {
  items: AccordionItem[];
  /** Index open on first render; -1 for all closed. Default 0. */
  defaultOpen?: number;
  /** Allow several rows open at once. */
  multiple?: boolean;
}
export function Accordion(props: AccordionProps): JSX.Element;
export default Accordion;
