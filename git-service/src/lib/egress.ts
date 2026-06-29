import type { InternalAxiosRequestConfig } from 'axios';

// SSRF defense: outbound requests may only reach these hosts. Anything else is rejected,
// so a malicious slug/URL can't make the server call internal/metadata endpoints.
const ALLOWED_HOSTS = new Set<string>([
  'leetcode.com',
  'codeforces.com',
  'www.codechef.com',
  'codechef.com',
  'www.hackerrank.com',
  'hackerrank.com',
  'api.github.com',
]);

export function assertAllowedUrl(rawUrl: string): void {
  let host: string;
  try {
    host = new URL(rawUrl).hostname.toLowerCase();
  } catch {
    throw new Error(`Blocked egress: invalid URL "${rawUrl}"`);
  }
  if (!ALLOWED_HOSTS.has(host)) {
    throw new Error(`Blocked egress to non-allowlisted host: ${host}`);
  }
}

// Axios request interceptor — validates the resolved URL before any outbound call.
export function egressInterceptor(config: InternalAxiosRequestConfig): InternalAxiosRequestConfig {
  const base = config.baseURL ?? '';
  const url = config.url ?? '';
  const full = base && !/^https?:\/\//i.test(url) ? `${base.replace(/\/$/, '')}/${url.replace(/^\//, '')}` : url;
  assertAllowedUrl(full);
  return config;
}
