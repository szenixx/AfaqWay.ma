"use client";

import { useEffect, useRef, useState, type FormEvent, type MouseEvent } from "react";
import { useRouter } from "next/navigation";
import { Button, Field, Divider, Icon, GoogleIcon } from "@/components/ds";
import { StatusCircle, IconCheck, IconClock } from "@/components/home/ui";
import { supabase } from "@/lib/supabase/client";

const POST_AUTH = "/dashboard";

/* Node = the numbered circle's own position. Bubble = the text card's position,
   placed independently so it can sit on whichever side has room. Together the
   nodes form a winding "way" that gets connected by an SVG path. */
const STEPS = [
  { n: 1, title: "Build your roadmap", desc: "Tell us about you and get a personalized step-by-step plan.", node: { left: 14, top: 16 }, bubble: { left: "22%", top: "12.5%" }, maxWidth: 230 },
  { n: 2, title: "Prepare your documents", desc: "Upload your files, get them checked before anything is sent.", node: { left: 62, top: 40 }, bubble: { left: "33%", top: "37%" }, maxWidth: 220 },
  { n: 3, title: "Track every deadline", desc: "Never miss an application, appointment, or renewal.", node: { left: 20, top: 74 }, bubble: { left: "28%", top: "71%" }, maxWidth: 230 },
];

/* A handful of the hero's outline icons, scattered as decorative background tiles. */
const SCATTER_ICONS: { name: string; left: string; top: string; delay: number }[] = [
  { name: "diploma", left: "45%", top: "6%", delay: 0.2 },
  { name: "passport", left: "81%", top: "22%", delay: 0.9 },
  { name: "document", left: "6%", top: "40%", delay: 1.4 },
  { name: "calendar", left: "45%", top: "60%", delay: 0.6 },
  { name: "payment", left: "72%", top: "82%", delay: 1.1 },
];

const glass = {
  background: "rgba(255,255,255,0.55)",
  backdropFilter: "blur(12px) saturate(1.5)",
  WebkitBackdropFilter: "blur(12px) saturate(1.5)",
  border: "1px solid rgba(255,255,255,0.6)",
} as const;

/* Liquid-glass, low-opacity frosted panels for the left-panel info widgets. */
const glassWidget = {
  background: "rgba(255,255,255,0.32)",
  backdropFilter: "blur(18px) saturate(1.6)",
  WebkitBackdropFilter: "blur(18px) saturate(1.6)",
  border: "1px solid rgba(255,255,255,0.55)",
  boxShadow: "0 12px 30px rgba(23,35,58,.14), inset 0 1px 0 rgba(255,255,255,.6)",
} as const;

const widgetEyebrow = { font: "600 10px/14px var(--font-sans)", letterSpacing: ".08em", textTransform: "uppercase" as const, color: "var(--ink-faint)" };

function AnimatedMark({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 96 96" style={{ color: "var(--indigo-600)" }} aria-hidden>
      <g fill="none" stroke="currentColor" strokeWidth="13" strokeLinecap="square" strokeLinejoin="miter">
        <path d="M29 28 48 45 67 28" style={{ animation: "afChev 2.2s cubic-bezier(.4,0,.2,1) infinite" }} />
        <path d="M29 54 48 71 67 54" style={{ animation: "afChev 2.2s cubic-bezier(.4,0,.2,1) .28s infinite" }} />
      </g>
    </svg>
  );
}

/* Static (non-animated) mark for the left panel, per user request. */
function StaticMark({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 96 96" style={{ color: "var(--indigo-600)" }} aria-hidden>
      <g fill="none" stroke="currentColor" strokeWidth="13" strokeLinecap="square" strokeLinejoin="miter">
        <path d="M29 28 48 45 67 28" />
        <path d="M29 54 48 71 67 54" />
      </g>
    </svg>
  );
}

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const textureRef = useRef<HTMLDivElement>(null);

  const isSignup = mode === "signup";

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("mode") === "signup") {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time UI sync from query param on mount
      setMode("signup");
    }
    if (params.get("reason") === "another-device") {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time UI sync from query param on mount
      setNotice("You were signed out because your account was opened on another device. Only one device can be signed in at a time.");
      return; // stay on the sign-in form; don't auto-redirect
    }
    // Already signed in? Skip the form and go straight to the workspace.
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) router.replace("/dashboard");
    })();
  }, [router]);

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  function switchMode(next: "login" | "signup") {
    setMode(next);
    setError(null);
    setNotice(null);
  }

  function onPanelMove(e: MouseEvent<HTMLDivElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    if (textureRef.current) textureRef.current.style.transform = `translate(${x * 26}px, ${y * 26}px)`;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    if (!emailValid) return setError("Enter a valid email address.");
    if (password.length < 6) return setError("Password must be at least 6 characters.");
    setLoading(true);
    try {
      // Go straight to onboarding (or the dashboard if already done) — no bounce
      // through the home / sign-in page.
      const routeAfterAuth = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { router.replace("/signup"); return; }
        const { data: prof } = await supabase.from("profiles").select("onboarding_completed_at").eq("id", user.id).maybeSingle();
        router.replace(prof?.onboarding_completed_at ? "/dashboard" : "/profile-setup");
      };
      if (!isSignup) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) setError(error.message);
        else await routeAfterAuth();
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}${POST_AUTH}` },
        });
        if (error) setError(error.message);
        else if (data.session) await routeAfterAuth();
        else {
          // Accounts are auto-confirmed, so log the user in right away instead of
          // waiting on a confirmation email.
          const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password });
          if (signInErr) setNotice("Your account is ready. Please log in to continue.");
          else await routeAfterAuth();
        }
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setError(null);
    setNotice(null);
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}${POST_AUTH}` },
    });
    if (error) {
      setError(error.message);
      setLoading(false);
    }
  }

  async function handleForgot() {
    setError(null);
    setNotice(null);
    if (!emailValid) return setError("Enter your email above first, then tap Forgot password.");
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/signup` });
    if (error) setError(error.message);
    else setNotice("Password reset link sent. Check your email.");
  }

  const footerPrefix = isSignup ? "Already have an account? " : "Don’t have an account? ";

  return (
    <div className="af-auth-main" style={{ height: "100vh", overflow: "hidden", background: "var(--paper)" }}>
      {/* ── Left panel ── */}
      <div className="af-auth-left" onMouseMove={onPanelMove} style={{ position: "relative", borderRadius: 16, overflow: "hidden", background: "var(--indigo-100)", backgroundImage: "url(/roadmap-panel.webp)", backgroundSize: "cover", backgroundPosition: "center" }}>
        {/* mouse-reactive texture */}
        <div ref={textureRef} aria-hidden style={{ position: "absolute", inset: -30, backgroundImage: "radial-gradient(rgba(43,76,155,.10) 1.2px, transparent 1.2px)", backgroundSize: "20px 20px", transition: "transform 140ms cubic-bezier(.4,0,.2,1)", pointerEvents: "none" }} />

        {/* logo + tagline, top-left, static (no motion), bigger */}
        <div style={{ position: "absolute", top: 24, left: 24, textAlign: "left", zIndex: 3 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
            <StaticMark size={34} />
            <span style={{ font: "700 24px/1 var(--font-sans)", color: "var(--ink)", letterSpacing: "-0.01em" }}>AfaqWay</span>
          </div>
          <div style={{ font: "500 13.5px/19px var(--font-sans)", color: "var(--ink-soft)", marginTop: 6 }}>We help you, every step of your journey.</div>
        </div>

        {/* connecting "way" between the 3 steps */}
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", zIndex: 1, pointerEvents: "none" }}>
          <path
            d={`M ${STEPS[0].node.left} ${STEPS[0].node.top} Q 42 8 ${STEPS[1].node.left} ${STEPS[1].node.top} Q 44 62 ${STEPS[2].node.left} ${STEPS[2].node.top}`}
            fill="none"
            stroke="var(--indigo-line)"
            strokeWidth="0.5"
            strokeDasharray="2 2.2"
            vectorEffect="non-scaling-stroke"
            style={{ animation: "afDashFlow 1.6s linear infinite" }}
          />
        </svg>

        {/* scattered outline icons (same glyph set as the homepage hero), dropping in */}
        {SCATTER_ICONS.map((ic, i) => (
          <div
            key={ic.name}
            aria-hidden
            style={{
              position: "absolute",
              left: ic.left,
              top: ic.top,
              width: 34,
              height: 34,
              borderRadius: 10,
              background: "rgba(255,255,255,0.5)",
              backdropFilter: "blur(6px)",
              WebkitBackdropFilter: "blur(6px)",
              border: "1px solid rgba(255,255,255,0.6)",
              boxShadow: "0 6px 14px rgba(23,35,58,.10)",
              color: "var(--indigo-600)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1,
              animation: `afDropIn .6s cubic-bezier(.4,0,.2,1) ${ic.delay}s both, afFloatY ${7 + i}s ease-in-out ${ic.delay + 0.6}s infinite`,
            }}
          >
            <Icon name={ic.name} size={16} />
          </div>
        ))}

        {/* 3 roadmap steps: node + independently-placed text bubble, varied positions */}
        {STEPS.map((s, i) => {
          const d = 0.35 + i * 0.28;
          return (
            <div key={s.n}>
              <div
                style={{
                  position: "absolute",
                  left: `${s.node.left}%`,
                  top: `${s.node.top}%`,
                  transform: "translate(-50%,-50%)",
                  width: 38,
                  height: 38,
                  borderRadius: 999,
                  background: "var(--indigo-600)",
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  font: "700 15px/1 var(--font-sans)",
                  border: "3px solid #fff",
                  boxShadow: "0 6px 16px rgba(43,76,155,.35)",
                  zIndex: 2,
                  animation: `afNodePop .5s cubic-bezier(.4,0,.2,1) ${d}s both`,
                }}
              >
                {s.n}
              </div>
              <div
                style={{
                  position: "absolute",
                  left: s.bubble.left,
                  top: s.bubble.top,
                  maxWidth: s.maxWidth,
                  ...glass,
                  borderRadius: 12,
                  padding: "10px 12px",
                  zIndex: 2,
                  animation: `afStepFade .5s cubic-bezier(.4,0,.2,1) ${d}s both, afFloatY ${6.5 + i}s ease-in-out ${d + 0.6}s infinite`,
                }}
              >
                <div style={{ font: "600 14px/19px var(--font-sans)", color: "var(--ink)" }}>{s.title}</div>
                <div style={{ font: "400 12px/17px var(--font-sans)", color: "var(--ink-soft)", marginTop: 2 }}>{s.desc}</div>
              </div>
            </div>
          );
        })}

        {/* floating widget A, "Your dossier" (medium), scattered near the top */}
        <div style={{ position: "absolute", top: "6%", right: "7%", width: 200, zIndex: 2, ...glassWidget, borderRadius: 14, padding: "12px 14px", animation: "afDropIn .6s cubic-bezier(.4,0,.2,1) .5s both, afFloatY 7.5s ease-in-out 1.1s infinite" }}>
          <div style={widgetEyebrow}>Your dossier</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
            <StatusCircle size={26} tone="green"><IconCheck size={14} /></StatusCircle>
            <span style={{ font: "500 12px/16px var(--font-sans)", color: "var(--ink)", flex: 1 }}>Passport</span>
            <span style={{ font: "600 10px/14px var(--font-sans)", color: "var(--green)" }}>Approved</span>
          </div>
          <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
            {["calendar", "passport", "diploma"].map((n) => (
              <span key={n} style={{ width: 30, height: 30, borderRadius: 8, background: "var(--indigo-100)", color: "var(--indigo-600)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon name={n} size={16} />
              </span>
            ))}
          </div>
        </div>

        {/* floating widget B, "Deadline" (small), scattered lower-left */}
        <div style={{ position: "absolute", left: "8%", top: "56%", width: 168, zIndex: 2, ...glassWidget, borderRadius: 12, padding: "10px 12px", animation: "afDropIn .6s cubic-bezier(.4,0,.2,1) 1.3s both, afFloatY 8s ease-in-out 1.9s infinite" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Icon name="calendar" size={16} style={{ color: "var(--indigo-600)" }} />
            <span style={{ font: "600 12px/16px var(--font-sans)", color: "var(--ink)" }}>Visa appointment</span>
          </div>
          <span style={{ display: "inline-flex", marginTop: 8, background: "var(--indigo-tint)", border: "1px solid var(--indigo-line)", color: "var(--indigo-text)", borderRadius: 999, padding: "3px 10px", font: "600 11px/15px var(--font-sans)" }}>
            Thu · 09:30
          </span>
        </div>

        {/* floating widget C, "Your journey" (larger), scattered upper-right */}
        <div style={{ position: "absolute", right: "5%", top: "27%", width: 232, zIndex: 2, ...glassWidget, borderRadius: 14, padding: "14px 16px", animation: "afDropIn .6s cubic-bezier(.4,0,.2,1) .9s both, afFloatY 7s ease-in-out 1.5s infinite" }}>
          <div style={widgetEyebrow}>Your journey</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10 }}>
            <StatusCircle size={24} tone="green"><IconCheck size={13} /></StatusCircle>
            <span style={{ font: "500 12px/16px var(--font-sans)", color: "var(--ink)", flex: 1 }}>Passport</span>
            <span style={{ font: "600 10px/14px var(--font-sans)", color: "var(--green)" }}>Approved</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8, paddingTop: 8, borderTop: "1px solid var(--line-soft)" }}>
            <StatusCircle size={24} tone="amber"><IconClock size={13} /></StatusCircle>
            <span style={{ font: "500 12px/16px var(--font-sans)", color: "var(--ink)", flex: 1 }}>Diploma</span>
            <span style={{ font: "600 10px/14px var(--font-sans)", color: "var(--amber)" }}>Under review</span>
          </div>
          <div style={{ height: 5, borderRadius: 999, background: "var(--grey-tint)", marginTop: 12, overflow: "hidden" }}>
            <div style={{ width: "62%", height: "100%", borderRadius: 999, background: "var(--indigo-600)" }} />
          </div>
          <div style={{ font: "400 10.5px/14px var(--font-sans)", color: "var(--ink-faint)", marginTop: 5 }}>8 of 13 steps done</div>
        </div>

        {/* motivating line, moved to the bottom-right corner */}
        <div style={{ position: "absolute", bottom: 24, right: 24, maxWidth: "46%", textAlign: "right", zIndex: 3 }}>
          <div style={{ font: "600 15px/21px var(--font-sans)", color: "var(--ink)" }}>
            Thousands of students, one clear path abroad. You are next.
          </div>
          <div style={{ font: "400 11.5px/16px var(--font-sans)", color: "var(--ink-faint)", marginTop: 4 }}>
            One dossier. One roadmap. Zero guesswork.
          </div>
        </div>
      </div>

      {/* ── Right panel (form) ── */}
      <div className="af-auth-right">
        <div style={{ width: "100%", maxWidth: 420, display: "flex", flexDirection: "column", gap: 16 }}>
          {/* toggle */}
          <div style={{ display: "flex", background: "var(--subtle)", borderRadius: 999, padding: 4, gap: 4 }}>
            {(["login", "signup"] as const).map((m) => {
              const active = mode === m;
              return (
                <button key={m} type="button" onClick={() => switchMode(m)} style={{ flex: 1, height: 40, borderRadius: 999, border: "none", cursor: "pointer", font: "600 14px/1 var(--font-sans)", background: active ? "var(--card)" : "transparent", color: active ? "var(--indigo-600)" : "var(--ink-soft)", boxShadow: active ? "var(--shadow-card)" : "none", transition: "all 120ms cubic-bezier(.4,0,.2,1)" }}>
                  {m === "login" ? "Login" : "Create an account"}
                </button>
              );
            })}
          </div>

          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, marginTop: 2 }}>
            <AnimatedMark size={48} />
            <h1 style={{ font: "700 28px/36px var(--font-sans)", color: "var(--ink)", margin: "8px 0 0", textAlign: "center" }}>
              {isSignup ? "Create your account" : "Welcome back!"}
            </h1>
            <p style={{ font: "400 14px/20px var(--font-sans)", color: "var(--ink-faint)", margin: 0, textAlign: "center" }}>
              Enter your details below.
            </p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <Field label="Email" type="email" required autoComplete="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            <Field
              label="Password"
              type={showPw ? "text" : "password"}
              required
              autoComplete={isSignup ? "new-password" : "current-password"}
              placeholder={isSignup ? "At least 6 characters" : "Enter your password."}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              trailing={
                <button type="button" onClick={() => setShowPw((v) => !v)} aria-label={showPw ? "Hide password" : "Show password"} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--ink-faint)", display: "flex", padding: 4 }}>
                  <Icon name={showPw ? "eye-off" : "eye"} size={18} />
                </button>
              }
            />

            {!isSignup && (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <label style={{ display: "inline-flex", alignItems: "center", gap: 8, cursor: "pointer", font: "400 13px/18px var(--font-sans)", color: "var(--ink-soft)" }}>
                  <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} style={{ accentColor: "var(--indigo-600)", width: 15, height: 15 }} />
                  Remember me
                </label>
                <button type="button" onClick={handleForgot} style={{ background: "none", border: "none", cursor: "pointer", font: "500 13px/18px var(--font-sans)", color: "var(--indigo-600)" }}>
                  Forgot password?
                </button>
              </div>
            )}

            {error && (
              <div role="alert" style={{ background: "var(--red-tint)", border: "1px solid var(--red-line)", color: "var(--red)", borderRadius: 12, padding: "10px 12px", font: "500 13px/18px var(--font-sans)" }}>
                {error}
              </div>
            )}
            {notice && (
              <div style={{ background: "var(--green-tint)", border: "1px solid var(--green-line)", color: "var(--green)", borderRadius: 12, padding: "10px 12px", font: "500 13px/18px var(--font-sans)" }}>
                {notice}
              </div>
            )}

            <Button type="submit" variant="primary" size="lg" fullWidth loading={loading}>
              {isSignup ? "Create account" : "Log in"}
            </Button>
            {isSignup && (
              <p style={{ font: "400 12px/17px var(--font-sans)", color: "var(--ink-faint)", textAlign: "center", margin: 0 }}>
                By creating an account you agree to our <a href="/terms" style={{ color: "var(--indigo-600)" }}>Terms of Service</a> and <a href="/refund" style={{ color: "var(--indigo-600)" }}>Refund Policy</a>.
              </p>
            )}
          </form>

          <Divider label="Or continue with" />

          <Button variant="neutral" size="lg" fullWidth icon={<GoogleIcon size={18} />} onClick={handleGoogle} disabled={loading}>
            {isSignup ? "Sign up with Google" : "Log in with Google"}
          </Button>

          <div style={{ textAlign: "center", font: "400 13px/18px var(--font-sans)", color: "var(--ink-soft)" }}>
            {footerPrefix}
            <button type="button" onClick={() => switchMode(isSignup ? "login" : "signup")} style={{ background: "none", border: "none", cursor: "pointer", font: "600 13px/18px var(--font-sans)", color: "var(--indigo-600)", padding: 0 }}>
              {isSignup ? "Log in" : "Sign Up"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
