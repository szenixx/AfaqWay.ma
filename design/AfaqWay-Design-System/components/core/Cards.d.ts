import type { CSSProperties, ReactNode } from "react";

/**
 * The five card roles — every item on the platform is one of these. Use one; do
 * not invent a sixth. FeatureCard (image + action), InfoCard (thumbnail + meta),
 * CompactCard (dense row), StatCard (metric tile), ActionCard (next-step prompt).
 *
 * @startingPoint section="Core" subtitle="Feature / Info / Compact / Stat / Action" viewport="760x420"
 */

export interface FeatureCardProps {
  image?: string;
  /** Drawn cover (map, flag, illustration) when there's no photo. */
  imageNode?: ReactNode;
  badge?: string;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  bookmarked?: boolean;
  onBookmark?: () => void;
  style?: CSSProperties;
}
export function FeatureCard(props: FeatureCardProps): JSX.Element;

export interface InfoCardProps {
  thumbnail?: ReactNode;
  title: string;
  supporting?: string;
  /** Quiet metadata row (city, tuition, language…). */
  meta?: string[];
  actionLabel?: string;
  onAction?: () => void;
  style?: CSSProperties;
}
export function InfoCard(props: InfoCardProps): JSX.Element;

export interface CompactCardProps {
  icon: ReactNode;
  title: string;
  description?: string;
  onClick?: () => void;
  style?: CSSProperties;
}
export function CompactCard(props: CompactCardProps): JSX.Element;

export interface StatCardProps {
  value: string | number;
  title: string;
  icon: ReactNode;
  /** Accent colour for the top rule + icon tile. Default indigo. */
  accent?: string;
  trend?: { value: string; up: boolean };
  sub?: string;
  className?: string;
  style?: CSSProperties;
}
export function StatCard(props: StatCardProps): JSX.Element;

export interface ActionCardProps {
  icon: ReactNode;
  title: string;
  description?: string;
  ctaLabel: string;
  onAction?: () => void;
  style?: CSSProperties;
}
export function ActionCard(props: ActionCardProps): JSX.Element;
