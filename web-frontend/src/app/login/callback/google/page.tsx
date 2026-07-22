"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { apiFetch } from "@/utils/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

function GoogleCallbackHandler() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const [waking, setWaking] = useState(false);

  useEffect(() => {
    const code = searchParams.get("code");
    if (!code) {
      setStatus("error");
      setErrorMsg("No authorization code received from Google.");
      return;
    }

    // CSRF check: state must match the one we generated pre-redirect.
    const returnedState = searchParams.get("state");
    const savedState = sessionStorage.getItem("google_oauth_state");
    sessionStorage.removeItem("google_oauth_state");
    if (!returnedState || !savedState || returnedState !== savedState) {
      setStatus("error");
      setErrorMsg("Invalid or missing sign-in state (possible CSRF). Please start sign-in again.");
      return;
    }

    const exchangeCode = async (attempt = 0) => {
      const MAX_ATTEMPTS = 6;
      try {
        // Google requires the exact redirect_uri used in the authorize step.
        const redirectUri = `${window.location.origin}/login/callback/google`;
        const res = await apiFetch(`${API_URL}/auth/google`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ code, redirectUri }),
        });

        // 503 = the proxy couldn't reach the backend (cold-booting) — the request
        // never processed, so the single-use code is still valid; wait and retry.
        if (res.status === 503 && attempt < MAX_ATTEMPTS) {
          setWaking(true);
          await new Promise((r) => setTimeout(r, 3000));
          return exchangeCode(attempt + 1);
        }

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.message || `Authentication failed (${res.status})`);
        }
        const data = await res.json();
        localStorage.setItem("user", JSON.stringify(data.user));
        router.push("/dashboard");
      } catch (err: any) {
        // Network error (also typically a cold boot) — code still valid; retry.
        if (attempt < MAX_ATTEMPTS) {
          setWaking(true);
          await new Promise((r) => setTimeout(r, 3000));
          return exchangeCode(attempt + 1);
        }
        setStatus("error");
        setErrorMsg(err.message || "Something went wrong during authentication.");
      }
    };

    exchangeCode();
  }, [searchParams, router]);

  if (status === "error") {
    return (
      <div className="auth" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
        <div style={{ textAlign: "center", maxWidth: 400 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
          <h2 style={{ marginBottom: 8 }}>Authentication Failed</h2>
          <p style={{ color: "var(--muted)", marginBottom: 24 }}>{errorMsg}</p>
          <a className="btn btn-primary" href="/login">Try again</a>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", flexDirection: "column", gap: 16 }}>
      <div style={{
        width: 40, height: 40, border: "3px solid var(--border, #e0dcd0)",
        borderTopColor: "var(--brand, #f1543f)", borderRadius: "50%",
        animation: "spin 0.8s linear infinite",
      }} />
      <p style={{ color: "var(--muted, #6f6d61)", textAlign: "center", maxWidth: 320 }}>
        {waking ? "Waking up the server — this can take up to a minute on the first sign-in…" : "Signing you in…"}
      </p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export default function GoogleLoginCallback() {
  return (
    <Suspense fallback={
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
        <p>Loading…</p>
      </div>
    }>
      <GoogleCallbackHandler />
    </Suspense>
  );
}
