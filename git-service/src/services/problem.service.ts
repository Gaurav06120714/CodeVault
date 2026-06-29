import type { Question, SolutionToSync, Submission } from '../types/sync.types';

// Build the question.md content for a problem folder.
export function buildQuestionMarkdown(q: Question): string {
  const tags = q.topics.length ? q.topics.map((t) => `\`${t}\``).join(' · ') : '-';
  const link = q.url ? `[${q.url}](${q.url})` : '-';
  return `# ${q.number}. ${q.title}

| | |
|---|---|
| **Difficulty** | ${q.difficulty ?? '-'} |
| **Topics** | ${tags} |
| **Link** | ${link} |

---

${q.statementMarkdown || '_Statement not available._'}
`;
}

// Combine an accepted submission with its question statement into a push-ready item.
export function toSolutionToSync(sub: Submission, q: Question): SolutionToSync {
  return {
    platform: sub.platform,
    number: sub.number,
    slug: sub.slug,
    title: sub.title,
    difficulty: sub.difficulty ?? q.difficulty,
    topics: sub.topics.length ? sub.topics : q.topics,
    language: sub.language,
    code: sub.code,
    questionMarkdown: buildQuestionMarkdown(q),
    solvedAt: sub.solvedAt,
    url: sub.url ?? q.url,
  };
}
