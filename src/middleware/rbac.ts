import type { Context, Next } from 'hono';
import { forbidden, unauthorized } from '../utils/response';
import type { UserRole, AuthUser } from '../types';

/**
 * Role hierarchy - higher roles include permissions of lower roles
 */
const roleHierarchy: Record<UserRole, number> = {
  student: 1,
  organizer: 2,
  admin: 3,
};

/**
 * Check if a role has at least the minimum required role level
 */
function hasMinimumRole(userRole: UserRole, minimumRole: UserRole): boolean {
  return roleHierarchy[userRole] >= roleHierarchy[minimumRole];
}

/**
 * Role-based access control middleware
 * Requires user to have one of the specified roles
 */
export function requireRole(...allowedRoles: UserRole[]) {
  return async (c: Context, next: Next) => {
    const user = c.get('user') as AuthUser | undefined;
    
    if (!user) {
      return unauthorized(c, 'Authentication required');
    }
    
    if (!allowedRoles.includes(user.role)) {
      return forbidden(c, `Access denied. Required roles: ${allowedRoles.join(', ')}`);
    }
    
    await next();
  };
}

/**
 * Require minimum role level (includes higher roles)
 */
export function requireMinRole(minimumRole: UserRole) {
  return async (c: Context, next: Next) => {
    const user = c.get('user') as AuthUser | undefined;
    
    if (!user) {
      return unauthorized(c, 'Authentication required');
    }
    
    if (!hasMinimumRole(user.role, minimumRole)) {
      return forbidden(c, `Access denied. Minimum role required: ${minimumRole}`);
    }
    
    await next();
  };
}

/**
 * Require admin role
 */
export function requireAdmin() {
  return requireRole('admin');
}

/**
 * Require organizer role (or admin)
 */
export function requireOrganizer() {
  return requireMinRole('organizer');
}

/**
 * Resource ownership check middleware factory
 * Checks if the authenticated user owns the resource or is an admin
 */
export function requireOwnership(getOwnerId: (c: Context) => Promise<string | null>) {
  return async (c: Context, next: Next) => {
    const user = c.get('user') as AuthUser | undefined;
    
    if (!user) {
      return unauthorized(c, 'Authentication required');
    }
    
    // Admins can access any resource
    if (user.role === 'admin') {
      await next();
      return;
    }
    
    const ownerId = await getOwnerId(c);
    
    if (!ownerId || ownerId !== user.id) {
      return forbidden(c, 'You do not have permission to access this resource');
    }
    
    await next();
  };
}

/**
 * Check if current user is the owner or has minimum role
 */
export function requireOwnerOrRole(
  getOwnerId: (c: Context) => Promise<string | null>,
  minimumRole: UserRole
) {
  return async (c: Context, next: Next) => {
    const user = c.get('user') as AuthUser | undefined;
    
    if (!user) {
      return unauthorized(c, 'Authentication required');
    }
    
    // Check if user has minimum role
    if (hasMinimumRole(user.role, minimumRole)) {
      await next();
      return;
    }
    
    // Check ownership
    const ownerId = await getOwnerId(c);
    
    if (ownerId && ownerId === user.id) {
      await next();
      return;
    }
    
    return forbidden(c, 'You do not have permission to access this resource');
  };
}

