# Marketing UI kit — Homepage hero

A recreation of the AfaqWay **marketing homepage** hero (`src/components/home/`).
Open `index.html`.

## What it shows
- **Pill nav** — floating rounded bar: double-chevron glyph + "AfaqWay" wordmark,
  text links, indigo Sign-up button.
- **Animated grid** background, radially masked.
- **Floating glass widgets** — a journey-progress card, a timetable card, and
  app-icon tiles, each drifting on `floatY`. Hidden below 1080px and under
  reduced motion.
- **Center stack** — the animated double-chevron, the headline *"Study abroad,
  guided every step of the way."*, the subhead, and the shimmer CTA + ghost
  button.
- **Trust marquee** — university names scrolling, edge-masked, with the
  positioning line *"AfaqWay is built for students, not agencies."*

## How it's built
Self-contained HTML on the design-system tokens (`styles.css`) with inline
styles + a small `<style>` for keyframes — it does not depend on the component
bundle, so it renders standalone. Icons are inline lucide-shaped SVGs.
