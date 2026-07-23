/**
 * Run `fn` over `items` with a bounded number of concurrent executions.
 * Used by the platform scrapers so we don't fire ~15 upstream tag requests at
 * once (which risks rate-limits / IP bans that the platforms enforce).
 */
export async function mapLimit<T, R>(
  items: T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let cursor = 0;

  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const i = cursor++;
      results[i] = await fn(items[i], i);
    }
  });

  await Promise.all(workers);
  return results;
}
