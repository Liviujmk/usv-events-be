import { eq, and, desc, count } from 'drizzle-orm';
import { db, notifications } from '../../db';
import { log } from '../../middleware/logger';
import { parsePagination } from '../../utils/pagination';
import type { CreateNotificationInput, BulkNotificationInput, QueryNotificationsInput } from './notifications.schema';
import type { NotificationType } from '../../types';

export class NotificationsService {
  /**
   * Create a notification
   */
  async createNotification(input: CreateNotificationInput) {
    const [notification] = await db
      .insert(notifications)
      .values({
        userId: input.userId,
        type: input.type,
        title: input.title,
        message: input.message,
        data: input.data,
        scheduledFor: input.scheduledFor ? new Date(input.scheduledFor) : null,
      })
      .returning();

    log.info(`Notification created for user ${input.userId}: ${input.title}`);
    return notification;
  }

  /**
   * Create bulk notifications
   */
  async createBulkNotifications(input: BulkNotificationInput) {
    const notificationValues = input.userIds.map((userId) => ({
      userId,
      type: input.type as NotificationType,
      title: input.title,
      message: input.message,
      data: input.data,
    }));

    const result = await db.insert(notifications).values(notificationValues).returning();

    log.info(`Bulk notifications created for ${input.userIds.length} users`);
    return result;
  }

  /**
   * Get user's notifications
   */
  async getUserNotifications(userId: string, query: QueryNotificationsInput) {
    const { page, limit, offset } = parsePagination(query.page, query.limit);

    const conditions = [eq(notifications.userId, userId)];

    if (query.isRead !== undefined) {
      conditions.push(eq(notifications.isRead, query.isRead === 'true'));
    }

    if (query.type) {
      conditions.push(eq(notifications.type, query.type));
    }

    const whereClause = and(...conditions);

    const [data, totalResult, unreadResult] = await Promise.all([
      db
        .select()
        .from(notifications)
        .where(whereClause)
        .limit(limit)
        .offset(offset)
        .orderBy(desc(notifications.createdAt)),
      db.select({ count: count() }).from(notifications).where(whereClause),
      db
        .select({ count: count() })
        .from(notifications)
        .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false))),
    ]);

    return {
      data,
      total: totalResult[0]?.count || 0,
      unreadCount: unreadResult[0]?.count || 0,
      page,
      limit,
    };
  }

  /**
   * Get notification by ID
   */
  async getNotificationById(notificationId: string) {
    return db.query.notifications.findFirst({
      where: eq(notifications.id, notificationId),
    });
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string, userId: string) {
    const [updated] = await db
      .update(notifications)
      .set({
        isRead: true,
        readAt: new Date(),
      })
      .where(
        and(
          eq(notifications.id, notificationId),
          eq(notifications.userId, userId)
        )
      )
      .returning();

    return updated;
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(userId: string) {
    await db
      .update(notifications)
      .set({
        isRead: true,
        readAt: new Date(),
      })
      .where(
        and(
          eq(notifications.userId, userId),
          eq(notifications.isRead, false)
        )
      );

    log.info(`All notifications marked as read for user ${userId}`);
  }

  /**
   * Delete notification
   */
  async deleteNotification(notificationId: string, userId: string) {
    const [deleted] = await db
      .delete(notifications)
      .where(
        and(
          eq(notifications.id, notificationId),
          eq(notifications.userId, userId)
        )
      )
      .returning();

    if (!deleted) {
      throw new Error('Notification not found');
    }

    log.info(`Notification deleted: ${notificationId}`);
  }

  /**
   * Get unread count for user
   */
  async getUnreadCount(userId: string): Promise<number> {
    const [result] = await db
      .select({ count: count() })
      .from(notifications)
      .where(
        and(
          eq(notifications.userId, userId),
          eq(notifications.isRead, false)
        )
      );

    return result?.count || 0;
  }

  /**
   * Send event reminder notifications (would be called by a cron job)
   */
  async sendEventReminders(eventId: string, eventTitle: string, eventDate: Date) {
    // This would typically query registered users and create notifications
    // For now, this is a placeholder for the notification logic
    log.info(`Event reminder notifications sent for event: ${eventId}`);
  }

  /**
   * Send event update notification to all registered users
   */
  async notifyEventUpdate(
    eventId: string,
    eventTitle: string,
    updateMessage: string,
    userIds: string[]
  ) {
    if (userIds.length === 0) return;

    await this.createBulkNotifications({
      userIds,
      type: 'event_update',
      title: `Update: ${eventTitle}`,
      message: updateMessage,
      data: { eventId },
    });
  }

  /**
   * Send registration confirmation notification
   */
  async sendRegistrationConfirmation(
    userId: string,
    eventId: string,
    eventTitle: string,
    ticketNumber: string
  ) {
    await this.createNotification({
      userId,
      type: 'registration_confirmed',
      title: 'Registration Confirmed',
      message: `You are registered for "${eventTitle}". Your ticket number is ${ticketNumber}.`,
      data: { eventId, ticketNumber },
    });
  }

  /**
   * Send feedback request notification
   */
  async sendFeedbackRequest(userId: string, eventId: string, eventTitle: string) {
    await this.createNotification({
      userId,
      type: 'feedback_request',
      title: 'Share Your Feedback',
      message: `How was your experience at "${eventTitle}"? We'd love to hear your feedback!`,
      data: { eventId },
    });
  }
}

export const notificationsService = new NotificationsService();

