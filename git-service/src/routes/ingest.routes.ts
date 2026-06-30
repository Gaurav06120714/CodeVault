import { Router } from 'express';
import { ingest } from '../controllers/ingest.controller';
import { requireAuth } from '../middlewares/auth.middleware';
import { validateBody } from '../middlewares/validate.middleware';
import { rateLimit } from '../middlewares/rateLimit.middleware';
import { asyncHandler } from '../utils/helpers';
import { ingestSchema } from '../validators/ingest.validator';

const router = Router();

router.use(requireAuth);

// Slightly higher cap than manual sync — the extension may batch several captures.
const ingestLimit = rateLimit({ windowSec: 60, max: 60, keyPrefix: 'ingest' });

router.post('/', ingestLimit, validateBody(ingestSchema), asyncHandler(ingest));

export default router;
