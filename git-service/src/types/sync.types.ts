import type { PlatformName } from './index';

export type Difficulty = 'easy' | 'medium' | 'hard';

/** One accepted submission discovered on a platform (metadata only). */
export interface Submission {
  slug: string;
  number: string;
  title: string;
  difficulty?: Difficulty;
  topics: string[];
  language: string;
  submissionId: string;
  solvedAt?: string;
}

/** A problem statement to write into question.md. */
export interface Question {
  slug: string;
  title: string;
  contentMarkdown: string;
  tags: string[];
  url: string;
}

/** A fully-resolved problem ready to push (code + question). */
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
  platformUrl: string;
  solvedAt?: string;
}

/** Platform adapter for Path B (authorized code sync). One file per platform. */
export interface SubmissionAdapter {
  readonly platform: PlatformName;
  fetchAcceptedSubmissions(token: string, handle: string): Promise<Submission[]>;
  fetchSubmissionCode(token: string, submission: Submission): Promise<string>;
  fetchQuestion(handle: string, slug: string): Promise<Question>;
}

export interface SyncResult {
  itemsFetched: number;
  itemsPushed: number;
  status: 'success' | 'partial' | 'failed' | 'expired';
  commitSha?: string;
}
