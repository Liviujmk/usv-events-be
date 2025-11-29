import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { usersService } from './users.service';
import {
  updateProfileSchema,
  updateInterestsSchema,
  updateUserRoleSchema,
  updateUserStatusSchema,
  listUsersQuerySchema,
} from './users.schema';
import { auth } from '../../middleware/auth';
import { requireAdmin } from '../../middleware/rbac';
import { success, error, paginated, notFound } from '../../utils/response';
import type { AuthUser } from '../../types';
import type { Env } from '../../types/hono';

const usersController = new Hono<Env>();

/**
 * GET /users/me
 * Get current user's full profile
 */
usersController.get('/me', auth(), async (c) => {
  try {
    const user = c.get('user') as AuthUser;
    const profile = await usersService.getUserById(user.id);

    if (!profile) {
      return notFound(c, 'User not found');
    }

    return success(c, profile);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to get profile';
    return error(c, message, 400);
  }
});

/**
 * PATCH /users/me
 * Update current user's profile
 */
usersController.patch(
  '/me',
  auth(),
  zValidator('json', updateProfileSchema),
  async (c) => {
    try {
      const user = c.get('user') as AuthUser;
      const input = c.req.valid('json');
      const updated = await usersService.updateProfile(user.id, input);
      return success(c, updated);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update profile';
      return error(c, message, 400);
    }
  }
);

/**
 * GET /users/me/interests
 * Get current user's interests
 */
usersController.get('/me/interests', auth(), async (c) => {
  try {
    const user = c.get('user') as AuthUser;
    const interests = await usersService.getUserInterests(user.id);
    return success(c, { interests });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to get interests';
    return error(c, message, 400);
  }
});

/**
 * PUT /users/me/interests
 * Update current user's interests
 */
usersController.put(
  '/me/interests',
  auth(),
  zValidator('json', updateInterestsSchema),
  async (c) => {
    try {
      const user = c.get('user') as AuthUser;
      const { interests } = c.req.valid('json');
      const updated = await usersService.updateInterests(user.id, interests);
      return success(c, { interests: updated });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update interests';
      return error(c, message, 400);
    }
  }
);

/**
 * GET /users
 * List all users (admin only)
 */
usersController.get(
  '/',
  auth(),
  requireAdmin(),
  zValidator('query', listUsersQuerySchema),
  async (c) => {
    try {
      const query = c.req.valid('query');
      const result = await usersService.listUsers(query);
      return paginated(c, result.data, result.page, result.limit, result.total);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to list users';
      return error(c, message, 400);
    }
  }
);

/**
 * GET /users/:id
 * Get user by ID (admin only)
 */
usersController.get('/:id', auth(), requireAdmin(), async (c) => {
  try {
    const { id } = c.req.param();
    const user = await usersService.getUserById(id);

    if (!user) {
      return notFound(c, 'User not found');
    }

    return success(c, user);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to get user';
    return error(c, message, 400);
  }
});

/**
 * PATCH /users/:id/role
 * Update user role (admin only)
 */
usersController.patch(
  '/:id/role',
  auth(),
  requireAdmin(),
  zValidator('json', updateUserRoleSchema),
  async (c) => {
    try {
      const { id } = c.req.param();
      const { role } = c.req.valid('json');
      const updated = await usersService.updateUserRole(id, role);
      return success(c, updated);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update user role';
      return error(c, message, 400);
    }
  }
);

/**
 * PATCH /users/:id/status
 * Update user status (admin only)
 */
usersController.patch(
  '/:id/status',
  auth(),
  requireAdmin(),
  zValidator('json', updateUserStatusSchema),
  async (c) => {
    try {
      const { id } = c.req.param();
      const { isActive } = c.req.valid('json');
      const updated = await usersService.updateUserStatus(id, isActive);
      return success(c, updated);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update user status';
      return error(c, message, 400);
    }
  }
);

export { usersController };

