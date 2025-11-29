import { eq, and, ilike, or, sql, count } from 'drizzle-orm';
import { db, users, userInterests, organizerProfiles, faculties } from '../../db';
import { log } from '../../middleware/logger';
import { parsePagination } from '../../utils/pagination';
import type { UpdateProfileInput, UpdateInterestsInput, ListUsersQuery } from './users.schema';
import type { EventType, UserRole } from '../../types';

export class UsersService {
  /**
   * Get user by ID
   */
  async getUserById(userId: string) {
    const result = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: {
        password: false,
      },
      with: {
        faculty: true,
        organizerProfile: true,
        interests: true,
      },
    });

    return result;
  }

  /**
   * Update user profile
   */
  async updateProfile(userId: string, input: UpdateProfileInput) {
    const [updated] = await db
      .update(users)
      .set({
        ...input,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        role: users.role,
        facultyId: users.facultyId,
        profileImage: users.profileImage,
        phone: users.phone,
        bio: users.bio,
      });

    log.info(`Profile updated for user: ${userId}`);
    return updated;
  }

  /**
   * Update user interests
   */
  async updateInterests(userId: string, interests: EventType[]) {
    // Delete existing interests
    await db.delete(userInterests).where(eq(userInterests.userId, userId));

    // Insert new interests
    if (interests.length > 0) {
      await db.insert(userInterests).values(
        interests.map((eventType) => ({
          userId,
          eventType,
        }))
      );
    }

    log.info(`Interests updated for user: ${userId}`);
    return interests;
  }

  /**
   * Get user interests
   */
  async getUserInterests(userId: string): Promise<EventType[]> {
    const result = await db
      .select({ eventType: userInterests.eventType })
      .from(userInterests)
      .where(eq(userInterests.userId, userId));

    return result.map((r) => r.eventType);
  }

  /**
   * List users (admin only)
   */
  async listUsers(query: ListUsersQuery) {
    const { page, limit, offset } = parsePagination(query.page, query.limit);

    const conditions = [];

    if (query.role) {
      conditions.push(eq(users.role, query.role));
    }

    if (query.facultyId) {
      conditions.push(eq(users.facultyId, query.facultyId));
    }

    if (query.isActive !== undefined) {
      conditions.push(eq(users.isActive, query.isActive === 'true'));
    }

    if (query.search) {
      const searchTerm = `%${query.search}%`;
      conditions.push(
        or(
          ilike(users.email, searchTerm),
          ilike(users.firstName, searchTerm),
          ilike(users.lastName, searchTerm)
        )
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [data, totalResult] = await Promise.all([
      db
        .select({
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          role: users.role,
          facultyId: users.facultyId,
          profileImage: users.profileImage,
          isActive: users.isActive,
          createdAt: users.createdAt,
        })
        .from(users)
        .where(whereClause)
        .limit(limit)
        .offset(offset)
        .orderBy(users.createdAt),
      db
        .select({ count: count() })
        .from(users)
        .where(whereClause),
    ]);

    return {
      data,
      total: totalResult[0]?.count || 0,
      page,
      limit,
    };
  }

  /**
   * Update user role (admin only)
   */
  async updateUserRole(userId: string, role: UserRole) {
    const [updated] = await db
      .update(users)
      .set({
        role,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning({
        id: users.id,
        email: users.email,
        role: users.role,
      });

    log.info(`Role updated for user ${userId} to ${role}`);
    return updated;
  }

  /**
   * Update user status (admin only)
   */
  async updateUserStatus(userId: string, isActive: boolean) {
    const [updated] = await db
      .update(users)
      .set({
        isActive,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning({
        id: users.id,
        email: users.email,
        isActive: users.isActive,
      });

    log.info(`Status updated for user ${userId} to ${isActive ? 'active' : 'inactive'}`);
    return updated;
  }

  /**
   * Create or update organizer profile
   */
  async upsertOrganizerProfile(
    userId: string,
    data: {
      organizationName: string;
      organizationType?: string;
      description?: string;
      website?: string;
      socialLinks?: Record<string, string>;
    }
  ) {
    const existing = await db.query.organizerProfiles.findFirst({
      where: eq(organizerProfiles.userId, userId),
    });

    if (existing) {
      const [updated] = await db
        .update(organizerProfiles)
        .set({
          ...data,
          updatedAt: new Date(),
        })
        .where(eq(organizerProfiles.userId, userId))
        .returning();

      return updated;
    }

    const [created] = await db
      .insert(organizerProfiles)
      .values({
        userId,
        ...data,
      })
      .returning();

    log.info(`Organizer profile created for user: ${userId}`);
    return created;
  }

  /**
   * Verify organizer profile (admin only)
   */
  async verifyOrganizerProfile(profileId: string, adminId: string) {
    const [updated] = await db
      .update(organizerProfiles)
      .set({
        isVerified: true,
        verifiedAt: new Date(),
        verifiedBy: adminId,
        updatedAt: new Date(),
      })
      .where(eq(organizerProfiles.id, profileId))
      .returning();

    log.info(`Organizer profile ${profileId} verified by admin ${adminId}`);
    return updated;
  }
}

export const usersService = new UsersService();

