import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { feedbackService } from './feedback.service';
import { createFeedbackSchema, updateFeedbackSchema, queryFeedbackSchema } from './feedback.schema';
import { auth } from '../../middleware/auth';
import { requireAdmin } from '../../middleware/rbac';
import { success, error, successMessage, notFound, forbidden, paginated } from '../../utils/response';
import type { AuthUser } from '../../types';
import type { Env } from '../../types/hono';

const feedbackController = new Hono<Env>();

/**
 * POST /feedback
 * Create feedback for an event
 */
feedbackController.post(
  '/',
  auth(),
  zValidator('json', createFeedbackSchema),
  async (c) => {
    try {
      const user = c.get('user') as AuthUser;
      const input = c.req.valid('json');
      const feedback = await feedbackService.createFeedback(user.id, input);
      return success(c, feedback, 201);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create feedback';
      return error(c, message, 400);
    }
  }
);

/**
 * GET /feedback/my
 * Get current user's feedback
 */
feedbackController.get('/my', auth(), async (c) => {
  try {
    const user = c.get('user') as AuthUser;
    const feedback = await feedbackService.getUserFeedback(user.id);
    return success(c, feedback);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to get feedback';
    return error(c, message, 400);
  }
});

/**
 * GET /feedback/event/:eventId
 * Get feedback for an event
 */
feedbackController.get(
  '/event/:eventId',
  zValidator('query', queryFeedbackSchema),
  async (c) => {
    try {
      const { eventId } = c.req.param();
      const query = c.req.valid('query');
      const result = await feedbackService.getEventFeedback(eventId, query);
      
      return c.json({
        success: true,
        data: result.data,
        stats: result.stats,
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: Math.ceil(result.total / result.limit),
        },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to get feedback';
      return error(c, message, 400);
    }
  }
);

/**
 * GET /feedback/event/:eventId/stats
 * Get feedback statistics for an event
 */
feedbackController.get('/event/:eventId/stats', async (c) => {
  try {
    const { eventId } = c.req.param();
    const stats = await feedbackService.getEventStatistics(eventId);
    return success(c, stats);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to get statistics';
    return error(c, message, 400);
  }
});

/**
 * PATCH /feedback/:id
 * Update feedback
 */
feedbackController.patch(
  '/:id',
  auth(),
  zValidator('json', updateFeedbackSchema),
  async (c) => {
    try {
      const { id } = c.req.param();
      const user = c.get('user') as AuthUser;
      const input = c.req.valid('json');

      const updated = await feedbackService.updateFeedback(id, user.id, input);
      return success(c, updated);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update feedback';
      return error(c, message, 400);
    }
  }
);

/**
 * DELETE /feedback/:id
 * Delete feedback
 */
feedbackController.delete('/:id', auth(), async (c) => {
  try {
    const { id } = c.req.param();
    const user = c.get('user') as AuthUser;

    await feedbackService.deleteFeedback(id, user.id, user.role === 'admin');
    return successMessage(c, 'Feedback deleted successfully');
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to delete feedback';
    return error(c, message, 400);
  }
});

export { feedbackController };

