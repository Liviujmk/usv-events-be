import { cors } from 'hono/cors';

/**
 * CORS middleware configuration
 */
export function corsMiddleware() {
  return cors({
    origin: (origin) => {
      // Allow requests from these origins
      // const allowedOrigins = [
      //   'http://localhost:3000',
      //   'http://localhost:5173',
      //   'http://127.0.0.1:3000',
      //   'http://127.0.0.1:5173',
      // ];
      const allowedOrigins = ['*'];
      // In production, add your frontend domain
      if (process.env.FRONTEND_URL) {
        allowedOrigins.push(process.env.FRONTEND_URL);
      }

      // Allow Vercel preview deployments
      if (origin && origin.includes('.vercel.app')) {
        return origin;
      }

      // Allow all origins in development or if no origin (same-origin requests)
      if (process.env.NODE_ENV === 'development' || !origin) {
        return origin;
      }

      // return allowedOrigins.includes(origin) ? origin : allowedOrigins[0];
      return '*';
    },
    // allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    // allowHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    // exposeHeaders: ['Content-Length', 'X-Request-Id'],
    credentials: true,
    maxAge: 86400, // 24 hours
  });
}

