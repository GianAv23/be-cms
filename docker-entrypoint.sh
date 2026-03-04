#!/bin/sh
set -e

echo "Starting entrypoint script..."

# Environment variables are printed for debugging
echo "Checking environment variables..."
echo "NODE_ENV: $NODE_ENV"
echo "PORT: $PORT"

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "ERROR: DATABASE_URL environment variable is not set!"
    exit 1
fi

echo "✓ DATABASE_URL is configured"

# Upload directories are created if not present
echo "Ensuring upload directories exist..."
mkdir -p /app/uploads/news
mkdir -p /app/uploads/news-gallery
mkdir -p /app/uploads/ads
echo "✓ Upload directories created/verified."

# Database migrations are applied to target database
echo "Running database migrations..."

# Prisma migrations are deployed using explicit schema path
npx prisma migrate deploy --schema=./prisma/schema.prisma

if [ $? -eq 0 ]; then
    echo "✓ Migrations completed successfully."
else
    echo "✗ Migration failed!"
    exit 1
fi

# Start application
echo "Starting application..."
exec "$@"