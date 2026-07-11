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

The frontend will run on `http://localhost:3000` and the backend on `http://localhost:3001`.

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

### Makefile (recommandé)

Afficher toutes les commandes : `make help`

**Développement**

| Commande | Description |
|----------|-------------|
| `make up` | Démarre la stack dev (Docker) |
| `make down` | Arrête les conteneurs |
| `make logs` | Suit les logs (`make logs s=backend`) |
| `make seed` | Seed de dev dans le conteneur backend |
| `make migrate name=ma_migration` | Crée/applique une migration Prisma |
| `make backend-sh` | Shell dans le conteneur backend |
| `make frontend-sh` | Shell dans le conteneur frontend |
| `make psql` | Ouvre psql sur la base `medicote` |
| `make clean` | Arrête tout et supprime les volumes |

**Tests E2E (Playwright)**

| Commande | Description |
|----------|-------------|
| `make e2e-up` | Démarre la stack E2E isolée (DB `medicote_e2e`) |
| `make e2e-install` | Installe Playwright dans `e2e/` (une fois) |
| `make e2e-test` | Lance les tests E2E (stack doit être up) |
| `make e2e-test-ui` | Lance les tests avec l'UI Playwright (debug) |
| `make e2e-down` | Arrête la stack E2E et supprime les volumes |
| `make e2e-logs` | Logs E2E (`make e2e-logs s=backend-e2e`) |

Workflow E2E typique :

```bash
make e2e-up        # génère .env.e2e si absent (secrets éphémères locaux)
make e2e-install   # première fois uniquement
make e2e-test
```

Les identifiants de la stack E2E (PostgreSQL, JWT) sont dans `.env.e2e` (gitignoré), généré depuis `.env.e2e.example` via `scripts/prepare-e2e-env.sh`. Ne jamais committer `.env.e2e`.

Comptes de test (seed E2E) — mot de passe : valeur de `E2E_PASSWORD` dans `.env.e2e` (généré par `make e2e-up`)

| Rôle | Email |
|------|-------|
| Patient | `patient@test.fr` |
| Praticien | `praticien@test.fr` |
| Admin | `admin@test.fr` |
| Staff | `staff@test.fr` |

### Root Level

- `npm run dev` - Start both backend and frontend
- `npm run dev:backend` - Start only backend
- `npm run dev:frontend` - Start only frontend
- `npm run build` - Build both projects
- `npm run build:backend` - Build only backend
- `npm run build:frontend` - Build only frontend
- `npm run start` - Start both in production mode
- `npm run seed:dev` - Seed the database with development data
- `npm run test` - Run backend + frontend unit tests
- `npm run test:e2e` - Run Playwright E2E tests
- `npm run test:e2e:ui` - Run E2E tests with Playwright UI
- `npm run e2e:setup` - Start E2E Docker stack (`docker compose -f docker-compose.e2e.yml up -d --wait`)
- `npm run e2e:teardown` - Stop E2E Docker stack

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
