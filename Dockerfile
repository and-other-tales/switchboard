FROM node:22-slim

WORKDIR /app

# Copy all project files
COPY . .

# Copy the .next directory into the Docker image
COPY .next .next

# Make the start script executable
RUN chmod +x start.sh

# Expose the ports the apps run on
EXPOSE 8080 8081

# Command to run the app
CMD ["/app/start.sh"]
