import type { PaginationParams } from '../types';
import { config } from '../config';

/**
 * Parse pagination parameters from query string
 */
export function parsePagination(
  page?: string | number,
  limit?: string | number
): PaginationParams {
  const parsedPage = Math.max(1, parseInt(String(page || 1), 10) || 1);
  const parsedLimit = Math.min(
    config.pagination.maxLimit,
    Math.max(1, parseInt(String(limit || config.pagination.defaultLimit), 10) || config.pagination.defaultLimit)
  );
  
  return {
    page: parsedPage,
    limit: parsedLimit,
    offset: (parsedPage - 1) * parsedLimit,
  };
}

