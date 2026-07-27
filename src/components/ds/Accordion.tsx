"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";

/* The platform's accordion.

   Height cannot be animated from `auto`, so the panel is measured and the
   measurement is animated: open sets the panel to its scroll height, then to
   `auto` once the transition ends, so long answers still reflow if the window
   is resized. Closing measures back down to zero.

   Built on ds.css like every other control; nothing here depends on a utility
   framework. */

export type AccordionItem = { id?: string; question: ReactNode; answer: ReactNode };

function Row({ item, open, onToggle }: { item: AccordionItem; open: boolean; onToggle: () => void }) {
  const panel = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number | "auto">(0);
  const id = useId();

  useEffect(() => {
    const el = panel.current;
    if (!el) return;

    if (open) {
      setHeight(el.scrollHeight);
      // Once expanded, hand height back to the content so it can reflow.
      const done = () => setHeight("auto");
      el.addEventListener("transitionend", done, { once: true });
      return () => el.removeEventListener("transitionend", done);
    }

    // Closing from `auto` needs a concrete starting height for one frame.
    setHeight(el.scrollHeight);
    const frame = requestAnimationFrame(() => setHeight(0));
    return () => cancelAnimationFrame(frame);
  }, [open]);

  return (
    <div className={`acc-item${open ? " open" : ""}`}>
      <h3 className="acc-h">
        <button
          type="button" className="acc-trigger" onClick={onToggle}
          aria-expanded={open} aria-controls={`${id}-panel`} id={`${id}-trigger`}
        >
          <span className="acc-q">{item.question}</span>
          <span className="acc-chev"><ChevronDown size={17} /></span>
        </button>
      </h3>
      <div
        ref={panel} className="acc-panel" role="region"
        id={`${id}-panel`} aria-labelledby={`${id}-trigger`}
        style={{ height: height === "auto" ? "auto" : height }}
        // Collapsed content stays out of the tab order and off the a11y tree.
        inert={!open}
      >
        <div className="acc-a">{item.answer}</div>
      </div>
    </div>
  );
}

export function Accordion({ items, defaultOpen = 0, multiple }: {
  items: AccordionItem[];
  /** Index open on first render; pass -1 for all closed. */
  defaultOpen?: number;
  /** Allow several rows open at once. */
  multiple?: boolean;
}) {
  const [open, setOpen] = useState<number[]>(defaultOpen >= 0 ? [defaultOpen] : []);

  const toggle = (i: number) => setOpen((cur) => {
    if (cur.includes(i)) return cur.filter((n) => n !== i);
    return multiple ? [...cur, i] : [i];
  });

  return (
    <div className="acc">
      {items.map((item, i) => (
        <Row key={item.id ?? i} item={item} open={open.includes(i)} onToggle={() => toggle(i)} />
      ))}
    </div>
  );
}

export default Accordion;
