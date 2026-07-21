import { defineConfig } from 'vitest/config';

// Test-time env so `src/config/env.ts` parses without a real .env
// (it process.exit(1)s on invalid env). These are dummy values; the crypto/jwt
// tests read them back from process.env so the values always match.
export default defineConfig({
  test: {
    env: {
      NODE_ENV: 'test',
      DATABASE_URL: 'postgresql://test:test@localhost:5433/codevault_test',
      JWT_SECRET: 'test-jwt-secret-at-least-thirty-two-characters-long',
      ENCRYPTION_KEY: 'a'.repeat(64), // 64 hex chars = 32 bytes
      REDIS_URL: 'redis://localhost:6380',
    },
    coverage: {
      provider: 'v8',
      reporter: ['text-summary', 'json', 'html'],
    },
  },
});
