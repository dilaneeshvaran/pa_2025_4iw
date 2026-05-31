# MEDICOTE

Medicote is where doctors and patients can connect, manage appointments, share medical records, and do video consultations.
We also have an ai assistant that can guide you to the right doctor based on your symptoms, and answer your medical questions.

## Project Structure

This is a monorepo containing:

- **backend/** - Fastify API server with Prisma ORM
- **frontend/** - Nuxt.js web application
- **shared/** - Shared TypeScript types and utilities

## Prerequisites

- Node.js (v20 or higher)
- Docker and Docker Compose
- npm

## Quick Start

### 1. Install Dependencies

From the root directory, install all workspace dependencies:

```bash
npm install
```

This will install dependencies for backend, frontend and shared.

### 2. Environment Setup

Ask for the .env files for backend and frontend from your project lead.

### 3. Start the Database (Development)

```bash
docker compose -f docker-compose.dev.yml up -d
```

This starts the PostgreSQL database container for development.

### 4. Run Database Migrations

```bash
cd backend
npx prisma migrate dev
npx prisma generate
```

### 5. Seed the Database (Optional)

```bash
cd backend
npm run seed:dev
```

### 6. Start Development Servers

You have two options:

**Option A: Run both backend and frontend together**

```bash
npm run dev
```

**Option B: Run them separately in different terminals**

Terminal 1 (Backend):

```bash
npm run dev:backend
```

Terminal 2 (Frontend):

```bash
npm run dev:frontend
```

The backend will run on `http://localhost:3000` and the frontend on `http://localhost:3001`.

## Available Scripts

### Root Level

- `npm run dev` - Start both backend and frontend
- `npm run dev:backend` - Start only backend
- `npm run dev:frontend` - Start only frontend
- `npm run build` - Build both projects
- `npm run build:backend` - Build only backend
- `npm run build:frontend` - Build only frontend
- `npm run start` - Start both in production mode
- `npm run seed:dev` - Seed the database with development data

### Backend Scripts

Navigate to `backend/` directory:

- `npm run dev` - Start backend in development mode
- `npm run build` - Build backend for production
- `npm run start` - Start backend in production mode
- `npm run seed:dev` - Seed database

### Frontend Scripts

Navigate to `frontend/` directory:

- `npm run dev` - Start frontend in development mode
- `npm run build` - Build frontend for production
- `npm run preview` - Preview production build

## Project Configuration

### Environment Variables

All environment variables are consolidated in the root `.env` file with prefixes:

- `BACKEND_*` - Backend configuration
- `FRONTEND_*` - Frontend configuration

### Shared Types

Common TypeScript types used by both frontend and backend are located in `shared/types/`.

### Docker

The `docker-compose.yml` in the root manages the PostgreSQL database service.

## Development Workflow

1. Make changes to backend or frontend code
2. Changes are automatically reloaded in development mode
3. Commit your changes with meaningful commit messages
4. Push to your branch

## Production Build

Build both projects for production:

```bash
npm run build
```

Start in production mode:

```bash
npm run start
```

## Troubleshooting

### Port Already in Use

If you get a port conflict error:

- Backend: Change `BACKEND_PORT` in `.env`
- Frontend: The port is set in `frontend/nuxt.config.ts`

### Database Connection Issues

1. Ensure Docker is running: `docker ps`
2. Check database credentials in `.env`
3. Verify `BACKEND_DATABASE_URL` matches your Postgres configuration

### Module Not Found Errors

Run `npm install` from the root directory to install all dependencies.

## CI/CD

The project uses **GitHub Actions** (`.github/workflows/`):

- **`ci.yml`** — runs on every push (except `main`) and PR to `main`. Installs deps,
  generates the Prisma client, runs the Jest (backend) and Vitest (frontend) test
  suites, and builds both apps.
- **`cd.yml`** — runs on push to `main`. Re-runs the tests, builds the production
  Docker images and pushes them to **GHCR**
  (`ghcr.io/<owner>/pa_2025_4iw-backend` and `-frontend`), then deploys to the VPS
  over SSH (`git pull` → `docker compose -f docker-compose.prod.yml pull` → `up -d`).

### Required GitHub secrets (Settings → Secrets and variables → Actions)

| Secret | Description |
| --- | --- |
| `SSH_HOST` | VPS hostname or IP |
| `SSH_USER` | SSH user on the VPS |
| `SSH_KEY` | Private SSH key (PEM) authorized on the VPS |
| `SSH_PORT` | SSH port (optional, defaults to `22`) |
| `DEPLOY_PATH` | Absolute path of the project checkout on the VPS |

`GITHUB_TOKEN` is provided automatically and is used to push/pull images on GHCR.

### One-time VPS setup

- Install Docker + Docker Compose.
- Clone the repo into `DEPLOY_PATH` and create `backend/.env` and the root `.env`.
- Make sure the SSH user can run `docker` (e.g. is in the `docker` group).
- Images are public by default; if the GHCR packages are private, the deploy step's
  `docker login` (already included) handles authentication.

## Authors

Made by **Dilan EESHVARAN**, **AKA Kassi Joel Emmanuel**, **Sylvain ANTIN**, **Alix Sylvani**
