import './env'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const connectionString = process.env.BACKEND_DATABASE_URL

if (!connectionString) {
  throw new Error('BACKEND_DATABASE_URL is not defined')
}

const pool = new Pool({
  connectionString,
  ssl: false, // disable ssl for local development
})

const adapter = new PrismaPg(pool)

const prisma = new PrismaClient({
  adapter,
  log:
    process.env.BACKEND_NODE_ENV === 'development'
      ? ['query', 'error', 'warn']
      : ['error'],
})

export default prisma
