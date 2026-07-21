import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../app';

const app = createApp();

// BOLA / broken-authorization guard: NO protected endpoint may be reachable
// without a valid session. Each of these must reject anonymous access with 401
// (they run requireAuth before ever touching the database).
const PROTECTED_GET = [
  '/api/stats',
  '/api/settings',
  '/api/platforms',
  '/api/notifications',
  '/api/messages',
  '/api/github-repos',
  '/api/settings/export', // GDPR data export must never be anonymous
];

describe('authorization gate (BOLA prevention)', () => {
  for (const path of PROTECTED_GET) {
    it(`rejects anonymous GET ${path} with 401`, async () => {
      const res = await request(app).get(path);
      expect(res.status).toBe(401);
    });
  }

  it('keeps the health check publicly reachable (200)', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
  });

  it('returns 404 for unknown routes (no accidental catch-all exposure)', async () => {
    const res = await request(app).get('/api/does-not-exist');
    expect(res.status).toBe(404);
  });
});
