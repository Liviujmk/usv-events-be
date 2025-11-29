import { z } from 'zod';

// Notification type enum
const notificationTypeEnum = z.enum([
  'event_reminder',
  'event_update',
  'registration_confirmed',
  'event_cancelled',
  'recommendation',
  'feedback_request',
]);

// Create notification schema (admin only)
export const createNotificationSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  type: notificationTypeEnum,
  title: z.string().min(1).max(255),
  message: z.string().min(1),
  data: z.record(z.string(), z.unknown()).optional(),
  scheduledFor: z.string().datetime().optional(),
});

// Bulk notification schema
export const bulkNotificationSchema = z.object({
  userIds: z.array(z.string().uuid()).min(1),
  type: notificationTypeEnum,
  title: z.string().min(1).max(255),
  message: z.string().min(1),
  data: z.record(z.string(), z.unknown()).optional(),
});

// Query notifications schema
export const queryNotificationsSchema = z.object({
  page: z.string().optional().default('1'),
  limit: z.string().optional().default('20'),
  isRead: z.enum(['true', 'false']).optional(),
  type: notificationTypeEnum.optional(),
});

// Types
export type CreateNotificationInput = z.infer<typeof createNotificationSchema>;
export type BulkNotificationInput = z.infer<typeof bulkNotificationSchema>;
export type QueryNotificationsInput = z.infer<typeof queryNotificationsSchema>;

