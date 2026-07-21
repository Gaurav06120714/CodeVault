// CodeVault load test (k6) — verifies the SCALABILITY.md SLO targets:
//   p95 /public  <= 500ms   ·   availability (checks) >= 99%
// Run:
//   k6 run -e BASE_URL=https://codevault-ig6c.onrender.com \
//          -e USERNAME=<a-public-username> load-tests/stats.k6.js
//
// Notes:
// - /stats requires auth, so this drives the public read path (/api/public/:username),
//   which shares the same cache + DB layer and is the SLO-critical anonymous path.
// - Thresholds make the test FAIL (non-zero exit) when an SLO is breached — wire it
//   into a pipeline once the app runs on a non-sleeping tier.
import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const USERNAME = __ENV.USERNAME || 'demo';

export const options = {
  stages: [
    { duration: '30s', target: 20 }, // ramp up
    { duration: '1m', target: 20 },  // sustained
    { duration: '30s', target: 0 },  // ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // SLO: p95 <= 500ms for /public
    checks: ['rate>0.99'],            // SLO: >= 99% successful responses
  },
};

export default function () {
  const res = http.get(`${BASE_URL}/api/public/${USERNAME}`);
  check(res, {
    'status is 200 or 404': (r) => r.status === 200 || r.status === 404,
    'responded under 1.5s': (r) => r.timings.duration < 1500,
  });
  sleep(1);
}
