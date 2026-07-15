/**
 * 60px flat top bar: wordmark, subtle search, bell + messages with unread dots, divider, profile module with dropdown.
 * @startingPoint section="Chrome" subtitle="Flat 60px bar with profile dropdown" viewport="700x220"
 */
export interface TopBarProps {
  /** User display name */
  name?: string;
  /** Role line under the name */
  role?: string;
  /** Avatar image URL; initials fallback */
  avatar?: string;
  unreadBell?: boolean;
  unreadMail?: boolean;
  /** Render with the profile dropdown open */
  defaultOpen?: boolean;
}
export declare function TopBar(props: TopBarProps): JSX.Element;