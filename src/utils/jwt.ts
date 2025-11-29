import { sign, verify, decode } from 'hono/jwt';
import { config } from '../config';
import type { JwtPayload, AuthUser } from '../types';

/**
 * Generate an access token for a user
 */
export async function generateAccessToken(user: AuthUser): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    sub: user.id,
    email: user.email,
    role: user.role,
    iat: now,
    exp: now + 15 * 60, // 15 minutes
    iss: config.jwt.issuer,
  };
  
  return sign(payload, config.jwt.secret);
}

/**
 * Generate a refresh token
 */
export async function generateRefreshToken(userId: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    sub: userId,
    type: 'refresh',
    iat: now,
    exp: now + 7 * 24 * 60 * 60, // 7 days
    iss: config.jwt.issuer,
  };
  
  return sign(payload, config.jwt.secret);
}

/**
 * Verify and decode an access token
 */
export async function verifyAccessToken(token: string): Promise<JwtPayload | null> {
  try {
    const payload = await verify(token, config.jwt.secret);
    return payload as unknown as JwtPayload;
  } catch {
    return null;
  }
}

/**
 * Verify a refresh token
 */
export async function verifyRefreshToken(token: string): Promise<{ sub: string } | null> {
  try {
    const payload = await verify(token, config.jwt.secret) as { sub: string; type: string };
    if (payload.type !== 'refresh') {
      return null;
    }
    return { sub: payload.sub };
  } catch {
    return null;
  }
}

/**
 * Get expiry date for refresh token (7 days from now)
 */
export function getRefreshTokenExpiry(): Date {
  return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
}

