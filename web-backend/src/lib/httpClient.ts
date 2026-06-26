import axios from 'axios';

/**
 * Pre-configured axios instance for outbound calls (GitHub OAuth, platform APIs).
 * Short timeout + a User-Agent (GitHub requires one). Per-call base URLs are set
 * by the caller; SSRF egress allowlisting is enforced at the integration layer.
 */
export const httpClient = axios.create({
  timeout: 15_000,
  headers: { 'User-Agent': 'CodeVault' },
});
