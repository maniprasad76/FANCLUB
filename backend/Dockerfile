# ============================================
# FAN Backend — Production Dockerfile
# Multi-stage build for minimal image size
# ============================================

# ── Stage 1: Build ──
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies first (cache layer)
COPY package*.json ./
RUN npm ci --ignore-scripts

# Copy source and build
COPY . .
RUN npx prisma generate
RUN npm run build

# Prune dev dependencies after build
RUN npm prune --production

# ── Stage 2: Runtime ──
FROM node:20-alpine AS runtime

# Security: run as non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001 -G nodejs

WORKDIR /app

# Copy only production artifacts
COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nodejs /app/package.json ./package.json
COPY --from=builder --chown=nestjs:nodejs /app/prisma ./prisma

# Set environment
ENV NODE_ENV=production
ENV PORT=5000

# Expose the port
EXPOSE 5000

# Switch to non-root user
USER nestjs

# Health check — verifies the app is responding
HEALTHCHECK --interval=30s --timeout=5s --retries=3 --start-period=15s \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/api/health || exit 1

# Start the application
CMD ["node", "dist/src/main"]
