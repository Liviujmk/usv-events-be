import { z } from 'zod';

// Update profile schema
export const updateProfileSchema = z.object({
  firstName: z
    .string()
    .min(2, 'First name must be at least 2 characters')
    .max(100, 'First name must be at most 100 characters')
    .optional(),
  lastName: z
    .string()
    .min(2, 'Last name must be at least 2 characters')
    .max(100, 'Last name must be at most 100 characters')
    .optional(),
  facultyId: z.string().uuid('Invalid faculty ID').nullable().optional(),
  profileImage: z.string().url('Invalid URL').max(500).nullable().optional(),
  phone: z.string().max(20, 'Phone must be at most 20 characters').nullable().optional(),
  bio: z.string().max(1000, 'Bio must be at most 1000 characters').nullable().optional(),
});

// Update user interests schema
export const updateInterestsSchema = z.object({
  interests: z.array(
    z.enum(['academic', 'social', 'career', 'sports', 'volunteering', 'cultural', 'workshop', 'conference', 'other'])
  ),
});

// Admin: Update user role schema
export const updateUserRoleSchema = z.object({
  role: z.enum(['student', 'organizer', 'admin']),
});

// Admin: Update user status schema
export const updateUserStatusSchema = z.object({
  isActive: z.boolean(),
});

// Query params for listing users
export const listUsersQuerySchema = z.object({
  page: z.string().optional().default('1'),
  limit: z.string().optional().default('20'),
  role: z.enum(['student', 'organizer', 'admin']).optional(),
  facultyId: z.string().uuid().optional(),
  search: z.string().optional(),
  isActive: z.enum(['true', 'false']).optional(),
});

// Types
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type UpdateInterestsInput = z.infer<typeof updateInterestsSchema>;
export type UpdateUserRoleInput = z.infer<typeof updateUserRoleSchema>;
export type UpdateUserStatusInput = z.infer<typeof updateUserStatusSchema>;
export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;

