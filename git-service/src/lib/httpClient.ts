import axios from 'axios';

// Pre-configured axios instance for outbound calls (platform APIs, GitHub).
// An SSRF egress allowlist interceptor is attached later in lib/egress.ts.
export const httpClient = axios.create({
  timeout: 15000,
  headers: {
    'User-Agent': 'CodeVault-git-service',
    Accept: 'application/json',
  },
});
