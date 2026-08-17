"use client";

import { useEffect, useState } from "react";
import { MonitorSmartphone, X } from "lucide-react";

/* "This works better on a bigger screen."

   Phone-only: the workspace is usable on a phone, but the journey —
   reading a step, watching its video, uploading documents — is genuinely
   easier on a wider screen, and a student who never learns that just has a
   worse time silently.

   Dismissable, but only for the session. sessionStorage (not local) is the
   whole mechanism: it survives navigation and refreshes, so the advice
   doesn't nag someone who has already read it, and it is gone by the next
   sign-in — DEVICE_ADVICE_KEY is cleared on sign-out too, so logging out
   and back in inside the same tab brings it back as well.

   Bilingual, with the Arabic scoped in its own dir="rtl" lang="ar" span,
   the same way the onboarding note does it. That is the established
   pattern here for a single Arabic line inside an otherwise LTR layout;
   the page direction is deliberately untouched. */

export const DEVICE_ADVICE_KEY = "af.deviceAdvice.dismissed";

export function DeviceAdvice() {
  /* Starts hidden and reveals after mount: the dismissed flag lives in
     sessionStorage, which the server cannot read, so rendering it visible
     first would flash the advice at someone who had already closed it. */
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      if (sessionStorage.getItem(DEVICE_ADVICE_KEY) !== "1") setShow(true);
    } catch {
      setShow(true); // storage blocked — showing it is the safer default
    }
  }, []);

  if (!show) return null;

  const dismiss = () => {
    setShow(false);
    try { sessionStorage.setItem(DEVICE_ADVICE_KEY, "1"); } catch { /* storage blocked */ }
  };

  return (
    <aside className="dvc-advice" role="note">
      <span className="dvc-advice-ico" aria-hidden>
        <span className="dvc-advice-ping" />
        <MonitorSmartphone size={15} />
      </span>
      <span className="dvc-advice-text">
        <span className="dvc-advice-en">
          For a smoother journey, we recommend a desktop, laptop or tablet.
        </span>
        <span className="dvc-advice-ar" dir="rtl" lang="ar">
          لتجربة أسهل، ننصح باستخدام حاسوب مكتبي أو محمول أو جهاز لوحي.
        </span>
      </span>
      <button type="button" className="dvc-advice-x" onClick={dismiss} aria-label="Dismiss this recommendation">
        <X size={15} />
      </button>
    </aside>
  );
}

export default DeviceAdvice;
