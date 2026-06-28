import { Router } from 'express';
import { PlatformController } from '../controllers/platform.controller';
import { requireAuth } from '../middlewares/auth.middleware';

const router = Router();

router.use(requireAuth); // Protect all routes

router.get('/', PlatformController.listConnections);
router.post('/connect', PlatformController.addConnection);
router.delete('/:platform', PlatformController.removeConnection);

export default router;
