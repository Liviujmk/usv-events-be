import { eq, and, or, ilike, gte, lte, desc, asc, count, sql } from 'drizzle-orm';
import { db, events, eventRegistrations, eventFavorites, users } from '../../db';
import { log } from '../../middleware/logger';
import { parsePagination } from '../../utils/pagination';
import { generateUniqueSlug, generateTicketNumber, generateQrCodeContent } from '../../utils/slug';
import type {
  CreateEventInput,
  UpdateEventInput,
  ReviewEventInput,
  ListEventsQuery,
  RegisterForEventInput,
} from './events.schema';
import type { EventStatus, AuthUser } from '../../types';

export class EventsService {
  /**
   * Create a new event
   */
  async createEvent(organizerId: string, input: CreateEventInput) {
    const slug = generateUniqueSlug(input.title);

    const [event] = await db
      .insert(events)
      .values({
        ...input,
        slug,
        organizerId,
        startDate: new Date(input.startDate),
        endDate: new Date(input.endDate),
        registrationDeadline: input.registrationDeadline
          ? new Date(input.registrationDeadline)
          : null,
        status: 'draft',
      })
      .returning();

    log.info(`Event created: ${event.id} by organizer ${organizerId}`);
    return event;
  }

  /**
   * Get event by ID
   */
  async getEventById(eventId: string, includeOrganizer = false) {
    const result = await db.query.events.findFirst({
      where: eq(events.id, eventId),
      with: {
        organizer: includeOrganizer
          ? {
              columns: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                profileImage: true,
              },
            }
          : undefined,
        faculty: true,
        department: true,
      },
    });

    return result;
  }

  /**
   * Get event by slug
   */
  async getEventBySlug(slug: string) {
    return db.query.events.findFirst({
      where: eq(events.slug, slug),
      with: {
        organizer: {
          columns: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            profileImage: true,
          },
        },
        faculty: true,
        department: true,
      },
    });
  }

  /**
   * Update event
   */
  async updateEvent(eventId: string, input: UpdateEventInput) {
    const updateData: Record<string, unknown> = {
      ...input,
      updatedAt: new Date(),
    };

    if (input.startDate) {
      updateData.startDate = new Date(input.startDate);
    }
    if (input.endDate) {
      updateData.endDate = new Date(input.endDate);
    }
    if (input.registrationDeadline) {
      updateData.registrationDeadline = new Date(input.registrationDeadline);
    }
    if (input.title) {
      updateData.slug = generateUniqueSlug(input.title);
    }

    const [updated] = await db
      .update(events)
      .set(updateData)
      .where(eq(events.id, eventId))
      .returning();

    log.info(`Event updated: ${eventId}`);
    return updated;
  }

  /**
   * Delete event
   */
  async deleteEvent(eventId: string) {
    await db.delete(events).where(eq(events.id, eventId));
    log.info(`Event deleted: ${eventId}`);
  }

  /**
   * Submit event for approval
   */
  async submitForApproval(eventId: string) {
    const [updated] = await db
      .update(events)
      .set({
        status: 'pending',
        updatedAt: new Date(),
      })
      .where(eq(events.id, eventId))
      .returning();

    log.info(`Event submitted for approval: ${eventId}`);
    return updated;
  }

  /**
   * Review event (approve/reject)
   */
  async reviewEvent(eventId: string, adminId: string, input: ReviewEventInput) {
    const updateData: Record<string, unknown> = {
      status: input.status,
      updatedAt: new Date(),
    };

    if (input.status === 'approved') {
      updateData.approvedAt = new Date();
      updateData.approvedBy = adminId;
    } else if (input.status === 'rejected') {
      updateData.rejectionReason = input.rejectionReason;
    }

    const [updated] = await db
      .update(events)
      .set(updateData)
      .where(eq(events.id, eventId))
      .returning();

    log.info(`Event ${eventId} ${input.status} by admin ${adminId}`);
    return updated;
  }

  /**
   * List events with filters
   */
  async listEvents(query: ListEventsQuery, userId?: string) {
    const { page, limit, offset } = parsePagination(query.page, query.limit);

    const conditions = [];

    // Only show approved events for public listing (unless admin/organizer filtering)
    if (!query.status && !query.organizerId) {
      conditions.push(eq(events.status, 'approved'));
    } else if (query.status) {
      conditions.push(eq(events.status, query.status as EventStatus));
    }

    if (query.type) {
      conditions.push(eq(events.type, query.type));
    }

    if (query.facultyId) {
      conditions.push(eq(events.facultyId, query.facultyId));
    }

    if (query.departmentId) {
      conditions.push(eq(events.departmentId, query.departmentId));
    }

    if (query.organizerId) {
      conditions.push(eq(events.organizerId, query.organizerId));
    }

    if (query.startDateFrom) {
      conditions.push(gte(events.startDate, new Date(query.startDateFrom)));
    }

    if (query.startDateTo) {
      conditions.push(lte(events.startDate, new Date(query.startDateTo)));
    }

    if (query.isOnline !== undefined) {
      conditions.push(eq(events.isOnline, query.isOnline === 'true'));
    }

    if (query.isFeatured !== undefined) {
      conditions.push(eq(events.isFeatured, query.isFeatured === 'true'));
    }

    if (query.search) {
      const searchTerm = `%${query.search}%`;
      conditions.push(
        or(
          ilike(events.title, searchTerm),
          ilike(events.description, searchTerm),
          ilike(events.location, searchTerm)
        )
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Determine sort column
    let sortColumn;
    switch (query.sortBy) {
      case 'title':
        sortColumn = events.title;
        break;
      case 'createdAt':
        sortColumn = events.createdAt;
        break;
      case 'startDate':
      default:
        sortColumn = events.startDate;
    }

    const orderBy = query.sortOrder === 'desc' ? desc(sortColumn) : asc(sortColumn);

    const [data, totalResult] = await Promise.all([
      db.query.events.findMany({
        where: whereClause,
        limit,
        offset,
        orderBy: [orderBy],
        with: {
          organizer: {
            columns: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          faculty: {
            columns: {
              id: true,
              name: true,
              abbreviation: true,
            },
          },
        },
      }),
      db.select({ count: count() }).from(events).where(whereClause),
    ]);

    return {
      data,
      total: totalResult[0]?.count || 0,
      page,
      limit,
    };
  }

  /**
   * Get events organized by a user
   */
  async getOrganizerEvents(organizerId: string, status?: EventStatus) {
    const conditions = [eq(events.organizerId, organizerId)];

    if (status) {
      conditions.push(eq(events.status, status));
    }

    return db.query.events.findMany({
      where: and(...conditions),
      orderBy: [desc(events.createdAt)],
      with: {
        faculty: true,
        department: true,
      },
    });
  }

  /**
   * Register user for an event
   */
  async registerForEvent(eventId: string, userId: string, input: RegisterForEventInput) {
    // Check if event exists and is open for registration
    const event = await this.getEventById(eventId);

    if (!event) {
      throw new Error('Event not found');
    }

    if (event.status !== 'approved') {
      throw new Error('Event is not open for registration');
    }

    if (event.registrationDeadline && new Date() > event.registrationDeadline) {
      throw new Error('Registration deadline has passed');
    }

    if (event.maxParticipants && event.currentParticipants >= event.maxParticipants) {
      throw new Error('Event is full');
    }

    // Check if user is already registered
    const existingRegistration = await db.query.eventRegistrations.findFirst({
      where: and(
        eq(eventRegistrations.eventId, eventId),
        eq(eventRegistrations.userId, userId)
      ),
    });

    if (existingRegistration) {
      throw new Error('You are already registered for this event');
    }

    // Create registration
    const ticketNumber = generateTicketNumber();
    const qrCode = generateQrCodeContent(eventId, ticketNumber);

    const [registration] = await db
      .insert(eventRegistrations)
      .values({
        eventId,
        userId,
        status: 'confirmed',
        ticketNumber,
        qrCode,
        notes: input.notes,
      })
      .returning();

    // Update participant count
    await db
      .update(events)
      .set({
        currentParticipants: sql`${events.currentParticipants} + 1`,
      })
      .where(eq(events.id, eventId));

    log.info(`User ${userId} registered for event ${eventId}`);
    return registration;
  }

  /**
   * Cancel registration
   */
  async cancelRegistration(eventId: string, userId: string) {
    const [registration] = await db
      .select()
      .from(eventRegistrations)
      .where(
        and(
          eq(eventRegistrations.eventId, eventId),
          eq(eventRegistrations.userId, userId)
        )
      )
      .limit(1);

    if (!registration) {
      throw new Error('Registration not found');
    }

    if (registration.status === 'cancelled') {
      throw new Error('Registration is already cancelled');
    }

    await db
      .update(eventRegistrations)
      .set({
        status: 'cancelled',
        updatedAt: new Date(),
      })
      .where(eq(eventRegistrations.id, registration.id));

    // Update participant count
    await db
      .update(events)
      .set({
        currentParticipants: sql`${events.currentParticipants} - 1`,
      })
      .where(eq(events.id, eventId));

    log.info(`User ${userId} cancelled registration for event ${eventId}`);
  }

  /**
   * Get user's registrations
   */
  async getUserRegistrations(userId: string) {
    return db.query.eventRegistrations.findMany({
      where: eq(eventRegistrations.userId, userId),
      with: {
        event: {
          with: {
            organizer: {
              columns: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
      orderBy: [desc(eventRegistrations.createdAt)],
    });
  }

  /**
   * Get event participants (for organizers)
   */
  async getEventParticipants(eventId: string, status?: string) {
    const conditions = [eq(eventRegistrations.eventId, eventId)];

    if (status) {
      conditions.push(eq(eventRegistrations.status, status as any));
    }

    return db.query.eventRegistrations.findMany({
      where: and(...conditions),
      with: {
        user: {
          columns: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
      },
      orderBy: [desc(eventRegistrations.createdAt)],
    });
  }

  /**
   * Check in a participant
   */
  async checkInParticipant(
    eventId: string,
    checkInBy: string,
    ticketNumber?: string,
    qrCode?: string
  ) {
    const conditions = [eq(eventRegistrations.eventId, eventId)];

    if (ticketNumber) {
      conditions.push(eq(eventRegistrations.ticketNumber, ticketNumber));
    } else if (qrCode) {
      conditions.push(eq(eventRegistrations.qrCode, qrCode));
    }

    const [registration] = await db
      .select()
      .from(eventRegistrations)
      .where(and(...conditions))
      .limit(1);

    if (!registration) {
      throw new Error('Registration not found');
    }

    if (registration.status !== 'confirmed') {
      throw new Error('Registration is not confirmed');
    }

    if (registration.checkedInAt) {
      throw new Error('Participant already checked in');
    }

    const [updated] = await db
      .update(eventRegistrations)
      .set({
        status: 'attended',
        checkedInAt: new Date(),
        checkedInBy: checkInBy,
        updatedAt: new Date(),
      })
      .where(eq(eventRegistrations.id, registration.id))
      .returning();

    log.info(`Participant ${registration.userId} checked in for event ${eventId}`);
    return updated;
  }

  /**
   * Add event to favorites
   */
  async addToFavorites(eventId: string, userId: string) {
    await db
      .insert(eventFavorites)
      .values({ eventId, userId })
      .onConflictDoNothing();

    log.info(`User ${userId} added event ${eventId} to favorites`);
  }

  /**
   * Remove event from favorites
   */
  async removeFromFavorites(eventId: string, userId: string) {
    await db
      .delete(eventFavorites)
      .where(
        and(
          eq(eventFavorites.eventId, eventId),
          eq(eventFavorites.userId, userId)
        )
      );

    log.info(`User ${userId} removed event ${eventId} from favorites`);
  }

  /**
   * Get user's favorite events
   */
  async getUserFavorites(userId: string) {
    return db.query.eventFavorites.findMany({
      where: eq(eventFavorites.userId, userId),
      with: {
        event: {
          with: {
            organizer: {
              columns: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
      orderBy: [desc(eventFavorites.createdAt)],
    });
  }

  /**
   * Get event statistics (for organizers/admins)
   */
  async getEventStats(eventId: string) {
    const [stats] = await db
      .select({
        totalRegistrations: count(),
        confirmed: sql<number>`COUNT(*) FILTER (WHERE ${eventRegistrations.status} = 'confirmed')`,
        attended: sql<number>`COUNT(*) FILTER (WHERE ${eventRegistrations.status} = 'attended')`,
        cancelled: sql<number>`COUNT(*) FILTER (WHERE ${eventRegistrations.status} = 'cancelled')`,
      })
      .from(eventRegistrations)
      .where(eq(eventRegistrations.eventId, eventId));

    return stats;
  }

  /**
   * Get pending events for approval (admin)
   */
  async getPendingEvents() {
    return db.query.events.findMany({
      where: eq(events.status, 'pending'),
      with: {
        organizer: {
          columns: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        faculty: true,
      },
      orderBy: [asc(events.createdAt)],
    });
  }

  /**
   * Feature/unfeature an event (admin)
   */
  async toggleFeatured(eventId: string, isFeatured: boolean) {
    const [updated] = await db
      .update(events)
      .set({
        isFeatured,
        updatedAt: new Date(),
      })
      .where(eq(events.id, eventId))
      .returning();

    log.info(`Event ${eventId} featured status set to ${isFeatured}`);
    return updated;
  }
}

export const eventsService = new EventsService();

