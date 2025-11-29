# USV Events - University Events Management System API

A centralized platform for managing university events, built with HonoJS, Drizzle ORM, and Neon PostgreSQL.

## Overview

USV Events provides a unified platform where university events can be created, managed, and promoted. Students can discover, save, and register for events easily.

## Tech Stack

- **Runtime**: Bun
- **Framework**: HonoJS
- **Database**: PostgreSQL (Neon Serverless)
- **ORM**: Drizzle ORM
- **Validation**: Zod
- **Authentication**: JWT (JSON Web Tokens)

## Architecture

The project follows Clean Architecture principles:

```
src/
├── config/         # Application configuration
├── db/             # Database connection and schema
├── middleware/     # Express middleware (auth, logging, RBAC)
├── modules/        # Feature modules
│   ├── auth/       # Authentication (login, register, JWT)
│   ├── users/      # User management
│   ├── events/     # Event CRUD and management
│   ├── faculties/  # Faculty and department management
│   ├── feedback/   # Event feedback/ratings
│   ├── notifications/ # User notifications
│   └── files/      # Event materials/files
├── types/          # TypeScript type definitions
└── utils/          # Utility functions
```

## Features

### For Students
- Browse and search events
- Filter by faculty, type, date, location
- Register for events with QR code tickets
- Favorite events
- Set interests for personalized recommendations
- Receive notifications and reminders
- Provide feedback after events

### For Organizers
- Create and manage events
- Track registrations and participants
- Check-in participants via QR code
- Upload event materials (PDFs, presentations)
- View event statistics

### For Administrators
- Approve/reject event submissions
- Manage user accounts and roles
- Generate reports
- Feature events

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login
- `POST /api/v1/auth/refresh` - Refresh access token
- `POST /api/v1/auth/logout` - Logout
- `POST /api/v1/auth/change-password` - Change password
- `GET /api/v1/auth/me` - Get current user

### Users
- `GET /api/v1/users/me` - Get profile
- `PATCH /api/v1/users/me` - Update profile
- `GET /api/v1/users/me/interests` - Get interests
- `PUT /api/v1/users/me/interests` - Update interests
- `GET /api/v1/users` - List users (admin)
- `PATCH /api/v1/users/:id/role` - Update role (admin)
- `PATCH /api/v1/users/:id/status` - Update status (admin)

### Events
- `GET /api/v1/events` - List events (public)
- `POST /api/v1/events` - Create event (organizer)
- `GET /api/v1/events/:id` - Get event
- `PATCH /api/v1/events/:id` - Update event
- `DELETE /api/v1/events/:id` - Delete event
- `POST /api/v1/events/:id/submit` - Submit for approval
- `POST /api/v1/events/:id/review` - Approve/reject (admin)
- `POST /api/v1/events/:id/register` - Register for event
- `DELETE /api/v1/events/:id/register` - Cancel registration
- `GET /api/v1/events/:id/participants` - Get participants (organizer)
- `POST /api/v1/events/:id/check-in` - Check in participant
- `GET /api/v1/events/:id/stats` - Get statistics
- `POST /api/v1/events/:id/favorite` - Add to favorites
- `DELETE /api/v1/events/:id/favorite` - Remove from favorites

### Faculties & Departments
- `GET /api/v1/faculties` - List faculties
- `POST /api/v1/faculties` - Create faculty (admin)
- `GET /api/v1/departments` - List departments
- `POST /api/v1/departments` - Create department (admin)

### Feedback
- `POST /api/v1/feedback` - Create feedback
- `GET /api/v1/feedback/event/:eventId` - Get event feedback
- `GET /api/v1/feedback/event/:eventId/stats` - Get feedback stats

### Notifications
- `GET /api/v1/notifications` - Get notifications
- `GET /api/v1/notifications/unread-count` - Get unread count
- `POST /api/v1/notifications/:id/read` - Mark as read
- `POST /api/v1/notifications/read-all` - Mark all as read

### Files
- `GET /api/v1/files/event/:eventId` - Get event materials
- `POST /api/v1/files` - Upload material (organizer)
- `POST /api/v1/files/:id/download` - Download material

## Getting Started

### Prerequisites
- Bun runtime
- PostgreSQL database (Neon recommended)

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   bun install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   ```

4. Configure your `.env`:
   ```
   DATABASE_URL=your_neon_database_url
   JWT_SECRET=your_jwt_secret_key
   NODE_ENV=development
   ```

5. Run database migrations:
   ```bash
   bun run db:push
   ```

6. Start the development server:
   ```bash
   bun run dev
   ```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `JWT_SECRET` | Secret key for JWT signing | Yes |
| `NODE_ENV` | Environment (development/production) | No |
| `FRONTEND_URL` | Frontend URL for CORS | No |

## Database Schema

### Main Tables
- `users` - User accounts
- `faculties` - University faculties
- `departments` - Faculty departments
- `events` - Event listings
- `event_registrations` - User registrations
- `event_favorites` - Saved events
- `event_feedback` - Event reviews
- `event_materials` - Event files
- `notifications` - User notifications
- `organizer_profiles` - Organizer details
- `refresh_tokens` - JWT refresh tokens
- `audit_logs` - Action logging

## User Roles

| Role | Description |
|------|-------------|
| `student` | Can browse, register, and review events |
| `organizer` | Can create and manage events |
| `admin` | Full system access |

## Security

- Password hashing with bcrypt
- JWT-based authentication
- Role-based access control (RBAC)
- Request validation with Zod
- CORS protection

## License

MIT
