import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { facultiesService } from './faculties.service';
import {
  createFacultySchema,
  updateFacultySchema,
  createDepartmentSchema,
  updateDepartmentSchema,
} from './faculties.schema';
import { auth } from '../../middleware/auth';
import { requireAdmin } from '../../middleware/rbac';
import { success, error, successMessage, notFound } from '../../utils/response';
import type { Env } from '../../types/hono';

const facultiesController = new Hono<Env>();

// ==================== FACULTIES ====================

/**
 * GET /faculties
 * Get all faculties (public)
 */
facultiesController.get('/', async (c) => {
  try {
    const faculties = await facultiesService.getAllFaculties();
    return success(c, faculties);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to get faculties';
    return error(c, message, 400);
  }
});

/**
 * GET /faculties/:id
 * Get faculty by ID (public)
 */
facultiesController.get('/:id', async (c) => {
  try {
    const { id } = c.req.param();
    const faculty = await facultiesService.getFacultyById(id);

    if (!faculty) {
      return notFound(c, 'Faculty not found');
    }

    return success(c, faculty);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to get faculty';
    return error(c, message, 400);
  }
});

/**
 * POST /faculties
 * Create a new faculty (admin only)
 */
facultiesController.post(
  '/',
  auth(),
  requireAdmin(),
  zValidator('json', createFacultySchema),
  async (c) => {
    try {
      const input = c.req.valid('json');
      const faculty = await facultiesService.createFaculty(input);
      return success(c, faculty, 201);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create faculty';
      return error(c, message, 400);
    }
  }
);

/**
 * PATCH /faculties/:id
 * Update a faculty (admin only)
 */
facultiesController.patch(
  '/:id',
  auth(),
  requireAdmin(),
  zValidator('json', updateFacultySchema),
  async (c) => {
    try {
      const { id } = c.req.param();
      const input = c.req.valid('json');

      const existing = await facultiesService.getFacultyById(id);
      if (!existing) {
        return notFound(c, 'Faculty not found');
      }

      const updated = await facultiesService.updateFaculty(id, input);
      return success(c, updated);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update faculty';
      return error(c, message, 400);
    }
  }
);

/**
 * DELETE /faculties/:id
 * Delete a faculty (admin only)
 */
facultiesController.delete('/:id', auth(), requireAdmin(), async (c) => {
  try {
    const { id } = c.req.param();

    const existing = await facultiesService.getFacultyById(id);
    if (!existing) {
      return notFound(c, 'Faculty not found');
    }

    await facultiesService.deleteFaculty(id);
    return successMessage(c, 'Faculty deleted successfully');
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to delete faculty';
    return error(c, message, 400);
  }
});

/**
 * GET /faculties/:id/departments
 * Get departments by faculty (public)
 */
facultiesController.get('/:id/departments', async (c) => {
  try {
    const { id } = c.req.param();
    const departments = await facultiesService.getDepartmentsByFaculty(id);
    return success(c, departments);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to get departments';
    return error(c, message, 400);
  }
});

// ==================== DEPARTMENTS ====================

/**
 * GET /departments
 * Get all departments (public)
 */
const departmentsController = new Hono<Env>();

departmentsController.get('/', async (c) => {
  try {
    const departments = await facultiesService.getAllDepartments();
    return success(c, departments);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to get departments';
    return error(c, message, 400);
  }
});

/**
 * GET /departments/:id
 * Get department by ID (public)
 */
departmentsController.get('/:id', async (c) => {
  try {
    const { id } = c.req.param();
    const department = await facultiesService.getDepartmentById(id);

    if (!department) {
      return notFound(c, 'Department not found');
    }

    return success(c, department);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to get department';
    return error(c, message, 400);
  }
});

/**
 * POST /departments
 * Create a new department (admin only)
 */
departmentsController.post(
  '/',
  auth(),
  requireAdmin(),
  zValidator('json', createDepartmentSchema),
  async (c) => {
    try {
      const input = c.req.valid('json');
      const department = await facultiesService.createDepartment(input);
      return success(c, department, 201);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create department';
      return error(c, message, 400);
    }
  }
);

/**
 * PATCH /departments/:id
 * Update a department (admin only)
 */
departmentsController.patch(
  '/:id',
  auth(),
  requireAdmin(),
  zValidator('json', updateDepartmentSchema),
  async (c) => {
    try {
      const { id } = c.req.param();
      const input = c.req.valid('json');

      const existing = await facultiesService.getDepartmentById(id);
      if (!existing) {
        return notFound(c, 'Department not found');
      }

      const updated = await facultiesService.updateDepartment(id, input);
      return success(c, updated);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update department';
      return error(c, message, 400);
    }
  }
);

/**
 * DELETE /departments/:id
 * Delete a department (admin only)
 */
departmentsController.delete('/:id', auth(), requireAdmin(), async (c) => {
  try {
    const { id } = c.req.param();

    const existing = await facultiesService.getDepartmentById(id);
    if (!existing) {
      return notFound(c, 'Department not found');
    }

    await facultiesService.deleteDepartment(id);
    return successMessage(c, 'Department deleted successfully');
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to delete department';
    return error(c, message, 400);
  }
});

export { facultiesController, departmentsController };

