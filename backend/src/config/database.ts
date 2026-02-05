import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const pool = new Pool({
  connectionString: process.env.BACKEND_DATABASE_URL,
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
