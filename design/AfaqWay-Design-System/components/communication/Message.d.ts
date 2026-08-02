import type { CSSProperties, ReactNode } from "react";

/**
 * The message row wrapper around `<Bubble>`: an avatar, a content column (for
 * `<Bubble>`/`<BubbleContent>`), and header/footer meta rows (sender name,
 * timestamp). `MessageGroup` stacks one sender's consecutive messages under a
 * single avatar.
 *
 * @startingPoint section="Communication" subtitle="Message row — avatar + bubble + meta" viewport="700x260"
 */
export interface MessageGroupProps { children?: ReactNode; style?: CSSProperties }
export function MessageGroup(props: MessageGroupProps): JSX.Element;

export interface MessageProps {
  /** "start" (received, avatar+bubble left) or "end" (mine, right). */
  align?: "start" | "end";
  children?: ReactNode;
  style?: CSSProperties;
}
export function Message(props: MessageProps): JSX.Element;

export interface MessageAvatarProps { children?: ReactNode; style?: CSSProperties }
export function MessageAvatar(props: MessageAvatarProps): JSX.Element;

export interface MessageContentProps { align?: "start" | "end"; children?: ReactNode; style?: CSSProperties }
export function MessageContent(props: MessageContentProps): JSX.Element;

export interface MessageHeaderProps { children?: ReactNode; style?: CSSProperties }
export function MessageHeader(props: MessageHeaderProps): JSX.Element;

export interface MessageFooterProps { align?: "start" | "end"; children?: ReactNode; style?: CSSProperties }
export function MessageFooter(props: MessageFooterProps): JSX.Element;
