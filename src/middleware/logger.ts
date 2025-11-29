import type { Context, Next } from 'hono';

/**
 * Color codes for terminal output
 */
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
} as const;

/**
 * Get color based on HTTP status code
 */
function getStatusColor(status: number): string {
  if (status >= 500) return colors.red;
  if (status >= 400) return colors.yellow;
  if (status >= 300) return colors.cyan;
  if (status >= 200) return colors.green;
  return colors.reset;
}

/**
 * Get color based on HTTP method
 */
function getMethodColor(method: string): string {
  switch (method) {
    case 'GET': return colors.green;
    case 'POST': return colors.blue;
    case 'PUT': return colors.yellow;
    case 'PATCH': return colors.yellow;
    case 'DELETE': return colors.red;
    default: return colors.reset;
  }
}

/**
 * Format duration to human readable string
 */
function formatDuration(ms: number): string {
  if (ms < 1) return `${(ms * 1000).toFixed(0)}µs`;
  if (ms < 1000) return `${ms.toFixed(0)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

/**
 * Generate a unique request ID
 */
function generateRequestId(): string {
  return `req_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 8)}`;
}

/**
 * Logger middleware - logs all incoming requests and their responses
 */
export function logger() {
  return async (c: Context, next: Next) => {
    const requestId = generateRequestId();
    const startTime = Date.now();
    
    // Store request info in context
    c.set('requestId', requestId);
    c.set('startTime', startTime);
    
    const method = c.req.method;
    const path = c.req.path;
    const userAgent = c.req.header('user-agent') || 'unknown';
    const ip = c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || 'unknown';
    
    // Log incoming request
    console.log(
      `${colors.dim}[${new Date().toISOString()}]${colors.reset} ` +
      `${colors.magenta}${requestId}${colors.reset} ` +
      `${colors.cyan}-->>${colors.reset} ` +
      `${getMethodColor(method)}${method.padEnd(7)}${colors.reset} ` +
      `${path}`
    );
    
    try {
      await next();
      
      const duration = Date.now() - startTime;
      const status = c.res.status;
      
      // Log response
      console.log(
        `${colors.dim}[${new Date().toISOString()}]${colors.reset} ` +
        `${colors.magenta}${requestId}${colors.reset} ` +
        `${colors.cyan}<<--${colors.reset} ` +
        `${getMethodColor(method)}${method.padEnd(7)}${colors.reset} ` +
        `${path} ` +
        `${getStatusColor(status)}${status}${colors.reset} ` +
        `${colors.dim}${formatDuration(duration)}${colors.reset}`
      );
    } catch (err) {
      const duration = Date.now() - startTime;
      
      // Log error
      console.error(
        `${colors.dim}[${new Date().toISOString()}]${colors.reset} ` +
        `${colors.magenta}${requestId}${colors.reset} ` +
        `${colors.red}ERROR${colors.reset} ` +
        `${getMethodColor(method)}${method.padEnd(7)}${colors.reset} ` +
        `${path} ` +
        `${colors.dim}${formatDuration(duration)}${colors.reset}`,
        err
      );
      
      throw err;
    }
  };
}

/**
 * Simple console logger utility
 */
export const log = {
  info: (message: string, data?: unknown) => {
    console.log(
      `${colors.dim}[${new Date().toISOString()}]${colors.reset} ` +
      `${colors.blue}INFO${colors.reset} ` +
      message,
      data ? data : ''
    );
  },
  
  warn: (message: string, data?: unknown) => {
    console.warn(
      `${colors.dim}[${new Date().toISOString()}]${colors.reset} ` +
      `${colors.yellow}WARN${colors.reset} ` +
      message,
      data ? data : ''
    );
  },
  
  error: (message: string, error?: unknown) => {
    console.error(
      `${colors.dim}[${new Date().toISOString()}]${colors.reset} ` +
      `${colors.red}ERROR${colors.reset} ` +
      message,
      error ? error : ''
    );
  },
  
  debug: (message: string, data?: unknown) => {
    if (process.env.NODE_ENV !== 'production') {
      console.log(
        `${colors.dim}[${new Date().toISOString()}]${colors.reset} ` +
        `${colors.magenta}DEBUG${colors.reset} ` +
        message,
        data ? data : ''
      );
    }
  },
};

