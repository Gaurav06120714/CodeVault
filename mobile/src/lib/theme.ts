/** CodeVault palette — mirrors the web app's warm cream + signal-red look. */
export const colors = {
  bg: '#fffcf5',
  card: '#ffffff',
  cardAlt: '#fbf8ef',
  border: '#e6e1d3',
  ink: '#26241d',
  muted: '#6f6d61',
  faint: '#9c9a8e',
  brand: '#f1543f',
  brandSoft: '#fde7e2',
  green: '#2f9e6f',
  blue: '#3b82f6',
  amber: '#e8a13a',
  purple: '#8b5cf6',
};

/** Per-platform accent colors. */
export const platformColor: Record<string, string> = {
  leetcode: '#f89f1b',
  codeforces: '#1f8acb',
  codechef: '#8b5e3c',
  hackerrank: '#2ec866',
};

export const difficultyColor = {
  easy: '#2f9e6f',
  medium: '#e8a13a',
  hard: '#f1543f',
};

export const radius = { sm: 8, md: 12, lg: 16 };
export const space = (n: number) => n * 4;
