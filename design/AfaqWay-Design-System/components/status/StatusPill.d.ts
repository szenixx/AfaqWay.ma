/**
 * Uppercase status pill using the closed five-word vocabulary: Not started / Applied / Under review / Needs changes / Approved.
 * @startingPoint section="Status" subtitle="Text-form status, closed vocabulary" viewport="700x150"
 */
export interface StatusPillProps {
  /** not-started | applied | under-review | needs-changes | approved */
  status?: 'not-started' | 'applied' | 'under-review' | 'needs-changes' | 'approved';
  /** Override label — only for the canonical word set */
  children?: React.ReactNode;
}
export declare function StatusPill(props: StatusPillProps): JSX.Element;