import type { RepoFileEntry } from '../../types/github.types';

/**
 * Build the repo's index README — a table of every synced problem. Regenerated
 * after each sync run so the index always reflects what's in the repo.
 */
export function generateReadme(repoName: string, entries: RepoFileEntry[]): string {
  const rows = entries
    .slice()
    .sort((a, b) => a.number.localeCompare(b.number))
    .map((e) => `| ${e.number} | [${e.title}](${e.path}) | ${e.language} |`)
    .join('\n');

  return `# ${repoName}

> Auto-synced by [CodeVault](https://github.com/Gaurav06120714/CodeVault). ${entries.length} solutions.

| # | Problem | Language |
|---|---------|----------|
${rows}
`;
}
