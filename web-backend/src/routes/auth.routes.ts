import { Router } from 'express';
import * as authController from '../controllers/auth.controller';
import { requireAuth } from '../middlewares/auth.middleware';
import { asyncHandler } from '../utils/helpers';

const router = Router();

router.get('/github/start', asyncHandler(authController.startGithub));
router.get('/github/callback', asyncHandler(authController.githubCallback));
router.get('/session', requireAuth, asyncHandler(authController.session));
router.post('/refresh', asyncHandler(authController.refresh));
router.post('/logout', requireAuth, asyncHandler(authController.logout));

export default router;
