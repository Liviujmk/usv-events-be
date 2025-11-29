import type { Context } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { serverError, error } from '../utils/response';
import { log } from './logger';

/**
 * Global error handler middleware
 */
export function errorHandler(err: Error, c: Context) {
  const requestId = c.get('requestId') || 'unknown';
  
  // Handle Hono HTTP exceptions
  if (err instanceof HTTPException) {
    log.warn(`HTTP Exception [${requestId}]: ${err.message}`, {
      status: err.status,
      path: c.req.path,
    });
    
    return error(c, err.message, err.status);
  }
  
  // Handle Zod validation errors
  if (err.name === 'ZodError') {
    log.warn(`Validation Error [${requestId}]:`, err);
    return error(c, 'Validation failed', 422);
  }
  
  // Handle database errors
  if (err.message?.includes('duplicate key') || err.message?.includes('unique constraint')) {
    log.warn(`Database Constraint Error [${requestId}]:`, err.message);
    return error(c, 'A record with this value already exists', 409);
  }
  
  // Log unexpected errors
  log.error(`Unexpected Error [${requestId}]:`, err);
  
  // Don't expose error details in production
  const message = process.env.NODE_ENV === 'production'
    ? 'An unexpected error occurred'
    : err.message;
  
  return serverError(c, message);
}

