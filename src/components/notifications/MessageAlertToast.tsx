"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/reui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import type { Notification } from "@/lib/notifications";

/* The card raised when an advisor sends a message — reui's c-alert-19
   structure (logo · headline · message preview + View), the one thing
   sonnerNotify.ts swaps in for the plain icon toast every other notification
   kind still uses. Colours come from .afq-alert19 (admin-overview.css),
   which remaps reui's own tokens to AfaqWay's — the same scoping trick
   .afq-hui already uses for HeroUI — so the primitives are reui's, verbatim,
   and the palette is the platform's.

   Two rows, logo on the left spanning both:
     [logo]  New message from Advisor #104
     [logo]  "message preview…"                              [View]
   The View button sits at the end of the message row, not beside the
   headline — a deliberate departure from reui's own demo (which puts its
   action beside the title) because that is what reads best with a single
   action and no separate timestamp line. */

export function MessageAlertToast({ n, onView }: { n: Notification; onView: () => void }) {
  return (
    <div className="afq-alert19" style={{ width: "min(92vw, 392px)" }}>
      <Alert className="grid-cols-[32px_1fr] items-start gap-x-3" style={{ boxShadow: "0 18px 44px rgba(23,35,58,.16)" }}>
        {/* The exact mark StudentChat's own header uses for "who's answering"
            (BrandLogo variant="app" — see chat-brand-avatar in ds.css): the
            app icon carries its own blue field, so no tint sits behind it,
            same as there. */}
        <Avatar className="size-8 border">
          <AvatarImage src="/assets/brand/logo-app.webp" alt="AfaqWay" />
          <AvatarFallback className="bg-[var(--indigo-50)] text-[var(--indigo-600)]">AW</AvatarFallback>
        </Avatar>
        <AlertTitle className="truncate">{n.title}</AlertTitle>
        <AlertDescription className="flex! flex-row items-center justify-between gap-3">
          <span className="min-w-0 flex-1 truncate">{n.body}</span>
          <Button className="shrink-0" onClick={onView} size="xs">View</Button>
        </AlertDescription>
      </Alert>
    </div>
  );
}
