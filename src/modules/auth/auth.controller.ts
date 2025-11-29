import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { authService } from './auth.service';
import { registerSchema, loginSchema, refreshTokenSchema, changePasswordSchema } from './auth.schema';
import { auth } from '../../middleware/auth';
import { success, error, successMessage } from '../../utils/response';
import type { AuthUser } from '../../types';
import type { Env } from '../../types/hono';

const authController = new Hono<Env>();

/**
 * POST /auth/register
 * Register a new user
 */
authController.post(
  '/register',
  zValidator('json', registerSchema),
  async (c) => {
    try {
      const input = c.req.valid('json');
      const result = await authService.register(input);
      return success(c, result, 201);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Registration failed';
      return error(c, message, 400);
    }
  }
);

/**
 * POST /auth/login
 * Login user
 */
authController.post(
  '/login',
  zValidator('json', loginSchema),
  async (c) => {
    try {
      const input = c.req.valid('json');
      const result = await authService.login(input);
      return success(c, result);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed';
      return error(c, message, 401);
    }
  }
);

/**
 * POST /auth/refresh
 * Refresh access token
 */
authController.post(
  '/refresh',
  zValidator('json', refreshTokenSchema),
  async (c) => {
    try {
      const { refreshToken } = c.req.valid('json');
      const result = await authService.refreshAccessToken(refreshToken);
      return success(c, result);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Token refresh failed';
      return error(c, message, 401);
    }
  }
);

/**
 * POST /auth/logout
 * Logout user
 */
authController.post('/logout', auth(), async (c) => {
  try {
    const user = c.get('user') as AuthUser;
    const body = await c.req.json().catch(() => ({}));
    await authService.logout(user.id, body.refreshToken);
    return successMessage(c, 'Logged out successfully');
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Logout failed';
    return error(c, message, 400);
  }
});

/**
 * POST /auth/change-password
 * Change user password
 */
authController.post(
  '/change-password',
  auth(),
  zValidator('json', changePasswordSchema),
  async (c) => {
    try {
      const user = c.get('user') as AuthUser;
      const { currentPassword, newPassword } = c.req.valid('json');
      await authService.changePassword(user.id, currentPassword, newPassword);
      return successMessage(c, 'Password changed successfully');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Password change failed';
      return error(c, message, 400);
    }
  }
);

/**
 * GET /auth/me
 * Get current user profile
 */
authController.get('/me', auth(), async (c) => {
  try {
    const user = c.get('user') as AuthUser;
    const profile = await authService.getProfile(user.id);
    return success(c, profile);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to get profile';
    return error(c, message, 400);
  }
});

export { authController };

