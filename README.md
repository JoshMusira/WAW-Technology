# Issue Tracking Web Application

A full-stack issue tracking application for creating, assigning, prioritizing, and progressing work items. The application includes user registration and login, role management, issue comments, activity history, and a dashboard-oriented web interface.

## Features

- User registration, login, logout, and access-token refresh
- `ADMIN` and `STANDARD_USER` roles
- Issue creation and editing
- Issue status tracking: `OPEN`, `IN_PROGRESS`, `RESOLVED`, and `CLOSED`
- Issue priorities: `LOW`, `MEDIUM`, and `HIGH`
- Optional issue assignment to another user
- Comments on issues
- Activity log for auditable application events
- Filtering and querying issues from the frontend
- Responsive React interface with protected application routes
- PostgreSQL persistence through Prisma
- Docker support for the API and database

## Technology Stack

### Backend

- Node.js and TypeScript
- Express 5
- PostgreSQL
- Prisma 7 with the PostgreSQL adapter
- `jose` for JWT signing and verification
- CORS and Morgan request logging

### Frontend

- React 19
- React Router 8 with server-side rendering
- TypeScript
- Vite
- TanStack Query integration for server state
- Axios for API requests
- Tailwind CSS 4
- Lucide React icons and Sonner notifications

## Repository Layout

```text
.
├── Backend/
│   ├── prisma/
│   │   ├── schema.prisma          # Database schema
│   │   └── migrations/            # Versioned database migrations
│   ├── src/
│   │   ├── controllers/           # Request handlers and application operations
│   │   ├── lib/                   # Prisma, token, and activity helpers
│   │   ├── middleware/            # Authentication middleware
│   │   ├── routes/                # HTTP route definitions
│   │   ├── server.ts              # Express application configuration
│   │   └── index.ts               # API process entry point
│   ├── Dockerfile
│   └── docker-compose.yml         # API + PostgreSQL development/deployment stack
├── Frontend/
│   ├── app/
│   │   ├── components/            # Reusable UI and issue components
│   │   ├── hooks/                 # Auth, issue, and activity data hooks
│   │   ├── lib/                   # API client, validation, and utilities
│   │   ├── provider/              # Auth and query providers
│   │   ├── routes/                # Page-level route modules
│   │   ├── routes.ts              # React Router route configuration
│   │   └── app.css                # Application styles
│   ├── Dockerfile
│   └── package.json
└── package.json
```

## Prerequisites

- Node.js 22 or newer for the backend. The frontend Docker image uses Node.js 24.
- npm
- PostgreSQL 15 or newer, or Docker Desktop with Docker Compose
- A shell that can set environment variables

## Setup and Run Locally

### 1. Install dependencies

Run the following from the repository root:

```bash
cd Backend
npm install

cd ../Frontend
npm install
```

### 2. Configure the backend

Create `Backend/.env`:

```dotenv
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/issue_tracking_app?schema=public"
PORT=3000
FRONTEND_URL="http://localhost:5173"
ACCESS_TOKEN_SECRET="replace-with-a-random-secret-at-least-32-characters"
REFRESH_TOKEN_SECRET="replace-with-a-different-random-secret-at-least-32-characters"
ACCESS_TOKEN_EXPIRES_IN="15m"
```

`ACCESS_TOKEN_SECRET` and `REFRESH_TOKEN_SECRET` must each contain at least 32 characters. Use different, randomly generated values in any shared or production environment.

The database in `DATABASE_URL` must exist before running migrations. For example, with a local PostgreSQL installation:

```bash
createdb issue_tracking_app
```

Apply the existing migrations and generate the Prisma client:

```bash
cd Backend
npx prisma migrate deploy
npx prisma generate
```

For development, `npm run dev` also works after the database is available. When changing the Prisma schema during development, create a migration with:

```bash
npx prisma migrate dev --name describe-your-change
```

### 3. Configure the frontend

Create `Frontend/.env` if the API is not running at the default configured deployment URL:

```dotenv
VITE_API_URL="http://localhost:3000"
```

The frontend uses `VITE_API_URL` as the Axios base URL. Without it, the current fallback is `https://waw-technology.onrender.com`.

### 4. Start both services

Use two terminals:

```bash
# Terminal 1
cd Backend
npm run dev
```

```bash
# Terminal 2
cd Frontend
npm run dev
```

Open `http://localhost:5173`. The API health endpoint is available at `http://localhost:3000/health` and returns `{ "status": "ok" }` when the server is running.

## Docker Setup

The backend Compose file starts both PostgreSQL and the API. From `Backend/`, create a `.env` file with at least:

```dotenv
POSTGRES_PASSWORD=replace-with-a-local-password
ACCESS_TOKEN_SECRET=replace-with-a-random-secret-at-least-32-characters
REFRESH_TOKEN_SECRET=replace-with-a-different-random-secret-at-least-32-characters
FRONTEND_URL=http://localhost:5173
```

Optional Compose settings include `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PORT`, and `API_PORT`.

Start the services:

```bash
cd Backend
docker compose up --build
```

The API is then available at `http://localhost:3000`. The API container runs `prisma migrate deploy` before starting the server. The frontend can be run locally with `VITE_API_URL=http://localhost:3000`, or built and run separately with its Dockerfile.

Stop the stack with:

```bash
docker compose down
```

Add `-v` only when the PostgreSQL volume should also be deleted.

## Useful Commands

### Backend

```bash
npm run dev             # Run the API with watch mode
npm run build           # Generate Prisma client and compile TypeScript
npm start               # Run the compiled API
npm run start:container # Apply migrations, then run the compiled API
npx prisma studio       # Open Prisma Studio
```

### Frontend

```bash
npm run dev       # Start the React Router development server
npm run typecheck # Generate route types and run TypeScript checks
npm run build     # Create the production client/server build
npm start         # Serve the production build
```

## Architecture Overview

### Runtime flow

1. A browser request loads the React Router frontend.
2. Frontend route modules render the dashboard, issues, users, activity, login, and registration views.
3. Data hooks call the backend through the Axios client in `Frontend/app/lib/fetch-util.ts`.
4. The client attaches the stored bearer access token to authenticated requests.
5. Express routes dispatch requests to controllers.
6. Controllers use the shared Prisma client to read and mutate PostgreSQL data.
7. Protected routes use authentication middleware to verify the access token before reaching the controller.
8. Relevant mutations write activity records so important changes remain traceable.

### Backend layers

- **Routes** define the public HTTP contract and attach middleware.
- **Middleware** authenticates bearer tokens and places the authenticated user identity and role on the request.
- **Controllers** validate request intent, enforce application rules, perform Prisma operations, and shape responses.
- **Libraries** centralize shared infrastructure such as Prisma access, JWT handling, and activity logging.
- **Prisma schema and migrations** define the persistent data model and its evolution.

The main API groups are:

| Route | Purpose | Authentication |
| --- | --- | --- |
| `/health` | Health check | Public |
| `/users` | Registration, login, refresh, logout, current user, and user directory | Mixed |
| `/issues` | Issue listing, creation, updates, and comments | Required |
| `/activity` | Activity history | Required |

### Data model

The core entities are:

- **User**: identity, credentials, role, created issues, assignments, comments, tokens, and activity records.
- **RefreshToken**: hashed refresh-token storage with expiry and revocation state.
- **Issue**: title, description, priority, status, creator, optional assignee, and comments.
- **Comment**: issue discussion authored by a user.
- **ActivityLog**: actor, action, entity information, description, and timestamp.

Foreign-key actions are intentional: deleting a user does not silently remove authored issues or audit records, while deleting an issue removes its comments and unassigns affected users where appropriate.

## Design Decisions

### Separate frontend and backend applications

The frontend and API are independently deployable Node applications. This keeps UI concerns, browser state, and page routing separate from authentication, business rules, and persistence. It also allows the API to serve other clients later without coupling them to the React application.

### REST-style resource routes

The API uses resource-oriented routes such as `/issues`, `/issues/:id/comments`, and `/users/:id/role`. This keeps the HTTP contract predictable and maps naturally to the issue-tracking domain.

### JWT access tokens with persisted refresh tokens

Short-lived access tokens are used for normal API requests, while refresh tokens last seven days and are stored only as SHA-256 hashes in the database. The split limits the useful lifetime of an exposed access token and allows refresh tokens to be revoked server-side during logout or incident response.

Access and refresh tokens use separate secrets, issuer and audience claims, explicit token types, and signature verification through `jose`.

### Role-aware authorization

The authenticated request contains both the user ID and role. This provides a single identity context for controllers and supports administrator-only operations such as role changes while keeping ordinary issue operations available to standard users.

### Prisma migrations as the database contract

Database changes are represented by committed Prisma migrations rather than relying on implicit synchronization. This makes deployments repeatable and gives the team a reviewable history of schema changes.

### Centralized frontend API client

Axios configuration and authentication behavior live in one module. Request interceptors attach access tokens, while response handling converts unauthorized responses into a global logout event. Feature hooks therefore focus on data requirements instead of repeating transport and authentication logic.

### Activity logs for auditability

Activity logging is modeled as a first-class entity rather than only a console log. This allows users to inspect meaningful changes after they happen and provides a durable operational history tied to actors and entities.

### Server state managed through hooks

The frontend groups API queries and mutations into hooks such as issue, auth, and activity hooks. This keeps page components focused on rendering and user interactions while providing a consistent place for cache invalidation and request behavior.

### Explicit domain enums

Roles, priorities, and statuses are database enums. This prevents invalid values from entering the persistence layer and makes the main workflow states visible in both the schema and application code.

## Production Notes

- Set strong, unique secrets through the deployment platform rather than committing `.env` files.
- Set `FRONTEND_URL` to the exact browser origin that should be allowed by CORS.
- Set the frontend `VITE_API_URL` to the public API URL at build time.
- Run `npm run build` and `npm run start` for the frontend production server.
- Run the backend container or `npm run start:container` so migrations are applied before the API starts.
- Use a managed PostgreSQL instance or a persistent database volume; do not treat a disposable container filesystem as durable storage.
- Review the default frontend API fallback before deployment and prefer an explicit `VITE_API_URL`.

## Troubleshooting

### Database connection errors

Verify that PostgreSQL is running, the database exists, and `DATABASE_URL` is available to the backend process. In Docker, use the Compose service hostname `postgres` rather than `localhost` from inside the API container.

### CORS errors

Make sure `FRONTEND_URL` matches the full frontend origin, including the protocol and port, for example `http://localhost:5173`.

### Authentication failures

Confirm both token secrets are present and at least 32 characters long. Delete stale `token`, `refreshToken`, and `user` entries from browser local storage after changing environments or token configuration.

### Frontend requests use the wrong API

Set `VITE_API_URL` in `Frontend/.env` and restart the frontend development server. Vite environment variables are read when the development server or production build starts.
