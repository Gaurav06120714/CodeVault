import type { Request, Response } from 'express';
import prisma from '../lib/prisma';

// GET /api/repos — the caller's per-platform GitHub repo mappings (target repos for sync).
export async function list(req: Request, res: Response): Promise<void> {
  const userId = req.user!.userId;
  const repos = await prisma.githubRepo.findMany({
    where: { userId },
    orderBy: { platform: 'asc' },
    select: {
      id: true,
      platform: true,
      repoFullName: true,
      visibility: true,
      folderConvention: true,
      defaultBranch: true,
      fileCount: true,
      lastSyncAt: true,
    },
  });
  res.json({ items: repos });
}
