# stage 1: base
FROM node:22-alpine AS base

WORKDIR /app

RUN addgroup -g 1001 appgroup \
 && adduser -D -u 1001 -G appgroup medicote \
 && chown -R medicote:appgroup /app

USER medicote


# stage 2: dependencies
FROM base AS deps

COPY --chown=medicote:appgroup package*.json .npmrc ./
COPY --chown=medicote:appgroup frontend/package*.json ./frontend/
COPY --chown=medicote:appgroup shared/package*.json ./shared/
COPY --chown=medicote:appgroup shared ./shared

# package-lock.json is generated on Windows and lacks linux-x64-musl optional
# native binaries (e.g. @oxc-parser/binding-linux-x64-musl needed by Nuxt on
# Alpine). Removing it forces a fresh cross-platform resolution.
RUN rm -f package-lock.json && npm install


# stage 3: builder
FROM deps AS builder

COPY --chown=medicote:appgroup frontend ./frontend

ARG NUXT_PUBLIC_API_BASE=/api
ARG NUXT_PUBLIC_UMAMI_URL=/umami
ENV NUXT_PUBLIC_API_BASE=${NUXT_PUBLIC_API_BASE}
ENV NUXT_PUBLIC_UMAMI_URL=${NUXT_PUBLIC_UMAMI_URL}

RUN NODE_OPTIONS="--max-old-space-size=4096" npm run build --workspace=frontend


# stage 4: development
FROM deps AS development

COPY --chown=medicote:appgroup frontend ./frontend

EXPOSE 3000

WORKDIR /app/frontend
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]


# stage 5: production
FROM base AS production

COPY --chown=medicote:appgroup --from=builder /app/frontend/.output ./frontend/.output

ENV NODE_ENV=production

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
 CMD wget --no-verbose --spider http://localhost:3000 || exit 1

WORKDIR /app/frontend
CMD ["node", ".output/server/index.mjs"]
