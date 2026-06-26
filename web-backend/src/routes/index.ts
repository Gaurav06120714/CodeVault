import { Router } from 'express';
import healthRoutes from './health.routes';

/**
 * API router — mounts every feature router under /api/v1.
 * Health/readiness live at the root (outside /api) for infra probes.
 */
const router = Router();

// Feature routers are added here as modules land (auth, users, platforms, stats, public...).

export default router;
export { healthRoutes };
