"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import Link from "next/link";

/* MegaMenu — ported from the godui mega-menu motion: a highlight pill slides
   between triggers (layoutId spring) and the panel morphs its width/height
   between sections instead of unmounting. Structure and interaction are the
   source's; colour, radius, shadow and font all come from the design system
   tokens, not Tailwind defaults. */

export type MegaMenuLink = { label: string; href: string; description?: string; icon?: ReactNode };
export type MegaMenuSection = { heading?: string; links: MegaMenuLink[] };
export type MegaMenuItem = { label: string; href?: string; sections?: MegaMenuSection[] };

const linkStyle = { font: "600 14px/20px var(--font-sans)" } as const;

export function MegaMenu({ items, openDelay = 80, closeDelay = 140 }: { items: MegaMenuItem[]; openDelay?: number; closeDelay?: number }) {
  const reduceMotion = useReducedMotion();
  const highlightId = useId();
  const [active, setActive] = useState<number | null>(null);
  const [hovered, setHovered] = useState<number | null>(null);
  const openTimer = useRef<number | undefined>(undefined);
  const closeTimer = useRef<number | undefined>(undefined);
  const navRef = useRef<HTMLElement>(null);

  const spring = reduceMotion ? { duration: 0 } : ({ type: "spring", stiffness: 320, damping: 32, mass: 0.9 } as const);

  const scheduleOpen = (index: number) => {
    window.clearTimeout(closeTimer.current);
    setHovered(index);
    if (!items[index]?.sections) { setActive(null); return; }
    openTimer.current = window.setTimeout(() => setActive(index), openDelay);
  };
  const scheduleClose = () => {
    window.clearTimeout(openTimer.current);
    setHovered(null);
    closeTimer.current = window.setTimeout(() => setActive(null), closeDelay);
  };
  /* Touch devices have no hover/mouseleave, so a tap-opened panel needs an
     explicit way to close both by tapping its own trigger again and by
     tapping anywhere else — without this the panel could only ever open on
     a phone, never close. */
  const toggle = (index: number) => {
    window.clearTimeout(openTimer.current);
    window.clearTimeout(closeTimer.current);
    setHovered(null);
    setActive((cur) => (cur === index ? null : index));
  };
  useEffect(() => {
    if (active === null) return;
    const close = (e: MouseEvent) => { if (!navRef.current?.contains(e.target as Node)) setActive(null); };
    window.addEventListener("mousedown", close);
    return () => window.removeEventListener("mousedown", close);
  }, [active]);

  const highlight = hovered ?? active;
  const activeItem = active !== null ? items[active] : null;

  return (
    <nav ref={navRef} aria-label="Explore menu" style={{ position: "relative" }} onMouseLeave={scheduleClose}>
      <ul style={{ display: "flex", alignItems: "center", gap: 4, listStyle: "none", margin: 0, padding: 0 }}>
        {items.map((item, index) => {
          const hasPanel = !!item.sections;
          const isHot = highlight === index;
          const trigger = (
            <span className="af-navstroke" style={{ ...linkStyle, color: isHot ? "var(--ink)" : "var(--ink-soft)", cursor: "pointer" }}>
              {isHot && (
                <motion.span layoutId={highlightId} transition={spring} style={{ position: "absolute", inset: 0, borderRadius: 999, background: "var(--subtle)" }} />
              )}
              <span style={{ position: "relative" }}>{item.label}</span>
            </span>
          );
          return (
            <li key={item.label} style={{ position: "relative" }}>
              {hasPanel ? (
                <button type="button" aria-expanded={active === index} aria-haspopup="true" onMouseEnter={() => scheduleOpen(index)} onFocus={() => scheduleOpen(index)} onClick={() => toggle(index)} style={{ background: "none", border: "none", padding: 0, margin: 0, cursor: "pointer" }}>
                  {trigger}
                </button>
              ) : (
                <Link href={item.href ?? "/soon"} onMouseEnter={() => scheduleOpen(index)}>{trigger}</Link>
              )}
            </li>
          );
        })}
      </ul>

      <AnimatePresence>
        {activeItem?.sections && (
          <motion.div
            key="panel"
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
            transition={reduceMotion ? { duration: 0 } : { duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            onMouseEnter={() => window.clearTimeout(closeTimer.current)}
            style={{ position: "absolute", top: "calc(100% + 8px)", left: 0, zIndex: 30, borderRadius: 16, background: "var(--card)", border: "1px solid var(--line)", boxShadow: "0 18px 44px rgba(23,35,58,.16)", padding: 8, display: "flex", gap: 4, width: "max-content" }}
          >
            {activeItem.sections.map((section) => (
              <div key={section.heading ?? section.links[0]?.label} style={{ width: 220 }}>
                {section.heading && (
                  <p style={{ margin: 0, padding: "8px 12px 4px", font: "600 10.5px/14px var(--font-sans)", letterSpacing: ".06em", textTransform: "uppercase", color: "var(--ink-faint)" }}>{section.heading}</p>
                )}
                <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column" }}>
                  {section.links.map((link) => (
                    <li key={link.href}>
                      <Link href={link.href} onClick={() => { setActive(null); setHovered(null); }} style={{ display: "flex", alignItems: "flex-start", gap: 10, borderRadius: 12, padding: 10, textDecoration: "none" }}>
                        {link.icon && (
                          <span style={{ marginTop: 2, flex: "none", width: 30, height: 30, borderRadius: 9, background: "var(--indigo-tint)", color: "var(--indigo-600)", display: "flex", alignItems: "center", justifyContent: "center" }}>{link.icon}</span>
                        )}
                        <span style={{ display: "flex", flexDirection: "column" }}>
                          <span style={{ font: "600 13px/18px var(--font-sans)", color: "var(--ink)" }}>{link.label}</span>
                          {link.description && <span style={{ font: "400 11.5px/16px var(--font-sans)", color: "var(--ink-faint)" }}>{link.description}</span>}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

export default MegaMenu;
