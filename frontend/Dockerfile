#stage 1: base
FROM node:20-alpine AS base

WORKDIR /app

RUN addgroup -g 1001 appgroup && adduser -D -u 1001 -G appgroup medicote-user && chown -R medicote-user:appgroup /app



