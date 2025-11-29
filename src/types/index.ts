import type { Context } from 'hono';
import type { users } from '../db/schema';

// User role type
export type UserRole = 'student' | 'organizer' | 'admin';

// Event status type
export type EventStatus = 'draft' | 'pending' | 'approved' | 'rejected' | 'cancelled' | 'completed';

// Event type
export type EventType = 'academic' | 'social' | 'career' | 'sports' | 'volunteering' | 'cultural' | 'workshop' | 'conference' | 'other';

// Registration status type
export type RegistrationStatus = 'pending' | 'confirmed' | 'cancelled' | 'attended';

// Notification type
export type NotificationType = 'event_reminder' | 'event_update' | 'registration_confirmed' | 'event_cancelled' | 'recommendation' | 'feedback_request';

// JWT Payload
export interface JwtPayload {
  sub: string; // user id
  email: string;
  role: UserRole;
  iat: number;
  exp: number;
  iss: string;
}

// Authenticated user in context
export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  firstName: string;
  lastName: string;
}

// Variables for Hono context
export interface Variables {
  user: AuthUser;
  requestId: string;
  startTime: number;
}

// Bindings for environment
export interface Bindings {
  DATABASE_URL: string;
  JWT_SECRET: string;
}

// App context type
export type AppContext = Context<{ Variables: Variables; Bindings: Bindings }>;

// Pagination params
export interface PaginationParams {
  page: number;
  limit: number;
  offset: number;
}

// Paginated response
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: Record<string, string[]>;
}

// Filter options for events
export interface EventFilters {
  type?: EventType;
  status?: EventStatus;
  facultyId?: string;
  departmentId?: string;
  organizerId?: string;
  startDateFrom?: Date;
  startDateTo?: Date;
  isOnline?: boolean;
  isFeatured?: boolean;
  search?: string;
}

// Sort options
export interface SortOptions {
  field: string;
  order: 'asc' | 'desc';
}

// Select fields type helper
export type SelectUser = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

