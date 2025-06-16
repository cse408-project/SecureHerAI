#!/bin/bash

# =========================================================
# SecureHerAI Mobile App SHA-1 Fingerprint Extractor
# Gets the correct SHA-1 for Google OAuth2 setup (Android)
# =========================================================

echo "SecureHerAI Mobile App Certificate Fingerprint Utility"
echo "======================================================="
echo ""

# Check if we're in the app directory
if [ ! -f "app.json" ]; then
    echo "❌ Error: app.json not found. Please run this script from the secureherai-app directory."
    exit 1
fi

echo "📱 Getting SHA-1 fingerprint for Android OAuth setup..."
echo ""

# Method 1: Try Expo managed workflow
echo "🔍 Method 1: Trying Expo managed workflow..."
if command -v npx >/dev/null 2>&1; then
    echo "Running: npx expo fetch:android:hashes"
    if npx expo fetch:android:hashes 2>/dev/null; then
        echo ""
        echo "✅ Use the SHA-1 fingerprint shown above in Google Cloud Console"
        echo ""
    else
        echo "⚠️  Expo managed hashes not available. Trying local debug keystore..."
        echo ""
        
        # Method 2: Local Android debug keystore
        echo "🔍 Method 2: Checking local Android debug keystore..."
        
        # Check common debug keystore locations
        KEYSTORE_LOCATIONS=(
            "$HOME/.android/debug.keystore"
            "$ANDROID_HOME/debug.keystore"
            "$HOME/Android/Sdk/debug.keystore"
        )
        
        KEYSTORE_FOUND=false
        
        for keystore in "${KEYSTORE_LOCATIONS[@]}"; do
            if [ -f "$keystore" ]; then
                echo "📍 Found debug keystore at: $keystore"
                echo ""
                echo "🔐 SHA-1 Fingerprint for Google Cloud Console:"
                echo "=============================================="
                
                # Extract SHA-1 fingerprint
                if command -v keytool >/dev/null 2>&1; then
                    keytool -list -v -keystore "$keystore" -alias androiddebugkey -storepass android -keypass android 2>/dev/null | grep -i "sha1:" | head -1
                    echo "=============================================="
                    echo ""
                    echo "✅ Copy the SHA-1 fingerprint above to Google Cloud Console"
                    echo "   Go to: APIs & Services > Credentials > Create OAuth Client (Android)"
                    echo ""
                    KEYSTORE_FOUND=true
                    break
                else
                    echo "❌ keytool not found. Please install Java Development Kit (JDK)"
                    exit 1
                fi
            fi
        done
        
        if [ "$KEYSTORE_FOUND" = false ]; then
            echo "❌ No Android debug keystore found."
            echo ""
            echo "🔧 To generate a debug keystore:"
            echo "   keytool -genkey -v -keystore ~/.android/debug.keystore -storepass android -alias androiddebugkey -keypass android -keyalg RSA -keysize 2048 -validity 10000"
            echo ""
        fi
    fi
else
    echo "❌ npx not found. Please install Node.js and npm"
    exit 1
fi

echo ""
echo "📋 Summary for different environments:"
echo "======================================"
echo "🏠 Development (your PC): Use the SHA-1 shown above"
echo "💻 Other developer PCs: Each will have their own SHA-1 from their debug keystore"
echo "🚀 Production: Use SHA-1 from your production signing certificate"
echo ""
echo "📖 For production deployment:"
echo "   1. Generate a production signing certificate"
echo "   2. Extract its SHA-1 fingerprint"
echo "   3. Add it to Google Cloud Console"
echo "   4. Sign your APK/Bundle with the production certificate"
echo ""
