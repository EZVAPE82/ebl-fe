# =====================================================
# 프론트엔드 Dockerfile — Next.js 16 standalone
# Multi-stage: deps → builder → runner
# =====================================================

# ----- 1. deps -----
FROM node:22-alpine AS deps
WORKDIR /app

# 의존성만 먼저 복사 (캐시 효율)
COPY package.json package-lock.json* ./
RUN npm ci --no-audit --no-fund


# ----- 2. builder -----
FROM node:22-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build (.next/standalone 산출)
RUN npm run build


# ----- 3. runner (실행 환경) -----
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# 비루트 사용자 + healthcheck용 curl (alpine은 wget 내장이지만 상태코드 검증을 위해 curl 사용)
RUN apk add --no-cache curl && \
    addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# standalone 결과만 복사 (이미지 크기 최소)
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

USER nextjs

EXPOSE 3000

# Healthcheck (홈 페이지 GET 200) — curl로 status 검증
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
    CMD curl -fsS http://localhost:3000/ || exit 1

CMD ["node", "server.js"]
