#!/bin/sh

set -e

# Store the original DATABASE_URL (pointing to PgBouncer)
ORIGINAL_DATABASE_URL=$DATABASE_URL

# Get the direct PostgreSQL URL
DIRECT_URL=${DIRECT_DATABASE_URL:-$DATABASE_URL}

echo "Original DATABASE_URL: $DATABASE_URL (PgBouncer)"
echo "Direct connection URL: $DIRECT_URL (PostgreSQL)"

# Extract host and port from the direct URL
DB_HOST=$(echo "$DIRECT_URL" | awk -F[@:] '{print $4}')
DB_PORT=$(echo "$DIRECT_URL" | awk -F[@:] '{print $5}' | cut -d'/' -f1)

echo "Waiting for database at $DB_HOST:$DB_PORT"

# Wait for the database to be ready
./wait-for-it.sh "$DB_HOST":"$DB_PORT" -t 60

echo "Database is up - running migrations"

# Temporarily change DATABASE_URL to the direct connection for migrations
export DATABASE_URL="$DIRECT_URL"
echo "Using DATABASE_URL for migrations: $DATABASE_URL"

# Run Prisma migrations
npx prisma migrate deploy

echo "Migrations complete - restoring original DATABASE_URL"

# Restore the original DATABASE_URL for the application
export DATABASE_URL="$ORIGINAL_DATABASE_URL"
echo "Restored DATABASE_URL: $DATABASE_URL"

echo "Starting application"
# Start the Node.js application (which will use the restored DATABASE_URL)
node dist/main.js
