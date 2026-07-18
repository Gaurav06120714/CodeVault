import { platformColor, difficultyColor } from './theme';

/**
 * Normalizes the web-backend `/api/stats` payload
 * `{ totalSolved, platforms: { leetcode:{...}, codeforces:{...}, ... } }`
 * into view-models the dashboard/analytics screens render. Defensive: every
 * platform integration returns a slightly different shape.
 */
export type StatsVM = {
  totalSolved: number;
  connected: string[];
  byDifficulty: { easy: number; medium: number; hard: number };
  perPlatform: { label: string; value: number; color: string }[];
  languages: { label: string; value: number }[];
  topics: { label: string; value: number }[];
  ratings: { platform: string; current: number; peak: number }[];
  heatmap: { count: number }[];
  recent: { title: string; platform: string; when: string }[];
};

function parseLeetHeatmap(raw: any): { count: number }[] {
  let cal: Record<string, number> = {};
  try {
    cal = typeof raw === 'string' ? JSON.parse(raw || '{}') : raw || {};
  } catch {
    cal = {};
  }
  // Full last 12 months (like the web), horizontally scrollable on phone.
  const DAYS = 371; // 53 weeks
  const byDay = new Map<string, number>();
  for (const [ts, count] of Object.entries(cal)) {
    const key = new Date(Number(ts) * 1000).toISOString().slice(0, 10);
    byDay.set(key, (byDay.get(key) || 0) + Number(count));
  }
  const out: { count: number }[] = [];
  const today = new Date();
  const first = new Date(today);
  first.setDate(today.getDate() - (DAYS - 1));
  // Pad the leading partial week so rows line up to weekday (0 = Sunday).
  for (let p = 0; p < first.getDay(); p++) out.push({ count: -1 });
  for (let i = DAYS - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    out.push({ count: byDay.get(d.toISOString().slice(0, 10)) || 0 });
  }
  return out;
}

export function normalizeStats(data: any): StatsVM {
  const platforms = data?.platforms ?? {};
  const connected = Object.keys(platforms);

  const byDifficulty = { easy: 0, medium: 0, hard: 0 };
  const perPlatform: StatsVM['perPlatform'] = [];
  const ratings: StatsVM['ratings'] = [];
  let languages: StatsVM['languages'] = [];
  let topics: StatsVM['topics'] = [];
  let heatmap: { count: number }[] = [];
  const recent: StatsVM['recent'] = [];

  for (const [name, pRaw] of Object.entries(platforms)) {
    const p: any = pRaw || {};
    perPlatform.push({
      label: name,
      value: p.total || 0,
      color: platformColor[name] || '#888',
    });
    byDifficulty.easy += p.easy || 0;
    byDifficulty.medium += p.medium || 0;
    byDifficulty.hard += p.hard || 0;

    if (typeof p.rating === 'number' || typeof p.maxRating === 'number') {
      ratings.push({
        platform: name,
        current: p.rating || p.currentRating || 0,
        peak: p.maxRating || p.peakRating || p.rating || 0,
      });
    }

    // Languages (LeetCode: [{ languageName, problemsSolved }])
    if (Array.isArray(p.languages)) {
      languages = languages.concat(
        p.languages.map((l: any) => ({
          label: l.languageName || l.name || 'lang',
          value: l.problemsSolved || l.count || 0,
        })),
      );
    }

    // Topics (LeetCode: tagProblemCounts { advanced, intermediate, fundamental })
    const t = p.topics;
    if (t && !Array.isArray(t)) {
      const flat = [
        ...(t.advanced || []),
        ...(t.intermediate || []),
        ...(t.fundamental || []),
      ];
      topics = topics.concat(
        flat.map((x: any) => ({ label: x.tagName || x.name, value: x.problemsSolved || 0 })),
      );
    }

    if (p.heatmap) heatmap = parseLeetHeatmap(p.heatmap);

    if (Array.isArray(p.recent)) {
      for (const r of p.recent) {
        recent.push({
          title: r.title || r.titleSlug || 'Solved',
          platform: name,
          when: r.timestamp
            ? new Date(Number(r.timestamp) * 1000).toLocaleDateString()
            : '',
        });
      }
    }
  }

  languages.sort((a, b) => b.value - a.value);
  topics.sort((a, b) => b.value - a.value);

  return {
    totalSolved: data?.totalSolved ?? perPlatform.reduce((a, b) => a + b.value, 0),
    connected,
    byDifficulty,
    perPlatform,
    languages: languages.slice(0, 6),
    topics: topics.slice(0, 8),
    ratings,
    heatmap,
    recent: recent.slice(0, 12),
  };
}

export const diffColors = difficultyColor;
