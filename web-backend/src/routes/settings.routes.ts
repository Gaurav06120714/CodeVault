import { Router } from 'express';
import { SettingsController } from '../controllers/settings.controller';
import { requireAuth } from '../middlewares/auth.middleware';

const router = Router();

router.use(requireAuth);

router.get('/', SettingsController.getSettings);
router.patch('/', SettingsController.updateSettings);
router.get('/export', SettingsController.exportData);
router.delete('/account', SettingsController.deleteAccount);

export default router;
