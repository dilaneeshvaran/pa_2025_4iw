# stage 1: base
FROM node:20-alpine AS base

WORKDIR /app

RUN addgroup -g 1001 appgroup \
 && adduser -D -u 1001 -G appgroup medicote \
 && chown -R medicote:appgroup /app

USER medicote


# stage 2: dependencies
FROM base AS deps

COPY --chown=medicote:appgroup package*.json .
COPY --chown=medicote:appgroup prisma ./prisma

RUN npm install && npx prisma generate


# stage 2b: production dependencies only
FROM base AS prod-deps

COPY --chown=medicote:appgroup package*.json .
COPY --chown=medicote:appgroup prisma ./prisma

RUN npm install --omit=dev


# stage 3: builder
FROM deps AS builder

COPY --chown=medicote:appgroup tsconfig.json .
COPY --chown=medicote:appgroup prisma.config.ts .
COPY --chown=medicote:appgroup src ./src

RUN npx prisma generate
RUN npm run build


# stage 4: development
FROM deps AS development

COPY --chown=medicote:appgroup . .

EXPOSE 3001

CMD ["npm", "run", "dev"]


# stage 5: production
FROM base AS production

COPY --chown=medicote:appgroup --from=prod-deps /app/node_modules ./node_modules
COPY --chown=medicote:appgroup --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --chown=medicote:appgroup --from=builder /app/dist ./dist
COPY --chown=medicote:appgroup --from=builder /app/prisma ./prisma
# Required by `prisma migrate deploy` (Prisma 7 reads datasource.url from here)
COPY --chown=medicote:appgroup --from=builder /app/prisma.config.ts .
COPY --chown=medicote:appgroup --from=deps /app/package.json .

ENV NODE_ENV=production

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
 CMD wget --no-verbose --spider http://localhost:3001/health || exit 1

CMD ["node", "dist/index.js"]