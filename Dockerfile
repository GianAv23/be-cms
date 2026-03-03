# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy everything
COPY . .

# Install dependencies
RUN npm ci

# Generate Prisma Client
RUN npx prisma generate

# Build
RUN npm run build

# Check build output
RUN echo "Build completed. Contents of dist:" && ls -la dist/

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

RUN apk add --no-cache curl

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install production dependencies
RUN npm ci --only=production && \
    npx prisma generate && \
    npm cache clean --force

# Copy built dist from builder
COPY --from=builder /app/dist ./dist

# Verify
RUN echo "Copied dist. Contents:" && ls -la dist/

# Copy entrypoint
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Create directories
RUN mkdir -p uploads/news uploads/news-gallery uploads/ads

# Create user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001 && \
    chown -R nestjs:nodejs /app

USER nestjs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:3000/health/live || exit 1

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["node", "dist/main.js"]