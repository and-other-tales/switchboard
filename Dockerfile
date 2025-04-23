FROM node:22-slim

WORKDIR /app

# Copy package files first for better caching
COPY webapp/package*.json ./webapp/
COPY websocket-server/package*.json ./websocket-server/

# Install dependencies
RUN cd /app/webapp && npm install
RUN cd /app/websocket-server && npm install

# Copy the rest of the application
COPY . .

# Make the start script executable
RUN chmod +x start.sh

# Expose the ports the apps run on (webapp - 8080, websocket - 8081)
EXPOSE 8080 8081

# Command to run the app - build and start will happen at runtime via start.sh
CMD ["/app/start.sh"]
