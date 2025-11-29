import type { Context, Next } from 'hono';
import { verifyAccessToken } from '../utils/jwt';
import { unauthorized } from '../utils/response';
import { db, users } from '../db';
import { eq } from 'drizzle-orm';
import type { AuthUser } from '../types';

/**
 * Extract bearer token from Authorization header
 */
function extractBearerToken(authHeader: string | undefined): string | null {
  if (!authHeader) return null;
  
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
    return null;
  }
  
  return parts[1];
}

/**
 * Authentication middleware
 * Validates JWT token and attaches user to context
 */
export function auth() {
  return async (c: Context, next: Next) => {
    const authHeader = c.req.header('Authorization');
    const token = extractBearerToken(authHeader);
    
    if (!token) {
      return unauthorized(c, 'Authentication token is required');
    }
    
    const payload = await verifyAccessToken(token);
    
    if (!payload) {
      return unauthorized(c, 'Invalid or expired token');
    }
    
    // Fetch user from database to ensure they still exist and are active
    const [user] = await db
      .select({
        id: users.id,
        email: users.email,
        role: users.role,
        firstName: users.firstName,
        lastName: users.lastName,
        isActive: users.isActive,
      })
      .from(users)
      .where(eq(users.id, payload.sub))
      .limit(1);
    
    if (!user || !user.isActive) {
      return unauthorized(c, 'User not found or inactive');
    }
    
    // Attach user to context
    const authUser: AuthUser = {
      id: user.id,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
    };
    
    c.set('user', authUser);
    
    await next();
  };
}

/**
 * Optional authentication middleware
 * Attaches user to context if token is provided and valid, but doesn't require it
 */
export function optionalAuth() {
  return async (c: Context, next: Next) => {
    const authHeader = c.req.header('Authorization');
    const token = extractBearerToken(authHeader);
    
    if (token) {
      const payload = await verifyAccessToken(token);
      
      if (payload) {
        const [user] = await db
          .select({
            id: users.id,
            email: users.email,
            role: users.role,
            firstName: users.firstName,
            lastName: users.lastName,
            isActive: users.isActive,
          })
          .from(users)
          .where(eq(users.id, payload.sub))
          .limit(1);
        
        if (user && user.isActive) {
          const authUser: AuthUser = {
            id: user.id,
            email: user.email,
            role: user.role,
            firstName: user.firstName,
            lastName: user.lastName,
          };
          
          c.set('user', authUser);
        }
      }
    }
    
    await next();
  };
}

