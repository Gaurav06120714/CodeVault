import client from 'prom-client';
import type { Request, Response, NextFunction } from 'express';

// Prometheus registry — default process/Node metrics + an HTTP request histogram.
// Scraped at GET /api/metrics (see app.ts). Exposes no secrets.
export const registry = new client.Registry();
registry.setDefaultLabels({ service: 'web-backend' });
client.collectDefaultMetrics({ register: registry });

const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status'] as const,
  buckets: [0.05, 0.1, 0.3, 0.5, 1, 1.5, 3, 5],
});
registry.registerMetric(httpRequestDuration);

/** Express middleware: records duration + status for every request. */
export function metricsMiddleware(req: Request, res: Response, next: NextFunction): void {
  const end = httpRequestDuration.startTimer();
  res.on('finish', () => {
    // Prefer the matched route pattern (e.g. /api/messages/:handle) to keep
    // label cardinality bounded; fall back to the path.
    const route = req.route?.path ?? req.baseUrl ?? req.path ?? 'unknown';
    end({ method: req.method, route: String(route), status: res.statusCode });
  });
  next();
}

/** Handler for GET /api/metrics — returns the Prometheus exposition format. */
export async function metricsHandler(_req: Request, res: Response): Promise<void> {
  res.set('Content-Type', registry.contentType);
  res.end(await registry.metrics());
}
