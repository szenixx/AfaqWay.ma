/**
 * Circle-housed status icon — the platform's one icon signature. Tint background, status-line border, glyph inside.
 * @startingPoint section="Status" subtitle="Circle-housed status icon, 5 states" viewport="700x150"
 */
export interface StatusBadgeProps {
  /** not-started | applied | under-review | needs-changes | approved */
  status?: 'not-started' | 'applied' | 'under-review' | 'needs-changes' | 'approved';
  /** Badge diameter px, 28-32 typical. Default 32 */
  size?: number;
  /** Optional row label (13.5/500 ink) rendered right of the badge */
  label?: string;
  /** Optional caption under the label (12/400 faint) */
  caption?: string;
}
export declare function StatusBadge(props: StatusBadgeProps): JSX.Element;