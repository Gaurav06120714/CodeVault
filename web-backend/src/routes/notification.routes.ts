import { Router } from 'express';
import * as notificationController from '../controllers/notification.controller';
import { requireAuth } from '../middlewares/auth.middleware';
import { asyncHandler } from '../utils/helpers';

const router = Router();

router.use(requireAuth);

router.get('/', asyncHandler(notificationController.list));
router.post('/read', asyncHandler(notificationController.markRead));

export default router;
