// LeetCode integration.
//
// Path A (stats): uses the public, unofficial GraphQL endpoint — username only.
// Path B (code):  requires the user's authorized session (LEETCODE_SESSION + csrf)
//                 to read THEIR OWN accepted submissions including source code.

const LEETCODE_GRAPHQL = "https://leetcode.com/graphql";

export interface LeetCodeStats {
  username: string;
  totalSolved: number;
  easy: number;
  medium: number;
  hard: number;
  ranking: number | null;
}

export interface LeetCodeSubmission {
  id: string;
  title: string;
  titleSlug: string;
  lang: string;
  timestamp: number;
}

/**
 * Path A — public profile stats. No authentication required.
 */
export async function getLeetCodeStats(username: string): Promise<LeetCodeStats> {
  const query = `
    query userStats($username: String!) {
      matchedUser(username: $username) {
        username
        profile { ranking }
        submitStatsGlobal { acSubmissionNum { difficulty count } }
      }
    }`;

  const res = await fetch(LEETCODE_GRAPHQL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables: { username } }),
  });

  const json = await res.json();
  const user = json?.data?.matchedUser;
  if (!user) throw new Error(`LeetCode user not found: ${username}`);

  const counts: Record<string, number> = {};
  for (const item of user.submitStatsGlobal.acSubmissionNum) {
    counts[item.difficulty] = item.count;
  }

  return {
    username: user.username,
    totalSolved: counts["All"] ?? 0,
    easy: counts["Easy"] ?? 0,
    medium: counts["Medium"] ?? 0,
    hard: counts["Hard"] ?? 0,
    ranking: user.profile?.ranking ?? null,
  };
}

/**
 * Path B — recent accepted submissions for the authorized user.
 * Returns the metadata list; full source code is fetched per-submission.
 * Requires a valid session (set via the user's one-time connect).
 *
 * TODO: implement authenticated submission + submissionDetails calls.
 */
export async function getRecentSubmissions(
  _username: string,
  _session: string,
): Promise<LeetCodeSubmission[]> {
  throw new Error("Not implemented: authorized submission fetch (Path B).");
}
