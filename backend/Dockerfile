# stage 1: base
FROM node:20-alpine AS base

WORKDIR /app

RUN addgroup -g 1001 appgroup && adduser -D -u 1001 -G appgroup medicote-user && chown -R medicote-user:appgroup /app

USER medicote-user


# stage 2: dependencies
FROM base AS deps

WORKDIR /app

COPY package*.json .
COPY tsconfig.json .
COPY prisma.config.ts .
COPY prisma ./prisma

RUN npm ci && npx prisma generate


#stage 3: development
FROM base AS development

WORKDIR /app

COPY --from=deps /app .
COPY src ./src

EXPOSE 3001

CMD ["npm", "run", "dev"]

# stage 3b: builder (compiles TypeScript for production)
FROM development AS builder

RUN npm run build


# stage 4: production
FROM base AS production

WORKDIR /app

COPY --from=deps /app/package.json .
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=deps /app/prisma ./prisma
COPY --from=deps /app/prisma.config.ts .
COPY --from=deps /app/tsconfig.json .

COPY .env .

USER medicote-user

ENV NODE_ENV=production

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 CMD wget --no-verbose --spider http://localhost:3001/health || exit 1

CMD ["node", "dist/server.js"]