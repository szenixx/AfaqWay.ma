import React, { createContext, useContext, useRef, useState, useEffect } from "react";

/* AfaqWay MorphingDialog — a card that expands in place into a full dialog
   (FLIP: the trigger's own rect is the animation's start point). Use on
   dashboard cards (university, program, document…) that open into detail. */

const Ctx = createContext(null);

export function MorphingDialog({ children }) {
  const [open, setOpen] = useState(false);
  const [rect, setRect] = useState(null);
  return <Ctx.Provider value={{ open, setOpen, rect, setRect }}>{children}</Ctx.Provider>;
}

export function MorphingDialogTrigger({ children, className = "", style, onClick }) {
  const ref = useRef(null);
  const ctx = useContext(Ctx);
  return (
    <div
      ref={ref}
      className={`mdlg-trigger ${className}`.trim()}
      style={{ cursor: "pointer", ...style }}
      onClick={(e) => {
        onClick && onClick(e);
        const r = ref.current.getBoundingClientRect();
        ctx.setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
        ctx.setOpen(true);
      }}
    >
      {children}
    </div>
  );
}

export function MorphingDialogContent({ children, className = "", style }) {
  const ctx = useContext(Ctx);
  const [phase, setPhase] = useState("start"); // start → open → closing
  useEffect(() => {
    if (ctx.open) {
      const id = requestAnimationFrame(() => setPhase("open"));
      return () => cancelAnimationFrame(id);
    }
  }, [ctx.open]);
  useEffect(() => {
    if (!ctx.open) return;
    const onEsc = (e) => { if (e.key === "Escape") close(); };
    document.addEventListener("keydown", onEsc);
    return () => document.removeEventListener("keydown", onEsc);
  }, [ctx.open]);
  if (!ctx.open || !ctx.rect) return null;
  const r = ctx.rect;
  const close = () => { setPhase("start"); ctx.setOpen(false); };
  const startStyle = { top: r.top, left: r.left, width: r.width, height: r.height, borderRadius: "var(--radius-2xl)" };
  const openStyle = { top: "50%", left: "50%", width: "min(90vw, 28rem)", height: "auto", maxHeight: "80vh", transform: "translate(-50%,-50%)", borderRadius: "var(--radius-dialog)" };
  return (
    <Ctx.Provider value={{ ...ctx, close }}>
      <div className="mdlg-overlay" onClick={close}>
        <div
          className={`mdlg-popup ${className}`.trim()}
          style={{ position: "fixed", ...(phase === "open" ? openStyle : startStyle), transition: "all 320ms var(--ease)", overflow: "auto", ...style }}
          onClick={(e) => e.stopPropagation()}
        >
          {children}
        </div>
      </div>
    </Ctx.Provider>
  );
}

export function MorphingDialogClose({ children }) {
  const ctx = useContext(Ctx);
  return (
    <button type="button" className="mdlg-close" aria-label="Close" onClick={() => ctx.close()}>
      {children || <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>}
    </button>
  );
}
