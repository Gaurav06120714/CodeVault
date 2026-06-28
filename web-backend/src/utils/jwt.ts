import jwt from 'jsonwebtoken';
import { env } from '../config/env';

export interface JwtPayload {
  userId: string;
}

export const signToken = (payload: JwtPayload, expiresIn = '7d'): string => {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: expiresIn as any });
};

export const verifyToken = (token: string): JwtPayload => {
  return jwt.verify(token, env.JWT_SECRET) as JwtPayload;
};
