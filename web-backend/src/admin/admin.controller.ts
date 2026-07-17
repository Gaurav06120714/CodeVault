import type { Request, Response } from 'express';
import { AdminService } from './admin.service';

// HTTP handlers for /api/admin/* — see /admin/plan.md §5. Access is enforced by
// requireAuth + requireAdmin on the router; these handlers just shape responses.
export const AdminController = {
  async overview(_req: Request, res: Response): Promise<void> {
    res.json(await AdminService.overview());
  },

  async listUsers(req: Request, res: Response): Promise<void> {
    const q = typeof req.query.query === 'string' ? req.query.query : '';
    res.json({ items: await AdminService.listUsers(q) });
  },
};
