"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { t as translate, type OnbLang } from "./darija";

/* Which language the onboarding is being read in.

   Scoped to the onboarding on purpose. This is not a platform-wide i18n layer:
   the rest of the product is still English-only, and pretending otherwise by
   putting the choice on <html> would leave a student reading Darija here and
   English the moment they land in the workspace.

   The choice is remembered, because a student who switches to Darija on the
   first question and then reloads has not changed their mind about which
   language they read. */

const KEY = "afaqway.onb.lang";

type Ctx = { lang: OnbLang; setLang: (l: OnbLang) => void; t: (s: string | undefined | null) => string };

const LangCtx = createContext<Ctx>({ lang: "en", setLang: () => {}, t: (s) => s ?? "" });

export function LangProvider({ children }: { children: React.ReactNode }) {
  /* Read once, lazily, rather than in an effect: an effect would render the
     English pass first and visibly re-flow the whole card to Darija. */
  const [lang, setLangState] = useState<OnbLang>(() => {
    if (typeof window === "undefined") return "en";
    try {
      return window.localStorage.getItem(KEY) === "ar" ? "ar" : "en";
    } catch {
      return "en"; // private mode, or storage blocked. English is the safe default.
    }
  });

  const setLang = useCallback((l: OnbLang) => {
    setLangState(l);
    try { window.localStorage.setItem(KEY, l); } catch { /* not worth failing a language switch over */ }
  }, []);

  const value = useMemo<Ctx>(
    () => ({ lang, setLang, t: (s) => translate(lang, s) }),
    [lang, setLang],
  );

  return <LangCtx.Provider value={value}>{children}</LangCtx.Provider>;
}

export const useLang = () => useContext(LangCtx);

/** The translator alone, for the common case of a component that only reads. */
export const useT = () => useContext(LangCtx).t;

/* A sentence that contains a link or a button.

   The review translated these as WHOLE sentences, which is the only way to get
   Darija's clause order right, so the markup can no longer be built by
   concatenating three fragments around a link. This takes the finished sentence
   and the phrases inside it that need to be interactive, and splits one out of
   the other. A phrase that is not found is simply skipped, so a wording change
   degrades to plain text rather than to a crash. */
export function withLinks(
  sentence: string,
  parts: { phrase: string; render: (text: string) => React.ReactNode }[],
): React.ReactNode[] {
  let rest: React.ReactNode[] = [sentence];
  for (const { phrase, render } of parts) {
    if (!phrase) continue;
    rest = rest.flatMap((node) => {
      if (typeof node !== "string") return [node];
      const at = node.indexOf(phrase);
      if (at === -1) return [node];
      return [node.slice(0, at), render(phrase), node.slice(at + phrase.length)];
    });
  }
  return rest.filter((n) => n !== "").map((n, i) => <span key={i}>{n}</span>);
}
