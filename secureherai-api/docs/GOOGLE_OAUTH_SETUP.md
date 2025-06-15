# Google OAuth2 Authentication for SecureHerAI

This document explains the implementation of Google OAuth2 authentication in the SecureHerAI application.

## Overview

The SecureHerAI application supports both traditional email/password authentication and Google OAuth2 authentication. When users choose to sign in with Google, they are redirected to the Google authentication page, and upon successful authentication, they are redirected back to the application with a JWT token.

## Implementation Details

### Configuration

The OAuth2 configuration is defined in `application.properties`:

```properties
spring.security.oauth2.client.registration.google.client-id=${OATH2_CLIENT_ID}
spring.security.oauth2.client.registration.google.client-secret=
spring.security.oauth2.client.registration.google.scope=email,profile
spring.security.oauth2.client.registration.google.redirect-uri={baseUrl}/oauth2/callback/google
```

### Authentication Flow

1. User initiates Google login by accessing the `/api/auth/google/login` endpoint.
2. The application redirects the user to the Google OAuth2 authorization page.
3. After successful authentication, Google redirects the user back to the `/oauth2/callback/google` endpoint.
4. The `OAuth2SuccessHandler` processes the authentication response:
   - Extracts user information from the OAuth2 attributes.
   - Checks if the user exists in the database.
   - If the user doesn't exist, creates a new user with information from Google.
   - Generates a JWT token for the authenticated user.
   - Redirects the user to the success page with the token.
5. The token can then be used for subsequent API requests.

### Mobile App Integration

For mobile app integration:

1. The mobile app should open a web browser or WebView with the Google OAuth URL.
2. After authentication, the browser will be redirected to the success page.
3. The mobile app should handle the custom URL scheme `secureherai://auth?token={token}`.
4. Upon receiving this URL, the app should extract the token and use it for API requests.

## Security Considerations

1. The OAuth2 client ID is stored in the environment variable `OATH2_CLIENT_ID`.
2. No client secret is required for mobile/public clients according to OAuth2 specifications.
3. JWT tokens have a configurable expiration time (default: 24 hours).
4. OAuth users do not have a password in the database, enhancing security.

## Testing

Test endpoints for OAuth2 authentication are available in the `auth_test.http` file.

## Implementation Classes

- `SecurityConfig.java`: Configures Spring Security with OAuth2 support.
- `OAuth2SuccessHandler.java`: Handles successful OAuth2 authentication.
- `OAuthService.java`: Processes OAuth2 user information.
- `GoogleAuthController.java`: Provides endpoints for Google OAuth2 authentication.
- `MobileAuthController.java`: Handles mobile app specific OAuth2 redirects.
