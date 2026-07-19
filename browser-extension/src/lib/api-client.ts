import type { CapturedSubmission, IngestResponse, RecentResponse } from '../types';
import { getToken, setToken, clearToken } from './storage';
import { GIT_SERVICE_URL, WEB_API } from '../constants';

/**
 * Re-mint the extension JWT directly from web-backend using the browser's session cookie.
 *
 * Runs in the background worker, so it does NOT need the CodeVault web app to be open or even
 * running — only web-backend (`WEB_API`) reachable and a live session cookie from a past
 * sign-in (host_permissions on :4000 let the worker send that cookie). If the short-lived
 * access cookie has expired, we rotate it via /auth/refresh (CSRF-exempt) and retry once.
 * Returns the fresh token (also persisted) or null if the user must sign in on the web app.
 */
async function fetchExtensionToken(): Promise<string | null> {
  try {
    const res = await fetch(`${WEB_API}/auth/extension-token`, { credentials: 'include' });
    if (!res.ok) return null;
    const data = (await res.json()) as { token?: string };
    return data.token ?? null;
  } catch {
    return null;
  }
}

export async function mintToken(): Promise<string | null> {
  let token = await fetchExtensionToken();
  if (!token) {
    // Access cookie likely expired — rotate it with the refresh cookie, then retry once.
    try {
      await fetch(`${WEB_API}/auth/refresh`, { method: 'POST', credentials: 'include' });
    } catch {
      /* ignore */
    }
    token = await fetchExtensionToken();
  }
  if (token) await setToken(token);
  else await clearToken();
  return token;
}

/** Get a usable token: the stored one, or a freshly minted one. */
async function ensureToken(): Promise<string | null> {
  return (await getToken()) ?? (await mintToken());
}

// Fetch the user's most recently synced problems (for the popup "recent captures" list).
export async function getRecentProblems(limit = 6): Promise<RecentResponse> {
  const token = await ensureToken();
  if (!token) return { ok: false, error: 'not_signed_in' };
  const call = (t: string) =>
    fetch(`${GIT_SERVICE_URL}/problems?limit=${limit}`, { headers: { Authorization: `Bearer ${t}` } });
  try {
    let res = await call(token);
    if (res.status === 401) {
      const fresh = await mintToken();
      if (fresh) res = await call(fresh);
    }
    if (!res.ok) return { ok: false, error: `http_${res.status}` };
    const data = await res.json();
    return { ok: true, items: data.items ?? [] };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'network_error' };
  }
}

// Send captured submissions to git-service. Auth = the same user JWT (Bearer). On a 401
// (token expired/invalid) we transparently re-mint from web-backend and retry once, so the
// extension self-recovers without the user re-signing-in.
export async function postIngest(captures: CapturedSubmission[]): Promise<IngestResponse> {
  const token = await ensureToken();
  if (!token) return { ok: false, error: 'not_signed_in' };

  const call = (t: string) =>
    fetch(`${GIT_SERVICE_URL}/ingest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` },
      body: JSON.stringify({ captures }),
    });

  try {
    let res = await call(token);
    if (res.status === 401) {
      const fresh = await mintToken();
      if (fresh) res = await call(fresh);
    }
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return { ok: false, error: body?.error?.code ?? `http_${res.status}` };
    }
    const data = await res.json();
    return { ok: true, accepted: data.accepted, pushed: data.pushed, skipped: data.skipped };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'network_error' };
  }
}
