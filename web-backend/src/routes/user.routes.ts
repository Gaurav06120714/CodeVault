import { Router } from 'express';
import * as userController from '../controllers/user.controller';
import { requireAuth } from '../middlewares/auth.middleware';
import { validateBody } from '../middlewares/validate.middleware';
import { updateUserSchema } from '../validators/user.validator';
import { asyncHandler } from '../utils/helpers';

const router = Router();

router.use(requireAuth); // all user routes are protected + ownership-scoped

router.get('/me', asyncHandler(userController.getMe));
router.patch('/me', validateBody(updateUserSchema), asyncHandler(userController.updateMe));
router.delete('/me', asyncHandler(userController.deleteMe));

export default router;
