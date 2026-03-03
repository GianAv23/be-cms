#!/bin/sh
set -e

# Create upload directories if they don't exist
# This ensures the structure exists even when volume is mounted
mkdir -p /app/uploads/news
mkdir -p /app/uploads/news-gallery
mkdir -p /app/uploads/ads

echo "Upload directories initialized"
echo "Starting application..."

# Execute the main command (node dist/main)
exec "$@"
