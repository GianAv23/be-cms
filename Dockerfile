# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Copy Prisma files
COPY prisma ./prisma/

# Install dependencies (including dev dependencies for build)
RUN npm ci

# Copy necessary config files for build
COPY tsconfig*.json ./
COPY nest-cli.json ./

# Copy source code
COPY src ./src

# Generate Prisma Client
RUN npx prisma generate

# Build the application
RUN npm run build

# Verify build output exists
RUN ls -la dist/

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

# Install curl for healthcheck
RUN apk add --no-cache curl

# Copy package files
COPY package*.json ./

# Copy Prisma schema and migrations
COPY prisma/schema.prisma ./prisma/
COPY prisma/migrations ./prisma/migrations/

# Install production dependencies only
RUN npm ci --only=production && \
    npx prisma generate && \
    npm cache clean --force

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist

# Verify dist was copied
RUN ls -la dist/ && \
    test -f dist/main.js || (echo "ERROR: dist/main.js not found!" && exit 1)

# Copy entrypoint script
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Create uploads directory structure
RUN mkdir -p uploads/news uploads/news-gallery uploads/ads

# Create a non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

# Change ownership of the app directory and uploads
RUN chown -R nestjs:nodejs /app

# Switch to non-root user
USER nestjs

# Expose the application port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:${PORT:-3000}/health/live || exit 1

# Set entrypoint to initialize directories and run migrations
ENTRYPOINT ["docker-entrypoint.sh"]

# Start the application (use .js extension)
CMD ["node", "dist/main.js"]