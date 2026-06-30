import type { Request, Response } from 'express';
import { runIngest } from '../services/ingest.service';
import type { IngestInput } from '../validators/ingest.validator';

// POST /api/ingest — receive submissions captured in-browser by the extension (Path B v2)
// and push them to the caller's GitHub repo. Auth = same user JWT (ownership from req.user).
export async function ingest(req: Request, res: Response): Promise<void> {
  const userId = req.user!.userId;
  const { captures } = req.body as IngestInput;

  const result = await runIngest(userId, captures);
  res.status(202).json(result); // { accepted, pushed, skipped }
}
