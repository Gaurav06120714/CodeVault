import type { CapturedSubmission, IngestResponse } from '../types';
import { getToken } from './storage';
import { GIT_SERVICE_URL } from '../constants';

// Send captured submissions to git-service. Auth = the same user JWT (Bearer),
// stored by the sign-in flow. Returns a normalized result.
export async function postIngest(captures: CapturedSubmission[]): Promise<IngestResponse> {
  const token = await getToken();
  if (!token) return { ok: false, error: 'not_signed_in' };

  try {
    const res = await fetch(`${GIT_SERVICE_URL}/ingest`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ captures }),
    });

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
