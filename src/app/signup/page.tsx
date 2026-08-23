"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button, Field, Divider, Icon, GoogleIcon, Checkbox, fieldIcon } from "@/components/ds";
import { supabase } from "@/lib/supabase/client";
import { Loader } from "@/components/ds";
import { fetchAdminRole } from "@/lib/admin";
import { resolvePostLoginDest } from "@/lib/authRoute";
import { deviceId } from "@/lib/useSingleSession";

// OAuth / email-confirm links land on a neutral callback that resolves the role
// and redirects directly — never through the user dashboard.
const POST_AUTH = "/auth/callback";

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
  const [checking, setChecking] = useState(true);

  const isSignup = mode === "signup";

  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams(window.location.search);
    if (params.get("mode") === "signup") {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time UI sync from query param on mount
      setMode("signup");
    }
    const reason = params.get("reason");
    const kicked = reason === "another-device" || reason === "inactive";
    if (reason === "another-device") {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time UI sync from query param on mount
      setNotice("You were signed out because your account was opened on another device. Only one device can be signed in at a time.");
    } else if (reason === "inactive") {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time UI sync from query param on mount
      setNotice("Your account is not active right now. Please contact support.");
    }
    // If there's a SAVED session, validate it against the server before trusting it.
    // A stale session (account deleted, banned, or now active on another device)
    // must NOT auto-open the dashboard — sign it out and show the login form instead.
    (async () => {
      const dest = kicked ? null : await resolveSavedSession();
      if (cancelled) return;
      if (dest) { router.replace(dest); return; } // valid → straight to the workspace
      setChecking(false); // no valid session → show the form
    })();
    return () => { cancelled = true; };
  }, [router]);

  // Returns where a valid saved session should go, or null (and signs it out) if invalid.
  async function resolveSavedSession(): Promise<string | null> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return null;
    const { data: { user }, error } = await supabase.auth.getUser(); // server check → fails if account deleted
    if (error || !user) { await supabase.auth.signOut(); return null; }
    const { role } = await fetchAdminRole(user.email);
    if (role) return "/admin";
    const { data: prof } = await supabase.from("profiles").select("onboarding_completed_at, banned, active_session_id").eq("id", user.id).maybeSingle();
    if (!prof) { await supabase.auth.signOut(); return null; }
    if (prof.banned) { await supabase.auth.signOut(); setNotice("Your account is not active right now. Please contact support."); return null; }
    if (prof.active_session_id && prof.active_session_id !== deviceId()) {
      await supabase.auth.signOut();
      setNotice("You were signed out because your account is signed in on another device. Please log in again.");
      return null;
    }
    return prof.onboarding_completed_at ? "/dashboard" : "/profile-setup";
  }

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  function switchMode(next: "login" | "signup") {
    setMode(next);
    setError(null);
    setNotice(null);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    if (!emailValid) return setError("Enter a valid email address.");
    if (password.length < 6) return setError("Password must be at least 6 characters.");
    setLoading(true);
    try {
      // Resolve the destination from the user's role at login time and go there
      // directly — no bounce through the home / dashboard / sign-in page.
      const routeAfterAuth = async () => {
        const { dest, error } = await resolvePostLoginDest();
        if (dest) { router.replace(dest); return; }
        setError(error ?? "Sign-in failed, please try again.");
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

  // While validating a saved session, show a neutral loader — never flash the form
  // or bounce through another page (fixes the "goes to home first" glitch).
  if (checking) {
    return <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--paper)" }}><Loader size={56} block /></div>;
  }

  return (
    <div className="af-auth-main af-desktop-zoom" style={{ overflow: "hidden", background: "var(--paper)" }}>
      {/* ── Left panel ──
          The frame is untouched: `.af-auth-left` still owns its 47.6% basis,
          the near-full height and the scaling corner radius. What sits inside
          it is now one abstract image and nothing else, so the artwork is the
          whole panel rather than a backdrop with things layered on top. */}
      <div className="af-auth-left" style={{ position: "relative", overflow: "hidden", background: "var(--indigo-100)" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="af-auth-visual" src="/auth-panel.webp" alt="" />

        {/* Both blocks are positioned as percentages OF THE PANEL, so they hold
            the same relationship to the frame at every size and can never drift
            outside the rounded corners the panel clips to. */}
        <div className="af-auth-mark">
          <svg width="30" height="30" viewBox="0 0 96 96" aria-hidden>
            <g fill="none" stroke="#FFFFFF" strokeWidth="13" strokeLinecap="square" strokeLinejoin="miter">
              <path d="M29 28 48 45 67 28" />
              <path d="M29 54 48 71 67 54" />
            </g>
          </svg>
          <span>AfaqWay</span>
        </div>

        <div className="af-auth-caption">
          <p>AfaqWay is built for students, not agencies.</p>
          <h2>Going abroad should not depend on who you know.</h2>
        </div>
      </div>

      {/* ── Right panel (form) ── */}
      <div className="af-auth-right">
        <div className="af-auth-form">
          {/* The mark, the heading and its line all start on the same left
              rail as the fields below them, so the panel reads as one column
              rather than a centred badge sitting above a left-aligned form.
              Same icon as the panel opposite: one page, one mark. */}
          <header className="af-auth-head">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="af-auth-headmark" src="/brand-icon.png" alt="" width={38} height={38} />
            <h1>{isSignup ? "Create your account" : "Welcome back!"}</h1>
            <p>
              {isSignup
                ? "A few details and your study abroad file is open."
                : "Sign in to pick up exactly where you left off."}
            </p>
          </header>

          <form className="af-auth-fields" onSubmit={handleSubmit}>
            <Field label="Email" icon={fieldIcon("email")} type="email" required autoComplete="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            <Field
              label="Password"
              icon={fieldIcon("password")}
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
              <div className="af-auth-row">
                <Checkbox checked={remember} onChange={setRemember} label={<span style={{ color: "var(--ink-soft)" }}>Remember me</span>} />
                <button type="button" className="af-auth-link" onClick={handleForgot}>Forgot password?</button>
              </div>
            )}

            {error && (
              <div role="alert" className="af-auth-alert" data-tone="error">{error}</div>
            )}
            {notice && (
              <div className="af-auth-alert" data-tone="ok">{notice}</div>
            )}

            <Button
              type="submit" variant="primary" size="lg" fullWidth loading={loading}
              style={{
                borderRadius: "var(--radius-control)",
                height: "clamp(42px, 5.4vh, 52px)",
                boxShadow: "0 10px 24px -12px rgba(46, 59, 199, .65)",
              }}
            >
              {isSignup ? "Create account" : "Log in"}
            </Button>
            {isSignup && (
              <p className="af-auth-legal">
                By creating an account you agree to our <a href="/terms">Terms of Service</a> and <a href="/refund">Refund Policy</a>.
              </p>
            )}
          </form>

          <Divider label="Or continue with" />

          <Button
            variant="neutral" size="lg" fullWidth icon={<GoogleIcon size={18} />}
            onClick={handleGoogle} disabled={loading}
            style={{ borderRadius: "var(--radius-control)", height: "clamp(40px, 5vh, 48px)" }}
          >
            {isSignup ? "Sign up with Google" : "Log in with Google"}
          </Button>

          <div className="af-auth-switch">
            {footerPrefix}
            <button type="button" onClick={() => switchMode(isSignup ? "login" : "signup")}>
              {isSignup ? "Log in" : "Sign Up"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
