# Google Maps Implementation Guide for SecureHerAI

This guide explains how to set up and use Google Maps in the SecureHerAI React Native Expo application with cross-platform support (Android, iOS, and Web).

## Overview

The implementation uses:

- **react-native-maps** for native platforms (Android/iOS)
- **@teovilla/react-native-web-maps** for web platform via webpack alias
- **expo-location** for location services
- Cross-platform compatibility with single codebase

## Dependencies Installed

```bash
npx expo install react-native-maps      # Native maps support
npm install @teovilla/react-native-web-maps  # Web maps shim
```

## Configuration Files

### 1. webpack.config.js

Created at project root to alias react-native-maps for web:

```javascript
const { createExpoWebpackConfigAsync } = require("@expo/webpack-config");

module.exports = async function (env, argv) {
  const config = await createExpoWebpackConfigAsync(env, argv);
  config.resolve.alias["react-native-maps"] = "@teovilla/react-native-web-maps";
  return config;
};
```

### 2. app.json

Updated Android configuration for Google Maps:

```json
{
  "expo": {
    "android": {
      "config": {
        "googleMaps": {
          "apiKey": "YOUR_ANDROID_GOOGLE_MAPS_API_KEY"
        }
      }
    }
  }
}
```

### 3. .env.example

Added Google Maps API key placeholders:

```bash
# Google Maps API Keys
EXPO_PUBLIC_GOOGLE_MAPS_ANDROID_API_KEY=YOUR_ANDROID_GOOGLE_MAPS_API_KEY
EXPO_PUBLIC_GOOGLE_MAPS_WEB_API_KEY=YOUR_WEB_GOOGLE_MAPS_API_KEY
EXPO_PUBLIC_GOOGLE_MAPS_IOS_API_KEY=YOUR_IOS_GOOGLE_MAPS_API_KEY
```

## Implementation Components

### 1. LocationService (services/locationService.ts)

Handles location-related functionality:

- Permission requests
- Getting current location
- Watching location changes
- Geocoding and reverse geocoding

### 2. MapComponent (components/MapComponent.tsx)

Reusable map component with:

- Cross-platform support
- Marker management
- Event handling
- Custom styling

### 3. MapScreen (app/(tabs)/map.tsx)

Main map screen implementation with:

- Current location display
- Interactive marker placement
- Location-based features

## Getting Google Maps API Keys

### For Android:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable "Maps SDK for Android"
4. Create credentials (API Key)
5. Restrict the key to your Android package name: `com.cse408project.secureheraiapp`
6. Add your app's SHA-1 fingerprint

### For Web:

1. In the same Google Cloud project
2. Enable "Maps JavaScript API"
3. Create credentials (API Key)
4. Restrict the key to your web domain (optional for development)

### For iOS (if needed):

1. Enable "Maps SDK for iOS"
2. Create credentials (API Key)
3. Restrict the key to your iOS bundle identifier

## Setup Instructions

### 1. Create Environment File

Copy `.env.example` to `.env` and fill in your API keys:

```bash
cp .env.example .env
```

Edit `.env`:

```bash
EXPO_PUBLIC_GOOGLE_MAPS_ANDROID_API_KEY=your_actual_android_key
EXPO_PUBLIC_GOOGLE_MAPS_WEB_API_KEY=your_actual_web_key
EXPO_PUBLIC_GOOGLE_MAPS_IOS_API_KEY=your_actual_ios_key
```

### 2. Update app.json

Replace the placeholder in `app.json` with your actual Android API key:

```json
{
  "expo": {
    "android": {
      "config": {
        "googleMaps": {
          "apiKey": "your_actual_android_key_here"
        }
      }
    }
  }
}
```

### 3. Test the Implementation

#### For Android:

```bash
npx expo run:android
```

#### For Web:

```bash
npx expo start --web
```

#### For iOS:

```bash
npx expo run:ios
```

## Features Implemented

### Current Features:

- **Interactive Map**: Users can view and interact with the map
- **Current Location**: Automatically shows user's current location
- **Marker Placement**: Tap anywhere to add custom markers
- **Marker Management**: Tap markers to view info or remove them
- **Cross-Platform**: Works on Android, iOS, and Web
- **Location Services**: Integrated with expo-location for permissions and location data

### Map Controls:

- **Zoom**: Pinch to zoom in/out
- **Pan**: Drag to move around the map
- **User Location**: Shows current user location with blue dot
- **Custom Markers**: Add markers by tapping
- **Marker Info**: Tap markers to see coordinates and options

## Usage Examples

### Basic Map Usage:

```tsx
import MapComponent from "../../components/MapComponent";

<MapComponent
  initialRegion={{
    latitude: 23.8103,
    longitude: 90.4125,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  }}
  showsUserLocation={true}
  onPress={handleMapPress}
/>;
```

### Adding Custom Markers:

```tsx
const markers = [
  {
    id: "marker1",
    coordinate: { latitude: 23.8103, longitude: 90.4125 },
    title: "Custom Location",
    description: "Description here",
  },
];

<MapComponent markers={markers} />;
```

### Getting Current Location:

```tsx
import locationService from "../../services/locationService";

const location = await locationService.getCurrentLocation();
if (location) {
  console.log("Current location:", location.coords);
}
```

## Security Considerations

1. **API Key Security**:

   - Never commit API keys to version control
   - Use environment variables
   - Restrict API keys to specific platforms/domains

2. **Location Permissions**:

   - Always request permissions before accessing location
   - Handle permission denied gracefully
   - Provide fallback functionality

3. **Rate Limiting**:
   - Google Maps API has usage quotas
   - Monitor usage in Google Cloud Console
   - Implement caching for frequent requests

## Troubleshooting

### Common Issues:

1. **Map not showing on Android**:

   - Check if API key is correct in app.json
   - Ensure Maps SDK for Android is enabled
   - Verify package name and SHA-1 fingerprint

2. **Map not showing on Web**:

   - Check if web API key is set in environment
   - Ensure Maps JavaScript API is enabled
   - Verify webpack.config.js alias is correct

3. **Location not working**:
   - Check location permissions
   - Ensure device has location services enabled
   - Test on physical device (location may not work in simulators)

### Development Tips:

1. **Testing on Different Platforms**:

   - Test web version in browser developer tools
   - Use Android/iOS simulators for mobile testing
   - Test location features on real devices

2. **Performance Optimization**:
   - Limit number of markers for better performance
   - Use clustering for many markers
   - Optimize marker icons and images

## Future Enhancements

Potential features to add:

- **Directions and Navigation**: Integrate routing between locations
- **Geofencing**: Set up location-based alerts and notifications
- **Safety Zones**: Mark safe and unsafe areas on the map
- **Real-time Tracking**: Share location with trusted contacts
- **Emergency Services**: Quick access to nearby emergency services
- **Offline Maps**: Cache map data for offline usage

## Related Files

- `app/(tabs)/map.tsx` - Main map screen
- `components/MapComponent.tsx` - Reusable map component
- `services/locationService.ts` - Location utility service
- `webpack.config.js` - Web platform configuration
- `app.json` - Expo configuration with Google Maps setup
- `.env.example` - Environment variables template

## Resources

- [React Native Maps Documentation](https://github.com/react-native-maps/react-native-maps)
- [Expo Maps Documentation](https://docs.expo.dev/versions/latest/sdk/map-view/)
- [Google Maps Platform](https://developers.google.com/maps)
- [@teovilla/react-native-web-maps](https://github.com/teovillanueva/react-native-web-maps)
- [Expo Location Documentation](https://docs.expo.dev/versions/latest/sdk/location/)
