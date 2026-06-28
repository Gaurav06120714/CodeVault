import { Router } from 'express';
import { StatsController } from '../controllers/stats.controller';
import { requireAuth } from '../middlewares/auth.middleware';

const router = Router();

router.use(requireAuth);

router.get('/', StatsController.getDashboardStats);

export default router;
