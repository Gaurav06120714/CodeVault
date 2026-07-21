import { describe, it, expect } from 'vitest';
import pino from 'pino';
import { Writable } from 'node:stream';
import { redactOptions } from '../logger';

// Build a logger with the SAME redaction config the app uses, writing to an
// in-memory stream so we can assert secrets never make it into the output.
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

describe('logger redaction (no secrets in logs)', () => {
  it('censors Authorization and Cookie request headers', () => {
    const { log, out } = capture();
    log.info(
      { req: { headers: { authorization: 'Bearer supersecrettoken', cookie: 'cv_access=abc123' } } },
      'incoming request',
    );
    const text = out();
    expect(text).not.toContain('supersecrettoken');
    expect(text).not.toContain('cv_access=abc123');
    expect(text).toContain('[REDACTED]');
  });

  it('censors token and password fields anywhere in the logged object', () => {
    const { log, out } = capture();
    log.info({ user: { password: 'hunter2', sessionToken: 'LEETCODE_SESSION_xyz' } }, 'user event');
    const text = out();
    expect(text).not.toContain('hunter2');
    expect(text).not.toContain('LEETCODE_SESSION_xyz');
    expect(text).toContain('[REDACTED]');
  });

  it('censors encrypted token material (tokenCipher)', () => {
    const { log, out } = capture();
    log.info({ tokenCipher: 'deadbeefcafe', tokenIv: 'ivvalue' }, 'secret persisted');
    const text = out();
    expect(text).not.toContain('deadbeefcafe');
    expect(text).not.toContain('ivvalue');
  });
});
