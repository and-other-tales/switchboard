#!/bin/sh
set -e

# Create .htpasswd file for basic authentication
# Use environment variables for username and password
if [ -z "$AUTH_USERNAME" ] || [ -z "$AUTH_PASSWORD" ]; then
  echo "Warning: AUTH_USERNAME or AUTH_PASSWORD not set. Using default credentials."
  AUTH_USERNAME=${AUTH_USERNAME:-admin}
  AUTH_PASSWORD=${AUTH_PASSWORD:-password}
fi

# Create htpasswd file from environment variables
htpasswd -bc /etc/nginx/.htpasswd "$AUTH_USERNAME" "$AUTH_PASSWORD"
echo "Basic authentication configured for user: $AUTH_USERNAME"

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