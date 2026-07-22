import { Request, Response } from 'express';
import { StatsService } from '../services/stats.service';

export class StatsController {
  static async getDashboardStats(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.userId;
      const force = req.query.force === 'true';
      const stats = await StatsService.getAggregatedStats(userId, force);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: 'Failed to aggregate stats' });
    }
  }
}
