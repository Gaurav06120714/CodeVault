import { Router } from 'express';
import * as statsController from '../controllers/stats.controller';
import { requireAuth } from '../middlewares/auth.middleware';
import { rateLimit } from '../middlewares/rateLimit.middleware';
import { asyncHandler } from '../utils/helpers';

const router = Router();

router.use(requireAuth);

router.get(
  '/',
  rateLimit({ windowSec: 60, max: 30, keyPrefix: 'stats' }),
  asyncHandler(statsController.getStats),
);
router.get(
  '/recent',
  rateLimit({ windowSec: 60, max: 60, keyPrefix: 'stats-recent' }),
  asyncHandler(statsController.getRecent),
);

export default router;
