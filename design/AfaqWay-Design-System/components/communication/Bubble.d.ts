import type { CSSProperties, ReactNode } from "react";

/**
 * The chat bubble family — advisor ↔ student messages. BubbleGroup stacks one
 * sender's consecutive messages; Bubble picks alignment; BubbleContent is the
 * rounded-3xl fill (seven tones); BubbleReactions overlaps a small reaction
 * pill on the bubble's corner.
 *
 * @startingPoint section="Communication" subtitle="Chat message bubbles — 7 tones, start/end align" viewport="700x300"
 */
export interface BubbleGroupProps { children?: ReactNode; style?: CSSProperties }
export function BubbleGroup(props: BubbleGroupProps): JSX.Element;

export type BubbleVariant = "default" | "secondary" | "muted" | "tinted" | "outline" | "ghost" | "destructive";

export interface BubbleProps {
  variant?: BubbleVariant;
  /** "start" (received, left) or "end" (mine, right). Default "start". */
  align?: "start" | "end";
  children?: ReactNode;
  style?: CSSProperties;
}
export function Bubble(props: BubbleProps): JSX.Element;

export interface BubbleContentProps {
  variant?: BubbleVariant;
  children?: ReactNode;
  style?: CSSProperties;
}
export function BubbleContent(props: BubbleContentProps): JSX.Element;

export interface BubbleReactionsProps {
  side?: "top" | "bottom";
  align?: "start" | "end";
  children?: ReactNode;
  style?: CSSProperties;
}
export function BubbleReactions(props: BubbleReactionsProps): JSX.Element;
