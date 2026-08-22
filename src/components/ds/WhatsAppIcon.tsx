/* The WhatsApp glyph, in one place.

   It was drawn inline in the marketing footer, and the plan step needed the
   same mark — which is exactly the point a second copy starts drifting from
   the first. Brand colour is never baked in: it draws in `currentColor`, so
   each surface tints it from its own palette. */
export function WhatsAppIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M3.5 20.5l1.3-4.2A8 8 0 1 1 8 19.4l-4.5 1.1z" />
      <path d="M9 9.2c.2-.6.4-.6.7-.6h.5c.2 0 .4 0 .6.5l.7 1.6c.1.2 0 .4-.1.5l-.5.6c-.1.1-.2.3-.1.5.3.6 1.3 1.7 2.3 2.1.2.1.4.1.5-.1l.5-.6c.2-.2.3-.2.5-.1l1.5.8c.2.1.3.2.3.4 0 .5-.4 1.3-.8 1.5-.5.3-1.4.5-3-.2-2-.9-3.3-3-3.5-3.3-.1-.2-.9-1.3-.9-2.4 0-1.1.6-1.6.8-1.8z" fill="currentColor" stroke="none" />
    </svg>
  );
}

export default WhatsAppIcon;
