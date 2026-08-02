import type { ReactNode } from "react";

export interface MegaMenuLink {
  label: string;
  href: string;
  description?: string;
  icon?: ReactNode;
}
export interface MegaMenuSection {
  heading?: string;
  links: MegaMenuLink[];
}
export interface MegaMenuItem {
  label: string;
  /** Present → renders a dropdown panel. Omit + set `href` for a plain link. */
  sections?: MegaMenuSection[];
  href?: string;
}

/**
 * Top-bar navigation with expandable "mega" panels (Product/Resources-style),
 * for marketing site headers. Items without `sections` render as plain links.
 *
 * @startingPoint section="Navigation" subtitle="Top-bar nav with expandable panels" viewport="700x64"
 */
export interface MegaMenuProps { items: MegaMenuItem[] }
export function MegaMenu(props: MegaMenuProps): JSX.Element;
