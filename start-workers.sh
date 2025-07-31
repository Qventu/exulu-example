#!/bin/sh
set -x  # Print each command before execution for debugging

echo "Starting Exulu IMP worker..."
echo "NODE_ENV: $NODE_ENV"

if [ "$NODE_ENV" = "dev" ]; then
  echo "Starting in dev mode with tsx watch..."
  tsx watch workers.ts
else
  echo "Starting in production mode..."
  npm run build
  pm2 start dist/workers.js --name "exulu-worker"
  pm2 logs
fi 