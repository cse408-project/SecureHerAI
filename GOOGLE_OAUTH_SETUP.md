# Google OAuth Setup Guide for SecureHerAI

This guide provides step-by-step instructions for setting up Google OAuth authentication for both web and mobile versions of the SecureHerAI application.

## Table of Contents

- [Prerequisites](#prerequisites)
- [OAuth Flow Overview](#oauth-flow-overview)
- [Google Cloud Console Setup](#google-cloud-console-setup)
  - [Creating a Project](#creating-a-project)
  - [Configuring OAuth Consent Screen](#configuring-oauth-consent-screen)
  - [Setting Up Web Application Client](#setting-up-web-application-client)
  - [Setting Up Mobile Application Clients](#setting-up-mobile-application-clients)
- [Backend Configuration (Spring Boot)](#backend-configuration-spring-boot)
- [Frontend Configuration](#frontend-configuration)
  - [Web Application](#web-application)
  - [Mobile Application (Expo/React Native)](#mobile-application-exporeact-native)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)

## Prerequisites

Before starting, ensure you have:

- A Google account with access to Google Cloud Console
- Access to the SecureHerAI project codebase
- Java/Spring Boot development environment for backend changes
- JavaScript/React Native/Expo development environment for frontend changes

## OAuth Flow Overview

Understanding the OAuth flow is crucial for proper configuration. The SecureHerAI app supports both **web** and **mobile** OAuth flows:

### Web OAuth Flow (React/Browser)

#### Step 1: User Initiates OAuth (Frontend)

- **Where**: React app at `http://localhost:8081`
- **What**: User clicks "Sign in with Google" button
- **Redirects to**: Backend OAuth endpoint `http://localhost:8080/oauth2/authorize/google`

#### Step 2: Backend Redirects to Google (Backend → Google)

- **Where**: Spring Boot backend at `http://localhost:8080`
- **What**: Backend creates OAuth authorization request
- **Redirects to**: `https://accounts.google.com/o/oauth2/v2/auth?...`

#### Step 3: User Authenticates (Google)

- **Where**: Google's authentication servers
- **What**: User enters credentials and grants permissions
- **Redirects to**: **CRITICAL** → `http://localhost:8080/login/oauth2/code/google`

#### Step 4: Google Sends Authorization Code (Google → Backend)

- **Where**: Backend receives callback from Google
- **What**: Google sends authorization code to backend
- **Backend processes**: Exchanges code for access token, creates JWT

#### Step 5: Backend Redirects User (Backend → Frontend)

- **Where**: Backend redirects authenticated user via `OAuth2SuccessHandler`
- **What**: User is sent back to frontend with success token
- **Redirects to**: `http://localhost:8081/dashboard?token=JWT_TOKEN`

### Mobile OAuth Flow (React Native/Expo)

#### Step 1: Mobile App Initiates OAuth

- **Where**: React Native app (Expo)
- **What**: User clicks "Sign in with Google" button
- **Opens**: WebBrowser with backend OAuth endpoint

#### Step 2-4: Same as Web Flow

- Same authentication process through Google servers
- Same backend processing and JWT creation

#### Step 5: Backend Redirects to Mobile App

- **Where**: Backend `OAuth2SuccessHandler` detects mobile User-Agent
- **What**: Redirects to mobile deep link endpoint
- **Redirects to**: `secureheraiapp://auth?token=JWT_TOKEN`
- **Result**: Mobile app receives token via deep link and authenticates user

### Key Points:

- **Google ALWAYS sends the authorization code to your backend** (port 8080)
- **Backend handles all secure token exchanges** and JWT creation
- **Frontend/Mobile never directly receives sensitive OAuth tokens**
- **Web users end up on** `http://localhost:8081/dashboard?token=...`
- **Mobile users return to app via** `secureheraiapp://auth?token=...` deep link
- **The redirect URI in Google Console must point to the backend**: `http://localhost:8080/login/oauth2/code/google`

## Google Cloud Console Setup

### Creating a Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click on the project dropdown at the top of the page
3. Click "New Project"
4. Enter "SecureHerAI" as the project name
5. Choose an organization (if applicable) and click "Create"
6. Wait for the project to be created and switch to it

### Configuring OAuth Consent Screen

1. In the Google Cloud Console, navigate to "APIs & Services" > "OAuth consent screen"
2. Select "External" for the user type (unless you have a Google Workspace organization)
3. Click "Create"
4. Fill in the required information:
   - App name: SecureHerAI
   - User support email: [your-email]
   - App logo: Upload your app logo (optional but recommended)
   - Developer contact information: [your-email]
5. Click "Save and Continue"
6. Add the following scopes:
   - `./auth/userinfo.email`
   - `./auth/userinfo.profile`
   - `openid`
7. Click "Save and Continue"
8. Add test users (if in testing mode)
9. Click "Save and Continue" to complete the setup
10. Review your configuration and click "Back to Dashboard"

### Setting Up Web Application Client

1. In the Google Cloud Console, navigate to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth client ID"
3. Select "Web application" as the application type
4. Name: "SecureHerAI Web Client"
5. Add authorized JavaScript origins:
   - `http://localhost:8080` (your backend server)
   - `https://YOUR_PRODUCTION_BACKEND_DOMAIN` (for production)
6. Add authorized redirect URIs (CRITICAL - this is where Google sends the authorization code):

   - `http://localhost:8080/login/oauth2/code/google` (LOCAL DEVELOPMENT - your backend)
   - `https://YOUR_PRODUCTION_BACKEND_DOMAIN/login/oauth2/code/google` (PRODUCTION)

   **Important**:

   - Do NOT add `http://localhost:8081/*` URIs here
   - The redirect URI must point to your BACKEND (port 8080), not frontend (port 8081)
   - Use the **Spring Security OAuth2 default callback path**: `/login/oauth2/code/google`
   - Google sends the authorization code to your backend, which processes it securely

7. Click "Create"
8. Note your Client ID and Client Secret (we'll need these for the Spring Boot configuration)

### Setting Up Mobile Application Clients

#### Android Setup

1. In the Google Cloud Console, navigate to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth client ID"
3. Select "Android" as the application type
4. Name: "SecureHerAI Android Client"
5. Package name: `com.secureherai.app` (or your actual package name from app.json)
6. Generate SHA-1 certificate fingerprint:

   ```bash
   # For debug keystore
   keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android

   # If you're using Expo managed workflow
   expo fetch:android:hashes
   ```

7. Enter the SHA-1 fingerprint into the form
8. Click "Create"

#### iOS Setup

1. In the Google Cloud Console, navigate to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth client ID"
3. Select "iOS" as the application type
4. Name: "SecureHerAI iOS Client"
5. Bundle ID: `com.secureherai.app` (or your actual bundle ID from app.json)
6. Click "Create"

## Backend Configuration (Spring Boot)

Update your `.env` file and `application.properties` with the correct OAuth configuration:

### Backend .env file:

```properties
# Email Configuration
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD="your-app-password"

# API Configuration
EXPO_APP_URL=http://localhost:8081
EXPO_PUBLIC_API_BASE_URL=http://localhost:8080/api

# OAuth2 Configuration
OAUTH2_WEB_ORIGIN=http://localhost:8081
OAUTH2_WEB_REDIRECT_URI=http://localhost:8080/login/oauth2/code/google

# Google OAuth Credentials
OAUTH2_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID
OAUTH2_CLIENT_SECRET=YOUR_GOOGLE_CLIENT_SECRET
```

### application.properties:

```properties
# OAuth2 Configuration
spring.security.oauth2.client.registration.google.client-id=${OAUTH2_CLIENT_ID}
spring.security.oauth2.client.registration.google.client-secret=${OAUTH2_CLIENT_SECRET}
spring.security.oauth2.client.registration.google.scope=email,profile
spring.security.oauth2.client.registration.google.redirect-uri=${OAUTH2_REDIRECT_URI:http://localhost:8080/login/oauth2/code/google}
spring.security.oauth2.client.provider.google.authorization-uri=https://accounts.google.com/o/oauth2/v2/auth
spring.security.oauth2.client.provider.google.token-uri=https://oauth2.googleapis.com/token
spring.security.oauth2.client.provider.google.user-info-uri=https://www.googleapis.com/oauth2/v3/userinfo
spring.security.oauth2.client.provider.google.user-name-attribute=email

# Frontend URL for redirects after OAuth success
app.frontend.url=${OAUTH2_WEB_ORIGIN:http://localhost:8081}

# Mobile app deep linking scheme
app.mobile.redirect.scheme=${MOBILE_SCHEME:secureheraiapp}
```

### Key Configuration Points:

- `OAUTH2_WEB_REDIRECT_URI` must match Google Console redirect URI exactly
- `app.frontend.url` is where **web users** are sent after successful OAuth
- `app.mobile.redirect.scheme` is the deep link scheme for **mobile users**
- Backend (8080) handles OAuth, Frontend (8081) shows UI
- **Use Spring Security's default OAuth2 callback path**: `/login/oauth2/code/google`

## Frontend Configuration

### Web Application

Your frontend `.env` file should contain:

```properties
# Frontend Configuration
EXPO_APP_URL=http://localhost:8081
EXPO_METRO_URL=exp://192.168.0.103:8081
EXPO_PUBLIC_API_BASE_URL=http://localhost:8080/api

# OAuth Configuration (tells frontend where to send OAuth requests)
OAUTH2_WEB_ORIGIN=http://localhost:8081
OAUTH2_WEB_REDIRECT_URI=http://localhost:8080/login/oauth2/code/google

# Google Credentials (for frontend OAuth button)
OAUTH2_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID
OAUTH2_CLIENT_SECRET=YOUR_GOOGLE_CLIENT_SECRET
```

### Important Notes for Frontend:

- Frontend (8081) sends users to backend (8080) for OAuth
- Frontend never directly handles OAuth callbacks
- Frontend receives authenticated users after backend processes OAuth
- `OAUTH2_WEB_REDIRECT_URI` tells frontend where Google will send the code (to backend)
- **Web users** are redirected to: `http://localhost:8081/dashboard?token=...`
- **Mobile users** are redirected via deep link: `secureheraiapp://auth?token=...`

### Mobile Application (Expo/React Native)

1. Make sure you have the necessary packages installed:

   ```bash
   npx expo install expo-auth-session expo-web-browser expo-linking
   ```

2. Update your `app.json` to include the scheme for deep linking:

   ```json
   {
     "expo": {
       "scheme": "secureheraiapp",
       "android": {
         "package": "com.secureherai.app"
       },
       "ios": {
         "bundleIdentifier": "com.secureherai.app"
       },
       "linking": {
         "prefixes": ["secureheraiapp://", "secureherai://"]
       }
     }
   }
   ```

3. Configure the `GoogleOAuthScreen.tsx` component to use the appropriate client IDs:

   ```typescript
   const androidClientId = "YOUR_ANDROID_CLIENT_ID";
   const iosClientId = "YOUR_IOS_CLIENT_ID";
   const webClientId = "YOUR_WEB_CLIENT_ID";
   ```

4. Ensure your backend `OAuth2SuccessHandler.java` correctly handles both web and mobile redirects:
   - **Web redirects**: Uses `MobileAuthController.handleWebRedirect()` → `http://localhost:8081/dashboard?token=...`
   - **Mobile redirects**: Uses `MobileAuthController.handleMobileRedirect()` → `secureheraiapp://auth?token=...`
   - The handler detects User-Agent to determine platform automatically

## Testing

### Implementation Architecture

The OAuth flow is implemented using several key components:

#### Backend Components:

- **`OAuth2SuccessHandler.java`**: Handles successful OAuth authentication, creates JWT tokens, and determines whether to redirect to web or mobile
- **`OAuthService.java`**: Processes OAuth2 user data, creates/updates users in database
- **`MobileAuthController.java`**: Provides endpoints for mobile and web OAuth redirects
- **`GoogleAuthController.java`**: Provides OAuth initialization endpoints
- **`SecurityConfig.java`**: Configures Spring Security OAuth2 integration

#### Frontend Components:

- **`GoogleOAuthScreen.tsx`**: Mobile OAuth interface that opens WebBrowser for authentication
- **`api.ts`**: Contains `getGoogleOAuthUrl()` method to initiate OAuth from frontend
- **`verify-login.tsx`**: Handles post-authentication verification and token processing

#### Key Endpoints:

- `GET /api/auth/google/login` - Returns OAuth URL for frontend to initiate flow
- `GET /oauth2/authorize/google` - Spring Security OAuth2 initiation endpoint
- `GET /login/oauth2/code/google` - Spring Security OAuth2 callback (Google redirects here)
- `GET /api/auth/mobile/web-redirect?token=...` - Web OAuth success redirect
- `GET /api/auth/mobile/oauth-success?token=...` - Mobile OAuth success redirect

### Testing Web OAuth Flow

1. **Start your Spring Boot backend server** (port 8080)
2. **Start your web application frontend** (port 8081)
3. **Navigate to the login page** at `http://localhost:8081`
4. **Click "Sign in with Google"**
   - This redirects you to `http://localhost:8080/oauth2/authorize/google`
   - Backend redirects you to Google authentication
5. **Complete Google authentication**
   - Google redirects to `http://localhost:8080/oauth2/callback/google`
   - Backend processes the authorization code
   - Backend creates JWT token and redirects you back to frontend
6. **Verify you're authenticated** and properly redirected to dashboard

### Expected OAuth URL Flow:

```
WEB FLOW:
http://localhost:8081 (your app)
        ↓ (click Google sign-in)
http://localhost:8080/oauth2/authorize/google (backend)
        ↓ (redirect to Google)
https://accounts.google.com/o/oauth2/v2/auth?... (Google)
        ↓ (user authenticates)
http://localhost:8080/login/oauth2/code/google (backend receives code)
        ↓ (backend processes, creates JWT)
http://localhost:8081/dashboard?token=... (back to frontend)

MOBILE FLOW:
Mobile App → WebBrowser
        ↓ (opens OAuth URL)
http://localhost:8080/oauth2/authorize/google (backend)
        ↓ (redirect to Google)
https://accounts.google.com/o/oauth2/v2/auth?... (Google)
        ↓ (user authenticates)
http://localhost:8080/login/oauth2/code/google (backend receives code)
        ↓ (backend processes, creates JWT)
secureheraiapp://auth?token=... (deep link back to mobile app)
```

### Testing with Simple HTML Page

If you want to test OAuth on a single page:

```html
<!DOCTYPE html>
<html>
  <head>
    <title>SecureHerAI OAuth Test</title>
  </head>
  <body>
    <h1>SecureHerAI Google OAuth Test</h1>
    <button onclick="signInWithGoogle()">Sign in with Google</button>
    <div id="result"></div>

    <script>
      function signInWithGoogle() {
        // Redirect to backend OAuth endpoint
        window.location.href = "http://localhost:8080/oauth2/authorize/google";
      }

      // Check for OAuth success when page loads
      window.onload = function () {
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get("token");

        if (token) {
          document.getElementById("result").innerHTML =
            "<h2>✅ OAuth Success!</h2><p>Token: " + token + "</p>";
        }
      };
    </script>
  </body>
</html>
```

Save as `oauth-test.html` and serve using:

```bash
python -m http.server 9000
```

Access at `http://localhost:9000/oauth-test.html`

### Testing Mobile OAuth Flow

1. Start your Spring Boot backend server
2. Start your Expo application
3. Navigate to the login page
4. Click on "Sign in with Google"
5. Complete the Google authentication flow in the opened browser
6. Verify the app is reopened via deep link and you're properly authenticated

### Testing Deep Links (Mobile Only)

You can test deep linking functionality using:

```bash
# For Android
adb shell am start -W -a android.intent.action.VIEW -d "secureheraiapp://auth?token=EXAMPLE_TOKEN" com.secureherai.app

# For iOS (requires Expo Go or standalone app to be installed)
xcrun simctl openurl booted "secureheraiapp://auth?token=EXAMPLE_TOKEN"

# Test mobile OAuth success endpoint directly
curl "http://localhost:8080/api/auth/mobile/test-redirect"
```

### Debugging OAuth Issues

#### Check Backend Logs

```bash
# If using Docker
docker logs secureherai_api

# If running locally
tail -f logs/application.log
```

#### Test OAuth Endpoints

```bash
# Test OAuth initiation endpoint
curl -v http://localhost:8080/oauth2/authorize/google

# Test mobile redirect endpoint
curl -v "http://localhost:8080/api/auth/mobile/oauth-success?token=test_token"

# Test web redirect endpoint
curl -v "http://localhost:8080/api/auth/mobile/web-redirect?token=test_token"
```

## Troubleshooting

### Common Issues

1. **Redirect URI Mismatch**:

   - Ensure Google Console redirect URI is exactly: `http://localhost:8080/login/oauth2/code/google`
   - Do NOT use `/oauth2/callback/google` - this is the old custom path
   - Use Spring Security's default OAuth2 callback path

2. **Invalid Client ID**: Double-check that you're using the correct client ID for each platform.

3. **Mobile Deep Linking Issues**:

   - Verify your app's scheme in `app.json` is `secureheraiapp`
   - Check that `MobileAuthController` uses the correct scheme: `${app.mobile.redirect.scheme}`
   - Test deep links manually using `adb` commands

4. **OAuth Flow Breaks on Mobile**:

   - Ensure `expo-web-browser` is properly configured
   - Check that `WebBrowser.maybeCompleteAuthSession()` is called
   - Verify deep link prefixes in `app.json` include `secureheraiapp://`

5. **Backend Not Detecting Mobile vs Web**:

   - `OAuth2SuccessHandler` uses User-Agent detection
   - Add `?platform=mobile` parameter to OAuth URL for explicit mobile detection
   - Check backend logs for User-Agent strings

6. **CORS Errors**: Ensure your backend properly handles CORS for the OAuth flows.

7. **Missing Scopes**: Verify that you've requested and been approved for the necessary OAuth scopes.

8. **Certificate Fingerprint Issues**: For Android, ensure the SHA-1 fingerprint matches the one used in Google Cloud Console.

9. **Environment Variable Issues**:

   - Verify `OAUTH2_CLIENT_ID` and `OAUTH2_CLIENT_SECRET` are set correctly
   - Check that `OAUTH2_REDIRECT_URI` points to the correct callback path
   - Ensure `app.frontend.url` and `app.mobile.redirect.scheme` are configured

10. **Spring Security Configuration**:
    - Verify that `SecurityConfig.java` properly configures OAuth2 login
    - Check that `OAuth2SuccessHandler` is registered with Spring Security
    - Ensure the OAuth2 registration is configured correctly in `application.properties`

For additional help, refer to:

- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Spring Security OAuth 2.0 Documentation](https://docs.spring.io/spring-security/reference/servlet/oauth2/index.html)
- [Expo Authentication Documentation](https://docs.expo.dev/guides/authentication/)

## Quick Setup Summary

### For Google Cloud Console:

1. Create project "SecureHerAI"
2. Configure OAuth consent screen
3. Create Web Application OAuth client
4. Set redirect URI to: `http://localhost:8080/login/oauth2/code/google`
5. Note Client ID and Client Secret

### For Backend Configuration:

1. Set environment variables: `OAUTH2_CLIENT_ID`, `OAUTH2_CLIENT_SECRET`
2. Configure `application.properties` with Google OAuth settings
3. Ensure `OAuth2SuccessHandler` and `MobileAuthController` are properly configured

### For Frontend Configuration:

1. Set `EXPO_PUBLIC_API_BASE_URL=http://localhost:8080/api`
2. Configure `app.json` with scheme `secureheraiapp`
3. Install required packages: `expo-web-browser`, `expo-linking`

### Testing:

1. Start backend on port 8080
2. Start frontend on port 8081
3. Test web OAuth flow in browser
4. Test mobile OAuth flow in Expo app
5. Verify deep linking works with `adb` commands

The OAuth flow should work seamlessly for both web and mobile platforms, with automatic platform detection and appropriate redirects.
