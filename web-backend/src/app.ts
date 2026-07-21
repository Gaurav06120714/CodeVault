import express, { Application, Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import pinoHttp from 'pino-http';
import logger from './lib/logger';
import { env } from './config/env';
import authRoutes from './routes/auth.routes';
import platformRoutes from './routes/platform.routes';
import statsRoutes from './routes/stats.routes';
import publicRoutes from './routes/public.routes';
import githubRepoRoutes from './routes/githubRepo.routes';
import notificationRoutes from './routes/notification.routes';
import settingsRoutes from './routes/settings.routes';
import followRoutes from './routes/follow.routes';
import messageRoutes from './routes/message.routes';
import { csrfMiddleware } from './middlewares/csrf.middleware';
import { metricsMiddleware, metricsHandler } from './lib/metrics';
import { captureException } from './lib/sentry';
import { randomUUID } from 'crypto';
// Admin is a standalone app (see /admin/) running on its own port — no longer mounted here.

export const createApp = (): Application => {
  const app = express();

  // Security Middlewares
  app.use(helmet());
  app.use(cors({
    // Deployed frontend origin comes from CORS_ORIGIN (comma-separated allowed for
    // multiple, e.g. the frontend + admin). Falls back to the local dev origin.
    origin: env.CORS_ORIGIN
      ? env.CORS_ORIGIN.split(',').map((o) => o.trim())
      : (env.NODE_ENV === 'production' ? 'https://codevault.io' : 'http://localhost:3000'),
    credentials: true,
  }));

  // Body parsing
  app.use(express.json());
  app.use(cookieParser());

  // Anti-CSRF Token Middleware (Double Submit Cookie)
  app.use(csrfMiddleware);

  // Expose endpoint for frontend to explicitly fetch/initialize the CSRF token if needed
  app.get('/api/csrf-token', (req: Request, res: Response) => {
    res.json({ status: 'ok', csrfToken: req.cookies['csrf-token'] });
  });

  // Logging — correlate every log line with a request id. Reuse an inbound
  // X-Request-Id (e.g. from the frontend proxy) or mint a UUID, and echo it back
  // on the response so a request can be traced across services.
  app.use(
    pinoHttp({
      logger,
      genReqId: (req, res) => {
        const inbound = req.headers['x-request-id'];
        const id = (Array.isArray(inbound) ? inbound[0] : inbound) || randomUUID();
        res.setHeader('x-request-id', id);
        return id;
      },
    }),
  );

  // Metrics — record request duration/status, expose Prometheus scrape endpoint.
  app.use(metricsMiddleware);
  app.get('/api/metrics', metricsHandler);

  // Health check
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/platforms', platformRoutes);
  app.use('/api/stats', statsRoutes);
  app.use('/api/public', publicRoutes);
  app.use('/api/github-repos', githubRepoRoutes);
  app.use('/api/notifications', notificationRoutes);
  app.use('/api/settings', settingsRoutes);
  app.use('/api/users', followRoutes);
  app.use('/api/messages', messageRoutes);

  // Global Error Handler — never leak internal details to the client
  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    captureException(err); // reported to Sentry when SENTRY_DSN is configured
    logger.error(err);
    res.status(err.status || 500).json({
      error: {
        message: 'Internal server error',
      }
    });
  });

  return app;
};
