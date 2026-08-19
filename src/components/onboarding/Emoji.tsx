import type { EmojiName } from "@/lib/onboarding/emoji";

/* iOS-style emoji, rendered as an image rather than a text glyph.

   A text emoji is drawn by whatever emoji font the reader's OS ships — Segoe on
   Windows, Noto on Android, Apple's on a Mac — so the same screen would carry
   three different illustration styles depending on who opens it. These are
   Apple's own artwork, self-hosted, so every student sees one set.

   Assets come from scripts/build-emoji.mjs; add a name to
   src/lib/onboarding/emojiMap.json and re-run it. */
export function Emoji({ name, size = 28, className }: { name: EmojiName; size?: number; className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/emoji/${name}.png`}
      alt=""
      aria-hidden
      draggable={false}
      width={size}
      height={size}
      className={className}
      style={{ width: size, height: size, flex: "none", objectFit: "contain" }}
    />
  );
}

export type { EmojiName };
