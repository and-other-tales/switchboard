#!/bin/bash

# Entrypoint script for Google Cloud Run deployment

# Set environment variables from Cloud Run environment if not already set
export PORT=${PORT:-8080}
export WEBSOCKET_PORT=${WEBSOCKET_PORT:-8081}

# Set PUBLIC_URL based on Cloud Run service URL if not specified
export PUBLIC_URL=${PUBLIC_URL:-"https://${K_SERVICE:-localhost}.${K_REVISION:-local}.${K_REGION:-local}.run.app"}

# Set WebSocket URL for the frontend
export NEXT_PUBLIC_WEBSOCKET_URL=${NEXT_PUBLIC_WEBSOCKET_URL:-"wss://${K_SERVICE:-localhost}.${K_REVISION:-local}.${K_REGION:-local}.run.app"}

# Explicitly check and set required environment variables from OS environment variables
export OPENAI_API_KEY=${OPENAI_API_KEY:?"OPENAI_API_KEY must be set"}
export TWILIO_ACCOUNT_SID=${TWILIO_ACCOUNT_SID:?"TWILIO_ACCOUNT_SID must be set"}
export TWILIO_AUTH_TOKEN=${TWILIO_AUTH_TOKEN:?"TWILIO_AUTH_TOKEN must be set"}

# Start the websocket-server first
echo "Building websocket-server..."
cd /app/websocket-server && npm install && npm run build
if [ $? -ne 0 ]; then
  echo "Error: Failed to build websocket-server"
  exit 1
fi

# Start the websocket-server in the background
echo "Starting websocket-server..."
cd /app/websocket-server && \
  WEBSOCKET_PORT=$WEBSOCKET_PORT \
  PUBLIC_URL="$PUBLIC_URL" \
  OPENAI_API_KEY="$OPENAI_API_KEY" \
  TWILIO_ACCOUNT_SID="$TWILIO_ACCOUNT_SID" \
  TWILIO_AUTH_TOKEN="$TWILIO_AUTH_TOKEN" \
  node dist/server.js &
WS_PID=$!

# Wait a bit for the websocket server to start
sleep 5

# Now build and start the webapp with the websocket server running
echo "Building webapp..."
cd /app/webapp && npm install && NODE_OPTIONS="--max-old-space-size=4096" npm run build
if [ $? -ne 0 ]; then
  echo "Warning: Build had issues, attempting to start anyway"
fi

# Start the Next.js webapp in the background with required environment variables
echo "Starting webapp..."
cd /app/webapp && \
  PORT=$PORT \
  WEBSOCKET_SERVER_URL="http://localhost:$WEBSOCKET_PORT" \
  PUBLIC_URL="$PUBLIC_URL" \
  OPENAI_API_KEY="$OPENAI_API_KEY" \
  TWILIO_ACCOUNT_SID="$TWILIO_ACCOUNT_SID" \
  TWILIO_AUTH_TOKEN="$TWILIO_AUTH_TOKEN" \
  npm run start &
WEBAPP_PID=$!

# Handle signals properly
trap "kill $WEBAPP_PID $WS_PID; exit" SIGINT SIGTERM

# Keep the container running
wait $WEBAPP_PID $WS_PID
