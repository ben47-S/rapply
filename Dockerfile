# syntax=docker/dockerfile:1.7

# ── Base ──────────────────────────────────────────────
FROM node:22-slim AS base
RUN npm install -g pnpm@10.30.2 --registry=https://registry.yarnpkg.com
WORKDIR /app

# ── Dependencies ─────────────────────────────────────
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
RUN pnpm install --frozen-lockfile

# ── Builder ──────────────────────────────────────────
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ARG DATABASE_URL
ARG VAPID_PUBLIC_KEY
ARG VAPID_PRIVATE_KEY
ARG NEXT_PUBLIC_VAPID_PUBLIC_KEY
ARG JWT_SECRET
ARG CRON_SECRET
ARG NEXT_PUBLIC_APP_URL

ENV DATABASE_URL=$DATABASE_URL
ENV VAPID_PUBLIC_KEY=$VAPID_PUBLIC_KEY
ENV VAPID_PRIVATE_KEY=$VAPID_PRIVATE_KEY
ENV NEXT_PUBLIC_VAPID_PUBLIC_KEY=$NEXT_PUBLIC_VAPID_PUBLIC_KEY
ENV JWT_SECRET=$JWT_SECRET
ENV CRON_SECRET=$CRON_SECRET
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL

ENV NEXT_TELEMETRY_DISABLED=1
RUN npx prisma generate
RUN pnpm build

# ── Runner ───────────────────────────────────────────
FROM node:22 AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

RUN groupadd --system --gid 1001 nodejs \
 && useradd --system --uid 1001 --gid nodejs nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
RUN npm install -g prisma@6.8.2 --registry=https://registry.yarnpkg.com

USER nextjs

EXPOSE 3000
CMD ["node", "server.js"]
