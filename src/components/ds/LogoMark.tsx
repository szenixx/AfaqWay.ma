/* The AfaqWay mark: two chevrons, the brand's own glyph.

   Lives in the design system because it is used platform-wide (admin, about,
   legal documents, the student workspace, onboarding). The gentle chevron drift
   comes from `.af-logo-chev1` / `.af-logo-chev2` in globals.css. */
export function LogoMark({ size = 30, color = "var(--indigo-600)" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 96 96" style={{ color }} aria-hidden>
      <g fill="none" stroke="currentColor" strokeWidth="13" strokeLinecap="square" strokeLinejoin="miter">
        <path className="af-logo-chev1" d="M29 28 48 45 67 28" />
        <path className="af-logo-chev2" d="M29 54 48 71 67 54" />
      </g>
    </svg>
  );
}

export default LogoMark;
