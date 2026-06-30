import { z } from 'zod';

const platform = z.enum(['leetcode', 'codeforces', 'codechef', 'hackerrank']);
const difficulty = z.enum(['easy', 'medium', 'hard']);

// One submission captured in-browser by the extension (Path B v2).
export const capturedSubmissionSchema = z.object({
  platform,
  number: z.string().min(1).max(40),
  slug: z.string().min(1).max(200),
  title: z.string().min(1).max(300),
  difficulty: difficulty.optional(),
  topics: z.array(z.string().max(60)).max(40).default([]),
  language: z.string().min(1).max(40),
  code: z.string().min(1).max(200_000), // size cap (anti-abuse)
  questionMarkdown: z.string().max(500_000).default(''),
  solvedAt: z.coerce.date().optional(),
  url: z.string().url().max(500).optional(),
});

export const ingestSchema = z
  .object({
    captures: z.array(capturedSubmissionSchema).min(1).max(50),
    idempotencyKey: z.string().max(120).optional(),
  })
  .strict();

export type CapturedSubmissionInput = z.infer<typeof capturedSubmissionSchema>;
export type IngestInput = z.infer<typeof ingestSchema>;
