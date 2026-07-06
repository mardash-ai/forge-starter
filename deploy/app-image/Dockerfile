# Production image for a Forge app — Next.js standalone. When you productionize, copy this to
# `app/Dockerfile` and `.dockerignore` (below) to `app/.dockerignore`, and set
# `output: 'standalone'` in `app/next.config.mjs` (see DEPLOY.md). CI (publish-app.yml) builds it.
#
# Multi-stage: install deps → `next build` (standalone) → a slim runner carrying only
# .next/standalone (a minimal server + just the node_modules it needs), .next/static, and public/.
FROM node:22-bookworm-slim AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci || npm install

FROM node:22-bookworm-slim AS build
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN mkdir -p public && npm run build

FROM node:22-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
# Standalone must bind 0.0.0.0 or Traefik gets a 502 (it would bind the container hostname).
ENV HOSTNAME=0.0.0.0
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public
EXPOSE 3000
CMD ["node", "server.js"]
