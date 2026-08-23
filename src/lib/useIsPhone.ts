"use client";

import { useEffect, useState } from "react";

/* 767px is the platform's one mobile boundary (see the responsive contract at
   the top of globals.css). Read on the first render rather than in an effect,
   so a phone never gets a frame of the desktop branch first. Safe here because
   every surface using it renders behind a client-side load gate. */
export function useIsPhone(): boolean {
  const [phone, setPhone] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches,
  );
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const sync = () => setPhone(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);
  return phone;
}
