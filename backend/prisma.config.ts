import 'dotenv/config'
import * as path from 'node:path'
import { defineConfig } from 'prisma/config'

export default defineConfig({
  schema: path.join('prisma', 'schema.prisma'),
  datasource: {
    url: process.env.BACKEND_DATABASE_URL,
  },
})
