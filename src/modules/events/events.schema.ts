import { z } from 'zod';

// Event type enum
const eventTypeEnum = z.enum([
  'academic',
  'social',
  'career',
  'sports',
  'volunteering',
  'cultural',
  'workshop',
  'conference',
  'other',
]);

// Event status enum
const eventStatusEnum = z.enum([
  'draft',
  'pending',
  'approved',
  'rejected',
  'cancelled',
  'completed',
]);

// Create event schema
export const createEventSchema = z.object({
  title: z
    .string()
    .min(5, 'Title must be at least 5 characters')
    .max(255, 'Title must be at most 255 characters'),
  description: z
    .string()
    .min(20, 'Description must be at least 20 characters'),
  shortDescription: z
    .string()
    .max(500, 'Short description must be at most 500 characters')
    .optional(),
  type: eventTypeEnum.default('other'),
  facultyId: z.string().uuid('Invalid faculty ID').optional(),
  departmentId: z.string().uuid('Invalid department ID').optional(),
  startDate: z.string().datetime({ message: 'Invalid start date' }),
  endDate: z.string().datetime({ message: 'Invalid end date' }),
  registrationDeadline: z
    .string()
    .datetime({ message: 'Invalid registration deadline' })
    .optional(),
  location: z
    .string()
    .min(3, 'Location must be at least 3 characters')
    .max(255, 'Location must be at most 255 characters'),
  address: z.string().max(500).optional(),
  isOnline: z.boolean().default(false),
  onlineLink: z.string().url('Invalid URL').max(500).optional(),
  maxParticipants: z.number().int().positive().optional(),
  coverImage: z.string().url('Invalid URL').max(500).optional(),
  images: z.array(z.string().url()).optional(),
  tags: z.array(z.string().max(50)).optional(),
  requirements: z.string().optional(),
  targetAudience: z.string().max(255).optional(),
}).refine(
  (data) => new Date(data.endDate) > new Date(data.startDate),
  {
    message: 'End date must be after start date',
    path: ['endDate'],
  }
).refine(
  (data) => {
    if (data.registrationDeadline) {
      return new Date(data.registrationDeadline) < new Date(data.startDate);
    }
    return true;
  },
  {
    message: 'Registration deadline must be before start date',
    path: ['registrationDeadline'],
  }
);

// Update event schema
export const updateEventSchema = createEventSchema.partial();

// Publish event schema (submit for approval)
export const publishEventSchema = z.object({
  status: z.literal('pending'),
});

// Admin: Approve/reject event schema
export const reviewEventSchema = z.object({
  status: z.enum(['approved', 'rejected']),
  rejectionReason: z.string().optional(),
});

// List events query schema
export const listEventsQuerySchema = z.object({
  page: z.string().optional().default('1'),
  limit: z.string().optional().default('20'),
  type: eventTypeEnum.optional(),
  status: eventStatusEnum.optional(),
  facultyId: z.string().uuid().optional(),
  departmentId: z.string().uuid().optional(),
  organizerId: z.string().uuid().optional(),
  startDateFrom: z.string().datetime().optional(),
  startDateTo: z.string().datetime().optional(),
  isOnline: z.enum(['true', 'false']).optional(),
  isFeatured: z.enum(['true', 'false']).optional(),
  search: z.string().optional(),
  sortBy: z.enum(['startDate', 'createdAt', 'title']).optional().default('startDate'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
});

// Register for event schema
export const registerForEventSchema = z.object({
  notes: z.string().max(500).optional(),
});

// Check-in schema
export const checkInSchema = z.object({
  ticketNumber: z.string().optional(),
  qrCode: z.string().optional(),
}).refine(
  (data) => data.ticketNumber || data.qrCode,
  {
    message: 'Either ticket number or QR code is required',
  }
);

// Export participants query schema
export const exportParticipantsQuerySchema = z.object({
  format: z.enum(['json', 'csv']).default('json'),
  status: z.enum(['pending', 'confirmed', 'cancelled', 'attended']).optional(),
});

// Types
export type CreateEventInput = z.infer<typeof createEventSchema>;
export type UpdateEventInput = z.infer<typeof updateEventSchema>;
export type PublishEventInput = z.infer<typeof publishEventSchema>;
export type ReviewEventInput = z.infer<typeof reviewEventSchema>;
export type ListEventsQuery = z.infer<typeof listEventsQuerySchema>;
export type RegisterForEventInput = z.infer<typeof registerForEventSchema>;
export type CheckInInput = z.infer<typeof checkInSchema>;
export type ExportParticipantsQuery = z.infer<typeof exportParticipantsQuerySchema>;

