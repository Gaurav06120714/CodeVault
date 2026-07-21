import client from 'prom-client';
import type { Request, Response, NextFunction } from 'express';

// Prometheus registry — default process/Node metrics + an HTTP request histogram.
// Scraped at GET /metrics (see app.ts). Exposes no secrets.
export const registry = new client.Registry();
registry.setDefaultLabels({ service: 'git-service' });
client.collectDefaultMetrics({ register: registry });

const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status'] as const,
  buckets: [0.05, 0.1, 0.3, 0.5, 1, 1.5, 3, 5],
});
registry.registerMetric(httpRequestDuration);

export function metricsMiddleware(req: Request, res: Response, next: NextFunction): void {
  const end = httpRequestDuration.startTimer();
  res.on('finish', () => {
    const route = req.route?.path ?? req.baseUrl ?? req.path ?? 'unknown';
    end({ method: req.method, route: String(route), status: res.statusCode });
  });
  next();
}

export async function metricsHandler(_req: Request, res: Response): Promise<void> {
  res.set('Content-Type', registry.contentType);
  res.end(await registry.metrics());
}
