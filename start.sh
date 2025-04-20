#!/bin/sh
set -e

# Check for required OAuth environment variables
if [ -z "$GOOGLE_CLIENT_ID" ] || [ -z "$GOOGLE_CLIENT_SECRET" ]; then
  echo "Warning: GOOGLE_CLIENT_ID and/or GOOGLE_CLIENT_SECRET not set."
  echo "Setting test values for local development - DO NOT USE IN PRODUCTION!"
  export GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID:-"TEST_CLIENT_ID"}
  export GOOGLE_CLIENT_SECRET=${GOOGLE_CLIENT_SECRET:-"TEST_CLIENT_SECRET"}
fi

# Set NEXTAUTH_URL if not provided (required for NextAuth.js)
if [ -z "$NEXTAUTH_URL" ]; then
  export NEXTAUTH_URL=${PUBLIC_URL}
  echo "NEXTAUTH_URL set to: $NEXTAUTH_URL"
fi

# Set NEXTAUTH_SECRET if not provided (required for NextAuth.js)
if [ -z "$NEXTAUTH_SECRET" ]; then
  if [ -z "$NEXTAUTH_SECRET_SEED" ]; then
    echo "Warning: NEXTAUTH_SECRET not set. Using a random value."
    export NEXTAUTH_SECRET=$(openssl rand -base64 32)
  else
    echo "Generating NEXTAUTH_SECRET from seed value."
    export NEXTAUTH_SECRET=$(echo $NEXTAUTH_SECRET_SEED | openssl dgst -sha256 -binary | openssl base64)
  fi
  echo "NEXTAUTH_SECRET has been set."
fi

echo "Google OAuth authentication configured"

# Generate and export PUBLIC_URL for Cloud Run
if [ -z "$PUBLIC_URL" ]; then
  export PUBLIC_URL=${K_SERVICE:+https://$K_SERVICE.$K_REGION-a.run.app}
  echo "PUBLIC_URL auto-detected as: $PUBLIC_URL"
fi

# Set WEBSOCKET_URL to point to the same host
if [ -z "$WEBSOCKET_URL" ]; then
  export WEBSOCKET_URL=$PUBLIC_URL
  echo "WEBSOCKET_URL set to: $WEBSOCKET_URL"
fi

# Log environment setup
echo "Starting services on port 8080..."
echo "WebSocket server will run on port 8081 internally"
echo "Next.js app will run on port 3000 internally"
echo "Nginx will proxy all requests on port 8080"

# Start all services using supervisord
exec /usr/bin/supervisord -c /etc/supervisord.conf