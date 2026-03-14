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
