import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { eventsService } from './events.service';
import {
  createEventSchema,
  updateEventSchema,
  reviewEventSchema,
  listEventsQuerySchema,
  registerForEventSchema,
  checkInSchema,
  exportParticipantsQuerySchema,
} from './events.schema';
import { auth, optionalAuth } from '../../middleware/auth';
import { requireOrganizer, requireAdmin, requireOwnerOrRole } from '../../middleware/rbac';
import { success, error, successMessage, paginated, notFound, forbidden } from '../../utils/response';
import type { AuthUser } from '../../types';
import type { Env } from '../../types/hono';
import { db, events } from '../../db';
import { eq } from 'drizzle-orm';

const eventsController = new Hono<Env>();

// Helper to get event owner ID
async function getEventOwnerId(eventId: string): Promise<string | null> {
  const event = await db.query.events.findFirst({
    where: eq(events.id, eventId),
    columns: { organizerId: true },
  });
  return event?.organizerId || null;
}

/**
 * GET /events
 * List events (public, with optional filters)
 */
eventsController.get(
  '/',
  optionalAuth(),
  zValidator('query', listEventsQuerySchema),
  async (c) => {
    try {
      const query = c.req.valid('query');
      const user = c.get('user') as AuthUser | undefined;
      const result = await eventsService.listEvents(query, user?.id);
      return paginated(c, result.data, result.page, result.limit, result.total);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to list events';
      return error(c, message, 400);
    }
  }
);

/**
 * GET /events/pending
 * Get pending events for approval (admin only)
 */
eventsController.get('/pending', auth(), requireAdmin(), async (c) => {
  try {
    const events = await eventsService.getPendingEvents();
    return success(c, events);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to get pending events';
    return error(c, message, 400);
  }
});

/**
 * GET /events/my-events
 * Get current user's organized events (organizer only)
 */
eventsController.get('/my-events', auth(), requireOrganizer(), async (c) => {
  try {
    const user = c.get('user') as AuthUser;
    const events = await eventsService.getOrganizerEvents(user.id);
    return success(c, events);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to get events';
    return error(c, message, 400);
  }
});

/**
 * GET /events/registrations
 * Get current user's event registrations
 */
eventsController.get('/registrations', auth(), async (c) => {
  try {
    const user = c.get('user') as AuthUser;
    const registrations = await eventsService.getUserRegistrations(user.id);
    return success(c, registrations);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to get registrations';
    return error(c, message, 400);
  }
});

/**
 * GET /events/favorites
 * Get current user's favorite events
 */
eventsController.get('/favorites', auth(), async (c) => {
  try {
    const user = c.get('user') as AuthUser;
    const favorites = await eventsService.getUserFavorites(user.id);
    return success(c, favorites);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to get favorites';
    return error(c, message, 400);
  }
});

/**
 * POST /events
 * Create a new event (organizer only)
 */
eventsController.post(
  '/',
  auth(),
  requireOrganizer(),
  zValidator('json', createEventSchema),
  async (c) => {
    try {
      const user = c.get('user') as AuthUser;
      const input = c.req.valid('json');
      const event = await eventsService.createEvent(user.id, input);
      return success(c, event, 201);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create event';
      return error(c, message, 400);
    }
  }
);

/**
 * GET /events/:id
 * Get event by ID
 */
eventsController.get('/:id', optionalAuth(), async (c) => {
  try {
    const { id } = c.req.param();
    const event = await eventsService.getEventById(id, true);

    if (!event) {
      return notFound(c, 'Event not found');
    }

    // Only show non-approved events to organizer or admin
    const user = c.get('user') as AuthUser | undefined;
    if (
      event.status !== 'approved' &&
      (!user || (user.id !== event.organizerId && user.role !== 'admin'))
    ) {
      return notFound(c, 'Event not found');
    }

    return success(c, event);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to get event';
    return error(c, message, 400);
  }
});

/**
 * GET /events/slug/:slug
 * Get event by slug
 */
eventsController.get('/slug/:slug', optionalAuth(), async (c) => {
  try {
    const { slug } = c.req.param();
    const event = await eventsService.getEventBySlug(slug);

    if (!event) {
      return notFound(c, 'Event not found');
    }

    const user = c.get('user') as AuthUser | undefined;
    if (
      event.status !== 'approved' &&
      (!user || (user.id !== event.organizerId && user.role !== 'admin'))
    ) {
      return notFound(c, 'Event not found');
    }

    return success(c, event);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to get event';
    return error(c, message, 400);
  }
});

/**
 * PATCH /events/:id
 * Update event (organizer/owner or admin)
 */
eventsController.patch(
  '/:id',
  auth(),
  zValidator('json', updateEventSchema),
  async (c) => {
    try {
      const { id } = c.req.param();
      const user = c.get('user') as AuthUser;
      const input = c.req.valid('json');

      const event = await eventsService.getEventById(id);

      if (!event) {
        return notFound(c, 'Event not found');
      }

      // Check ownership or admin role
      if (event.organizerId !== user.id && user.role !== 'admin') {
        return forbidden(c, 'You do not have permission to update this event');
      }

      const updated = await eventsService.updateEvent(id, input);
      return success(c, updated);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update event';
      return error(c, message, 400);
    }
  }
);

/**
 * DELETE /events/:id
 * Delete event (organizer/owner or admin)
 */
eventsController.delete('/:id', auth(), async (c) => {
  try {
    const { id } = c.req.param();
    const user = c.get('user') as AuthUser;

    const event = await eventsService.getEventById(id);

    if (!event) {
      return notFound(c, 'Event not found');
    }

    if (event.organizerId !== user.id && user.role !== 'admin') {
      return forbidden(c, 'You do not have permission to delete this event');
    }

    await eventsService.deleteEvent(id);
    return successMessage(c, 'Event deleted successfully');
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to delete event';
    return error(c, message, 400);
  }
});

/**
 * POST /events/:id/submit
 * Submit event for approval
 */
eventsController.post('/:id/submit', auth(), requireOrganizer(), async (c) => {
  try {
    const { id } = c.req.param();
    const user = c.get('user') as AuthUser;

    const event = await eventsService.getEventById(id);

    if (!event) {
      return notFound(c, 'Event not found');
    }

    if (event.organizerId !== user.id) {
      return forbidden(c, 'You do not have permission to submit this event');
    }

    if (event.status !== 'draft') {
      return error(c, 'Only draft events can be submitted for approval', 400);
    }

    const updated = await eventsService.submitForApproval(id);
    return success(c, updated);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to submit event';
    return error(c, message, 400);
  }
});

/**
 * POST /events/:id/review
 * Review event (admin only)
 */
eventsController.post(
  '/:id/review',
  auth(),
  requireAdmin(),
  zValidator('json', reviewEventSchema),
  async (c) => {
    try {
      const { id } = c.req.param();
      const user = c.get('user') as AuthUser;
      const input = c.req.valid('json');

      const event = await eventsService.getEventById(id);

      if (!event) {
        return notFound(c, 'Event not found');
      }

      if (event.status !== 'pending') {
        return error(c, 'Only pending events can be reviewed', 400);
      }

      const updated = await eventsService.reviewEvent(id, user.id, input);
      return success(c, updated);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to review event';
      return error(c, message, 400);
    }
  }
);

/**
 * POST /events/:id/register
 * Register for an event
 */
eventsController.post(
  '/:id/register',
  auth(),
  zValidator('json', registerForEventSchema),
  async (c) => {
    try {
      const { id } = c.req.param();
      const user = c.get('user') as AuthUser;
      const input = c.req.valid('json');

      const registration = await eventsService.registerForEvent(id, user.id, input);
      return success(c, registration, 201);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to register for event';
      return error(c, message, 400);
    }
  }
);

/**
 * DELETE /events/:id/register
 * Cancel registration for an event
 */
eventsController.delete('/:id/register', auth(), async (c) => {
  try {
    const { id } = c.req.param();
    const user = c.get('user') as AuthUser;

    await eventsService.cancelRegistration(id, user.id);
    return successMessage(c, 'Registration cancelled successfully');
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to cancel registration';
    return error(c, message, 400);
  }
});

/**
 * GET /events/:id/participants
 * Get event participants (organizer/owner or admin)
 */
eventsController.get('/:id/participants', auth(), async (c) => {
  try {
    const { id } = c.req.param();
    const user = c.get('user') as AuthUser;
    const status = c.req.query('status');

    const event = await eventsService.getEventById(id);

    if (!event) {
      return notFound(c, 'Event not found');
    }

    if (event.organizerId !== user.id && user.role !== 'admin') {
      return forbidden(c, 'You do not have permission to view participants');
    }

    const participants = await eventsService.getEventParticipants(id, status);
    return success(c, participants);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to get participants';
    return error(c, message, 400);
  }
});

/**
 * POST /events/:id/check-in
 * Check in a participant
 */
eventsController.post(
  '/:id/check-in',
  auth(),
  zValidator('json', checkInSchema),
  async (c) => {
    try {
      const { id } = c.req.param();
      const user = c.get('user') as AuthUser;
      const { ticketNumber, qrCode } = c.req.valid('json');

      const event = await eventsService.getEventById(id);

      if (!event) {
        return notFound(c, 'Event not found');
      }

      if (event.organizerId !== user.id && user.role !== 'admin') {
        return forbidden(c, 'You do not have permission to check in participants');
      }

      const registration = await eventsService.checkInParticipant(
        id,
        user.id,
        ticketNumber,
        qrCode
      );
      return success(c, registration);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to check in participant';
      return error(c, message, 400);
    }
  }
);

/**
 * GET /events/:id/stats
 * Get event statistics
 */
eventsController.get('/:id/stats', auth(), async (c) => {
  try {
    const { id } = c.req.param();
    const user = c.get('user') as AuthUser;

    const event = await eventsService.getEventById(id);

    if (!event) {
      return notFound(c, 'Event not found');
    }

    if (event.organizerId !== user.id && user.role !== 'admin') {
      return forbidden(c, 'You do not have permission to view statistics');
    }

    const stats = await eventsService.getEventStats(id);
    return success(c, stats);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to get statistics';
    return error(c, message, 400);
  }
});

/**
 * POST /events/:id/favorite
 * Add event to favorites
 */
eventsController.post('/:id/favorite', auth(), async (c) => {
  try {
    const { id } = c.req.param();
    const user = c.get('user') as AuthUser;

    await eventsService.addToFavorites(id, user.id);
    return successMessage(c, 'Event added to favorites');
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to add to favorites';
    return error(c, message, 400);
  }
});

/**
 * DELETE /events/:id/favorite
 * Remove event from favorites
 */
eventsController.delete('/:id/favorite', auth(), async (c) => {
  try {
    const { id } = c.req.param();
    const user = c.get('user') as AuthUser;

    await eventsService.removeFromFavorites(id, user.id);
    return successMessage(c, 'Event removed from favorites');
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to remove from favorites';
    return error(c, message, 400);
  }
});

/**
 * PATCH /events/:id/featured
 * Toggle event featured status (admin only)
 */
eventsController.patch('/:id/featured', auth(), requireAdmin(), async (c) => {
  try {
    const { id } = c.req.param();
    const body = await c.req.json();
    const isFeatured = body.isFeatured === true;

    const event = await eventsService.getEventById(id);

    if (!event) {
      return notFound(c, 'Event not found');
    }

    const updated = await eventsService.toggleFeatured(id, isFeatured);
    return success(c, updated);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to update featured status';
    return error(c, message, 400);
  }
});

export { eventsController };

