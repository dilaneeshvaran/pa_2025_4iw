#stage 1: base
FROM node:20-alpine AS base

WORKDIR /app

RUN addgroup -g 1001 appgroup && adduser -D -u 1001 -G appgroup medicote-user && chown -R medicote-user:appgroup /app


#stage 2: dependencies
FROM base AS deps

WORKDIR /app

COPY --chown=medicote-user:appgroup package*.json .
COPY --chown=medicote-user:appgroup tsconfig.json .
COPY --chown=medicote-user:appgroup nuxt.config.ts .
COPY --chown=medicote-user:appgroup tailwind.config.cjs .

USER medicote-user

RUN npm ci


# stage 3: builder (builds Nuxt app for production)
FROM deps AS builder

COPY --chown=medicote-user:appgroup . .

RUN NODE_OPTIONS="--max-old-space-size=4096" npm run build


#stage 4: development
FROM base AS development

WORKDIR /app

COPY --from=deps /app .
COPY --chown=appuser:appgroup . .

USER medicote-user

EXPOSE 3000

CMD ["npm", "run", "dev"]


#stage 5: production
FROM base AS production

WORKDIR /app

COPY --from=builder /app/package.json .
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.output ./.output
COPY --from=builder /app/nuxt.config.ts .
COPY --from=builder /app/tailwind.config.cjs .
COPY --from=builder /app/tsconfig.json .

USER medicote-user

ENV NODE_ENV=production

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 CMD wget --no-verbose --spider http://localhost:3000 || exit 1

CMD ["node", ".output/server/index.mjs"]