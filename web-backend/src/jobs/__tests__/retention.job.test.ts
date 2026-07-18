import { describe, it, expect } from 'vitest';
import { getRetentionThresholds } from '../retention.job';

describe('Retention Job Logic', () => {
  it('should correctly calculate date thresholds relative to "now"', () => {
    // Pick a fixed date in MS for consistent testing
    const now = new Date('2026-07-18T12:00:00Z').getTime();

    const thresholds = getRetentionThresholds(now);

    const msPerDay = 24 * 60 * 60 * 1000;

    expect(thresholds.thirtyDaysAgo.getTime()).toBe(now - 30 * msPerDay);
    expect(thresholds.ninetyDaysAgo.getTime()).toBe(now - 90 * msPerDay);
    expect(thresholds.oneEightyDaysAgo.getTime()).toBe(now - 180 * msPerDay);
  });
});
