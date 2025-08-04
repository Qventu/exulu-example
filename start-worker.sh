#!/bin/sh
set -x  # Print each command before execution for debugging

echo "Starting Exulu IMP worker..."
echo "NODE_ENV: $NODE_ENV"

npm run utils:initdb

if [ "$NODE_ENV" = "dev" ]; then
  echo "Starting in dev mode with tsx watch..."
  tsx watch worker.ts
else
  echo "Starting in production mode..."
  npm run build
  pm2 start dist/worker.js --name "exulu-worker"
  pm2 logs
fi 