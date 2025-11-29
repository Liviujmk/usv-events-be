import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { filesService } from './files.service';
import { createMaterialSchema, updateMaterialSchema } from './files.schema';
import { auth, optionalAuth } from '../../middleware/auth';
import { requireOrganizer } from '../../middleware/rbac';
import { success, error, successMessage, notFound, forbidden } from '../../utils/response';
import type { AuthUser } from '../../types';
import type { Env } from '../../types/hono';

const filesController = new Hono<Env>();

/**
 * GET /files/event/:eventId
 * Get materials for an event
 */
filesController.get('/event/:eventId', optionalAuth(), async (c) => {
  try {
    const { eventId } = c.req.param();
    const user = c.get('user') as AuthUser | undefined;
    
    const materials = await filesService.getEventMaterials(eventId, !!user);
    return success(c, materials);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to get materials';
    return error(c, message, 400);
  }
});

/**
 * GET /files/my
 * Get current user's uploaded materials
 */
filesController.get('/my', auth(), requireOrganizer(), async (c) => {
  try {
    const user = c.get('user') as AuthUser;
    const materials = await filesService.getUserMaterials(user.id);
    return success(c, materials);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to get materials';
    return error(c, message, 400);
  }
});

/**
 * POST /files
 * Upload a new material (organizer only)
 */
filesController.post(
  '/',
  auth(),
  requireOrganizer(),
  zValidator('json', createMaterialSchema),
  async (c) => {
    try {
      const user = c.get('user') as AuthUser;
      const input = c.req.valid('json');
      
      const material = await filesService.createMaterial(user.id, input);
      return success(c, material, 201);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to upload material';
      return error(c, message, 400);
    }
  }
);

/**
 * GET /files/:id
 * Get material by ID
 */
filesController.get('/:id', optionalAuth(), async (c) => {
  try {
    const { id } = c.req.param();
    const user = c.get('user') as AuthUser | undefined;
    
    const material = await filesService.getMaterialById(id);
    
    if (!material) {
      return notFound(c, 'Material not found');
    }
    
    // Check if material is public or user has access
    if (!material.isPublic && (!user || (user.id !== material.uploadedBy && user.role !== 'admin'))) {
      return notFound(c, 'Material not found');
    }
    
    return success(c, material);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to get material';
    return error(c, message, 400);
  }
});

/**
 * POST /files/:id/download
 * Increment download count and return material
 */
filesController.post('/:id/download', optionalAuth(), async (c) => {
  try {
    const { id } = c.req.param();
    const user = c.get('user') as AuthUser | undefined;
    
    const material = await filesService.getMaterialById(id);
    
    if (!material) {
      return notFound(c, 'Material not found');
    }
    
    if (!material.isPublic && (!user || (user.id !== material.uploadedBy && user.role !== 'admin'))) {
      return notFound(c, 'Material not found');
    }
    
    await filesService.incrementDownloadCount(id);
    
    return success(c, { fileUrl: material.fileUrl });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to get download URL';
    return error(c, message, 400);
  }
});

/**
 * PATCH /files/:id
 * Update material
 */
filesController.patch(
  '/:id',
  auth(),
  zValidator('json', updateMaterialSchema),
  async (c) => {
    try {
      const { id } = c.req.param();
      const user = c.get('user') as AuthUser;
      const input = c.req.valid('json');
      
      const updated = await filesService.updateMaterial(
        id,
        user.id,
        input,
        user.role === 'admin'
      );
      
      return success(c, updated);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update material';
      return error(c, message, 400);
    }
  }
);

/**
 * DELETE /files/:id
 * Delete material
 */
filesController.delete('/:id', auth(), async (c) => {
  try {
    const { id } = c.req.param();
    const user = c.get('user') as AuthUser;
    
    await filesService.deleteMaterial(id, user.id, user.role === 'admin');
    
    return successMessage(c, 'Material deleted successfully');
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to delete material';
    return error(c, message, 400);
  }
});

export { filesController };

