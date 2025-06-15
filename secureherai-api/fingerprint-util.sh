#!/bin/bash

# =========================================================
# SecureHerAI Fingerprint Utility
# - Shows certificate fingerprints from running container
# - Can extract fingerprints from volume if container is down
# - Highlights the OAuth SHA-1 fingerprint for Google Console
# =========================================================

echo "SecureHerAI Certificate Fingerprint Utility"
echo "------------------------------------------"

# Check if container is running
if docker ps | grep -q secureherai_api; then
    echo "Container is running. Viewing live fingerprints:"
    echo ""
    echo "GOOGLE OAUTH2 SHA-1 FINGERPRINT (FOR GOOGLE CONSOLE):"
    docker exec -it secureherai_api grep SHA1 /app/cert-fingerprints/oauth-fingerprint.txt
    echo ""
    echo "Would you like to see all certificate fingerprints? (y/n)"
    read -r response
    if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        echo ""
        echo "Additional Certificate Information:"
        echo "===================================="
        echo "System CA Certificate SHA-1 (for reference only):"
        docker exec -it secureherai_api cat /app/cert-fingerprints/ca-cert-fingerprint.txt
        
        if docker exec -it secureherai_api test -f /app/cert-fingerprints/keystore-fingerprint.txt; then
            echo ""
            echo "Application Keystore (if exists):"
            docker exec -it secureherai_api cat /app/cert-fingerprints/keystore-fingerprint.txt
        fi
        
        echo ""
        echo "Host Information:"
        docker exec -it secureherai_api cat /app/cert-fingerprints/hostname.txt
        docker exec -it secureherai_api cat /app/cert-fingerprints/network.txt
    fi
else
    echo "Container 'secureherai_api' is not running."
    echo "Attempting to read from persisted volume data..."
    echo ""
    
    # Create temporary container to access volume
    docker run --rm -v secureherai_cert_fingerprints:/data alpine:latest sh -c '
        if [ -f "/data/oauth-fingerprint.txt" ]; then
            echo "GOOGLE OAUTH2 SHA-1 FINGERPRINT (FOR GOOGLE CONSOLE):"
            grep SHA1 /data/oauth-fingerprint.txt
            echo ""
            echo "Additional stored certificate information:"
            echo "============================================="
            echo "System CA Certificate SHA-1 (for reference only):"
            if [ -f "/data/ca-cert-fingerprint.txt" ]; then
                cat /data/ca-cert-fingerprint.txt
            fi
            
            if [ -f "/data/keystore-fingerprint.txt" ]; then
                echo ""
                echo "Application Keystore (if exists):"
                cat /data/keystore-fingerprint.txt
            fi
        else
            echo "No fingerprint data found."
            echo "Start the secureherai_api container to generate fingerprints."
        fi
    '
fi

echo "------------------------------------------"
echo ""
echo "To use this SHA-1 fingerprint with Google OAuth2:"
echo "1. Go to the Google Cloud Console"
echo "2. Navigate to APIs & Services > Credentials"
echo "3. Create or edit your OAuth Client ID"
echo "4. Add this SHA-1 fingerprint when prompted"
echo ""
