"use client";

/* Three AfaqWay service modules that happen to live on social platforms.

   Support · Student life · Learning. One card system, three purposes: the
   platform supplies the accent colour and the mark, AfaqWay supplies the
   typography, the spacing and the card itself. Each card is real markup all
   the way down — the generated artwork, when it arrives, is one decorative
   layer inside it and nothing else.

   Access: the Learning Center is a paid surface. `unlocked` is the student's
   real subscription state, and a locked card still sells what is behind it
   rather than pretending it does not exist. */

import { Lock } from "lucide-react";
import { CardSwap } from "@/components/godui/card-swap";
import { socialLink } from "@/lib/socialLinks";

/* ── Brand marks ──────────────────────────────────────────────────────────
   Inline rather than an icon package: this lucide build ships no brand
   glyphs, and these four are the only ones the platform needs. Each is a
   single path on a 24-box that takes `currentColor`, so the card's accent
   drives it the same way every other icon here works. */

function WhatsAppMark(props: { size?: number }) {
  const s = props.size ?? 18;
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor" aria-hidden focusable="false">
      <path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.25-.46-2.38-1.47-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.61-.92-2.21-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.06 2.88 1.21 3.08c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.62.71.23 1.36.2 1.87.12.57-.09 1.76-.72 2.01-1.41.25-.7.25-1.29.17-1.42-.07-.13-.27-.2-.57-.35z" />
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.46 1.32 4.96L2 22l5.25-1.38a9.86 9.86 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91S17.5 2 12.04 2zm0 18.15h-.01a8.2 8.2 0 0 1-4.18-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.17 8.17 0 0 1-1.25-4.38c0-4.54 3.7-8.23 8.24-8.23 2.2 0 4.27.86 5.82 2.42a8.18 8.18 0 0 1 2.41 5.82c0 4.54-3.69 8.23-8.24 8.23z" />
    </svg>
  );
}

function InstagramMark(props: { size?: number }) {
  const s = props.size ?? 18;
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor" aria-hidden focusable="false">
      <path d="M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41-.56-.22-.96-.48-1.38-.9-.42-.42-.68-.82-.9-1.38-.16-.42-.36-1.06-.41-2.23C2.17 15.58 2.16 15.2 2.16 12s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41C8.42 2.17 8.8 2.16 12 2.16zM12 0C8.74 0 8.33.01 7.05.07 5.78.13 4.9.33 4.14.63c-.79.3-1.46.71-2.13 1.38C1.34 2.68.93 3.35.63 4.14.33 4.9.13 5.78.07 7.05.01 8.33 0 8.74 0 12s.01 3.67.07 4.95c.06 1.27.26 2.15.56 2.91.3.79.71 1.46 1.38 2.13.67.67 1.34 1.08 2.13 1.38.76.3 1.64.5 2.91.56C8.33 23.99 8.74 24 12 24s3.67-.01 4.95-.07c1.27-.06 2.15-.26 2.91-.56.79-.3 1.46-.71 2.13-1.38.67-.67 1.08-1.34 1.38-2.13.3-.76.5-1.64.56-2.91.06-1.28.07-1.69.07-4.95s-.01-3.67-.07-4.95c-.06-1.27-.26-2.15-.56-2.91-.3-.79-.71-1.46-1.38-2.13C21.32 1.34 20.65.93 19.86.63 19.1.33 18.22.13 16.95.07 15.67.01 15.26 0 12 0z" />
      <path d="M12 5.84a6.16 6.16 0 1 0 0 12.32 6.16 6.16 0 0 0 0-12.32zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8z" />
      <circle cx="18.41" cy="5.59" r="1.44" />
    </svg>
  );
}

function TikTokMark(props: { size?: number }) {
  const s = props.size ?? 18;
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor" aria-hidden focusable="false">
      <path d="M16.6 5.82a4.28 4.28 0 0 1-1.03-2.82h-3.1v12.4a2.6 2.6 0 0 1-2.6 2.5 2.6 2.6 0 1 1 .72-5.1V9.62a5.72 5.72 0 0 0-.72-.05A5.72 5.72 0 1 0 15.6 15.3V9.01a7.35 7.35 0 0 0 4.3 1.38V7.3a4.3 4.3 0 0 1-3.3-1.48z" />
    </svg>
  );
}

function YouTubeMark(props: { size?: number }) {
  const s = props.size ?? 18;
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor" aria-hidden focusable="false">
      <path d="M23.5 6.19a3.02 3.02 0 0 0-2.12-2.14C19.5 3.55 12 3.55 12 3.55s-7.5 0-9.38.5A3.02 3.02 0 0 0 .5 6.19C0 8.08 0 12 0 12s0 3.92.5 5.81a3.02 3.02 0 0 0 2.12 2.14c1.88.5 9.38.5 9.38.5s7.5 0 9.38-.5a3.02 3.02 0 0 0 2.12-2.14C24 15.92 24 12 24 12s0-3.92-.5-5.81zM9.55 15.57V8.43L15.82 12l-6.27 3.57z" />
    </svg>
  );
}

/* ── One card ─────────────────────────────────────────────────────────────
   The artwork slot is `art`, and it is a PAIR: the two card shapes are
   different enough that one drawing cannot serve both. Desktop is a narrow
   column, so its render is a compact square cluster; a phone card is full
   width and short, so its render is a wide two-object spread with more air.
   Neither is a crop of the other.

   Still optional: an undefined slot renders no image at all, so a card is
   never left pointing at a file that does not exist. */

type Art = {
  /** Square cutout for the three-up column and the deck. */
  desktop: string;
  /** Wide cutout for the full-width phone card. */
  mobile: string;
};

type Action = {
  key: string;
  label: string;
  icon: React.ReactNode;
  href: string | null;
  onClick?: () => void;
};

function SocialCard({ tone, marks, platform, title, body, art, actions, locked }: {
  tone: "whatsapp" | "social" | "youtube";
  /* One framed badge per platform: two marks sharing a frame read as a
     collision, two frames side by side read as a set. */
  marks: React.ReactNode[];
  platform: string;
  title: string;
  body: string;
  art?: Art;
  actions: Action[];
  locked?: { note: string; label: string; onClick: () => void };
}) {
  return (
    <section className={`dxs-card dxs-${tone}`}>
      {art && (
        /* Decorative only, and untouchable: every button sits above it.
           <picture> rather than a CSS background so the browser picks the
           right render at the breakpoint itself, downloads only that one, and
           still gets to lazy-load it. No JS, no second request.

           No aria-hidden on the <picture>: it is not an a11y-tree element, and
           the empty alt on the image is what actually marks this decorative. */
        <picture className="dxs-art">
          <source media="(max-width: 767px)" srcSet={art.mobile} type="image/webp" />
          <img src={art.desktop} alt="" loading="lazy" decoding="async" />
        </picture>
      )}

      <header className="dxs-head">
        <span className="dxs-marks" aria-hidden>
          {marks.map((m, i) => <span className="dxs-mark" key={i}>{m}</span>)}
        </span>
        <span className="dxs-platform">{platform}</span>
      </header>

      <h3 className="dxs-title">{title}</h3>
      <p className="dxs-body">{body}</p>

      {/* Two destinations share a row; one keeps the full width. The flag is
          on the container so the CSS never has to count children. */}
      <div className="dxs-actions" data-pair={(!locked && actions.length > 1) || undefined}>
        {locked ? (
          <>
            <p className="dxs-locked"><Lock size={13} aria-hidden />{locked.note}</p>
            <button type="button" className="dxs-cta" onClick={locked.onClick}>
              {locked.label}
            </button>
          </>
        ) : (
          actions.map((a) =>
            a.href ? (
              <a key={a.key} className="dxs-cta" href={a.href} target="_blank" rel="noopener noreferrer">
                <span className="dxs-cta-ico" aria-hidden>{a.icon}</span>
                <span className="dxs-cta-txt">{a.label}</span>
              </a>
            ) : (
              /* No link configured yet. Disabled and labelled, never a button
                 that looks live and does nothing when tapped. */
              <button key={a.key} type="button" className="dxs-cta is-soon" disabled
                title={`${a.label} is not linked yet`}>
                <span className="dxs-cta-ico" aria-hidden>{a.icon}</span>
                <span className="dxs-cta-txt">{a.label}</span>
                <span className="dxs-soon">Soon</span>
              </button>
            )
          )
        )}
      </div>
    </section>
  );
}

/* ── The section ──────────────────────────────────────────────────────────
   Two shapes, one set of cards. `deck` stacks them into the swapping deck the
   dashboard's last column holds — one platform at a time, retiring to the back
   every 4 seconds, in the order a student needs them: learn, then see, then
   ask. Without it they sit as a three-up row for any full-width surface.

   The deck pauses on hover, freezes under reduced motion and takes buried
   cards out of the tab order, so a rotating card never steals a CTA from
   under someone's cursor or drops a keyboard user onto an invisible button. */

export function SocialSection({ unlocked, onUpgrade, deck }: {
  /** Real subscription state: the Learning Center is a paid surface. */
  unlocked: boolean;
  /** Where a locked student goes to get access. */
  onUpgrade: () => void;
  /** Render as the swapping deck rather than a three-up row. */
  deck?: boolean;
}) {
  const youtube = (
    <SocialCard
      key="youtube"
      tone="youtube"
      platform="YouTube"
      marks={[<YouTubeMark key="yt" size={16} />]}
      title="AfaqWay Learning Center"
      art={{ desktop: "/assets/dashboard/card-youtube.webp", mobile: "/assets/dashboard/card-youtube-m.webp" }}
      body="Learn how to complete your study-abroad process from zero, step by step."
      actions={[{
        key: "yt",
        label: "Learning Center",
        icon: <YouTubeMark size={16} />,
        href: socialLink("youtube"),
      }]}
      locked={unlocked ? undefined : {
        note: "Included with a paid plan",
        label: "See plans",
        onClick: onUpgrade,
      }}
    />
  );

  const studentLife = (
    <SocialCard
      key="social"
      tone="social"
      platform="Instagram · TikTok"
      marks={[<InstagramMark key="ig" size={16} />, <TikTokMark key="tt" size={15} />]}
      title="Student Life Abroad"
      art={{ desktop: "/assets/dashboard/card-social.webp", mobile: "/assets/dashboard/card-social-m.webp" }}
      body="See real student experiences, tips, life abroad, and short videos from the AfaqWay community."
      actions={[
        { key: "tt", label: "TikTok", icon: <TikTokMark size={15} />, href: socialLink("tiktok") },
        { key: "ig", label: "Instagram", icon: <InstagramMark size={16} />, href: socialLink("instagram") },
      ]}
    />
  );

  const whatsapp = (
    <SocialCard
      key="whatsapp"
      tone="whatsapp"
      platform="WhatsApp"
      marks={[<WhatsAppMark key="wa" size={16} />]}
      title="WhatsApp Support"
      art={{ desktop: "/assets/dashboard/card-whats.webp", mobile: "/assets/dashboard/card-whats-m.webp" }}
      body="Need help? Talk to AfaqWay Support directly about your application, documents, admissions and residence procedures."
      actions={[{
        key: "wa",
        label: "WhatsApp Support",
        icon: <WhatsAppMark size={16} />,
        href: socialLink("whatsapp"),
      }]}
    />
  );

  if (deck) {
    return (
      <section className="dx-deck dxs-deck" aria-label="AfaqWay on social">
        <CardSwap className="dx-swap" interval={4000}>
          {youtube}
          {studentLife}
          {whatsapp}
        </CardSwap>
      </section>
    );
  }

  /* Full-width surfaces get all three at once: support first, because it is
     the one a student in trouble is looking for. */
  return <div className="dxs-row">{whatsapp}{studentLife}{youtube}</div>;
}

export default SocialSection;
