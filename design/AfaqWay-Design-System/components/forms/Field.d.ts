/**
 * Labelled form field — subtle fill, 12px radius, indigo focus ring. Wraps input, select, or textarea.
 * @startingPoint section="Forms" subtitle="Input / select / textarea with label + hint" viewport="700x180"
 */
export interface FieldProps {
  /** Label above the field, 13/500 ink */
  label?: string;
  /** Optional-context marker appended in faint ink, e.g. "exactly as written in your passport" */
  optional?: string;
  /** Helper text below, 12/400 faint — explains what happens next */
  hint?: string;
  /** input | select | textarea. Default input */
  as?: 'input' | 'select' | 'textarea';
  /** Options for select / content for textarea */
  children?: React.ReactNode;
  placeholder?: string;
  value?: string;
  onChange?: (e: any) => void;
  type?: string;
  style?: React.CSSProperties;
}
export declare function Field(props: FieldProps): JSX.Element;