import MAP from "./emojiMap.json";

/* One emoji vocabulary for the onboarding. The map is the single source the
   asset script reads too, so `node scripts/build-emoji.mjs` re-exports exactly
   the set named here into public/emoji/<name>.png. */
export const EMOJI_MAP = MAP;
export type EmojiName = keyof typeof MAP;
