# MEDICOTE

Medicote is where doctors and patients can connect, manage appointments, share medical records, and do video consultations.
We also have an ai assistant that can guide you to the right doctor based on your symptoms, and answer your medical questions.

## Quick Start

### Environment Setup

Ask for the .env files for backend and frontend from your project lead.

### 1. Start the containers (Development)

```bash
docker compose up -d
```

This starts PostgreSQL, Redis, frontend, backend, Umami and **LiveKit** (SFU for teleconsultation video).

The frontend will run on `http://localhost:3000` and the backend on `http://localhost:3001`.
LiveKit signaling is on ws://localhost:7880 (used internally by the teleconsult room).

### 2. Run Database Migrations

```bash
cd backend
npx prisma migrate dev
npx prisma generate
```

### 3. Seed the Database (Optional)

```bash
cd backend
npm run seed:dev
```

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

### Shared Types

Common TypeScript types used by both frontend and backend are located in `shared/types/`.

## Authors

Made by **Dilan EESHVARAN**, **AKA Kassi Joel Emmanuel**, **Sylvain ANTIN**, **Alix Sylvani**
