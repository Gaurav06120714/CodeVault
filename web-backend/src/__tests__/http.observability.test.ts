import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../app';

const app = createApp();

describe('observability (metrics + request-id correlation)', () => {
  it('exposes Prometheus metrics at /api/metrics', async () => {
    const res = await request(app).get('/api/metrics');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/plain');
    // default Node metrics + our custom histogram are present
    expect(res.text).toContain('process_cpu_user_seconds_total');
    expect(res.text).toContain('http_request_duration_seconds');
  });

  it('echoes a generated X-Request-Id on responses', async () => {
    const res = await request(app).get('/api/health');
    expect(res.headers['x-request-id']).toBeDefined();
    expect(res.headers['x-request-id'].length).toBeGreaterThan(0);
  });

  it('preserves an inbound X-Request-Id for cross-service tracing', async () => {
    const res = await request(app).get('/api/health').set('x-request-id', 'trace-abc-123');
    expect(res.headers['x-request-id']).toBe('trace-abc-123');
  });
});
