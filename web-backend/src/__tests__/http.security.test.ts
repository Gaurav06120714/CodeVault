import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../app';

const app = createApp();

describe('HTTP security (headers + CSRF + error envelope)', () => {
  it('applies Helmet security headers and removes x-powered-by', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers).not.toHaveProperty('x-powered-by');
  });

  it('seeds a readable csrf-token cookie on safe requests', async () => {
    const res = await request(app).get('/api/health');
    const raw = res.headers['set-cookie'] as string | string[] | undefined;
    const setCookie = Array.isArray(raw) ? raw.join(';') : String(raw ?? '');
    expect(setCookie).toContain('csrf-token');
  });

  it('blocks a state-changing request that has no CSRF token (403)', async () => {
    const res = await request(app).post('/api/platforms/connect').send({ platform: 'leetcode' });
    expect(res.status).toBe(403);
  });

  it('does not leak internal error details in the response body', async () => {
    // Unauthenticated protected route → structured error, never a stack trace.
    const res = await request(app).get('/api/stats');
    expect(res.status).toBe(401);
    expect(JSON.stringify(res.body)).not.toMatch(/at .*\(.*:\d+:\d+\)/); // no stack frames
    expect(res.body).toHaveProperty('error');
  });
});
