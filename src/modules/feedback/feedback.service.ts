import { eq, and, avg, count, desc } from 'drizzle-orm';
import { db, eventFeedback, eventRegistrations, events } from '../../db';
import { log } from '../../middleware/logger';
import { parsePagination } from '../../utils/pagination';
import type { CreateFeedbackInput, UpdateFeedbackInput, QueryFeedbackInput } from './feedback.schema';

export class FeedbackService {
  /**
   * Create feedback for an event
   */
  async createFeedback(userId: string, input: CreateFeedbackInput) {
    // Check if user attended the event
    const registration = await db.query.eventRegistrations.findFirst({
      where: and(
        eq(eventRegistrations.eventId, input.eventId),
        eq(eventRegistrations.userId, userId),
        eq(eventRegistrations.status, 'attended')
      ),
    });

    if (!registration) {
      throw new Error('You can only provide feedback for events you have attended');
    }

    // Check if user already provided feedback
    const existingFeedback = await db.query.eventFeedback.findFirst({
      where: and(
        eq(eventFeedback.eventId, input.eventId),
        eq(eventFeedback.userId, userId)
      ),
    });

    if (existingFeedback) {
      throw new Error('You have already provided feedback for this event');
    }

    const [feedback] = await db
      .insert(eventFeedback)
      .values({
        eventId: input.eventId,
        userId,
        rating: input.rating,
        comment: input.comment,
        isAnonymous: input.isAnonymous,
      })
      .returning();

    log.info(`Feedback created for event ${input.eventId} by user ${userId}`);
    return feedback;
  }

  /**
   * Update feedback
   */
  async updateFeedback(feedbackId: string, userId: string, input: UpdateFeedbackInput) {
    const [updated] = await db
      .update(eventFeedback)
      .set({
        ...input,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(eventFeedback.id, feedbackId),
          eq(eventFeedback.userId, userId)
        )
      )
      .returning();

    if (!updated) {
      throw new Error('Feedback not found or you do not have permission to update it');
    }

    log.info(`Feedback updated: ${feedbackId}`);
    return updated;
  }

  /**
   * Delete feedback
   */
  async deleteFeedback(feedbackId: string, userId: string, isAdmin = false) {
    const whereClause = isAdmin
      ? eq(eventFeedback.id, feedbackId)
      : and(eq(eventFeedback.id, feedbackId), eq(eventFeedback.userId, userId));

    const [deleted] = await db
      .delete(eventFeedback)
      .where(whereClause)
      .returning();

    if (!deleted) {
      throw new Error('Feedback not found or you do not have permission to delete it');
    }

    log.info(`Feedback deleted: ${feedbackId}`);
  }

  /**
   * Get feedback for an event
   */
  async getEventFeedback(eventId: string, query: QueryFeedbackInput) {
    const { page, limit, offset } = parsePagination(query.page, query.limit);

    const [data, totalResult, statsResult] = await Promise.all([
      db.query.eventFeedback.findMany({
        where: eq(eventFeedback.eventId, eventId),
        with: {
          user: {
            columns: {
              id: true,
              firstName: true,
              lastName: true,
              profileImage: true,
            },
          },
        },
        limit,
        offset,
        orderBy: [desc(eventFeedback.createdAt)],
      }),
      db.select({ count: count() }).from(eventFeedback).where(eq(eventFeedback.eventId, eventId)),
      db
        .select({
          averageRating: avg(eventFeedback.rating),
          totalReviews: count(),
        })
        .from(eventFeedback)
        .where(eq(eventFeedback.eventId, eventId)),
    ]);

    // Hide user info for anonymous feedback
    const processedData = data.map((feedback) => ({
      ...feedback,
      user: feedback.isAnonymous ? null : feedback.user,
    }));

    return {
      data: processedData,
      total: totalResult[0]?.count || 0,
      page,
      limit,
      stats: {
        averageRating: statsResult[0]?.averageRating
          ? parseFloat(String(statsResult[0].averageRating))
          : null,
        totalReviews: statsResult[0]?.totalReviews || 0,
      },
    };
  }

  /**
   * Get user's feedback
   */
  async getUserFeedback(userId: string) {
    return db.query.eventFeedback.findMany({
      where: eq(eventFeedback.userId, userId),
      with: {
        event: {
          columns: {
            id: true,
            title: true,
            slug: true,
            coverImage: true,
          },
        },
      },
      orderBy: [desc(eventFeedback.createdAt)],
    });
  }

  /**
   * Get feedback by ID
   */
  async getFeedbackById(feedbackId: string) {
    return db.query.eventFeedback.findFirst({
      where: eq(eventFeedback.id, feedbackId),
      with: {
        user: {
          columns: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        event: {
          columns: {
            id: true,
            title: true,
            organizerId: true,
          },
        },
      },
    });
  }

  /**
   * Get overall event statistics with feedback
   */
  async getEventStatistics(eventId: string) {
    const [stats] = await db
      .select({
        averageRating: avg(eventFeedback.rating),
        totalReviews: count(),
      })
      .from(eventFeedback)
      .where(eq(eventFeedback.eventId, eventId));

    // Get rating distribution
    const distribution = await db
      .select({
        rating: eventFeedback.rating,
        count: count(),
      })
      .from(eventFeedback)
      .where(eq(eventFeedback.eventId, eventId))
      .groupBy(eventFeedback.rating);

    const ratingDistribution: Record<number, number> = {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
    };

    distribution.forEach((d) => {
      ratingDistribution[d.rating] = d.count;
    });

    return {
      averageRating: stats?.averageRating
        ? parseFloat(String(stats.averageRating))
        : null,
      totalReviews: stats?.totalReviews || 0,
      ratingDistribution,
    };
  }
}

export const feedbackService = new FeedbackService();

