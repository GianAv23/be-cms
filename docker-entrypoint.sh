#!/bin/sh
set -e

echo "Starting entrypoint script..."

# Create upload directories if they don't exist
echo "Ensuring upload directories exist..."
mkdir -p /app/uploads/news
mkdir -p /app/uploads/news-gallery
mkdir -p /app/uploads/ads

echo "Upload directories created/verified."

# Run database migrations
echo "Running database migrations..."
npx prisma migrate deploy

echo "Migrations completed successfully."

# Execute the main command (start the application)
echo "Starting application..."
exec "$@"