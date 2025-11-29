import { relations, sql } from 'drizzle-orm';
import {
  boolean,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
  varchar,
  jsonb,
  decimal,
} from 'drizzle-orm/pg-core';

// ==================== ENUMS ====================

export const userRoleEnum = pgEnum('user_role', ['student', 'organizer', 'admin']);
export const eventStatusEnum = pgEnum('event_status', ['draft', 'pending', 'approved', 'rejected', 'cancelled', 'completed']);
export const eventTypeEnum = pgEnum('event_type', ['academic', 'social', 'career', 'sports', 'volunteering', 'cultural', 'workshop', 'conference', 'other']);
export const registrationStatusEnum = pgEnum('registration_status', ['pending', 'confirmed', 'cancelled', 'attended']);
export const notificationTypeEnum = pgEnum('notification_type', ['event_reminder', 'event_update', 'registration_confirmed', 'event_cancelled', 'recommendation', 'feedback_request']);

// ==================== USERS TABLE ====================

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: varchar('password', { length: 255 }).notNull(),
  firstName: varchar('first_name', { length: 100 }).notNull(),
  lastName: varchar('last_name', { length: 100 }).notNull(),
  role: userRoleEnum('role').default('student').notNull(),
  facultyId: uuid('faculty_id').references(() => faculties.id),
  profileImage: varchar('profile_image', { length: 500 }),
  phone: varchar('phone', { length: 20 }),
  bio: text('bio'),
  isActive: boolean('is_active').default(true).notNull(),
  emailVerified: boolean('email_verified').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ==================== FACULTIES TABLE ====================

export const faculties = pgTable('faculties', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull().unique(),
  abbreviation: varchar('abbreviation', { length: 20 }).notNull(),
  description: text('description'),
  website: varchar('website', { length: 255 }),
  contactEmail: varchar('contact_email', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ==================== DEPARTMENTS TABLE ====================

export const departments = pgTable('departments', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  facultyId: uuid('faculty_id').references(() => faculties.id).notNull(),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ==================== ORGANIZER PROFILES TABLE ====================

export const organizerProfiles = pgTable('organizer_profiles', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id).notNull().unique(),
  organizationName: varchar('organization_name', { length: 255 }).notNull(),
  organizationType: varchar('organization_type', { length: 100 }), // e.g., 'club', 'association', 'faculty'
  description: text('description'),
  website: varchar('website', { length: 255 }),
  socialLinks: jsonb('social_links'), // { facebook, instagram, linkedin, etc. }
  isVerified: boolean('is_verified').default(false).notNull(),
  verifiedAt: timestamp('verified_at'),
  verifiedBy: uuid('verified_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ==================== EVENTS TABLE ====================

export const events = pgTable('events', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 300 }).notNull().unique(),
  description: text('description').notNull(),
  shortDescription: varchar('short_description', { length: 500 }),
  type: eventTypeEnum('type').default('other').notNull(),
  status: eventStatusEnum('status').default('draft').notNull(),
  
  // Organizer info
  organizerId: uuid('organizer_id').references(() => users.id).notNull(),
  facultyId: uuid('faculty_id').references(() => faculties.id),
  departmentId: uuid('department_id').references(() => departments.id),
  
  // Date and time
  startDate: timestamp('start_date').notNull(),
  endDate: timestamp('end_date').notNull(),
  registrationDeadline: timestamp('registration_deadline'),
  
  // Location
  location: varchar('location', { length: 255 }).notNull(),
  address: varchar('address', { length: 500 }),
  isOnline: boolean('is_online').default(false).notNull(),
  onlineLink: varchar('online_link', { length: 500 }),
  
  // Capacity
  maxParticipants: integer('max_participants'),
  currentParticipants: integer('current_participants').default(0).notNull(),
  
  // Media
  coverImage: varchar('cover_image', { length: 500 }),
  images: jsonb('images').$type<string[]>(),
  
  // Approval
  approvedAt: timestamp('approved_at'),
  approvedBy: uuid('approved_by').references(() => users.id),
  rejectionReason: text('rejection_reason'),
  
  // Metadata
  tags: jsonb('tags').$type<string[]>(),
  requirements: text('requirements'),
  targetAudience: varchar('target_audience', { length: 255 }),
  isFeatured: boolean('is_featured').default(false).notNull(),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ==================== EVENT REGISTRATIONS TABLE ====================

export const eventRegistrations = pgTable('event_registrations', {
  id: uuid('id').defaultRandom().primaryKey(),
  eventId: uuid('event_id').references(() => events.id).notNull(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  status: registrationStatusEnum('status').default('pending').notNull(),
  qrCode: varchar('qr_code', { length: 500 }).unique(),
  ticketNumber: varchar('ticket_number', { length: 50 }).unique(),
  checkedInAt: timestamp('checked_in_at'),
  checkedInBy: uuid('checked_in_by').references(() => users.id),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  // Unique constraint: one registration per user per event
]);

// ==================== EVENT FAVORITES TABLE ====================

export const eventFavorites = pgTable('event_favorites', {
  userId: uuid('user_id').references(() => users.id).notNull(),
  eventId: uuid('event_id').references(() => events.id).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  primaryKey({ columns: [table.userId, table.eventId] }),
]);

// ==================== USER INTERESTS TABLE ====================

export const userInterests = pgTable('user_interests', {
  userId: uuid('user_id').references(() => users.id).notNull(),
  eventType: eventTypeEnum('event_type').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  primaryKey({ columns: [table.userId, table.eventType] }),
]);

// ==================== NOTIFICATIONS TABLE ====================

export const notifications = pgTable('notifications', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  type: notificationTypeEnum('type').notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  message: text('message').notNull(),
  data: jsonb('data'), // Additional data like eventId, etc.
  isRead: boolean('is_read').default(false).notNull(),
  readAt: timestamp('read_at'),
  scheduledFor: timestamp('scheduled_for'),
  sentAt: timestamp('sent_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ==================== EVENT FEEDBACK TABLE ====================

export const eventFeedback = pgTable('event_feedback', {
  id: uuid('id').defaultRandom().primaryKey(),
  eventId: uuid('event_id').references(() => events.id).notNull(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  rating: integer('rating').notNull(), // 1-5
  comment: text('comment'),
  isAnonymous: boolean('is_anonymous').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ==================== EVENT MATERIALS TABLE ====================

export const eventMaterials = pgTable('event_materials', {
  id: uuid('id').defaultRandom().primaryKey(),
  eventId: uuid('event_id').references(() => events.id).notNull(),
  uploadedBy: uuid('uploaded_by').references(() => users.id).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  fileUrl: varchar('file_url', { length: 500 }).notNull(),
  fileType: varchar('file_type', { length: 50 }).notNull(), // pdf, ppt, image, etc.
  fileSize: integer('file_size'), // in bytes
  isPublic: boolean('is_public').default(true).notNull(),
  downloadCount: integer('download_count').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ==================== REFRESH TOKENS TABLE ====================

export const refreshTokens = pgTable('refresh_tokens', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  token: varchar('token', { length: 500 }).notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ==================== AUDIT LOG TABLE ====================

export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id),
  action: varchar('action', { length: 100 }).notNull(),
  entityType: varchar('entity_type', { length: 50 }).notNull(),
  entityId: uuid('entity_id'),
  oldData: jsonb('old_data'),
  newData: jsonb('new_data'),
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: varchar('user_agent', { length: 500 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ==================== RELATIONS ====================

export const usersRelations = relations(users, ({ one, many }) => ({
  faculty: one(faculties, {
    fields: [users.facultyId],
    references: [faculties.id],
  }),
  organizerProfile: one(organizerProfiles, {
    fields: [users.id],
    references: [organizerProfiles.userId],
  }),
  organizedEvents: many(events),
  registrations: many(eventRegistrations),
  favorites: many(eventFavorites),
  interests: many(userInterests),
  notifications: many(notifications),
  feedback: many(eventFeedback),
  refreshTokens: many(refreshTokens),
}));

export const facultiesRelations = relations(faculties, ({ many }) => ({
  users: many(users),
  departments: many(departments),
  events: many(events),
}));

export const departmentsRelations = relations(departments, ({ one, many }) => ({
  faculty: one(faculties, {
    fields: [departments.facultyId],
    references: [faculties.id],
  }),
  events: many(events),
}));

export const organizerProfilesRelations = relations(organizerProfiles, ({ one }) => ({
  user: one(users, {
    fields: [organizerProfiles.userId],
    references: [users.id],
  }),
  verifier: one(users, {
    fields: [organizerProfiles.verifiedBy],
    references: [users.id],
  }),
}));

export const eventsRelations = relations(events, ({ one, many }) => ({
  organizer: one(users, {
    fields: [events.organizerId],
    references: [users.id],
  }),
  faculty: one(faculties, {
    fields: [events.facultyId],
    references: [faculties.id],
  }),
  department: one(departments, {
    fields: [events.departmentId],
    references: [departments.id],
  }),
  approver: one(users, {
    fields: [events.approvedBy],
    references: [users.id],
  }),
  registrations: many(eventRegistrations),
  favorites: many(eventFavorites),
  feedback: many(eventFeedback),
  materials: many(eventMaterials),
}));

export const eventRegistrationsRelations = relations(eventRegistrations, ({ one }) => ({
  event: one(events, {
    fields: [eventRegistrations.eventId],
    references: [events.id],
  }),
  user: one(users, {
    fields: [eventRegistrations.userId],
    references: [users.id],
  }),
  checkedInByUser: one(users, {
    fields: [eventRegistrations.checkedInBy],
    references: [users.id],
  }),
}));

export const eventFavoritesRelations = relations(eventFavorites, ({ one }) => ({
  user: one(users, {
    fields: [eventFavorites.userId],
    references: [users.id],
  }),
  event: one(events, {
    fields: [eventFavorites.eventId],
    references: [events.id],
  }),
}));

export const userInterestsRelations = relations(userInterests, ({ one }) => ({
  user: one(users, {
    fields: [userInterests.userId],
    references: [users.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));

export const eventFeedbackRelations = relations(eventFeedback, ({ one }) => ({
  event: one(events, {
    fields: [eventFeedback.eventId],
    references: [events.id],
  }),
  user: one(users, {
    fields: [eventFeedback.userId],
    references: [users.id],
  }),
}));

export const eventMaterialsRelations = relations(eventMaterials, ({ one }) => ({
  event: one(events, {
    fields: [eventMaterials.eventId],
    references: [events.id],
  }),
  uploader: one(users, {
    fields: [eventMaterials.uploadedBy],
    references: [users.id],
  }),
}));

export const refreshTokensRelations = relations(refreshTokens, ({ one }) => ({
  user: one(users, {
    fields: [refreshTokens.userId],
    references: [users.id],
  }),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  user: one(users, {
    fields: [auditLogs.userId],
    references: [users.id],
  }),
}));
