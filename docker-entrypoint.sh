#!/bin/sh
set -e

echo "Starting entrypoint script..."

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

# Run database migrations with inline DATABASE_URL
echo "Running database migrations..."

# Set DATABASE_URL for prisma explicitly and run migration
export DATABASE_URL="$DATABASE_URL"

# Use direct command without config file
npx prisma migrate deploy --schema=prisma/schema.prisma 2>&1

migration_status=$?

if [ $migration_status -eq 0 ]; then
    echo "✓ Migrations completed successfully."
else
    echo "✗ Migration failed with exit code: $migration_status"
    exit 1
fi

# Start application
echo "Starting application..."
exec "$@"