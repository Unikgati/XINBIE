import jwt from 'jsonwebtoken';
import { config } from '../config';

export function generateAccessToken(userId: string, role: string): string {
  return jwt.sign({ userId, role }, config.jwt.secret, {
    expiresIn: config.jwt.accessExpiry as any,
  });
}

export function generateRefreshToken(userId: string, role: string): string {
  return jwt.sign({ userId, role }, config.jwt.secret, {
    expiresIn: config.jwt.refreshExpiry as any,
  });
}

export function verifyToken(token: string): { userId: string; role: string } {
  return jwt.verify(token, config.jwt.secret) as { userId: string; role: string };
}
