// Shared types for git-service.

export type UserRole = 'user' | 'admin';

export type PlatformName = 'leetcode' | 'codeforces' | 'codechef' | 'hackerrank';

export const PLATFORMS: readonly PlatformName[] = [
  'leetcode',
  'codeforces',
  'codechef',
  'hackerrank',
] as const;

// Claims carried by the access JWT issued by web-backend and verified here (S1).
export interface JwtClaims {
  sub: string; // user id
  role: UserRole;
  handle: string;
  iat?: number;
  exp?: number;
}

export interface AuthUser {
  id: string;
  role: UserRole;
  handle: string;
}

export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
  };
}

export interface Paginated<T> {
  items: T[];
  nextCursor: string | null;
}

export interface HealthStatus {
  status: 'ok';
  service: 'git-service';
  uptime: number;
}

export interface ReadinessStatus {
  status: 'ready' | 'degraded';
  db: boolean;
  redis: boolean;
}
