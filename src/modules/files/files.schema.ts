import { z } from 'zod';

// Create event material schema
export const createMaterialSchema = z.object({
  eventId: z.string().uuid('Invalid event ID'),
  title: z
    .string()
    .min(1, 'Title is required')
    .max(255, 'Title must be at most 255 characters'),
  description: z.string().max(1000).optional(),
  fileUrl: z.string().url('Invalid file URL').max(500),
  fileType: z.string().max(50),
  fileSize: z.number().int().positive().optional(),
  isPublic: z.boolean().default(true),
});

// Update event material schema
export const updateMaterialSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().max(1000).optional(),
  isPublic: z.boolean().optional(),
});

// Query materials schema
export const queryMaterialsSchema = z.object({
  eventId: z.string().uuid().optional(),
  fileType: z.string().optional(),
  isPublic: z.enum(['true', 'false']).optional(),
  page: z.string().optional().default('1'),
  limit: z.string().optional().default('20'),
});

// Types
export type CreateMaterialInput = z.infer<typeof createMaterialSchema>;
export type UpdateMaterialInput = z.infer<typeof updateMaterialSchema>;
export type QueryMaterialsInput = z.infer<typeof queryMaterialsSchema>;

