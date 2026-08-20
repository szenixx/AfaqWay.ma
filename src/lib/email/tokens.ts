/* Email design tokens — the same AfaqWay brand values as src/app/ds.css, but
 * as literal hex/px. Email clients strip <style> blocks and don't resolve
 * CSS custom properties, so every colour, radius and font here has to be a
 * plain value inlined by React Email, not a var(--token) reference. Keep
 * these in sync with ds.css by hand if the brand palette ever changes —
 * there's no way to share the source of truth across a browser stylesheet
 * and a table-based HTML email. */

export const emailColors = {
  /* Brand triad, mirroring ds.css: primary #2E3BC7, secondary white (`card`
   * below), tertiary #1C328B for deep accents and gradient ends. */
  indigo600: "#2E3BC7",
  indigo500: "#424ED4",
  indigoTint: "#E1E3F9",
  indigoLine: "#B3B8ED",
  tertiary: "#1C328B",
  ink: "#17233A",
  inkSoft: "#5A6B85",
  inkFaint: "#8695AB",
  card: "#FFFFFF",
  page: "#ECEFF3",
  footerBg: "#F3F5F9",
  line: "#DCE2EA",
  lineSoft: "#E7ECF1",
  green: "#256B49",
  greenTint: "#E3F0E9",
  greenLine: "#9CCBB2",
  red: "#B23B27",
  redTint: "#FBE7E2",
  redLine: "#EDB3A6",
  amber: "#8A5A0C",
  amberTint: "#FBF0DA",
  amberLine: "#E7C583",
  grey: "#8695AB",
  greyTint: "#F1F4F7",
  greyLine: "#DCE2EA",
} as const;

export const emailFont =
  "'Helvetica Neue',Helvetica,Arial,sans-serif";

export const emailRadius = {
  sm: 8,
  md: 14,
  lg: 20,
  pill: 999,
} as const;

/** 600px is the long-standing safe max width for HTML email across clients. */
export const EMAIL_WIDTH = 600;
