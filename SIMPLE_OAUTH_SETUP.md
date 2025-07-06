# 🚀 Simple Google OAuth Setup Guide

## What You Have Now

✅ **Backend**: Your existing OAuth2 flow with email, openid, profile scopes
✅ **Frontend**: Simple Google Auth button that opens browser and shows temporary page
✅ **Temporary Page**: Shows user info (name, email, picture, token) after authentication

## How It Works

1. **User clicks "Continue with Google"** in your mobile app
2. **WebBrowser opens** your backend OAuth URL: `/oauth2/authorize/google`
3. **User authenticates** with Google in the browser
4. **Backend processes** the OAuth2 flow and gets user info
5. **Backend redirects** to temporary page: `/oauth-success.html?token=...&email=...&name=...&picture=...`
6. **Temporary page shows** all the OAuth information
7. **Page auto-redirects** back to your app after 10 seconds

## Setup Instructions

### 1. Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a project or select existing one
3. Go to **APIs & Services** → **OAuth consent screen**
   - Choose **External**
   - Fill in app name: "SecureHerAI"
   - Add your email
   - Add scopes: `openid`, `email`, `profile`
4. Go to **APIs & Services** → **Credentials**
   - Create **OAuth 2.0 Client ID**
   - Type: **Web application**
   - Name: "SecureHerAI Backend"
   - **Authorized redirect URIs**:
     ```
     http://localhost:8080/login/oauth2/code/google
     ```

### 2. Environment Configuration

**Backend** (`secureherai-api/.env`):

```bash
# Copy from .env.example and update these values:
OAUTH2_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
OAUTH2_CLIENT_SECRET=your_google_client_secret
```

**Mobile App** (`secureherai-app/.env`):

```bash
# Copy from .env.example - no Google credentials needed in mobile app
EXPO_PUBLIC_API_BASE_URL=http://localhost:8080/api
```

### 3. Test the Flow

1. **Start backend**:

   ```bash
   cd secureherai-api
   ./mvnw spring-boot:run
   ```

2. **Start mobile app**:

   ```bash
   cd secureherai-app
   npm start
   ```

3. **Test OAuth**:
   - Open mobile app
   - Navigate to Google OAuth screen
   - Click "Continue with Google"
   - Complete Google authentication
   - See temporary page with your info
   - Page will auto-redirect to app

## What You'll See

The temporary page will show:

- ✅ Success message
- 👤 Your name from Google
- 📧 Your email from Google
- 🖼️ Your profile picture from Google
- 🔑 JWT token from your backend
- ⏱️ 10-second countdown before auto-redirect

## Files Changed

- `secureherai-api/.env.example` - Updated with correct OAuth2 variables
- `secureherai-app/.env.example` - Simplified for OAuth web flow
- `secureherai-app/app/(auth)/GoogleOAuth.tsx` - Simple OAuth implementation
- `secureherai-api/.../OAuth2SuccessHandler.java` - Redirects to temporary page with user info
- `secureherai-api/.../oauth-success.html` - Shows OAuth info and auto-redirects

## Next Steps

1. Copy `.env.example` files to `.env` files
2. Update Google Cloud Console credentials in backend `.env`
3. Test the complete flow
4. The temporary page is perfect for development/testing OAuth

That's it! Simple email, openid, profile OAuth flow working with your existing backend! 🎉
