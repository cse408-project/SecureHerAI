import React, { useEffect, useRef } from "react";
import { StyleSheet, ViewStyle, View, Text } from "react-native";

export interface MapLocation {
  latitude: number;
  longitude: number;
  latitudeDelta?: number;
  longitudeDelta?: number;
}

export interface MapMarker {
  id: string;
  coordinate: {
    latitude: number;
    longitude: number;
  };
  title?: string;
  description?: string;
}

interface MapPressEvent {
  nativeEvent: {
    coordinate: {
      latitude: number;
      longitude: number;
    };
  };
}

interface MapComponentProps {
  initialRegion?: MapLocation;
  markers?: MapMarker[];
  onPress?: (event: MapPressEvent) => void;
  onMarkerPress?: (marker: MapMarker) => void;
  style?: ViewStyle;
  showsUserLocation?: boolean;
  followsUserLocation?: boolean;
  className?: string;
}

// Default location (Dhaka, Bangladesh)
const DEFAULT_REGION = {
  latitude: 23.8103,
  longitude: 90.4125,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

export default function MapComponent({
  initialRegion = DEFAULT_REGION,
  markers = [],
  onPress,
  onMarkerPress,
  style,
  showsUserLocation = true,
  followsUserLocation = false,
  className,
}: MapComponentProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  // Get web API key from environment variables
  const webApiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_WEB_API_KEY;

  useEffect(() => {
    if (!webApiKey) return;

    // Load Google Maps script
    const loadGoogleMaps = () => {
      if (window.google && window.google.maps) {
        initializeMap();
        return;
      }

      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${webApiKey}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = initializeMap;
      document.head.appendChild(script);
    };

    const initializeMap = () => {
      if (!mapRef.current || !window.google) return;

      // Initialize map
      mapInstance.current = new window.google.maps.Map(mapRef.current, {
        center: { lat: initialRegion.latitude, lng: initialRegion.longitude },
        zoom: 13,
        mapTypeControl: true,
        streetViewControl: false,
        fullscreenControl: true,
      });

      // Add click listener
      if (onPress) {
        mapInstance.current.addListener("click", (event: any) => {
          const coordinate = {
            latitude: event.latLng.lat(),
            longitude: event.latLng.lng(),
          };
          onPress({
            nativeEvent: { coordinate },
          });
        });
      }

      // Add markers
      updateMarkers();
    };

    const updateMarkers = () => {
      if (!mapInstance.current) return;

      // Clear existing markers
      markersRef.current.forEach((marker) => marker.setMap(null));
      markersRef.current = [];

      // Add new markers
      markers.forEach((marker) => {
        const googleMarker = new window.google.maps.Marker({
          position: {
            lat: marker.coordinate.latitude,
            lng: marker.coordinate.longitude,
          },
          map: mapInstance.current,
          title: marker.title,
        });

        if (marker.title || marker.description) {
          const infoWindow = new window.google.maps.InfoWindow({
            content: `<div><strong>${marker.title || "Location"}</strong><br/>${
              marker.description || ""
            }</div>`,
          });

          googleMarker.addListener("click", () => {
            infoWindow.open(mapInstance.current, googleMarker);
            if (onMarkerPress) {
              onMarkerPress(marker);
            }
          });
        }

        markersRef.current.push(googleMarker);
      });
    };

    loadGoogleMaps();

    return () => {
      // Cleanup
      markersRef.current.forEach((marker) => marker.setMap(null));
    };
  }, [webApiKey, initialRegion, markers, onPress, onMarkerPress]);

  const mapStyle = [styles.map, style];

  if (!webApiKey) {
    return (
      <View style={[mapStyle, styles.fallback]}>
        <Text style={styles.fallbackText}>
          Google Maps API key not configured for web platform.{"\n"}
          Please set EXPO_PUBLIC_GOOGLE_MAPS_WEB_API_KEY in your .env file.
        </Text>
      </View>
    );
  }

  return (
    <div
      ref={mapRef}
      style={{
        width: "100%",
        height: "100%",
        flex: 1,
        minHeight: 400,
      }}
      className={className}
    />
  );
}

const styles = StyleSheet.create({
  map: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  fallback: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f0f0f0",
  },
  fallbackText: {
    color: "#666",
    textAlign: "center",
    fontSize: 14,
  },
});

// Export mock components for consistency
export const Marker = () => null;
export { MapComponent as MapView };
export type { MapPressEvent };
