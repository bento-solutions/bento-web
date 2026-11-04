# Overridable so the image can be test-built against a local base image.
ARG NODE_IMAGE=node:22.23.4-alpine
FROM ${NODE_IMAGE} AS base

FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json .npmrc ./
RUN npm ci

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
# The build never touches the database: pages are generated on their first visit.
RUN PAYLOAD_SECRET=build-only DATABASE_URL=postgres://build:build@127.0.0.1:1/none npm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
ENV MEDIA_DIR=/app/media

RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs
# The named volume mounted here takes its ownership from this directory.
RUN mkdir -p .next media && chown nextjs:nodejs .next media

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
