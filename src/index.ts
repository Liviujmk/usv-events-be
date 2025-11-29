import { Hono } from 'hono';
import { swaggerUI } from '@hono/swagger-ui';
import { logger, errorHandler, corsMiddleware, log } from './middleware';
import { getOpenApiDocument } from './docs/openapi';
import type { Env } from './types/hono';

// Import controllers
import { authController } from './modules/auth';
import { usersController } from './modules/users';
import { eventsController } from './modules/events';
import { facultiesController, departmentsController } from './modules/faculties';
import { feedbackController } from './modules/feedback';
import { notificationsController } from './modules/notifications';
import { filesController } from './modules/files';

// Create main app
const app = new Hono<Env>();

// Global middleware
app.use('*', corsMiddleware());
app.use('*', logger());

// Error handling
app.onError(errorHandler);

// Health check endpoint
app.get('/', (c) => {
  return c.json({
    name: 'USV Events API',
    version: '1.0.0',
    status: 'healthy',
    docs: '/docs',
    timestamp: new Date().toISOString(),
  });
});

// Health check for monitoring
app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    environment: process.env.VERCEL ? 'vercel' : 'local',
    timestamp: new Date().toISOString(),
  });
});

// OpenAPI JSON endpoint
app.get('/openapi.json', (c) => {
  return c.json(getOpenApiDocument());
});

// Swagger UI
app.get('/docs', swaggerUI({ url: '/openapi.json', title: 'USV Events API', }));

// API Routes - v1
const v1 = new Hono<Env>();

// Mount controllers
v1.route('/auth', authController);
v1.route('/users', usersController);
v1.route('/events', eventsController);
v1.route('/faculties', facultiesController);
v1.route('/departments', departmentsController);
v1.route('/feedback', feedbackController);
v1.route('/notifications', notificationsController);
v1.route('/files', filesController);

// Mount v1 API
app.route('/api/v1', v1);

// 404 handler
app.notFound((c) => {
  return c.json(
    {
      success: false,
      message: 'Route not found',
      path: c.req.path,
    },
    404
  );
});

// Log startup
log.info('🚀 USV Events API starting...');
log.info(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);

export default app;
