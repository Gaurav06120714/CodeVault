// A single file to commit to a repo.
export interface GithubFile {
  path: string; // e.g. "0369/solution.py"
  content: string; // UTF-8 text
}

export interface RepoRef {
  owner: string;
  repo: string;
}

export interface CommitInfo {
  sha: string;
  message: string;
  committedAt: string;
}

// One row in the auto-generated repo index README.
export interface RepoFileEntry {
  number: string; // padded
  slug: string;
  title: string;
  difficulty?: string;
  language: string;
  solutionPath: string;
  url?: string; // platform problem link
  solvedAt?: string;
}
