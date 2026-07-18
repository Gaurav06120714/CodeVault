import { describe, it, expect } from 'vitest';
import { triggerSyncSchema } from '../src/validators/sync.validator';

describe('triggerSyncSchema', () => {
  it('accepts an empty body (sync all owned connections)', () => {
    expect(() => triggerSyncSchema.parse({})).not.toThrow();
  });

  it('accepts a valid cuid connectionId', () => {
    const parsed = triggerSyncSchema.parse({ connectionId: 'cmr1pnspl0001j08g0h8upstu' });
    expect(parsed.connectionId).toBe('cmr1pnspl0001j08g0h8upstu');
  });

  it('rejects a non-cuid connectionId', () => {
    expect(() => triggerSyncSchema.parse({ connectionId: '123' })).toThrow();
    expect(() => triggerSyncSchema.parse({ connectionId: 'not-a-cuid!' })).toThrow();
  });
});
