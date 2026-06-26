import type { Request, Response } from 'express';
import * as problemService from '../services/problem.service';
import { problemParamsSchema } from '../validators/sync.validator';

/** GET /problems/:platform/:number */
export async function getProblem(req: Request, res: Response): Promise<void> {
  const { platform, number } = problemParamsSchema.parse(req.params);
  const problem = await problemService.getProblem(req.user!.id, platform, number);
  res.status(200).json(problem);
}
