# GEA Content Management System - Backend API

Backend API service for managing advertisements, news articles, and user authentication for the GEA Content Management System.

## Frontend URL

The frontend application is hosted at: `https://cms-gea.devbygian.com`

## Backend API URL

The backend API is hosted at: `https://cms-api.devbygian.com`

## Table of Contents

- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Running the Server](#running-the-server)
- [Project Structure](#project-structure)
- [Key Features](#key-features)
- [Available Scripts](#available-scripts)
- [Tech Stack](#tech-stack)
- [API Modules](#api-modules)
- [Docker Deployment](#docker-deployment)

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v20 or higher recommended)
- **npm** or **yarn** package manager
- **PostgreSQL** (v16 or higher)
- **Docker** and **Docker Compose** (optional, for containerized deployment)
- **Git** (for version control)

## Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd be-cms
   ```

2. **Install dependencies**

   ```bash
   npm install
   # or
   yarn install
   ```

3. **Configure environment variables**

   Create a `.env` file in the root directory with the following variables:

   ```env
   # Application
   NODE_ENV=development
   PORT=3000

   # Database
   DATABASE_URL=postgresql://user:password@localhost:5432/be-cms

   # JWT Authentication
   JWT_SECRET=your-secret-key-here

   # CORS
   API_URL=https://cms-api.devbygian.com or http://localhost:3000
   CMS_URL=https://cms-gea.devbygian.com or http://localhost:5173

   # Upload Folder Names
   NEWS_IMAGE_UPLOAD_FOLDER_NAME=news
   NEWS_IMAGE_GALLERY_UPLOAD_FOLDER_NAME=news-gallery
   ADS_IMAGE_UPLOAD_FOLDER_NAME=ads
   ```

4. **Generate Prisma Client**

   ```bash
   npx prisma generate
   ```

5. **Run database migrations**

   ```bash
   npm run migrate:dev
   ```

## Running the Server

### Development Mode

To start the development server with hot-reload:

```bash
npm run start:dev
```

The API will be available at `http://localhost:3000`

### Production Mode

To build and run the application in production:

```bash
# Build the application
npm run build

# Start production server
npm run start:prod
```

### Watch Mode

To run with automatic restart on file changes:

```bash
npm start
```

### Debug Mode

To run with debugging enabled:

```bash
npm run start:debug
```

## Project Structure

```
be-cms/
├── docker-compose.yml          # Docker Compose configuration
├── docker-entrypoint.sh        # Container startup script
├── Dockerfile                  # Multi-stage Docker build
├── nest-cli.json               # NestJS CLI configuration
├── package.json                # Dependencies and scripts
├── tsconfig.json               # TypeScript configuration
├── tsconfig.build.json         # Build-specific TypeScript config
├── eslint.config.mjs           # ESLint configuration
│
├── prisma/                     # Database schema and migrations
│   ├── schema.prisma           # Prisma schema definition
│   └── migrations/             # Database migration files
│       ├── migration_lock.toml
│       └── [timestamp]/        # Individual migration folders
│
├── generated/                  # Auto-generated Prisma Client
│   └── prisma/                 # Type-safe database client
│       ├── client.ts
│       ├── models/             # Database model types
│       └── enums/              # Database enum types
│
├── src/                        # Application source code
│   ├── main.ts                 # Application entry point
│   ├── app.module.ts           # Root application module
│   ├── app.controller.ts       # Root controller
│   ├── app.service.ts          # Root service
│   │
│   ├── common/                 # Shared utilities and components
│   │   ├── decorators/         # Custom decorators
│   │   │   ├── public.decorator.ts      # Mark routes as public
│   │   │   ├── refresh.decorator.ts     # Mark refresh token routes
│   │   │   └── role.decorator.ts        # Role-based access control
│   │   │
│   │   ├── dto/                # Data Transfer Objects
│   │   │   └── response.dto.ts          # Standardized response wrapper
│   │   │
│   │   ├── filters/            # Exception filters
│   │   │   └── exception.filter.ts      # Global exception handler
│   │   │
│   │   ├── guards/             # Route guards
│   │   │   ├── auth.guard.ts            # JWT authentication guard with single-session enforcement
│   │   │   ├── role.guard.ts            # Role-based authorization guard
│   │   │   └── is-mine.guard.ts         # Resource ownership verification
│   │   │
│   │   ├── health/             # Health check endpoints
│   │   │   ├── health.controller.ts     # Health monitoring endpoints
│   │   │   └── health.module.ts         # Health module configuration
│   │   │
│   │   ├── interfaces/         # TypeScript interfaces
│   │   │   └── storage_bucket/          # Storage interface definitions
│   │   │
│   │   └── utils/              # Utility functions
│   │       └── case-transformer.util.ts # Case conversion utilities
│   │
│   ├── infrastructure/         # Infrastructure layer
│   │   ├── infrastructure.module.ts
│   │   │
│   │   ├── prisma/             # Database client
│   │   │   ├── prisma.module.ts
│   │   │   └── prisma.service.ts        # Prisma client service
│   │   │
│   │   └── local_bucket/       # Local file storage
│   │       ├── local_bucket.module.ts
│   │       └── local_bucket.service.ts  # File upload/management service
│   │
│   └── modules/                # Feature modules
│       ├── user/               # User management & authentication
│       │   ├── user.module.ts
│       │   ├── user.controller.ts
│       │   ├── user.service.ts
│       │   └── dto/            # User DTOs
│       │
│       ├── news/               # News article management
│       │   ├── news.module.ts
│       │   ├── news.controller.ts
│       │   ├── news.service.ts
│       │   └── dto/            # News DTOs
│       │
│       ├── news_image/         # News image management
│       │   ├── news_image.module.ts
│       │   ├── news_image.controller.ts
│       │   ├── news_image.service.ts
│       │   └── dto/            # News image DTOs
│       │
│       ├── ads/                # Advertisement management
│       │   ├── ads.module.ts
│       │   ├── ads.controller.ts
│       │   ├── ads.service.ts
│       │   └── dto/            # Ads DTOs
│       │
│       └── ads-image/          # Advertisement image management
│           ├── ads_image.module.ts
│           ├── ads_image.controller.ts
│           ├── ads_image.service.ts
│           └── dto/            # Ads image DTOs
│
├── test/                       # E2E tests
│   ├── app.e2e-spec.ts
│   └── jest-e2e.json
│
└── uploads/                    # Local file storage
    ├── news/                   # News article images
    ├── news-gallery/           # News gallery images
    └── ads/                    # Advertisement images
```

## Key Features

### Authentication & Authorization

#### Single-Session Enforcement

The application implements a robust single-session authentication system. When a user logs in, only one active session is allowed at a time.

**How it works** (implemented in [auth.guard.ts](src/common/guards/auth.guard.ts)):

1. When a user logs in, a unique session token (`session_token`) is generated and stored in the database
2. This session token is embedded in the JWT payload as `uniqueUUID`
3. On every authenticated request, the guard:
   - Extracts and verifies the JWT token from cookies
   - Compares the `uniqueUUID` from the JWT with the `session_token` in the database
   - If they don't match, the request is rejected with `UnauthorizedException`
4. When the user logs in from another device/browser, a new `session_token` is generated, invalidating all previous sessions automatically

This ensures that if a user logs in from Device A, and then logs in from Device B, Device A's session becomes invalid instantly. The next API call from Device A will fail with "another device has logged in" message.

#### Role-Based Access Control

The system implements role-based permissions with the following roles:

- **ADMIN** - Full system access
- **NEWS_EDITOR** - Can create and edit news articles
- **ADS_EDITOR** - Can create and edit advertisements

Protected routes use the `@Role()` decorator combined with [role.guard.ts](src/common/guards/role.guard.ts) to enforce permissions.

#### Resource Ownership Verification

The [is-mine.guard.ts](src/common/guards/is-mine.guard.ts) ensures users can only access their own resources by comparing the requested resource UUID with the authenticated user's UUID.

### Database Models

The application uses Prisma ORM with PostgreSQL and includes the following models:

- **User** - User accounts with authentication and role management
- **News** - News articles with categories (INTERNAL/EXTERNAL)
- **NewsImage** - Main images for news articles
- **NewsImageGallery** - Additional gallery images for news articles
- **AdminNews** - Tracks news creators and editors
- **Ads** - Advertisement content with partner information
- **AdsImage** - Images for advertisements

All models support soft deletion tracking with `deleted_at` timestamps where applicable.

### File Upload Management

The system provides local file storage through the `local_bucket` service:

- Organized uploads by content type (news, news-gallery, ads)
- Automatic directory creation
- Support for JPG, PNG, and JPEG formats
- Type-safe image category handling

### Health Monitoring

Health check endpoints are available at:

- `/health/live` - Liveness probe for container orchestration
- `/health/ready` - Readiness probe checking database connectivity

### CORS Configuration

Cross-Origin Resource Sharing is configured in [main.ts](src/main.ts) to allow:

- Credentials (cookies for JWT tokens)
- Specific frontend and API origins from environment variables
- Standard HTTP methods (GET, POST, PUT, DELETE, OPTIONS, PATCH)

### Exception Handling

Global exception filter ([exception.filter.ts](src/common/filters/exception.filter.ts)) provides:

- Standardized error responses
- HTTP exception handling
- Unhandled error catching
- Consistent error formatting

## Available Scripts

| Command                  | Description                               |
| ------------------------ | ----------------------------------------- |
| `npm run start`          | Start the application                     |
| `npm run start:dev`      | Start in development mode with hot-reload |
| `npm run start:debug`    | Start in debug mode                       |
| `npm run start:prod`     | Start in production mode                  |
| `npm run build`          | Build the application                     |
| `npm run migrate:dev`    | Run database migrations in development    |
| `npm run migrate:deploy` | Deploy migrations in production           |
| `npm run format`         | Format code with Prettier                 |
| `npm run lint`           | Lint and fix code with ESLint             |
| `npm test`               | Run unit tests                            |
| `npm run test:watch`     | Run tests in watch mode                   |
| `npm run test:cov`       | Run tests with coverage                   |
| `npm run test:e2e`       | Run end-to-end tests                      |

## Tech Stack

### Core Framework

- **NestJS v11** - Progressive Node.js framework for building efficient and scalable server-side applications
- **Node.js v20** - JavaScript runtime
- **TypeScript v5.7** - Typed JavaScript for better developer experience
- **Express** - Web framework (via @nestjs/platform-express)

### Database & ORM

- **PostgreSQL v16** - Relational database
- **Prisma v6** - Next-generation ORM for type-safe database access
- **@prisma/adapter-pg** - PostgreSQL adapter for Prisma
- **@prisma/client** - Auto-generated database client

### Authentication & Security

- **@nestjs/jwt v11** - JWT token generation and verification
- **bcrypt v6** - Password hashing
- **cookie-parser** - Cookie parsing middleware
- **uuid v13** - Unique identifier generation

### Validation & Transformation

- **class-validator v0.15** - Decorator-based validation
- **class-transformer v0.5** - Object transformation and serialization

### Configuration & Environment

- **@nestjs/config v4** - Configuration management with environment variables
- **dotenv** - Environment variable loading

### Health Monitoring

- **@nestjs/terminus v11** - Health check indicators for Kubernetes and other orchestrators

### File Handling

- **@types/multer** - TypeScript types for file uploads
- **Multer** - Multipart/form-data handling (via Express)

### Development Tools

- **ESLint v9** - Code linting
- **Prettier v3** - Code formatting
- **typescript-eslint v8** - TypeScript ESLint rules
- **Jest v30** - Testing framework
- **ts-jest** - TypeScript preprocessor for Jest
- **Supertest** - HTTP assertion library for testing

### Containerization

- **Docker** - Container platform
- **Docker Compose** - Multi-container orchestration

## API Modules

For detailed API documentation and testing, please refer to the [GEA News & Ads Management.postman_collection.json](GEA%20News%20%26%20Ads%20Management.postman_collection.json) file included in the project root.

This Postman collection contains:

- Authentication flows (login, logout, refresh token)
- User management operations
- News article CRUD operations
- Advertisement CRUD operations
- Image upload endpoints
- Pre-configured environment variables
- Sample request payloads and responses

## Docker Deployment

The application is containerized using Docker with multi-stage builds for optimal image size and security.

### Docker Compose Deployment

The easiest way to run the entire stack (application + database):

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

The `docker-compose.yml` includes:

- **PostgreSQL v16** - Database service with health checks
- **NestJS Application** - API service with automatic migrations
- **Volume Management** - Persistent storage for database and uploads

### Manual Docker Deployment

```bash
# Build the Docker image
docker build -t be-cms:latest .

# Run with environment variables
docker run -d \
  -p 3000:3000 \
  -e DATABASE_URL="postgresql://user:pass@host:5432/db" \
  -e JWT_SECRET="your-secret" \
  -v $(pwd)/uploads:/app/uploads \
  be-cms:latest
```

### Dockerfile Features

The [Dockerfile](Dockerfile) uses a multi-stage build process:

**Build Stage:**

1. Dependencies are installed (including dev dependencies for build process)
2. Prisma Client is generated from schema
3. Application is compiled to JavaScript

**Production Stage:**

1. curl is installed for container health monitoring
2. Production dependencies are installed and Prisma Client is generated
3. Compiled application is copied from builder stage
4. Upload directories are created for media storage
5. Non-root user is created for security
6. Application directory ownership is transferred to non-root user
7. Container is switched to non-root user context
8. Application port is exposed for external access
9. Health check is configured to monitor container status

### Entrypoint Script

The [docker-entrypoint.sh](docker-entrypoint.sh) performs the following during container startup:

1. Environment variables are printed for debugging
2. DATABASE_URL presence is verified
3. Upload directories are created if not present
4. Database migrations are applied to target database
5. Application is started with provided arguments

This ensures the database schema is always up-to-date before the application starts.

### Health Checks

Container health monitoring is configured to:

- Check liveness every 30 seconds
- Allow 40 seconds for initial startup
- Retry 3 times before marking as unhealthy
- Enable automatic container restart on failure

### Security Features

- Non-root user execution (user: nestjs, uid: 1001)
- Minimal Alpine Linux base image
- Production-only dependencies
- Health-based restart policies
- Isolated network with docker-compose
