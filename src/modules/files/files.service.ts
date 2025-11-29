import { eq, and, desc, count, sql } from 'drizzle-orm';
import { db, eventMaterials, events } from '../../db';
import { log } from '../../middleware/logger';
import { parsePagination } from '../../utils/pagination';
import type { CreateMaterialInput, UpdateMaterialInput, QueryMaterialsInput } from './files.schema';

export class FilesService {
  /**
   * Create an event material
   */
  async createMaterial(uploadedBy: string, input: CreateMaterialInput) {
    // Verify event exists and user is the organizer
    const event = await db.query.events.findFirst({
      where: eq(events.id, input.eventId),
      columns: { organizerId: true },
    });

    if (!event) {
      throw new Error('Event not found');
    }

    if (event.organizerId !== uploadedBy) {
      throw new Error('Only the event organizer can upload materials');
    }

    const [material] = await db
      .insert(eventMaterials)
      .values({
        eventId: input.eventId,
        uploadedBy,
        title: input.title,
        description: input.description,
        fileUrl: input.fileUrl,
        fileType: input.fileType,
        fileSize: input.fileSize,
        isPublic: input.isPublic,
      })
      .returning();

    log.info(`Material uploaded for event ${input.eventId}: ${material.title}`);
    return material;
  }

  /**
   * Get materials for an event
   */
  async getEventMaterials(eventId: string, isAuthenticated = false) {
    const conditions = [eq(eventMaterials.eventId, eventId)];

    // Only show public materials to non-authenticated users
    if (!isAuthenticated) {
      conditions.push(eq(eventMaterials.isPublic, true));
    }

    return db.query.eventMaterials.findMany({
      where: and(...conditions),
      with: {
        uploader: {
          columns: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: [desc(eventMaterials.createdAt)],
    });
  }

  /**
   * Get material by ID
   */
  async getMaterialById(materialId: string) {
    return db.query.eventMaterials.findFirst({
      where: eq(eventMaterials.id, materialId),
      with: {
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
   * Update material
   */
  async updateMaterial(materialId: string, userId: string, input: UpdateMaterialInput, isAdmin = false) {
    // Get material with event info
    const material = await this.getMaterialById(materialId);

    if (!material) {
      throw new Error('Material not found');
    }

    if (!isAdmin && material.event?.organizerId !== userId) {
      throw new Error('You do not have permission to update this material');
    }

    const [updated] = await db
      .update(eventMaterials)
      .set(input)
      .where(eq(eventMaterials.id, materialId))
      .returning();

    log.info(`Material updated: ${materialId}`);
    return updated;
  }

  /**
   * Delete material
   */
  async deleteMaterial(materialId: string, userId: string, isAdmin = false) {
    const material = await this.getMaterialById(materialId);

    if (!material) {
      throw new Error('Material not found');
    }

    if (!isAdmin && material.event?.organizerId !== userId) {
      throw new Error('You do not have permission to delete this material');
    }

    await db.delete(eventMaterials).where(eq(eventMaterials.id, materialId));

    log.info(`Material deleted: ${materialId}`);
  }

  /**
   * Increment download count
   */
  async incrementDownloadCount(materialId: string) {
    await db
      .update(eventMaterials)
      .set({
        downloadCount: sql`${eventMaterials.downloadCount} + 1`,
      })
      .where(eq(eventMaterials.id, materialId));
  }

  /**
   * Get materials uploaded by a user
   */
  async getUserMaterials(userId: string) {
    return db.query.eventMaterials.findMany({
      where: eq(eventMaterials.uploadedBy, userId),
      with: {
        event: {
          columns: {
            id: true,
            title: true,
            slug: true,
          },
        },
      },
      orderBy: [desc(eventMaterials.createdAt)],
    });
  }
}

export const filesService = new FilesService();

