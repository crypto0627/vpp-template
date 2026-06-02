# ==========================================
# VPP Dashboard - Next.js Application Dockerfile
# ==========================================
# Multi-stage build optimized for Docker layer caching

FROM node:22-alpine AS base

# ==========================================
# Stage 1: Dependencies (cached unless lockfile changes)
# ==========================================
FROM base AS deps

RUN corepack enable && corepack prepare pnpm@9.0.0 --activate
RUN apk add --no-cache libc6-compat openssl

WORKDIR /app

# Copy only dependency-related files first (maximizes cache hits)
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json turbo.json ./
COPY apps/web/package.json ./apps/web/
COPY packages/eslint-config/package.json ./packages/eslint-config/
COPY packages/typescript-config/package.json ./packages/typescript-config/

RUN pnpm install --frozen-lockfile --prefer-offline

# ==========================================
# Stage 2: Builder
# ==========================================
FROM base AS builder

RUN corepack enable && corepack prepare pnpm@9.0.0 --activate
RUN apk add --no-cache libc6-compat openssl

WORKDIR /app

# Copy all source files first
COPY . .

# Then overlay node_modules from deps stage (source COPY can't include them due to .dockerignore)
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules

# Generate Prisma Client
WORKDIR /app/apps/web
RUN pnpm exec prisma generate

# Build the application
WORKDIR /app
ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"
ENV NEXT_PUBLIC_API_BASE_URL="http://host.docker.internal:3003/data"
ENV NODE_ENV="production"
RUN pnpm turbo build --filter=web

# ==========================================
# Stage 3: Runner (minimal production image)
# ==========================================
FROM base AS runner

RUN apk add --no-cache openssl

WORKDIR /app

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/apps/web/public ./apps/web/public

RUN mkdir -p ./apps/web/.next
RUN chown nextjs:nodejs ./apps/web/.next

COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static

# Prisma files for migrations and generated client
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/prisma ./apps/web/prisma
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/lib/generated/prisma ./apps/web/lib/generated/prisma

# Scripts and historical data
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/scripts ./apps/web/scripts
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/constants ./apps/web/constants

USER nextjs

EXPOSE 3001

ENV PORT=3001
ENV HOSTNAME="0.0.0.0"
ENV NODE_ENV=production

CMD ["node", "apps/web/server.js"]
