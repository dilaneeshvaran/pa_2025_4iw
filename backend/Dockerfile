# stage 1: base
FROM node:22-alpine AS base

WORKDIR /app

RUN mkdir -p /app/backend/uploads \
 && addgroup -g 1001 appgroup \
 && adduser -D -u 1001 -G appgroup medicote \
 && chown -R medicote:appgroup /app

USER medicote


# stage 2: dependencies
FROM base AS deps

COPY --chown=medicote:appgroup package*.json .npmrc ./
COPY --chown=medicote:appgroup backend/package*.json ./backend/
COPY --chown=medicote:appgroup shared/package*.json ./shared/
COPY --chown=medicote:appgroup shared ./shared
COPY --chown=medicote:appgroup backend/prisma ./backend/prisma

RUN npm install && npx prisma generate --schema=backend/prisma/schema.prisma


# stage 2b: production dependencies only
FROM base AS prod-deps

COPY --chown=medicote:appgroup package*.json .npmrc ./
COPY --chown=medicote:appgroup backend/package*.json ./backend/
COPY --chown=medicote:appgroup shared/package*.json ./shared/
COPY --chown=medicote:appgroup shared ./shared
COPY --chown=medicote:appgroup backend/prisma ./backend/prisma

RUN npm install --omit=dev && npx prisma generate --schema=backend/prisma/schema.prisma


# stage 3: development
FROM deps AS development

COPY --chown=medicote:appgroup backend ./backend

EXPOSE 3001

WORKDIR /app/backend
CMD ["npm", "run", "dev"]


# stage 4: production
# Runs the TypeScript sources directly via tsx (same runtime as dev). This lets
# the @medicote/shared workspace resolve from source — shared has no JS build,
# so a compiled `node dist/index.js` cannot require it. tsx is a runtime
# dependency (see backend/package.json), so it survives `npm install --omit=dev`.
FROM base AS production

COPY --chown=medicote:appgroup --from=prod-deps /app/node_modules ./node_modules
COPY --chown=medicote:appgroup --from=prod-deps /app/shared ./shared
COPY --chown=medicote:appgroup backend/package.json backend/tsconfig.json backend/prisma.config.ts ./backend/
COPY --chown=medicote:appgroup backend/src ./backend/src
COPY --chown=medicote:appgroup backend/prisma ./backend/prisma

ENV NODE_ENV=production

EXPOSE 3001

# Use a GET (-O /dev/null), not wget --spider's HEAD: the /health route only
# answers GET. Hit 127.0.0.1 (not localhost): Fastify binds IPv4 (0.0.0.0), but
# localhost can resolve to ::1 (IPv6) inside the container, which nothing listens on.
HEALTHCHECK --interval=30s --timeout=3s --start-period=15s --retries=3 \
 CMD wget -q -O /dev/null http://127.0.0.1:3001/health || exit 1

WORKDIR /app/backend
CMD ["sh", "-c", "npx prisma migrate deploy && npx tsx src/index.ts"]