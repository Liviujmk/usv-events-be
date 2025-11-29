import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { notificationsService } from './notifications.service';
import {
  createNotificationSchema,
  bulkNotificationSchema,
  queryNotificationsSchema,
} from './notifications.schema';
import { auth } from '../../middleware/auth';
import { requireAdmin } from '../../middleware/rbac';
import { success, error, successMessage, paginated, notFound } from '../../utils/response';
import type { AuthUser } from '../../types';
import type { Env } from '../../types/hono';

const notificationsController = new Hono<Env>();

/**
 * GET /notifications
 * Get current user's notifications
 */
notificationsController.get(
  '/',
  auth(),
  zValidator('query', queryNotificationsSchema),
  async (c) => {
    try {
      const user = c.get('user') as AuthUser;
      const query = c.req.valid('query');
      const result = await notificationsService.getUserNotifications(user.id, query);

      return c.json({
        success: true,
        data: result.data,
        unreadCount: result.unreadCount,
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: Math.ceil(result.total / result.limit),
        },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to get notifications';
      return error(c, message, 400);
    }
  }
);

/**
 * GET /notifications/unread-count
 * Get unread notification count
 */
notificationsController.get('/unread-count', auth(), async (c) => {
  try {
    const user = c.get('user') as AuthUser;
    const count = await notificationsService.getUnreadCount(user.id);
    return success(c, { unreadCount: count });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to get unread count';
    return error(c, message, 400);
  }
});

/**
 * POST /notifications/:id/read
 * Mark notification as read
 */
notificationsController.post('/:id/read', auth(), async (c) => {
  try {
    const { id } = c.req.param();
    const user = c.get('user') as AuthUser;

    const notification = await notificationsService.markAsRead(id, user.id);

    if (!notification) {
      return notFound(c, 'Notification not found');
    }

    return success(c, notification);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to mark as read';
    return error(c, message, 400);
  }
});

/**
 * POST /notifications/read-all
 * Mark all notifications as read
 */
notificationsController.post('/read-all', auth(), async (c) => {
  try {
    const user = c.get('user') as AuthUser;
    await notificationsService.markAllAsRead(user.id);
    return successMessage(c, 'All notifications marked as read');
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to mark all as read';
    return error(c, message, 400);
  }
});

/**
 * DELETE /notifications/:id
 * Delete a notification
 */
notificationsController.delete('/:id', auth(), async (c) => {
  try {
    const { id } = c.req.param();
    const user = c.get('user') as AuthUser;

    await notificationsService.deleteNotification(id, user.id);
    return successMessage(c, 'Notification deleted successfully');
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to delete notification';
    return error(c, message, 400);
  }
});

/**
 * POST /notifications (admin only)
 * Create a notification for a user
 */
notificationsController.post(
  '/',
  auth(),
  requireAdmin(),
  zValidator('json', createNotificationSchema),
  async (c) => {
    try {
      const input = c.req.valid('json');
      const notification = await notificationsService.createNotification(input);
      return success(c, notification, 201);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create notification';
      return error(c, message, 400);
    }
  }
);

/**
 * POST /notifications/bulk (admin only)
 * Create bulk notifications
 */
notificationsController.post(
  '/bulk',
  auth(),
  requireAdmin(),
  zValidator('json', bulkNotificationSchema),
  async (c) => {
    try {
      const input = c.req.valid('json');
      const notifications = await notificationsService.createBulkNotifications(input);
      return success(c, { created: notifications.length }, 201);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create notifications';
      return error(c, message, 400);
    }
  }
);

export { notificationsController };

