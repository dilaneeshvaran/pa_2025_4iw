# stage 1: base
FROM node:20-alpine AS base

WORKDIR /app

RUN addgroup -g 1001 appgroup \
 && adduser -D -u 1001 -G appgroup medicote \
 && chown -R medicote:appgroup /app

USER medicote


# stage 2: dependencies
FROM base AS deps

COPY --chown=medicote:appgroup package*.json ./
COPY --chown=medicote:appgroup backend/package*.json ./backend/
COPY --chown=medicote:appgroup shared/package*.json ./shared/
COPY --chown=medicote:appgroup shared ./shared
COPY --chown=medicote:appgroup backend/prisma ./backend/prisma

RUN npm install && npx prisma generate --schema=backend/prisma/schema.prisma


# stage 2b: production dependencies only
FROM base AS prod-deps

COPY --chown=medicote:appgroup package*.json ./
COPY --chown=medicote:appgroup backend/package*.json ./backend/
COPY --chown=medicote:appgroup shared/package*.json ./shared/
COPY --chown=medicote:appgroup shared ./shared
COPY --chown=medicote:appgroup backend/prisma ./backend/prisma

RUN npm install --omit=dev && npx prisma generate --schema=backend/prisma/schema.prisma


# stage 3: builder
FROM deps AS builder

COPY --chown=medicote:appgroup backend/tsconfig.json ./backend/
COPY --chown=medicote:appgroup backend/prisma.config.ts ./backend/
COPY --chown=medicote:appgroup backend/src ./backend/src

RUN npx prisma generate --schema=backend/prisma/schema.prisma
RUN npm run build --workspace=backend


# stage 4: development
FROM deps AS development

COPY --chown=medicote:appgroup backend ./backend

EXPOSE 3001

WORKDIR /app/backend
CMD ["npm", "run", "dev"]


# stage 5: production
FROM base AS production

COPY --chown=medicote:appgroup --from=prod-deps /app/node_modules ./node_modules
COPY --chown=medicote:appgroup --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --chown=medicote:appgroup --from=builder /app/backend/dist ./backend/dist
COPY --chown=medicote:appgroup --from=builder /app/backend/prisma ./backend/prisma
# Required by `prisma migrate deploy` (Prisma 7 reads datasource.url from here)
COPY --chown=medicote:appgroup --from=builder /app/backend/prisma.config.ts ./backend/
COPY --chown=medicote:appgroup --from=deps /app/backend/package.json ./backend/

ENV NODE_ENV=production

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
 CMD wget --no-verbose --spider http://localhost:3001/health || exit 1

WORKDIR /app/backend
CMD ["node", "dist/index.js"]