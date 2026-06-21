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
COPY --chown=medicote:appgroup frontend/package*.json ./frontend/
COPY --chown=medicote:appgroup shared/package*.json ./shared/
COPY --chown=medicote:appgroup shared ./shared

RUN npm install


# stage 3: builder
FROM deps AS builder

COPY --chown=medicote:appgroup frontend ./frontend

RUN NODE_OPTIONS="--max-old-space-size=4096" npm run build --workspace=frontend


# stage 4: development
FROM deps AS development

COPY --chown=medicote:appgroup frontend ./frontend

EXPOSE 3000

WORKDIR /app/frontend
CMD ["npm", "run", "dev"]


# stage 5: production
FROM base AS production

COPY --chown=medicote:appgroup --from=builder /app/frontend/.output ./frontend/.output

ENV NODE_ENV=production

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
 CMD wget --no-verbose --spider http://localhost:3000 || exit 1

WORKDIR /app/frontend
CMD ["node", ".output/server/index.mjs"]