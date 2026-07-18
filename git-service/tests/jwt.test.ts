import { describe, it, expect } from 'vitest';
import jwt from 'jsonwebtoken';
import { verifyToken } from '../src/lib/jwt';

const secret = process.env.JWT_SECRET!;

describe('verifyToken (S1 access token — signed by web-backend, verified here)', () => {
  it('returns the payload for a valid token', () => {
    const token = jwt.sign({ userId: 'user_123' }, secret);
    expect(verifyToken(token).userId).toBe('user_123');
  });

  it('throws for a token signed with a different secret', () => {
    const token = jwt.sign({ userId: 'x' }, 'a-completely-different-secret-32chars!!');
    expect(() => verifyToken(token)).toThrow();
  });

  it('throws for an expired token', () => {
    const token = jwt.sign({ userId: 'x' }, secret, { expiresIn: -10 });
    expect(() => verifyToken(token)).toThrow();
  });

  it('throws for a malformed token', () => {
    expect(() => verifyToken('not.a.jwt')).toThrow();
  });
});
