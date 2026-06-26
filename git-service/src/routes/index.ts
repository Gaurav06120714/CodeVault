import { Router } from 'express';
import healthRoutes from './health.routes';
import syncRoutes from './sync.routes';
import repoRoutes from './repo.routes';
import problemRoutes from './problem.routes';

/** API router — all feature routers under /api/v1. */
const router = Router();

router.use('/sync', syncRoutes);
router.use('/repos', repoRoutes);
router.use('/problems', problemRoutes);

export default router;
export { healthRoutes };
