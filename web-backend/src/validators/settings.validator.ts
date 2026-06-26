import { z } from 'zod';

/**
 * Partial settings update. Each sub-object is optional and `.strict()`, so only
 * known preference fields are accepted (mass-assignment defense).
 */
export const updateSettingsSchema = z
  .object({
    sync: z
      .object({
        autoSync: z.boolean(),
        frequency: z.enum(['3h', '6h', 'daily']),
        includeQuestion: z.boolean(),
        maintainReadme: z.boolean(),
        onlyAccepted: z.boolean(),
      })
      .partial()
      .strict()
      .optional(),
    publicProfile: z
      .object({
        enabled: z.boolean(),
        visibleSections: z.array(z.string()).max(20),
      })
      .partial()
      .strict()
      .optional(),
    notifications: z
      .object({
        syncFailures: z.boolean(),
        weeklySummary: z.boolean(),
        productUpdates: z.boolean(),
      })
      .partial()
      .strict()
      .optional(),
    appearance: z
      .object({ theme: z.enum(['light', 'dark', 'system']) })
      .partial()
      .strict()
      .optional(),
  })
  .strict();

export const repoMappingParamsSchema = z.object({
  platform: z.enum(['leetcode', 'codeforces', 'codechef', 'hackerrank']),
});

export const updateRepoMappingSchema = z
  .object({
    repoFullName: z.string().regex(/^[\w.-]+\/[\w.-]+$/, 'must be owner/repo'),
    visibility: z.enum(['public', 'private']).optional(),
    folderConvention: z.enum(['number', 'difficulty', 'topic']).optional(),
    defaultBranch: z.string().min(1).max(100).optional(),
  })
  .strict();

export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>;
export type UpdateRepoMappingInput = z.infer<typeof updateRepoMappingSchema>;
