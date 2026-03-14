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