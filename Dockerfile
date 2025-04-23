FROM node:22-slim

WORKDIR /app

# Copy all project files
COPY . .

# Make the start script executable
RUN chmod +x start.sh

# Expose the ports the apps run on
EXPOSE 8080 8081

# Command to run the app
CMD ["/app/start.sh"]