import { Router } from 'express';
import * as publicController from '../controllers/public.controller';
import { rateLimit } from '../middlewares/rateLimit.middleware';
import { asyncHandler } from '../utils/helpers';

const router = Router();

// Public (no auth). Rate-limited per IP to deter scraping/enumeration.
router.get(
  '/:username',
  rateLimit({ windowSec: 60, max: 60, keyPrefix: 'public' }),
  asyncHandler(publicController.getProfile),
);

export default router;
