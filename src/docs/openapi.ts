import type { OpenAPIV3 } from 'openapi-types';

/**
 * Get the base URL for the API based on the environment
 */
function getServers(): OpenAPIV3.ServerObject[] {
  const servers: OpenAPIV3.ServerObject[] = [];

  // Add Vercel production URL if available
  if (process.env.VERCEL_URL) {
    servers.push({
      url: `https://${process.env.VERCEL_URL}`,
      description: 'Production server',
    });
  }

  // Add custom production URL if set
  if (process.env.API_URL) {
    servers.push({
      url: process.env.API_URL,
      description: 'Production server',
    });
  }

  // Always include localhost for development
  servers.push({
    url: 'http://localhost:3000',
    description: 'Development server',
  });

  return servers;
}

export function getOpenApiDocument(): OpenAPIV3.Document {
  return {
    openapi: '3.0.0',
    info: {
      title: 'USV Events API',
      version: '1.0.0',
      description: `
# University Events Management System API

A centralized platform for managing university events. This API provides endpoints for:

- **Authentication** - User registration, login, and token management
- **Users** - Profile management and user administration
- **Events** - Event CRUD, registration, favorites, and check-in
- **Faculties & Departments** - Academic structure management
- **Feedback** - Event reviews and ratings
- **Notifications** - User notification management
- **Files** - Event materials upload and download

## Authentication

Most endpoints require authentication via JWT Bearer token. Include the token in the Authorization header:

\`\`\`
Authorization: Bearer <your_access_token>
\`\`\`

## User Roles

| Role | Description |
|------|-------------|
| \`student\` | Can browse, register, and review events |
| \`organizer\` | Can create and manage events |
| \`admin\` | Full system access |
    `,
      contact: {
        name: 'USV Events Team',
        email: 'events@usv.ro',
      },
    },
    servers: getServers(),
    tags: [
      { name: 'Auth', description: 'Authentication endpoints' },
      { name: 'Users', description: 'User management endpoints' },
      { name: 'Events', description: 'Event management endpoints' },
      { name: 'Faculties', description: 'Faculty management endpoints' },
      { name: 'Departments', description: 'Department management endpoints' },
      { name: 'Feedback', description: 'Event feedback endpoints' },
      { name: 'Notifications', description: 'Notification endpoints' },
      { name: 'Files', description: 'File/material management endpoints' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT access token',
        },
      },
      schemas: {
        // Common schemas
        ApiResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            data: { type: 'object' },
          },
        },
        PaginatedResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'array', items: { type: 'object' } },
            pagination: {
              type: 'object',
              properties: {
                page: { type: 'integer' },
                limit: { type: 'integer' },
                total: { type: 'integer' },
                totalPages: { type: 'integer' },
                hasNext: { type: 'boolean' },
                hasPrev: { type: 'boolean' },
              },
            },
          },
        },
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string' },
            errors: {
              type: 'object',
              additionalProperties: {
                type: 'array',
                items: { type: 'string' },
              },
            },
          },
        },

        // User schemas
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            email: { type: 'string', format: 'email' },
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            role: { type: 'string', enum: ['student', 'organizer', 'admin'] },
            facultyId: { type: 'string', format: 'uuid', nullable: true },
            profileImage: { type: 'string', nullable: true },
            phone: { type: 'string', nullable: true },
            bio: { type: 'string', nullable: true },
            emailVerified: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        RegisterInput: {
          type: 'object',
          required: ['email', 'password', 'firstName', 'lastName'],
          properties: {
            email: { type: 'string', format: 'email', example: 'student@usv.ro' },
            password: { type: 'string', minLength: 8, example: 'SecurePass123' },
            firstName: { type: 'string', example: 'Ion' },
            lastName: { type: 'string', example: 'Popescu' },
            facultyId: { type: 'string', format: 'uuid' },
            phone: { type: 'string', example: '+40712345678' },
          },
        },
        LoginInput: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email', example: 'student@usv.ro' },
            password: { type: 'string', example: 'SecurePass123' },
          },
        },
        AuthResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                user: { $ref: '#/components/schemas/User' },
                accessToken: { type: 'string' },
                refreshToken: { type: 'string' },
              },
            },
          },
        },

        // Event schemas
        Event: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            title: { type: 'string' },
            slug: { type: 'string' },
            description: { type: 'string' },
            shortDescription: { type: 'string', nullable: true },
            type: { type: 'string', enum: ['academic', 'social', 'career', 'sports', 'volunteering', 'cultural', 'workshop', 'conference', 'other'] },
            status: { type: 'string', enum: ['draft', 'pending', 'approved', 'rejected', 'cancelled', 'completed'] },
            organizerId: { type: 'string', format: 'uuid' },
            facultyId: { type: 'string', format: 'uuid', nullable: true },
            departmentId: { type: 'string', format: 'uuid', nullable: true },
            startDate: { type: 'string', format: 'date-time' },
            endDate: { type: 'string', format: 'date-time' },
            registrationDeadline: { type: 'string', format: 'date-time', nullable: true },
            location: { type: 'string' },
            address: { type: 'string', nullable: true },
            isOnline: { type: 'boolean' },
            onlineLink: { type: 'string', nullable: true },
            maxParticipants: { type: 'integer', nullable: true },
            currentParticipants: { type: 'integer' },
            coverImage: { type: 'string', nullable: true },
            tags: { type: 'array', items: { type: 'string' }, nullable: true },
            isFeatured: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        CreateEventInput: {
          type: 'object',
          required: ['title', 'description', 'startDate', 'endDate', 'location'],
          properties: {
            title: { type: 'string', minLength: 5, maxLength: 255, example: 'Workshop: Introduction to AI' },
            description: { type: 'string', minLength: 20, example: 'Learn the basics of artificial intelligence in this hands-on workshop.' },
            shortDescription: { type: 'string', maxLength: 500 },
            type: { type: 'string', enum: ['academic', 'social', 'career', 'sports', 'volunteering', 'cultural', 'workshop', 'conference', 'other'], default: 'other' },
            facultyId: { type: 'string', format: 'uuid' },
            departmentId: { type: 'string', format: 'uuid' },
            startDate: { type: 'string', format: 'date-time', example: '2024-03-15T10:00:00Z' },
            endDate: { type: 'string', format: 'date-time', example: '2024-03-15T14:00:00Z' },
            registrationDeadline: { type: 'string', format: 'date-time' },
            location: { type: 'string', example: 'Room A101, Building C' },
            address: { type: 'string' },
            isOnline: { type: 'boolean', default: false },
            onlineLink: { type: 'string', format: 'uri' },
            maxParticipants: { type: 'integer', minimum: 1 },
            coverImage: { type: 'string', format: 'uri' },
            tags: { type: 'array', items: { type: 'string' } },
            requirements: { type: 'string' },
            targetAudience: { type: 'string' },
          },
        },

        // Registration schemas
        EventRegistration: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            eventId: { type: 'string', format: 'uuid' },
            userId: { type: 'string', format: 'uuid' },
            status: { type: 'string', enum: ['pending', 'confirmed', 'cancelled', 'attended'] },
            ticketNumber: { type: 'string' },
            qrCode: { type: 'string' },
            checkedInAt: { type: 'string', format: 'date-time', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },

        // Faculty schemas
        Faculty: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            abbreviation: { type: 'string' },
            description: { type: 'string', nullable: true },
            website: { type: 'string', nullable: true },
            contactEmail: { type: 'string', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        CreateFacultyInput: {
          type: 'object',
          required: ['name', 'abbreviation'],
          properties: {
            name: { type: 'string', example: 'Faculty of Electrical Engineering and Computer Science' },
            abbreviation: { type: 'string', example: 'FIESC' },
            description: { type: 'string' },
            website: { type: 'string', format: 'uri' },
            contactEmail: { type: 'string', format: 'email' },
          },
        },

        // Department schemas
        Department: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            facultyId: { type: 'string', format: 'uuid' },
            description: { type: 'string', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },

        // Feedback schemas
        Feedback: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            eventId: { type: 'string', format: 'uuid' },
            userId: { type: 'string', format: 'uuid' },
            rating: { type: 'integer', minimum: 1, maximum: 5 },
            comment: { type: 'string', nullable: true },
            isAnonymous: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        CreateFeedbackInput: {
          type: 'object',
          required: ['eventId', 'rating'],
          properties: {
            eventId: { type: 'string', format: 'uuid' },
            rating: { type: 'integer', minimum: 1, maximum: 5, example: 4 },
            comment: { type: 'string', example: 'Great event, very informative!' },
            isAnonymous: { type: 'boolean', default: false },
          },
        },

        // Notification schemas
        Notification: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            userId: { type: 'string', format: 'uuid' },
            type: { type: 'string', enum: ['event_reminder', 'event_update', 'registration_confirmed', 'event_cancelled', 'recommendation', 'feedback_request'] },
            title: { type: 'string' },
            message: { type: 'string' },
            isRead: { type: 'boolean' },
            readAt: { type: 'string', format: 'date-time', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },

        // Material schemas
        EventMaterial: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            eventId: { type: 'string', format: 'uuid' },
            title: { type: 'string' },
            description: { type: 'string', nullable: true },
            fileUrl: { type: 'string', format: 'uri' },
            fileType: { type: 'string' },
            fileSize: { type: 'integer', nullable: true },
            isPublic: { type: 'boolean' },
            downloadCount: { type: 'integer' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
    paths: {
      // ==================== AUTH ====================
      '/api/v1/auth/register': {
        post: {
          tags: ['Auth'],
          summary: 'Register a new user',
          description: 'Create a new user account with email and password',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/RegisterInput' },
              },
            },
          },
          responses: {
            '201': {
              description: 'User registered successfully',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/AuthResponse' },
                },
              },
            },
            '400': {
              description: 'Invalid input or user already exists',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                },
              },
            },
          },
        },
      },
      '/api/v1/auth/login': {
        post: {
          tags: ['Auth'],
          summary: 'Login',
          description: 'Authenticate user with email and password',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/LoginInput' },
              },
            },
          },
          responses: {
            '200': {
              description: 'Login successful',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/AuthResponse' },
                },
              },
            },
            '401': {
              description: 'Invalid credentials',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                },
              },
            },
          },
        },
      },
      '/api/v1/auth/refresh': {
        post: {
          tags: ['Auth'],
          summary: 'Refresh access token',
          description: 'Get a new access token using refresh token',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['refreshToken'],
                  properties: {
                    refreshToken: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Token refreshed successfully',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/AuthResponse' },
                },
              },
            },
            '401': {
              description: 'Invalid or expired refresh token',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                },
              },
            },
          },
        },
      },
      '/api/v1/auth/logout': {
        post: {
          tags: ['Auth'],
          summary: 'Logout',
          description: 'Invalidate refresh token and logout user',
          security: [{ bearerAuth: [] }],
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    refreshToken: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Logged out successfully',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ApiResponse' },
                },
              },
            },
          },
        },
      },
      '/api/v1/auth/me': {
        get: {
          tags: ['Auth'],
          summary: 'Get current user',
          description: 'Get the currently authenticated user profile',
          security: [{ bearerAuth: [] }],
          responses: {
            '200': {
              description: 'User profile',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      data: { $ref: '#/components/schemas/User' },
                    },
                  },
                },
              },
            },
            '401': {
              description: 'Unauthorized',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                },
              },
            },
          },
        },
      },
      '/api/v1/auth/change-password': {
        post: {
          tags: ['Auth'],
          summary: 'Change password',
          description: 'Change the current user password',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['currentPassword', 'newPassword'],
                  properties: {
                    currentPassword: { type: 'string' },
                    newPassword: { type: 'string', minLength: 8 },
                  },
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Password changed successfully',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ApiResponse' },
                },
              },
            },
            '400': {
              description: 'Invalid current password',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                },
              },
            },
          },
        },
      },

      // ==================== USERS ====================
      '/api/v1/users/me': {
        get: {
          tags: ['Users'],
          summary: 'Get my profile',
          description: 'Get the full profile of the authenticated user',
          security: [{ bearerAuth: [] }],
          responses: {
            '200': {
              description: 'User profile with relations',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      data: { $ref: '#/components/schemas/User' },
                    },
                  },
                },
              },
            },
          },
        },
        patch: {
          tags: ['Users'],
          summary: 'Update my profile',
          description: 'Update the authenticated user profile',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    firstName: { type: 'string' },
                    lastName: { type: 'string' },
                    facultyId: { type: 'string', format: 'uuid', nullable: true },
                    profileImage: { type: 'string', format: 'uri', nullable: true },
                    phone: { type: 'string', nullable: true },
                    bio: { type: 'string', nullable: true },
                  },
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Profile updated successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      data: { $ref: '#/components/schemas/User' },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/api/v1/users/me/interests': {
        get: {
          tags: ['Users'],
          summary: 'Get my interests',
          description: 'Get the event type interests of the authenticated user',
          security: [{ bearerAuth: [] }],
          responses: {
            '200': {
              description: 'User interests',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      data: {
                        type: 'object',
                        properties: {
                          interests: {
                            type: 'array',
                            items: { type: 'string', enum: ['academic', 'social', 'career', 'sports', 'volunteering', 'cultural', 'workshop', 'conference', 'other'] },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        put: {
          tags: ['Users'],
          summary: 'Update my interests',
          description: 'Update the event type interests of the authenticated user',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['interests'],
                  properties: {
                    interests: {
                      type: 'array',
                      items: { type: 'string', enum: ['academic', 'social', 'career', 'sports', 'volunteering', 'cultural', 'workshop', 'conference', 'other'] },
                    },
                  },
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Interests updated successfully',
            },
          },
        },
      },
      '/api/v1/users': {
        get: {
          tags: ['Users'],
          summary: 'List users (Admin)',
          description: 'List all users with filtering and pagination. Admin only.',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
            { name: 'limit', in: 'query', schema: { type: 'integer', default: 20, maximum: 100 } },
            { name: 'role', in: 'query', schema: { type: 'string', enum: ['student', 'organizer', 'admin'] } },
            { name: 'facultyId', in: 'query', schema: { type: 'string', format: 'uuid' } },
            { name: 'search', in: 'query', schema: { type: 'string' }, description: 'Search by name or email' },
            { name: 'isActive', in: 'query', schema: { type: 'boolean' } },
          ],
          responses: {
            '200': {
              description: 'Paginated list of users',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/PaginatedResponse' },
                },
              },
            },
            '403': {
              description: 'Forbidden - Admin access required',
            },
          },
        },
      },
      '/api/v1/users/{id}/role': {
        patch: {
          tags: ['Users'],
          summary: 'Update user role (Admin)',
          description: 'Update a user role. Admin only.',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['role'],
                  properties: {
                    role: { type: 'string', enum: ['student', 'organizer', 'admin'] },
                  },
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Role updated successfully',
            },
            '403': {
              description: 'Forbidden - Admin access required',
            },
          },
        },
      },

      // ==================== EVENTS ====================
      '/api/v1/events': {
        get: {
          tags: ['Events'],
          summary: 'List events',
          description: 'List all approved events with filtering and pagination',
          parameters: [
            { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
            { name: 'limit', in: 'query', schema: { type: 'integer', default: 20, maximum: 100 } },
            { name: 'type', in: 'query', schema: { type: 'string', enum: ['academic', 'social', 'career', 'sports', 'volunteering', 'cultural', 'workshop', 'conference', 'other'] } },
            { name: 'facultyId', in: 'query', schema: { type: 'string', format: 'uuid' } },
            { name: 'departmentId', in: 'query', schema: { type: 'string', format: 'uuid' } },
            { name: 'startDateFrom', in: 'query', schema: { type: 'string', format: 'date-time' } },
            { name: 'startDateTo', in: 'query', schema: { type: 'string', format: 'date-time' } },
            { name: 'isOnline', in: 'query', schema: { type: 'boolean' } },
            { name: 'isFeatured', in: 'query', schema: { type: 'boolean' } },
            { name: 'search', in: 'query', schema: { type: 'string' }, description: 'Search in title, description, location' },
            { name: 'sortBy', in: 'query', schema: { type: 'string', enum: ['startDate', 'createdAt', 'title'], default: 'startDate' } },
            { name: 'sortOrder', in: 'query', schema: { type: 'string', enum: ['asc', 'desc'], default: 'asc' } },
          ],
          responses: {
            '200': {
              description: 'Paginated list of events',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/PaginatedResponse' },
                },
              },
            },
          },
        },
        post: {
          tags: ['Events'],
          summary: 'Create event (Organizer)',
          description: 'Create a new event. Requires organizer or admin role.',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/CreateEventInput' },
              },
            },
          },
          responses: {
            '201': {
              description: 'Event created successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      data: { $ref: '#/components/schemas/Event' },
                    },
                  },
                },
              },
            },
            '403': {
              description: 'Forbidden - Organizer access required',
            },
          },
        },
      },
      '/api/v1/events/pending': {
        get: {
          tags: ['Events'],
          summary: 'List pending events (Admin)',
          description: 'List events awaiting approval. Admin only.',
          security: [{ bearerAuth: [] }],
          responses: {
            '200': {
              description: 'List of pending events',
            },
          },
        },
      },
      '/api/v1/events/my-events': {
        get: {
          tags: ['Events'],
          summary: 'My organized events (Organizer)',
          description: 'Get events organized by the authenticated user',
          security: [{ bearerAuth: [] }],
          responses: {
            '200': {
              description: 'List of organized events',
            },
          },
        },
      },
      '/api/v1/events/registrations': {
        get: {
          tags: ['Events'],
          summary: 'My registrations',
          description: 'Get events the authenticated user is registered for',
          security: [{ bearerAuth: [] }],
          responses: {
            '200': {
              description: 'List of event registrations',
            },
          },
        },
      },
      '/api/v1/events/favorites': {
        get: {
          tags: ['Events'],
          summary: 'My favorite events',
          description: 'Get events saved as favorites by the authenticated user',
          security: [{ bearerAuth: [] }],
          responses: {
            '200': {
              description: 'List of favorite events',
            },
          },
        },
      },
      '/api/v1/events/{id}': {
        get: {
          tags: ['Events'],
          summary: 'Get event by ID',
          description: 'Get a single event by its ID',
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
          ],
          responses: {
            '200': {
              description: 'Event details',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      data: { $ref: '#/components/schemas/Event' },
                    },
                  },
                },
              },
            },
            '404': {
              description: 'Event not found',
            },
          },
        },
        patch: {
          tags: ['Events'],
          summary: 'Update event',
          description: 'Update an event. Only the organizer or admin can update.',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/CreateEventInput' },
              },
            },
          },
          responses: {
            '200': {
              description: 'Event updated successfully',
            },
            '403': {
              description: 'Forbidden',
            },
          },
        },
        delete: {
          tags: ['Events'],
          summary: 'Delete event',
          description: 'Delete an event. Only the organizer or admin can delete.',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
          ],
          responses: {
            '200': {
              description: 'Event deleted successfully',
            },
          },
        },
      },
      '/api/v1/events/{id}/submit': {
        post: {
          tags: ['Events'],
          summary: 'Submit event for approval',
          description: 'Submit a draft event for admin approval',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
          ],
          responses: {
            '200': {
              description: 'Event submitted for approval',
            },
          },
        },
      },
      '/api/v1/events/{id}/review': {
        post: {
          tags: ['Events'],
          summary: 'Review event (Admin)',
          description: 'Approve or reject an event. Admin only.',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['status'],
                  properties: {
                    status: { type: 'string', enum: ['approved', 'rejected'] },
                    rejectionReason: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Event reviewed successfully',
            },
          },
        },
      },
      '/api/v1/events/{id}/register': {
        post: {
          tags: ['Events'],
          summary: 'Register for event',
          description: 'Register the authenticated user for an event',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
          ],
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    notes: { type: 'string', maxLength: 500 },
                  },
                },
              },
            },
          },
          responses: {
            '201': {
              description: 'Registration successful',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      data: { $ref: '#/components/schemas/EventRegistration' },
                    },
                  },
                },
              },
            },
            '400': {
              description: 'Registration failed (event full, deadline passed, etc.)',
            },
          },
        },
        delete: {
          tags: ['Events'],
          summary: 'Cancel registration',
          description: 'Cancel the authenticated user registration for an event',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
          ],
          responses: {
            '200': {
              description: 'Registration cancelled successfully',
            },
          },
        },
      },
      '/api/v1/events/{id}/participants': {
        get: {
          tags: ['Events'],
          summary: 'Get event participants (Organizer)',
          description: 'Get list of participants for an event. Only organizer or admin.',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
            { name: 'status', in: 'query', schema: { type: 'string', enum: ['pending', 'confirmed', 'cancelled', 'attended'] } },
          ],
          responses: {
            '200': {
              description: 'List of participants',
            },
          },
        },
      },
      '/api/v1/events/{id}/check-in': {
        post: {
          tags: ['Events'],
          summary: 'Check-in participant (Organizer)',
          description: 'Check-in a participant using ticket number or QR code',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    ticketNumber: { type: 'string' },
                    qrCode: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Participant checked in successfully',
            },
          },
        },
      },
      '/api/v1/events/{id}/stats': {
        get: {
          tags: ['Events'],
          summary: 'Get event statistics (Organizer)',
          description: 'Get registration and attendance statistics for an event',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
          ],
          responses: {
            '200': {
              description: 'Event statistics',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      data: {
                        type: 'object',
                        properties: {
                          totalRegistrations: { type: 'integer' },
                          confirmed: { type: 'integer' },
                          attended: { type: 'integer' },
                          cancelled: { type: 'integer' },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/api/v1/events/{id}/favorite': {
        post: {
          tags: ['Events'],
          summary: 'Add to favorites',
          description: 'Add an event to favorites',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
          ],
          responses: {
            '200': {
              description: 'Added to favorites',
            },
          },
        },
        delete: {
          tags: ['Events'],
          summary: 'Remove from favorites',
          description: 'Remove an event from favorites',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
          ],
          responses: {
            '200': {
              description: 'Removed from favorites',
            },
          },
        },
      },

      // ==================== FACULTIES ====================
      '/api/v1/faculties': {
        get: {
          tags: ['Faculties'],
          summary: 'List faculties',
          description: 'Get all faculties with their departments',
          responses: {
            '200': {
              description: 'List of faculties',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      data: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/Faculty' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        post: {
          tags: ['Faculties'],
          summary: 'Create faculty (Admin)',
          description: 'Create a new faculty. Admin only.',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/CreateFacultyInput' },
              },
            },
          },
          responses: {
            '201': {
              description: 'Faculty created successfully',
            },
          },
        },
      },
      '/api/v1/faculties/{id}': {
        get: {
          tags: ['Faculties'],
          summary: 'Get faculty by ID',
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
          ],
          responses: {
            '200': {
              description: 'Faculty details',
            },
          },
        },
        patch: {
          tags: ['Faculties'],
          summary: 'Update faculty (Admin)',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/CreateFacultyInput' },
              },
            },
          },
          responses: {
            '200': {
              description: 'Faculty updated successfully',
            },
          },
        },
        delete: {
          tags: ['Faculties'],
          summary: 'Delete faculty (Admin)',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
          ],
          responses: {
            '200': {
              description: 'Faculty deleted successfully',
            },
          },
        },
      },

      // ==================== DEPARTMENTS ====================
      '/api/v1/departments': {
        get: {
          tags: ['Departments'],
          summary: 'List departments',
          description: 'Get all departments',
          responses: {
            '200': {
              description: 'List of departments',
            },
          },
        },
        post: {
          tags: ['Departments'],
          summary: 'Create department (Admin)',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['name', 'facultyId'],
                  properties: {
                    name: { type: 'string' },
                    facultyId: { type: 'string', format: 'uuid' },
                    description: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: {
            '201': {
              description: 'Department created successfully',
            },
          },
        },
      },

      // ==================== FEEDBACK ====================
      '/api/v1/feedback': {
        post: {
          tags: ['Feedback'],
          summary: 'Create feedback',
          description: 'Submit feedback for an attended event',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/CreateFeedbackInput' },
              },
            },
          },
          responses: {
            '201': {
              description: 'Feedback submitted successfully',
            },
          },
        },
      },
      '/api/v1/feedback/my': {
        get: {
          tags: ['Feedback'],
          summary: 'My feedback',
          description: 'Get feedback submitted by the authenticated user',
          security: [{ bearerAuth: [] }],
          responses: {
            '200': {
              description: 'List of user feedback',
            },
          },
        },
      },
      '/api/v1/feedback/event/{eventId}': {
        get: {
          tags: ['Feedback'],
          summary: 'Event feedback',
          description: 'Get all feedback for an event',
          parameters: [
            { name: 'eventId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
            { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
            { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
          ],
          responses: {
            '200': {
              description: 'Event feedback with statistics',
            },
          },
        },
      },
      '/api/v1/feedback/event/{eventId}/stats': {
        get: {
          tags: ['Feedback'],
          summary: 'Event feedback statistics',
          description: 'Get feedback statistics for an event',
          parameters: [
            { name: 'eventId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
          ],
          responses: {
            '200': {
              description: 'Feedback statistics',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      data: {
                        type: 'object',
                        properties: {
                          averageRating: { type: 'number', nullable: true },
                          totalReviews: { type: 'integer' },
                          ratingDistribution: {
                            type: 'object',
                            properties: {
                              '1': { type: 'integer' },
                              '2': { type: 'integer' },
                              '3': { type: 'integer' },
                              '4': { type: 'integer' },
                              '5': { type: 'integer' },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },

      // ==================== NOTIFICATIONS ====================
      '/api/v1/notifications': {
        get: {
          tags: ['Notifications'],
          summary: 'My notifications',
          description: 'Get notifications for the authenticated user',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
            { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
            { name: 'isRead', in: 'query', schema: { type: 'boolean' } },
            { name: 'type', in: 'query', schema: { type: 'string', enum: ['event_reminder', 'event_update', 'registration_confirmed', 'event_cancelled', 'recommendation', 'feedback_request'] } },
          ],
          responses: {
            '200': {
              description: 'List of notifications with unread count',
            },
          },
        },
      },
      '/api/v1/notifications/unread-count': {
        get: {
          tags: ['Notifications'],
          summary: 'Unread count',
          description: 'Get the count of unread notifications',
          security: [{ bearerAuth: [] }],
          responses: {
            '200': {
              description: 'Unread notification count',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      data: {
                        type: 'object',
                        properties: {
                          unreadCount: { type: 'integer' },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/api/v1/notifications/{id}/read': {
        post: {
          tags: ['Notifications'],
          summary: 'Mark as read',
          description: 'Mark a notification as read',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
          ],
          responses: {
            '200': {
              description: 'Notification marked as read',
            },
          },
        },
      },
      '/api/v1/notifications/read-all': {
        post: {
          tags: ['Notifications'],
          summary: 'Mark all as read',
          description: 'Mark all notifications as read',
          security: [{ bearerAuth: [] }],
          responses: {
            '200': {
              description: 'All notifications marked as read',
            },
          },
        },
      },

      // ==================== FILES ====================
      '/api/v1/files/event/{eventId}': {
        get: {
          tags: ['Files'],
          summary: 'Event materials',
          description: 'Get materials for an event',
          parameters: [
            { name: 'eventId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
          ],
          responses: {
            '200': {
              description: 'List of event materials',
            },
          },
        },
      },
      '/api/v1/files': {
        post: {
          tags: ['Files'],
          summary: 'Upload material (Organizer)',
          description: 'Upload a material for an event',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['eventId', 'title', 'fileUrl', 'fileType'],
                  properties: {
                    eventId: { type: 'string', format: 'uuid' },
                    title: { type: 'string' },
                    description: { type: 'string' },
                    fileUrl: { type: 'string', format: 'uri' },
                    fileType: { type: 'string', example: 'pdf' },
                    fileSize: { type: 'integer' },
                    isPublic: { type: 'boolean', default: true },
                  },
                },
              },
            },
          },
          responses: {
            '201': {
              description: 'Material uploaded successfully',
            },
          },
        },
      },
      '/api/v1/files/{id}/download': {
        post: {
          tags: ['Files'],
          summary: 'Download material',
          description: 'Get download URL and increment download count',
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
          ],
          responses: {
            '200': {
              description: 'Download URL',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      data: {
                        type: 'object',
                        properties: {
                          fileUrl: { type: 'string', format: 'uri' },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  };
}

