#!/bin/bash

# Entrypoint script for Google Cloud Run deployment

# Set environment variables from Cloud Run environment if not already set
export PORT=${PORT:-8080}
export WEBSOCKET_PORT=${WEBSOCKET_PORT:-8081}
export PUBLIC_URL=${PUBLIC_URL:-"https://${K_SERVICE:-localhost}.${K_REVISION:-local}.${K_REGION:-local}.run.app"}

# Set environment variables from OS environment variables
export OPENAI_API_KEY=${OPENAI_API_KEY}
export TWILIO_ACCOUNT_SID=${TWILIO_ACCOUNT_SID}
export TWILIO_AUTH_TOKEN=${TWILIO_AUTH_TOKEN}

# Build the webapp and websocket-server
echo "Building webapp..."
cd /app/webapp && npm install && npm run build
if [ $? -ne 0 ]; then
  echo "Error: Failed to build webapp"
  exit 1
fi

echo "Building websocket-server..."
cd /app/websocket-server && npm install && npm run build
if [ $? -ne 0 ]; then
  echo "Error: Failed to build websocket-server"
  exit 1
fi

# Start both services
echo "Starting services..."
# Start the Next.js webapp in the background
cd /app/webapp && npm run start &
WEBAPP_PID=$!

# Start the websocket-server in the background
cd /app/websocket-server && node dist/server.js &
WS_PID=$!

# Handle signals properly
trap "kill $WEBAPP_PID $WS_PID; exit" SIGINT SIGTERM

# Keep the container running
wait $WEBAPP_PID $WS_PID
