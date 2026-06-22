// GitHub sync.
//
// Takes a solved problem + its source code and commits it to the user's repo
// in an organized folder, then updates the repo README index.

export interface SolutionToSync {
  platform: string;
  number: string;
  title: string;
  slug: string;
  difficulty?: string;
  topics?: string[];
  language: string;
  code: string;
}

/**
 * Builds the file path inside the synced repo, organized by platform,
 * difficulty, and problem. Example:
 *   leetcode/Medium/0369-plus-one-linked-list/solution.py
 */
export function buildFilePath(sol: SolutionToSync): string {
  const ext = languageExtension(sol.language);
  const padded = sol.number.padStart(4, "0");
  const diff = sol.difficulty ?? "Unsorted";
  return `${sol.platform}/${diff}/${padded}-${sol.slug}/solution.${ext}`;
}

/**
 * Pushes a single solution to GitHub via the REST API (contents endpoint).
 *
 * TODO: implement create/update file blob + commit using GITHUB_TOKEN.
 */
export async function pushSolution(
  _sol: SolutionToSync,
  _repo: string,
  _token: string,
): Promise<void> {
  throw new Error("Not implemented: GitHub contents API push.");
}

/**
 * Regenerates the repo README index table from all synced solutions.
 *
 * TODO: render a markdown table (no | title | type | difficulty | date).
 */
export function buildReadmeIndex(_solutions: SolutionToSync[]): string {
  throw new Error("Not implemented: README index generator.");
}

function languageExtension(lang: string): string {
  const map: Record<string, string> = {
    python: "py",
    python3: "py",
    cpp: "cpp",
    "c++": "cpp",
    java: "java",
    javascript: "js",
    typescript: "ts",
    c: "c",
    go: "go",
    rust: "rs",
  };
  return map[lang.toLowerCase()] ?? "txt";
}
