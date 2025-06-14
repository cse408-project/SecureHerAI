#!/bin/sh

# =========================================================
# SecureHerAI Certificate Manager
# - Manages OAuth keystores for consistent SHA-1 fingerprints
# - Extracts certificate fingerprints for Google OAuth2 setup
# =========================================================

# Create directory for storing certificate fingerprints
mkdir -p /app/cert-fingerprints

# =========================================================
# OAuth Keystore Management
# =========================================================

KEYSTORE_FILE="secureherai-oauth.keystore"
KEYSTORE_PATH="/app/$KEYSTORE_FILE"
KEYSTORE_PASSWORD=${OAUTH_KEYSTORE_PASSWORD:-secureherai123}
KEY_ALIAS="secureherai"
VALIDITY=3650
DNAME="CN=SecureHerAI, OU=Development, O=SecureHerAI, L=Dhaka, S=Dhaka, C=BD"

echo "==== SecureHerAI OAuth Keystore Setup ===="

# Generate keystore if it doesn't exist
if [ ! -f "$KEYSTORE_PATH" ]; then
  echo "Generating OAuth keystore for consistent SHA-1 fingerprint..."
  keytool -genkeypair \
    -keystore "$KEYSTORE_PATH" \
    -alias "$KEY_ALIAS" \
    -keyalg RSA \
    -keysize 2048 \
    -validity $VALIDITY \
    -storepass "$KEYSTORE_PASSWORD" \
    -keypass "$KEYSTORE_PASSWORD" \
    -dname "$DNAME"
  echo "Keystore created successfully!"
else
  echo "Using existing OAuth keystore."
fi

# Extract and save OAuth fingerprint
keytool -list -v -keystore "$KEYSTORE_PATH" -alias "$KEY_ALIAS" -storepass "$KEYSTORE_PASSWORD" | grep -A 1 "Certificate fingerprints" > /app/cert-fingerprints/oauth-fingerprint.txt

# =========================================================
# System Certificate Fingerprinting
# =========================================================

echo "Getting system certificate fingerprints..."
openssl x509 -in /etc/ssl/certs/ca-certificates.crt -noout -fingerprint -sha1 > /app/cert-fingerprints/ca-cert-fingerprint.txt

# Save host info
hostname > /app/cert-fingerprints/hostname.txt
ip addr show | grep "inet " > /app/cert-fingerprints/network.txt

# =========================================================
# Display Results
# =========================================================

echo ""
echo "********************************************"
echo "GOOGLE OAUTH2 SHA-1 FINGERPRINT:"
echo "COPY THIS TO GOOGLE CLOUD CONSOLE:"
grep "SHA1" /app/cert-fingerprints/oauth-fingerprint.txt
echo "********************************************"
echo ""
echo "Additional Certificate Information:"
echo "System CA Certificate SHA-1 (for reference only):"
cat /app/cert-fingerprints/ca-cert-fingerprint.txt
echo ""
echo "Certificate setup complete!"
echo ""

# Continue with original command
exec "$@"
