export interface Platform {
  id: string;
  name: string;
  shortName: string;
  url: string;
  iconClass: string;
  /** Brand hex color (single source of truth for platform colors). */
  color: string;
  /** Display order across the app. */
  order: number;
  /** Build the public problem URL from a submission slug/id. */
  problemUrl: (slug: string) => string;
}

export const PLATFORMS: Record<string, Platform> = {
  leetcode: {
    id: "leetcode",
    name: "LeetCode",
    shortName: "LC",
    url: "https://leetcode.com",
    iconClass: "lc",
    color: "#ffa116",
    order: 0,
    problemUrl: (slug) => `https://leetcode.com/problems/${slug}/`,
  },
  codeforces: {
    id: "codeforces",
    name: "Codeforces",
    shortName: "CF",
    url: "https://codeforces.com",
    iconClass: "cf",
    color: "#1f8acb",
    order: 1,
    // slug is "<contestId>-<index>"
    problemUrl: (slug) => {
      const [contestId, index] = slug.split("-");
      return contestId && index
        ? `https://codeforces.com/contest/${contestId}/problem/${index}`
        : "https://codeforces.com/problemset";
    },
  },
  codechef: {
    id: "codechef",
    name: "CodeChef",
    shortName: "CC",
    url: "https://www.codechef.com",
    iconClass: "cc",
    color: "#7a5230",
    order: 2,
    problemUrl: (slug) => `https://www.codechef.com/problems/${slug}`,
  },
  hackerrank: {
    id: "hackerrank",
    name: "HackerRank",
    shortName: "HR",
    url: "https://www.hackerrank.com",
    iconClass: "hr",
    color: "#1aa260",
    order: 3,
    problemUrl: (slug) => `https://www.hackerrank.com/challenges/${slug}/problem`,
  },
};

/** Platform ids in display order: leetcode, codeforces, codechef, hackerrank. */
export const PLATFORM_ORDER: string[] = Object.values(PLATFORMS)
  .sort((a, b) => a.order - b.order)
  .map((p) => p.id);

/** Display name for a platform id, with a safe fallback. */
export const platformName = (id: string): string => PLATFORMS[id]?.name ?? id;

/** Brand color for a platform id, with a neutral fallback. */
export const platformColor = (id: string): string => PLATFORMS[id]?.color ?? "#8a8378";

/** Public problem URL for a platform + slug, or null if unknown/empty. */
export const problemUrlFor = (platform: string, slug?: string): string | null =>
  slug && PLATFORMS[platform] ? PLATFORMS[platform].problemUrl(slug) : null;
