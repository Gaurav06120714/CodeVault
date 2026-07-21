import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';

const app = createApp();

describe('git-service observability (metrics endpoint)', () => {
  it('exposes Prometheus metrics at /metrics', async () => {
    const res = await request(app).get('/metrics');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/plain');
    expect(res.text).toContain('process_cpu_user_seconds_total');
    expect(res.text).toContain('http_request_duration_seconds');
    expect(res.text).toContain('service="git-service"');
  });
});
