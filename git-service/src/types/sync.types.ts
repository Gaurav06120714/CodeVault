import type { PlatformName } from './index';

export type Difficulty = 'easy' | 'medium' | 'hard';

// One accepted submission fetched from a platform (Path B).
export interface Submission {
  platform: PlatformName;
  number: string; // problem number (e.g. "369"), zero-padded later for folders
  slug: string; // problem slug/identifier on the platform
  title: string;
  difficulty?: Difficulty;
  topics: string[];
  language: string; // e.g. "python3", "cpp"
  code: string; // the accepted source code
  solvedAt?: Date;
  url?: string; // link to the submission/problem on the platform
}

// The problem statement, used to build question.md.
export interface Question {
  slug: string;
  number: string;
  title: string;
  difficulty?: Difficulty;
  topics: string[];
  statementMarkdown: string;
  url?: string;
}

// A fully-prepared item ready to push to GitHub (submission + question).
export interface SolutionToSync {
  platform: PlatformName;
  number: string;
  slug: string;
  title: string;
  difficulty?: Difficulty;
  topics: string[];
  language: string;
  code: string;
  questionMarkdown: string;
  solvedAt?: Date;
  url?: string;
}

// Every platform adapter implements this. Adapters receive the user's already-decrypted
// session token (decryption happens in the sync orchestrator, not here).
export interface SubmissionAdapter {
  platform: PlatformName;
  // Whether this platform supports authorized source-code retrieval at all.
  // (LeetCode: yes. Codeforces: metadata only. CodeChef/HackerRank: degrade.)
  supportsCodeSync: boolean;
  // Fetch recent accepted submissions (with code where supported).
  getRecentSubmissions(token: string, opts?: { limit?: number }): Promise<Submission[]>;
  // Fetch a problem statement for question.md.
  getQuestion(slug: string): Promise<Question>;
}

export interface SyncResult {
  itemsFetched: number;
  itemsPushed: number;
  skipped: number;
}
