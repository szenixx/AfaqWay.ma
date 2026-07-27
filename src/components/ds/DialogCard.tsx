"use client";

import type { ReactNode } from "react";
import { Info } from "lucide-react";

/* Dialog building blocks.

   Every dialog on the platform, Mark as Done, Replace Document, the review
   replies and every confirmation, is assembled from these three pieces, so they
   share one width, radius, shadow, header spacing, footer and typography.
   Nothing should sit directly on a dialog's background. */

/** Dialog header: eyebrow, title, optional description. */
export function DialogHead({ eyebrow, title, children }: { eyebrow?: string; title: string; children?: ReactNode }) {
  return (
    <header className="dlg-head">
      {eyebrow && <div className="dlg-eyebrow">{eyebrow}</div>}
      <h2 className="dlg-title">{title}</h2>
      {children && <p className="dlg-desc">{children}</p>}
    </header>
  );
}

/**
 * A section inside a dialog. The optional `hint` renders the small information
 * row that belongs with the field, inside the card rather than floating above
 * it on the dialog background.
 */
export function DialogCard({ title, hint, children, tone = "plain" }: {
  title?: string;
  hint?: ReactNode;
  /** Optional: a card may carry only a hint, e.g. an upload instruction. */
  children?: ReactNode;
  tone?: "plain" | "quiet";
}) {
  return (
    <section className={`dlg-card${tone === "quiet" ? " quiet" : ""}`}>
      {title && <div className="dlg-card-title">{title}</div>}
      {hint && <p className="dlg-hint"><Info size={14} />{hint}</p>}
      {children}
    </section>
  );
}

/** Dialog footer: secondary action on the left, primary on the right. */
export function DialogFoot({ children }: { children: ReactNode }) {
  return <footer className="dlg-foot">{children}</footer>;
}

export default DialogCard;
