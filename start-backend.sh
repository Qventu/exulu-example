#!/bin/sh
set -x  # Print each command before execution for debugging

echo "Starting Exulu IMP server..."
echo "NODE_ENV: $NODE_ENV"

npm run utils:initdb

if [ "$NODE_ENV" = "dev" ]; then
  echo "Starting in dev mode with tsx watch..."
  tsx watch server.ts
else
  echo "Starting in production mode..."
  npm run build
  pm2 start dist/server.js --name "exulu-server"
  pm2 logs
fi 