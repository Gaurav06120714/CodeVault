import type { InternalAxiosRequestConfig } from 'axios';

/**
 * SSRF egress allowlist (SECURITY_PLAN §7, API7). git-service only ever talks to
 * a fixed set of platform + GitHub hosts. This guard rejects any outbound request
 * to a non-allowlisted host (or non-HTTPS), blocking SSRF pivots to internal
 * services / cloud metadata endpoints.
 */
const ALLOWED_HOSTS = new Set([
  'leetcode.com',
  'www.leetcode.com',
  'codeforces.com',
  'www.codeforces.com',
  'codechef.com',
  'www.codechef.com',
  'hackerrank.com',
  'www.hackerrank.com',
  'api.github.com',
  'github.com',
]);

/** Throws if the resolved URL is not an allowlisted HTTPS host. */
export function assertAllowedUrl(rawUrl: string): void {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new Error(`egress blocked: invalid URL "${rawUrl}"`);
  }
  if (url.protocol !== 'https:') {
    throw new Error(`egress blocked: non-HTTPS protocol "${url.protocol}"`);
  }
  if (!ALLOWED_HOSTS.has(url.hostname.toLowerCase())) {
    throw new Error(`egress blocked: host "${url.hostname}" not in allowlist`);
  }
}

/** Axios request interceptor that enforces the egress allowlist on every call. */
export function egressInterceptor(config: InternalAxiosRequestConfig): InternalAxiosRequestConfig {
  const base = config.baseURL ?? '';
  const path = config.url ?? '';
  const full = base ? new URL(path, base).href : path;
  assertAllowedUrl(full);
  return config;
}
