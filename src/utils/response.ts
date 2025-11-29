import type { Context } from 'hono';
import type { ContentfulStatusCode } from 'hono/utils/http-status';
import type { ApiResponse, PaginatedResponse } from '../types';

/**
 * Send a successful JSON response
 */
export function success<T>(c: Context, data: T, status: ContentfulStatusCode = 200) {
  const response: ApiResponse<T> = {
    success: true,
    data,
  };
  return c.json(response, status);
}

/**
 * Send a successful response with a message
 */
export function successMessage(c: Context, message: string, status: ContentfulStatusCode = 200) {
  const response: ApiResponse = {
    success: true,
    message,
  };
  return c.json(response, status);
}

/**
 * Send a paginated response
 */
export function paginated<T>(
  c: Context,
  data: T[],
  page: number,
  limit: number,
  total: number
) {
  const totalPages = Math.ceil(total / limit);
  const response: PaginatedResponse<T> = {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
  return c.json({ success: true, ...response }, 200);
}

/**
 * Send an error response
 */
export function error(c: Context, message: string, status: ContentfulStatusCode = 400) {
  const response: ApiResponse = {
    success: false,
    message,
  };
  return c.json(response, status);
}

/**
 * Send a validation error response
 */
export function validationError(c: Context, errors: Record<string, string[]>) {
  const response: ApiResponse = {
    success: false,
    message: 'Validation failed',
    errors,
  };
  return c.json(response, 422);
}

/**
 * Send an unauthorized response
 */
export function unauthorized(c: Context, message: string = 'Unauthorized') {
  const response: ApiResponse = {
    success: false,
    message,
  };
  return c.json(response, 401);
}

/**
 * Send a forbidden response
 */
export function forbidden(c: Context, message: string = 'Forbidden') {
  const response: ApiResponse = {
    success: false,
    message,
  };
  return c.json(response, 403);
}

/**
 * Send a not found response
 */
export function notFound(c: Context, message: string = 'Resource not found') {
  const response: ApiResponse = {
    success: false,
    message,
  };
  return c.json(response, 404);
}

/**
 * Send an internal server error response
 */
export function serverError(c: Context, message: string = 'Internal server error') {
  const response: ApiResponse = {
    success: false,
    message,
  };
  return c.json(response, 500);
}

