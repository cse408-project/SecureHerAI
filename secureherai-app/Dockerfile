# Stage 1: Build the web assets
FROM node:18-alpine AS builder

# Install global dependencies
RUN npm install -g @expo/cli@latest


WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build for web (Expo's web build outputs into web-build/)
RUN npm run build:web

# Stage 2: Development stage
FROM node:18-alpine AS development

# Install global dependencies and curl for health check
RUN apk add --no-cache curl && \
    npm install -g @expo/cli@latest

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies (including devDependencies for development)
RUN npm ci

# Copy the rest of the application
COPY . .

# Make startup script executable
RUN chmod +x start-expo.sh

# Create .expo directory with proper permissions
RUN mkdir -p /app/.expo && chmod 755 /app/.expo

# For development, we'll run as root to avoid permission issues
# In production, use a non-root user

# Expose ports
EXPOSE 19006
EXPOSE 19000
EXPOSE 19001
EXPOSE 19002

# Set environment variables
ENV EXPO_DEVTOOLS_LISTEN_ADDRESS=0.0.0.0
ENV NODE_ENV=development
ENV EXPO_NO_DOTENV=1

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:19006/ || exit 1

# Start the application (running as root for development)
CMD ["./start-expo.sh"]

# Stage 3: Production stage with Nginx
FROM nginx:alpine AS production

# Copy the built files from builder stage into Nginx's html directory
COPY --from=builder /app/web-build /usr/share/nginx/html

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Expose port 80 for HTTP traffic
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
