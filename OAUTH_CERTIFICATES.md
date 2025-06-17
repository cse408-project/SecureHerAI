# SecureHerAI OAuth Certificate Setup

## Quick Summary

For Google OAuth2 setup in SecureHerAI, you need different SHA-1 certificates for different components:

### 🏠 Development Environment (Your PC)

**For Mobile App (Expo/React Native):**

- **SHA-1:** `96:D7:FD:C2:E6:7D:CA:EA:B0:36:92:C1:C1:9A:F8:83:55:F9:AE:05`
- **Source:** Local Android debug keystore (`~/.android/debug.keystore`)
- **Use in:** Google Cloud Console > Android OAuth Client

**For Backend API (Spring Boot):**

- **No certificate needed** for OAuth (runs on HTTP localhost)
- **Backend** handles OAuth callbacks and JWT generation

### 💻 Other Developer PCs

- Each developer will have their **own SHA-1** from their local debug keystore
- Run `./get-mobile-sha1.sh` to get their specific SHA-1
- Add each developer's SHA-1 to Google Cloud Console

### 🚀 Production Deployment

- **Generate production signing certificate** for your app
- **Extract SHA-1** from production certificate
- **Add production SHA-1** to Google Cloud Console
- **Sign final APK/Bundle** with production certificate

## Quick Commands

### Get Mobile App SHA-1 (Development):

```bash
# From the project root directory
./get-mobile-sha1.sh
```

### Google Cloud Console Setup:

1. Go to: https://console.cloud.google.com/apis/credentials
2. Create OAuth Client ID > Android
3. Package: `com.secureherai.app`
4. SHA-1: `96:D7:FD:C2:E6:7D:CA:EA:B0:36:92:C1:C1:9A:F8:83:55:F9:AE:05`

### Web OAuth Redirect URI:

```
http://localhost:8080/login/oauth2/code/google
```

## Files Cleaned Up ✅

Removed unnecessary backend certificate files:

- `cert-manager.sh` - Not needed for OAuth
- `fingerprint-util.sh` - Not needed for OAuth
- `secureherai-oauth.keystore` - Not needed for OAuth
- `CERTIFICATE_FINGERPRINTS.md` - Not needed for OAuth

The OAuth flow works with HTTP localhost and doesn't require backend SSL certificates.
