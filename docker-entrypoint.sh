#!/bin/sh
set -e

echo "Starting entrypoint script..."

# Debug: Print environment variables (remove sensitive data in production)
echo "Checking environment variables..."
echo "NODE_ENV: $NODE_ENV"
echo "PORT: $PORT"

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "ERROR: DATABASE_URL environment variable is not set!"
    echo "Available environment variables:"
    env | grep -v PASSWORD | grep -v SECRET | sort
    exit 1
else
    echo "✓ DATABASE_URL is configured"
fi

# Create upload directories if they don't exist
echo "Ensuring upload directories exist..."
mkdir -p /app/uploads/news
mkdir -p /app/uploads/news-gallery
mkdir -p /app/uploads/ads
echo "✓ Upload directories created/verified."

# Run database migrations with explicit DATABASE_URL
echo "Running database migrations..."
echo "Using Prisma schema from: prisma/schema.prisma"

# Export DATABASE_URL explicitly for Prisma
export DATABASE_URL="${DATABASE_URL}"

# Run migrations
npx prisma migrate deploy

if [ $? -eq 0 ]; then
    echo "✓ Migrations completed successfully."
else
    echo "✗ Migration failed!"
    exit 1
fi

# Execute the main command (start the application)
echo "Starting application..."
exec "$@"