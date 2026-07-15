/**
 * AfaqWay button — indigo primary, outlined ghost, neutral, destructive red.
 * @startingPoint section="Primitives" subtitle="Primary / ghost / neutral / destructive" viewport="700x150"
 */
export interface ButtonProps {
  /** primary | ghost | neutral | destructive. Default primary */
  variant?: 'primary' | 'ghost' | 'neutral' | 'destructive';
  /** md (40px, compact UI) | lg (44px, form-flow CTAs). Default md */
  size?: 'md' | 'lg';
  /** Optional 18px leading icon element */
  icon?: React.ReactNode;
  disabled?: boolean;
  onClick?: () => void;
  children?: React.ReactNode;
  style?: React.CSSProperties;
}
export declare function Button(props: ButtonProps): JSX.Element;