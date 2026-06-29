import { Router } from 'express';
import syncRoutes from './sync.routes';
import healthRoutes from './health.routes';

const router = Router();

// Mounted under /api in app.ts.
router.use('/sync', syncRoutes);

export default router;
export { healthRoutes };
