#!/bin/sh

# This script runs inside the Docker container during build to:
# 1. Generate the OAuth keystore if needed
# 2. Ensure it's in the right location for the application

# Set variables
KEYSTORE_FILE="secureherai-oauth.keystore"
KEYSTORE_PASSWORD=${OAUTH_KEYSTORE_PASSWORD:-secureherai123}
KEY_ALIAS="secureherai"
VALIDITY=3650 # 10 years
DNAME="CN=SecureHerAI, OU=Development, O=SecureHerAI, L=Dhaka, S=Dhaka, C=BD"

# Check if Java keytool is available
if ! command -v keytool >/dev/null 2>&1; then
  echo "Error: keytool not found. This container needs Java to generate the keystore."
  exit 1
fi

# Check if keystore exists in the mounted volume
if [ -f "/app/$KEYSTORE_FILE" ]; then
  echo "OAuth keystore found in mounted volume. Using existing keystore."
else
  # Check if we have a pre-generated keystore
  if [ -f "/usr/local/share/$KEYSTORE_FILE" ]; then
    echo "Using pre-generated OAuth keystore."
    cp "/usr/local/share/$KEYSTORE_FILE" "/app/$KEYSTORE_FILE"
  else
    echo "Generating new OAuth keystore..."
    keytool -genkeypair \
      -keystore "/app/$KEYSTORE_FILE" \
      -alias "$KEY_ALIAS" \
      -keyalg RSA \
      -keysize 2048 \
      -validity $VALIDITY \
      -storepass "$KEYSTORE_PASSWORD" \
      -keypass "$KEYSTORE_PASSWORD" \
      -dname "$DNAME"
    echo "Keystore created successfully!"
  fi
fi

# Display the SHA-1 fingerprint
echo "SHA-1 fingerprint for Google OAuth2 (use this in Google Developer Console):"
keytool -list -v -keystore "/app/$KEYSTORE_FILE" -alias "$KEY_ALIAS" -storepass "$KEYSTORE_PASSWORD" | grep -A 1 "Certificate fingerprints" | grep SHA1
