# Use Ubuntu 24.10 as the base image
FROM ubuntu:24.10 AS base

# Install Node.js 22 and Python 3.12
RUN apt-get update && apt-get install -y \
    curl \
    software-properties-common \
    && curl -fsSL https://deb.nodesource.com/setup_22.x | bash - \
    && apt-get install -y nodejs python3.12 python3.12-venv python3.12-distutils \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Copy package files for both services
COPY websocket-server/package*.json ./websocket-server/
COPY webapp/package*.json ./webapp/
# Install dependencies for both services
RUN cd websocket-server && npm ci
RUN cd webapp && npm install

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app

# Copy files from deps stage
COPY --from=deps /app/websocket-server/node_modules ./websocket-server/node_modules
COPY --from=deps /app/webapp/node_modules ./webapp/node_modules

# Copy source code
COPY websocket-server ./websocket-server
COPY webapp ./webapp

# Build websocket-server
RUN cd websocket-server && npm run build

# Build webapp
ENV NEXT_TELEMETRY_DISABLED=1
RUN cd webapp && npm run build

# Production image, copy all the files and run
FROM base AS runner
WORKDIR /app

# Install additional utilities
RUN apt-get update && apt-get install -y \
    nginx \
    supervisor \
    openssl \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Copy build artifacts
COPY --from=builder /app/websocket-server/dist ./websocket-server/dist
COPY --from=builder /app/websocket-server/src/twiml.xml ./websocket-server/dist/twiml.xml
COPY --from=builder /app/websocket-server/package.json ./websocket-server/

# Copy Next.js standalone build
COPY --from=builder /app/webapp/.next/standalone ./webapp
COPY --from=builder /app/webapp/.next/static ./webapp/.next/static
COPY --from=builder /app/webapp/public ./webapp/public

# Copy configuration files and startup scripts
COPY nginx.conf /etc/nginx/nginx.conf
COPY supervisord.conf /etc/supervisord.conf
COPY start.sh ./
RUN chmod +x start.sh

# Expose the standard port for Cloud Run
EXPOSE 8080

# Start the application
CMD ["./start.sh"]
