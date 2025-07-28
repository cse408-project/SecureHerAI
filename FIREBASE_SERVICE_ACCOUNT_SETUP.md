# 🔥 Firebase Service Account Setup for Web Push Notifications

## 🚨 Critical Update: Legacy API Shutdown

**The Firebase Legacy FCM API has been shut down since July 22, 2024.** We must use the HTTP v1 API for all push notifications. This requires a service account, even for web applications.

## 🎯 Why Service Account for Web?

While web applications traditionally used server keys, the **HTTP v1 API requires OAuth2 authentication** for enhanced security. The service account provides:
- ✅ **Short-lived access tokens** (expires in 1 hour)
- ✅ **Enhanced security** compared to static server keys
- ✅ **Future-proof** implementation
- ✅ **Required for continued service** after legacy shutdown

## 🔧 Setup Instructions

### 1. Generate Service Account Key

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **`herai-f6be1`**
3. Go to **Project Settings** → **Service Accounts**
4. Click **"Generate new private key"**
5. Download the JSON file

### 2. Configure Environment Variables

Add these to your `.env` file:

```bash
# Firebase Project ID (from your project)
FIREBASE_PROJECT_ID=herai-f6be1

# Firebase Service Account Key (entire JSON as single line string)
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"herai-f6be1","private_key_id":"your-key-id","private_key":"-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY\n-----END PRIVATE KEY-----\n","client_email":"firebase-adminsdk-xxxxx@herai-f6be1.iam.gserviceaccount.com","client_id":"your-client-id","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-xxxxx%40herai-f6be1.iam.gserviceaccount.com"}
```

### 3. Service Account Key Format

⚠️ **Important**: The service account key must be:
- The **entire JSON content** as a **single line string**
- **All quotes escaped** properly for environment variables
- **No line breaks** in the private key section

Example format:
```json
{
  "type": "service_account",
  "project_id": "herai-f6be1",
  "private_key_id": "abc123...",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhki...\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-xxxxx@herai-f6be1.iam.gserviceaccount.com",
  "client_id": "123456789...",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-xxxxx%40herai-f6be1.iam.gserviceaccount.com"
}
```

## 🔄 How It Works (HTTP v1 API)

### 1. OAuth2 Authentication
```java
// Backend generates short-lived access token
GoogleCredentials credentials = GoogleCredentials
    .fromStream(new ByteArrayInputStream(serviceAccountKey.getBytes()))
    .createScoped("https://www.googleapis.com/auth/firebase.messaging");
String accessToken = credentials.getAccessToken().getTokenValue();
```

### 2. HTTP v1 API Request
```http
POST https://fcm.googleapis.com/v1/projects/herai-f6be1/messages:send
Authorization: Bearer ya29.c.El...(access_token)
Content-Type: application/json

{
  "message": {
    "token": "FCM_TOKEN",
    "notification": {
      "title": "🚨 EMERGENCY ALERT",
      "body": "Emergency assistance needed"
    },
    "data": {
      "alertId": "123",
      "type": "SOS_ALERT"
    },
    "webpush": {
      "notification": {
        "requireInteraction": true,
        "actions": [
          {"action": "accept", "title": "Accept Alert"}
        ]
      }
    }
  }
}
```

### 3. Benefits Over Legacy API
- ✅ **Secure**: Access tokens expire automatically
- ✅ **Compliant**: Works after legacy shutdown
- ✅ **Modern**: OAuth2 industry standard
- ✅ **Feature-rich**: Supports latest FCM features

## 📋 Configuration Checklist

| Step | Status | Description |
|------|--------|-------------|
| 1. Firebase Project | ✅ `herai-f6be1` | Project exists |
| 2. Service Account | ⚠️ Need to create | Generate private key |
| 3. Environment Vars | ⚠️ Need to add | Add to `.env` file |
| 4. Frontend VAPID | ✅ Configured | Already working |
| 5. Backend API | ✅ Updated | HTTP v1 implementation |

## 🎉 Ready to Test

Once you've added the service account key to your `.env` file:

1. **Start backend**: `./mvnw spring-boot:run`
2. **Start frontend**: `npm run web`
3. **Test SOS alert**: Trigger emergency to send push notifications

The system now uses the modern, secure FCM HTTP v1 API that will continue working indefinitely! 🚀
