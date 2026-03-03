#!/bin/sh
set -e

echo "Starting entrypoint script..."

# Debug: Print environment variables
echo "Checking environment variables..."
echo "NODE_ENV: $NODE_ENV"
echo "PORT: $PORT"

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "ERROR: DATABASE_URL environment variable is not set!"
    exit 1
fi

echo "✓ DATABASE_URL is configured"

# Create upload directories
echo "Ensuring upload directories exist..."
mkdir -p /app/uploads/news
mkdir -p /app/uploads/news-gallery
mkdir -p /app/uploads/ads
echo "✓ Upload directories created/verified."

# Run database migrations with explicit schema path
echo "Running database migrations..."

# Run Prisma migrate deploy with explicit DATABASE_URL
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