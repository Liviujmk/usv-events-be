import { z } from 'zod';

// Create faculty schema
export const createFacultySchema = z.object({
  name: z
    .string()
    .min(3, 'Name must be at least 3 characters')
    .max(255, 'Name must be at most 255 characters'),
  abbreviation: z
    .string()
    .min(2, 'Abbreviation must be at least 2 characters')
    .max(20, 'Abbreviation must be at most 20 characters'),
  description: z.string().optional(),
  website: z.string().url('Invalid URL').max(255).optional(),
  contactEmail: z.string().email('Invalid email').max(255).optional(),
});

// Update faculty schema
export const updateFacultySchema = createFacultySchema.partial();

// Create department schema
export const createDepartmentSchema = z.object({
  name: z
    .string()
    .min(3, 'Name must be at least 3 characters')
    .max(255, 'Name must be at most 255 characters'),
  facultyId: z.string().uuid('Invalid faculty ID'),
  description: z.string().optional(),
});

// Update department schema
export const updateDepartmentSchema = createDepartmentSchema.partial().omit({ facultyId: true });

// Types
export type CreateFacultyInput = z.infer<typeof createFacultySchema>;
export type UpdateFacultyInput = z.infer<typeof updateFacultySchema>;
export type CreateDepartmentInput = z.infer<typeof createDepartmentSchema>;
export type UpdateDepartmentInput = z.infer<typeof updateDepartmentSchema>;

