# TSPark

Medicote is where doctors and patients can connect, manage appointments, share medical records, and do video consultations.

## Prerequisites

- Node.js (v20 or higher)
- Docker and Docker Compose
- npm

## Steps to Run the Project for Development

### Setting Up the Environment Variables

ask your team lead for the `.env` file and place it in the root directory of the project.

### 1. Install Dependencies

```bash
npm install
```

### 2. Start the Database

```bash
docker compose up -d
```

This will start PostgreSQL


### 3. Run migrations and seeds

```bash
npx prisma generate
npx prisma migrate deploy
npm run seed:dev
```

### 4. Start the Development Server

**Option A: Auto-reloading only (faster but no type checking)**

```bash
npm run dev
```

### 5. Access the Application

- **App**: http://localhost:3000

### 5. Stopping the Application

Stop the database:

```bash
docker compose down
```

Stop the development server: `Ctrl + C`

## Database Management with Prisma

### Generate Prisma Client

Generate TypeScript types after schema changes :

```bash
npx prisma generate
```

### Create a Migration

```bash
npx prisma migrate dev  --name your_migration_name
```

### Open Prisma Studio

Launch the database GUI to view and edit data:

```bash
npx prisma studio
```

### Seed Database

Seed the database with initial data:

```bash
npx prisma db seed
```
or

```bash
npm run seed:dev
```

### Reset Database

Reset the database (warning: deletes all data):

```bash
npx prisma migrate reset
```

### Deploy Migrations

Deploy migrations to the database: used in production or when pulling migrations from version control

```bash
npx prisma migrate deploy
```

### Validate Prisma Schema

Check your schema for errors without applying changes:

```bash
npx prisma validate
```

### View Database Schema

Pull the current database schema to see what's in your database:

```bash
npx prisma db pull
```

## Authors

Made by **Dilan EESHVARAN**, **AKA Kassi Joel Emmanuel**, **Sylvain ANTIN**, **Alix Sylvani**
