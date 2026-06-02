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
COPY --chown=medicote:appgroup tsconfig.json .
COPY --chown=medicote:appgroup nuxt.config.ts .
COPY --chown=medicote:appgroup tailwind.config.cjs .

RUN npm install


# stage 3: builder
FROM deps AS builder

COPY --chown=medicote:appgroup . .

RUN NODE_OPTIONS="--max-old-space-size=4096" npm run build


# stage 4: development
FROM base AS development

COPY --chown=medicote:appgroup --from=deps /app .
COPY --chown=medicote:appgroup . .

EXPOSE 3000

CMD ["npm", "run", "dev"]


# stage 5: production
FROM base AS production

COPY --chown=medicote:appgroup --from=builder /app/.output ./.output

ENV NODE_ENV=production

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
 CMD wget --no-verbose --spider http://localhost:3000 || exit 1

CMD ["node", ".output/server/index.mjs"]