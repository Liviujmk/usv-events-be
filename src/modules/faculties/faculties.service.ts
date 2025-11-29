import { eq } from 'drizzle-orm';
import { db, faculties, departments } from '../../db';
import { log } from '../../middleware/logger';
import type { CreateFacultyInput, UpdateFacultyInput, CreateDepartmentInput, UpdateDepartmentInput } from './faculties.schema';

export class FacultiesService {
  // ==================== FACULTIES ====================

  /**
   * Get all faculties
   */
  async getAllFaculties() {
    return db.query.faculties.findMany({
      with: {
        departments: true,
      },
      orderBy: (faculties, { asc }) => [asc(faculties.name)],
    });
  }

  /**
   * Get faculty by ID
   */
  async getFacultyById(id: string) {
    return db.query.faculties.findFirst({
      where: eq(faculties.id, id),
      with: {
        departments: true,
      },
    });
  }

  /**
   * Create a new faculty
   */
  async createFaculty(input: CreateFacultyInput) {
    const [faculty] = await db
      .insert(faculties)
      .values(input)
      .returning();

    log.info(`Faculty created: ${faculty.name}`);
    return faculty;
  }

  /**
   * Update a faculty
   */
  async updateFaculty(id: string, input: UpdateFacultyInput) {
    const [updated] = await db
      .update(faculties)
      .set({
        ...input,
        updatedAt: new Date(),
      })
      .where(eq(faculties.id, id))
      .returning();

    log.info(`Faculty updated: ${id}`);
    return updated;
  }

  /**
   * Delete a faculty
   */
  async deleteFaculty(id: string) {
    await db.delete(faculties).where(eq(faculties.id, id));
    log.info(`Faculty deleted: ${id}`);
  }

  // ==================== DEPARTMENTS ====================

  /**
   * Get all departments
   */
  async getAllDepartments() {
    return db.query.departments.findMany({
      with: {
        faculty: true,
      },
      orderBy: (departments, { asc }) => [asc(departments.name)],
    });
  }

  /**
   * Get departments by faculty
   */
  async getDepartmentsByFaculty(facultyId: string) {
    return db.query.departments.findMany({
      where: eq(departments.facultyId, facultyId),
      orderBy: (departments, { asc }) => [asc(departments.name)],
    });
  }

  /**
   * Get department by ID
   */
  async getDepartmentById(id: string) {
    return db.query.departments.findFirst({
      where: eq(departments.id, id),
      with: {
        faculty: true,
      },
    });
  }

  /**
   * Create a new department
   */
  async createDepartment(input: CreateDepartmentInput) {
    const [department] = await db
      .insert(departments)
      .values(input)
      .returning();

    log.info(`Department created: ${department.name}`);
    return department;
  }

  /**
   * Update a department
   */
  async updateDepartment(id: string, input: UpdateDepartmentInput) {
    const [updated] = await db
      .update(departments)
      .set({
        ...input,
        updatedAt: new Date(),
      })
      .where(eq(departments.id, id))
      .returning();

    log.info(`Department updated: ${id}`);
    return updated;
  }

  /**
   * Delete a department
   */
  async deleteDepartment(id: string) {
    await db.delete(departments).where(eq(departments.id, id));
    log.info(`Department deleted: ${id}`);
  }
}

export const facultiesService = new FacultiesService();

