import React, { useState, useRef, useEffect } from "react";

/* AfaqWay Accordion — the platform's expander (FAQ, support). Height is measured
   then animated, returning to auto so long answers reflow. Collapsed panels are
   inert. Ported from Accordion.tsx. */

const IChevronDown = ({ s = 17 }) => (<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6" /></svg>);
const IChevronUp = ({ s = 17 }) => (<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 15l-6-6-6 6" /></svg>);

function Row({ item, open, onToggle }) {
  const panel = useRef(null);
  const [height, setHeight] = useState(0);
  useEffect(() => {
    const el = panel.current;
    if (!el) return;
    if (open) {
      setHeight(el.scrollHeight);
      const done = () => setHeight("auto");
      el.addEventListener("transitionend", done, { once: true });
      return () => el.removeEventListener("transitionend", done);
    }
    setHeight(el.scrollHeight);
    const frame = requestAnimationFrame(() => setHeight(0));
    return () => cancelAnimationFrame(frame);
  }, [open]);
  return (
    <div className={`acc-item${open ? " open" : ""}`}>
      <h3 className="acc-h">
        <button type="button" className="acc-trigger" onClick={onToggle} aria-expanded={open}>
          <span className="acc-q">{item.question}</span>
          <span className="acc-chev">{open ? <IChevronUp /> : <IChevronDown />}</span>
        </button>
      </h3>
      <div ref={panel} className="acc-panel" role="region" style={{ height: height === "auto" ? "auto" : height }} inert={!open ? "" : undefined}>
        <div className="acc-a">{item.answer}</div>
      </div>
    </div>
  );
}

export function Accordion({ items = [], defaultOpen = 0, multiple }) {
  const [open, setOpen] = useState(defaultOpen >= 0 ? [defaultOpen] : []);
  const toggle = (i) => setOpen((cur) => {
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
