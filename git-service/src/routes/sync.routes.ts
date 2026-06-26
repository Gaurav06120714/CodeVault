import { Router } from 'express';
import * as syncController from '../controllers/sync.controller';
import { requireAuth } from '../middlewares/auth.middleware';
import { rateLimit } from '../middlewares/rateLimit.middleware';
import { asyncHandler } from '../utils/helpers';

const router = Router();

router.use(requireAuth);

// Manual trigger is cooldown-limited (queue + per-connection lock do the rest).
router.post(
  '/',
  rateLimit({ windowSec: 900, max: 5, keyPrefix: 'sync-trigger' }),
  asyncHandler(syncController.trigger),
);
router.get('/status', asyncHandler(syncController.status));
router.get('/activity', asyncHandler(syncController.activity));

export default router;
