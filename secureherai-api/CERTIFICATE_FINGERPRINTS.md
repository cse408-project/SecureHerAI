# SHA-1 Certificate Fingerprints for Google OAuth2

This document explains the complete setup for automatic SHA-1 certificate fingerprint generation in SecureHerAI, specifically for Google OAuth2 integration.

> **IMPORTANT**: This setup ensures the same SHA-1 fingerprint is generated on any machine, solving the Google OAuth2 configuration problem.

## How It Works

The SecureHerAI Docker setup automatically handles certificate fingerprinting:

1. **Automatic OAuth Keystore Generation**:

   - Docker automatically generates a keystore with consistent parameters
   - The same SHA-1 fingerprint is produced on every machine
   - No manual steps required before building or running Docker

2. **Certificate Fingerprint Scripts**:

   - The container automatically runs certificate fingerprinting on startup
   - Both system certificates and the OAuth keystore are fingerprinted
   - Fingerprints are saved to a persistent volume and displayed in logs

3. **Helper Tools**:
   - `fingerprint-util.sh`: View all certificate fingerprints
   - Works whether the container is running or from saved data
   - Clearly identifies the OAuth SHA-1 fingerprint for Google Console

## Complete Setup Instructions

### 1. Build and Start Docker Container

```bash
cd secureherai-api
docker-compose -f docker-compose-dev.yml up -d
```

The OAuth SHA-1 fingerprint will be displayed in the startup logs.

### 2. Get the SHA-1 Fingerprint

**Method 1: From container logs**

```bash
docker logs secureherai_api | grep "GOOGLE OAUTH2 SHA-1 FINGERPRINT" -A 1
```

**Method 2: Using the utility script**

```bash
./fingerprint-util.sh
```

### 3. Google Cloud Console Setup

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to "APIs & Services" > "Credentials"
4. Create OAuth client ID credentials:
   - Application type: Android, Web application, or other as needed
   - Add your SHA-1 fingerprint when prompted
   - Add your package name for Android applications
5. Download the credentials JSON file

### 4. Add Credentials to Your Environment

Add the client ID and client secret to your `.env` file:

```
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
```

## Technical Details

### Keystore Configuration

- **File**: `secureherai-oauth.keystore`
- **Password**: `secureherai123` (configurable via `OAUTH_KEYSTORE_PASSWORD`)
- **Key alias**: `secureherai`
- **Validity**: 10 years
- **Algorithm**: RSA 2048-bit

### Certificate Parameters

The keystore is generated with these consistent parameters:

```
CN=SecureHerAI, OU=Development, O=SecureHerAI, L=Dhaka, S=Dhaka, C=BD
```

### Files Created

- `/app/cert-fingerprints/oauth-fingerprint.txt` - OAuth keystore fingerprints
- `/app/cert-fingerprints/ca-cert-fingerprint.txt` - System CA fingerprints
- `/app/cert-fingerprints/hostname.txt` - Host information
- `/app/cert-fingerprints/network.txt` - Network configuration

## Manual Certificate Verification

If you need to manually verify a certificate, use these commands:

1. **For a specific certificate file**:

   ```bash
   docker exec -it secureherai_api openssl x509 -in /path/to/certificate.crt -noout -fingerprint -sha1
   ```

2. **For a remote server's SSL certificate**:
   ```bash
   docker exec -it secureherai_api sh -c "echo | openssl s_client -connect example.com:443 2>/dev/null | openssl x509 -noout -fingerprint -sha1"
   ```

## Security Notes

- Certificate fingerprints are useful for verification but do not contain private key material
- The fingerprints are stored in a Docker volume but do not expose sensitive information
- The keystore password is included in the Docker environment variables
- For production, consider storing the keystore password more securely
- When moving the application to another PC, the same fingerprints will be automatically generated

## Understanding Different SHA-1 Fingerprints

You will see **two different SHA-1 fingerprints** in the output:

### 1. OAuth Keystore SHA-1 (Primary - Use This)

```
SHA1: FD:DC:F6:01:85:23:31:38:FE:6D:4B:CB:34:E9:1D:10:6A:26:E2:CC
```

- **Purpose**: Specifically for Google OAuth2 authentication
- **Source**: Your application's custom OAuth keystore
- **Usage**: Register this in Google Cloud Console
- **Consistency**: Same fingerprint across all machines

### 2. System CA Certificate SHA-1 (Reference Only)

```
sha1 Fingerprint=93:05:7A:88:15:C6:4F:CE:88:2F:FA:91:16:52:28:78:BC:53:64:17
```

- **Purpose**: System SSL/TLS certificate validation
- **Source**: Container's certificate authority bundle
- **Usage**: For reference only, not used for OAuth2
- **Variability**: May differ between container builds

> **Important**: Always use the **OAuth Keystore SHA-1** for Google Cloud Console setup.

## Architecture

The system uses a simplified architecture:

1. **`cert-manager.sh`** - Single script that runs inside the container to handle all certificate tasks
2. **`fingerprint-util.sh`** - User-facing utility to easily view fingerprints
3. **Docker volume** - Persists certificate fingerprints across container restarts

This approach eliminates complexity while ensuring consistent SHA-1 fingerprints across all environments.
