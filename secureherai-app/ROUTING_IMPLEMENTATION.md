# Routing Architecture in SecureHerAI App

The app now uses Expo Router's Protected routes feature to handle authentication flow smoothly.

## Current Structure

- `app/_layout.tsx`: Root layout with Protected routes for authenticated and unauthenticated states
- `app/(auth)/*`: Authentication-related screens (login, register, etc.)
- `app/(tabs)/*`: Main app screens accessible only when authenticated
- `app/index.tsx`: Entry point that redirects to the appropriate route based on auth state

## Flow

1. When the app starts, it shows a loading screen while checking authentication state
2. Based on auth state:
   - If authenticated → redirects to (tabs)
   - If not authenticated → redirects to (auth)
3. When logging in, authentication is handled by AuthContext, and Protected routes automatically redirect to tabs
4. When logging out, Protected routes automatically redirect to auth screens

This implementation ensures smooth transitions between authenticated and unauthenticated states without requiring page reloads.

## Key Implementation Details

- Used Stack.Protected with conditional guards based on authentication state
- Added redirects in group layouts to handle auth state changes while within a group
- Updated logout flow to work with Protected routes
