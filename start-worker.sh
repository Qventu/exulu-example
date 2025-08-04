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
  # Check if pm2 process "exulu-worker" is running
  if pm2 list | grep -q "exulu-worker"; then
    echo "PM2 process 'exulu-worker' is already running. Restarting..."
    pm2 restart exulu-worker
  else
    echo "PM2 process 'exulu-worker' is not running. Starting..."
    pm2 start dist/worker.js --name "exulu-worker"
  fi
  pm2 logs
fi 