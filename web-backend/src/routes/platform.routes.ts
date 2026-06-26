import { Router } from 'express';
import * as platformController from '../controllers/platform.controller';
import { requireAuth } from '../middlewares/auth.middleware';
import { validateBody } from '../middlewares/validate.middleware';
import { createConnectionSchema, authorizeSyncSchema } from '../validators/platform.validator';
import { asyncHandler } from '../utils/helpers';

const router = Router();

router.use(requireAuth); // all connection routes are protected + ownership-scoped

router.get('/', asyncHandler(platformController.list));
router.post('/connect', validateBody(createConnectionSchema), asyncHandler(platformController.connect));
router.post('/:id/authorize', validateBody(authorizeSyncSchema), asyncHandler(platformController.authorize));
router.delete('/:id', asyncHandler(platformController.remove));

export default router;
