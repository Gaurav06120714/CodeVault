import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.middleware';
import { requireAdmin } from './admin.middleware';
import { AdminController } from './admin.controller';

// Admin routes — mounted at /api/admin. EVERY route is behind requireAuth + requireAdmin
// (owner-only, fails closed with 404). See /admin/plan.md §5.
const router = Router();

router.use(requireAuth, requireAdmin);

router.get('/overview', AdminController.overview);
router.get('/users', AdminController.listUsers);

// TODO (next phases): user detail/actions, logins, audit, payments (refund/cancel), flags.

export default router;
