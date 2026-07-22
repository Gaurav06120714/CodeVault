"use client";

import { useState } from "react";
import { PlatformChip } from "../../components/PlatformChip";
import { apiFetch } from "@/utils/api";

const GITHUB_CLIENT_ID = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID || '';
const REDIRECT_URI = `${typeof window !== 'undefined' ? window.location.origin : ''}/login/callback`;
const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';
const GOOGLE_REDIRECT_URI = `${typeof window !== 'undefined' ? window.location.origin : ''}/login/callback/google`;
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

function randomState() {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export default function Login() {
  const [email, setEmail] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailSuccess, setEmailSuccess] = useState(false);
  const [emailError, setEmailError] = useState("");

  // Wake the (possibly asleep on Render free tier) backend BEFORE redirecting to the
  // provider. The OAuth round-trip takes several seconds, during which the backend
  // cold-boots — so it's ready by the time the callback exchanges the code.
  // keepalive lets the request outlive this page's navigation.
  const prewarmBackend = () => {
    try {
      fetch(`${API_URL}/health`, { keepalive: true, cache: "no-store" }).catch(() => {});
    } catch {
      // ignore — this is best-effort warming
    }
  };

  const handleGitHubLogin = () => {
    // CSRF protection: generate a random state, stash it same-tab, and require the callback to
    // echo it back before exchanging the code.
    const state =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : Math.random().toString(36).slice(2) + Date.now().toString(36);
    sessionStorage.setItem("gh_oauth_state", state);
    prewarmBackend();
    const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=repo,read:user,user:email&state=${encodeURIComponent(state)}&prompt=select_account`;
    window.location.href = githubAuthUrl;
  };

  const handleGoogleLogin = () => {
    const state = randomState();
    sessionStorage.setItem("google_oauth_state", state);
    prewarmBackend();
    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(GOOGLE_REDIRECT_URI)}&response_type=code&scope=${encodeURIComponent("openid email profile")}&state=${encodeURIComponent(state)}&prompt=select_account`;
    window.location.href = googleAuthUrl;
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setEmailLoading(true);
    setEmailSuccess(false);
    setEmailError("");

    try {
      const res = await apiFetch(`${API_URL}/auth/email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to send magic link");
      }

      setEmailSuccess(true);
    } catch (err: any) {
      setEmailError(err.message || "Something went wrong. Please try again.");
    } finally {
      setEmailLoading(false);
    }
  };

  return (
    <div className="auth">
      {/* LEFT PANEL */}
      <div className="auth-panel">
        <div className="glow2" aria-hidden="true"></div>
        <a className="brand" href="/">
          <span className="mark" role="img" aria-label="CodeVault Logo">CV</span> CodeVault
        </a>
        <h1>Every problem you solve, finally in one place.</h1>
        <p>Connect your coding accounts once. Your stats stay in sync and your accepted solutions land in GitHub automatically.</p>
        <div className="plats">
          <PlatformChip platformId="leetcode" variant="dark" size="lg" href="https://leetcode.com" className="plat" />
          <PlatformChip platformId="codeforces" variant="dark" size="lg" href="https://codeforces.com" className="plat" />
          <PlatformChip platformId="codechef" variant="dark" size="lg" href="https://www.codechef.com" className="plat" />
          <PlatformChip platformId="hackerrank" variant="dark" size="lg" href="https://www.hackerrank.com" className="plat" />
        </div>
        <div className="quote">“I had three years of solved problems and nothing to link. Now there's one page that shows all of it.”</div>
      </div>

      {/* RIGHT FORM */}
      <div className="form-side">
        <div className="form">
          <a className="back" href="/">← Back to home</a>
          <div className="m-brand"><span className="mark" role="img" aria-label="CodeVault Logo">CV</span> CodeVault</div>
          <span className="tag">Get started</span>
          <h2>Sign in to CodeVault</h2>
          <div className="sub">We use GitHub so we can sync your solutions to a repository you own — no passwords to manage.</div>

          <button className="gh" type="button" onClick={handleGitHubLogin}>
            <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0016 8c0-4.42-3.58-8-8-8z"/></svg>
            Continue with GitHub
          </button>
          <p className="why">GitHub is required to create and update your synced repository.</p>

          <button className="gh" type="button" onClick={handleGoogleLogin} style={{ marginTop: 8, background: "#fff", color: "#1f2937", border: "1px solid #e5e7eb" }}>
            <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z"/>
              <path fill="#EA4335" d="M12 4.75c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 1.46 14.97.5 12 .5A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 6.68 9.14 4.75 12 4.75z"/>
            </svg>
            Continue with Google
          </button>

          <div className="divider">or use a sign-in link</div>

          {emailSuccess ? (
            <div style={{ padding: "16px", borderRadius: "8px", background: "rgba(16, 185, 129, 0.1)", border: "1px solid rgb(16, 185, 129)", margin: "16px 0", color: "#10b981", fontSize: "14px" }}>
              ✅ Verification link sent! Check your email inbox to sign in.
            </div>
          ) : (
            <form onSubmit={handleEmailLogin}>
              <div className="field">
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              {emailError && <p style={{ color: "var(--brand, #f1543f)", fontSize: "12px", margin: "4px 0 12px 0" }}>⚠️ {emailError}</p>}
              <button className="submit" type="submit" disabled={emailLoading}>
                {emailLoading ? "Sending link..." : "Email me a sign-in link"}
              </button>
              <p className="nopass">Passwordless — we'll email you a secure one-time link. No password to remember.</p>
            </form>
          )}

          <div className="alt">New to CodeVault? <a href="#" onClick={(e) => { e.preventDefault(); handleGitHubLogin(); }}>Create an account</a> — it's the same GitHub sign-in.</div>
        </div>
      </div>
    </div>
  );
}
