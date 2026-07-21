import { Request, Response } from 'express';
import { SettingsService } from '../services/settings.service';
import logger from '../lib/logger';

export class SettingsController {
  static async getSettings(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user?.userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }
      const settings = await SettingsService.getSettings(req.user.userId);
      res.json(settings);
    } catch (err: any) {
      logger.error({ err }, 'Failed to get settings');
      res.status(500).json({ error: 'Failed to load settings' });
    }
  }

  static async exportData(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user?.userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }
      const data = await SettingsService.exportUserData(req.user.userId);
      res.setHeader('Content-Disposition', 'attachment; filename="codevault-export.json"');
      res.json(data);
    } catch (err: any) {
      logger.error({ err }, 'Failed to export user data');
      res.status(500).json({ error: 'Failed to export data' });
    }
  }

  static async deleteAccount(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user?.userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }
      await SettingsService.deleteAccount(req.user.userId);
      // Sign the (now non-existent) user out.
      res.clearCookie('cv_access', { path: '/' });
      res.clearCookie('cv_refresh', { path: '/' });
      res.json({ ok: true });
    } catch (err: any) {
      logger.error({ err }, 'Failed to delete account');
      res.status(500).json({ error: 'Failed to delete account' });
    }
  }

  static async updateSettings(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user?.userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }
      
      const payload = req.body;
      const updatedSettings = await SettingsService.updateSettings(req.user.userId, payload);
      res.json(updatedSettings);
    } catch (err: any) {
      logger.error({ err }, 'Failed to update settings');
      const knownValidation = err.message === 'Handle is already taken' || err.message?.includes('Handle can only');
      if (knownValidation) {
        res.status(400).json({ error: err.message });
      } else {
        res.status(500).json({ error: 'Failed to update settings' });
      }
    }
  }
}
