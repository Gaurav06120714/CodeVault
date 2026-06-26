import type { Request, Response } from 'express';
import { z } from 'zod';
import * as notificationService from '../services/notification.service';

const listQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).optional(),
  unread: z.coerce.boolean().optional(),
});

const markReadSchema = z.object({
  ids: z.array(z.string()).optional(),
});

/** GET /notifications */
export async function list(req: Request, res: Response): Promise<void> {
  const { cursor, limit, unread } = listQuerySchema.parse(req.query);
  const page = await notificationService.listNotifications(req.user!.id, {
    cursor,
    limit,
    unreadOnly: unread,
  });
  res.status(200).json(page);
}

/** POST /notifications/read */
export async function markRead(req: Request, res: Response): Promise<void> {
  const { ids } = markReadSchema.parse(req.body ?? {});
  const updated = await notificationService.markRead(req.user!.id, ids);
  res.status(200).json({ updated });
}
