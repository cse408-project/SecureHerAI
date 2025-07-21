# Google Places API Setup for Emergency Services

## Overview

This implementation uses Google Places API to find nearby emergency services (hospitals, police stations, fire stations, pharmacies) instead of relying on backend APIs that don't exist.

## Setup Steps

### 1. Get Google Places API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the following APIs:
   - **Places API (New)** - for finding nearby places
   - **Maps JavaScript API** - if you're using Google Maps
4. Go to "Credentials" → "Create Credentials" → "API Key"
5. Copy your API key

### 2. Configure API Key in Your App

Add your API key to your environment variables:

**Option 1: .env file (recommended)**

```bash
EXPO_PUBLIC_GOOGLE_PLACES_API_KEY=YOUR_API_KEY_HERE
```

**Option 2: Direct replacement in googlePlacesService.ts**
Replace this line in `services/googlePlacesService.ts`:

```typescript
const GOOGLE_PLACES_API_KEY =
  process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY || "YOUR_GOOGLE_PLACES_API_KEY";
```

With:

```typescript
const GOOGLE_PLACES_API_KEY = "YOUR_ACTUAL_API_KEY_HERE";
```

### 3. API Restrictions (Optional but Recommended)

For security, restrict your API key:

1. In Google Cloud Console, click on your API key
2. Under "Application restrictions":
   - For development: Choose "None"
   - For production: Choose appropriate restriction (iOS apps, Android apps, etc.)
3. Under "API restrictions":
   - Choose "Restrict key"
   - Select only "Places API (New)"

### 4. Usage Limits and Billing

- Google Places API has usage limits
- First $200/month is free (Google Cloud credits)
- Monitor usage in Google Cloud Console
- Consider implementing caching to reduce API calls

## What This Implementation Does

✅ **Replaces backend emergency services API calls** with Google Places API calls
✅ **Finds nearby hospitals** using `type=hospital`
✅ **Finds nearby police stations** using `type=police`
✅ **Finds nearby fire stations** using `type=fire_station`
✅ **Finds nearby pharmacies** using `type=pharmacy`
✅ **Calculates distances** from user location
✅ **Highlights important locations** on the map
✅ **No backend API required** - everything runs in the frontend

## Files Modified

1. `services/googlePlacesService.ts` - New service for Google Places API
2. `app/(tabs)/map.tsx` - Updated to use Google Places instead of backend APIs

## Error Resolution

This fixes the error:

```
GET http://localhost:8080/api/emergency-services/hospitals?latitude=23.7261172&longitude=90.3896315&radius=5000 500 (Internal Server Error)
```

The app now gets emergency services data directly from Google Places API without needing backend endpoints.
