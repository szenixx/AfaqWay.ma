"use client";

/* Stepper — ported from @reui/stepper (reui.io / c-stepper-10), structure and
   states verbatim: StepperNav > StepperItem > StepperTrigger > (StepperIndicator
   + StepperSeparator), with completed/active/inactive/loading states and a
   swappable "completed" glyph via `indicators`. Controlled by `value`
   (no internal step state, no click-to-jump) — matches how the reference
   demo's data-state hooks work, minus the interactive tablist keyboard
   navigation Base UI's primitive adds, which this non-interactive progress
   indicator doesn't need. Recoloured onto the platform's own indigo/ink
   tokens; nothing here invents a new colour.

   INTENTIONAL DESIGN-SYSTEM EXCEPTION: this component keeps reui's own
   circle-indicator + connector-line structure rather than the platform's
   usual step-indicator shape, per explicit request — only mobile onboarding
   uses it (see .af-onboard-mobilesteps, hidden above 860px). */

import { createContext, useContext, type ReactNode } from "react";

type StepState = "active" | "completed" | "inactive" | "loading";

type StepperCtx = { value: number; reached: number; indicators: { completed?: ReactNode; loading?: ReactNode } };
const Ctx = createContext<StepperCtx | null>(null);
const useStepperCtx = () => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("Stepper.* must be used within <Stepper>");
  return ctx;
};

const ItemCtx = createContext<{ step: number; state: StepState } | null>(null);
const useItemCtx = () => {
  const ctx = useContext(ItemCtx);
  if (!ctx) throw new Error("StepperItem.* must be used within <StepperItem>");
  return ctx;
};

export function Stepper({ value, reached = value, indicators = {}, className, children }: {
  value: number;
  /** Furthest step visited so far. A step behind `value` but at or before
   *  `reached` still reads as completed after navigating back — the ported
   *  structure's own `value` alone can't express "visited, not current". */
  reached?: number;
  indicators?: { completed?: ReactNode; loading?: ReactNode };
  className?: string;
  children: ReactNode;
}) {
  return <Ctx.Provider value={{ value, reached, indicators }}><div className={className}>{children}</div></Ctx.Provider>;
}

export function StepperNav({ children }: { children: ReactNode }) {
  return <nav className="rst-nav" aria-hidden>{children}</nav>;
}

export function StepperItem({ step, loading = false, isLast, children }: {
  step: number; loading?: boolean; isLast: boolean; children: ReactNode;
}) {
  const { value, reached } = useStepperCtx();
  const state: StepState =
    loading && step === value ? "loading" :
    step === value ? "active" :
    step <= reached ? "completed" :
    "inactive";
  return (
    <ItemCtx.Provider value={{ step, state }}>
      <div className="rst-item" data-state={state} style={{ flex: isLast ? "none" : 1 }}>
        {children}
      </div>
    </ItemCtx.Provider>
  );
}

export function StepperIndicator() {
  const { indicators } = useStepperCtx();
  const { step, state } = useItemCtx();
  const glyph =
    state === "loading" ? (indicators.loading ?? step) :
    state === "completed" ? (indicators.completed ?? step) :
    step;
  return <span className="rst-indicator" data-state={state}>{glyph}</span>;
}

export function StepperSeparator({ isLast }: { isLast: boolean }) {
  const { state } = useItemCtx();
  if (isLast) return null;
  return <span className="rst-separator" data-state={state} />;
}
