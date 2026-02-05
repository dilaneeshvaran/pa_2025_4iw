# MEDICOTE

Medicote is where doctors and patients can connect, manage appointments, share medical records, and do video consultations.

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

Copy the `.env.example` file to `.env` and fill in your configuration:

```bash
cp .env.example .env
```

Edit `.env` with your actual values for:

- Database credentials (BACKEND*POSTGRES*\*)
- JWT secrets (BACKEND*JWT*\*)
- SMTP settings (BACKEND*SMTP*\*)
- API keys and other services

### 3. Start the Database

```bash
docker-compose up -d
```

This starts a PostgreSQL database container.

### 4. Run Database Migrations

```bash
cd backend
npx prisma migrate dev
```

### 5. Seed the Database (Optional)

```bash
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

## Authors

Made by **Dilan EESHVARAN**, **AKA Kassi Joel Emmanuel**, **Sylvain ANTIN**, **Alix Sylvani**
