import { describe, it, expect } from 'vitest';
import pino from 'pino';
import { Writable } from 'node:stream';
import { redactOptions } from '../src/lib/logger';

function capture() {
  const chunks: string[] = [];
  const stream = new Writable({
    write(chunk, _enc, cb) {
      chunks.push(chunk.toString());
      cb();
    },
  });
  const log = pino({ redact: redactOptions }, stream);
  return { log, out: () => chunks.join('') };
}

describe('git-service logger redaction (no secrets in logs)', () => {
  it('censors Authorization and Cookie request headers', () => {
    const { log, out } = capture();
    log.info(
      { req: { headers: { authorization: 'Bearer topsecret', cookie: 'cv_access=zzz' } } },
      'req',
    );
    const text = out();
    expect(text).not.toContain('topsecret');
    expect(text).not.toContain('cv_access=zzz');
    expect(text).toContain('[REDACTED]');
  });

  it('censors platform session tokens and encrypted material', () => {
    const { log, out } = capture();
    log.info({ sessionToken: 'LEETCODE_SESSION_abc', tokenCipher: 'deadbeef' }, 'sync');
    const text = out();
    expect(text).not.toContain('LEETCODE_SESSION_abc');
    expect(text).not.toContain('deadbeef');
  });
});
