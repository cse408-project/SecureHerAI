#!/bin/sh

# Start Expo with proper configuration for Docker
echo "Starting Expo web server..."

# Ensure .expo directory exists and has proper permissions
mkdir -p /app/.expo
chmod -R 755 /app/.expo

# Set environment variables
export EXPO_DEVTOOLS_LISTEN_ADDRESS=0.0.0.0
export NODE_ENV=development
export EXPO_NO_DOTENV=1
export EXPO_NO_TELEMETRY=1
export EXPO_NO_UPDATE_CHECK=1
export CI=1

# Start Expo web server
exec npx expo start --web --port 19006 --host lan
