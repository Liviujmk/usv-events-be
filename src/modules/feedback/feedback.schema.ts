import { z } from 'zod';

// Create feedback schema
export const createFeedbackSchema = z.object({
  eventId: z.string().uuid('Invalid event ID'),
  rating: z
    .number()
    .int()
    .min(1, 'Rating must be at least 1')
    .max(5, 'Rating must be at most 5'),
  comment: z.string().max(1000, 'Comment must be at most 1000 characters').optional(),
  isAnonymous: z.boolean().default(false),
});

// Update feedback schema
export const updateFeedbackSchema = z.object({
  rating: z
    .number()
    .int()
    .min(1, 'Rating must be at least 1')
    .max(5, 'Rating must be at most 5')
    .optional(),
  comment: z.string().max(1000, 'Comment must be at most 1000 characters').optional(),
});

// Query feedback schema
export const queryFeedbackSchema = z.object({
  eventId: z.string().uuid().optional(),
  page: z.string().optional().default('1'),
  limit: z.string().optional().default('20'),
});

// Types
export type CreateFeedbackInput = z.infer<typeof createFeedbackSchema>;
export type UpdateFeedbackInput = z.infer<typeof updateFeedbackSchema>;
export type QueryFeedbackInput = z.infer<typeof queryFeedbackSchema>;

