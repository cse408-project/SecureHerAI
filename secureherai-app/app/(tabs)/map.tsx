import React, { useState, useEffect } from "react";
import { View, Text, Alert, Platform } from "react-native";
import Header from "../../components/Header";
import MapComponent, {
  MapLocation,
  MapMarker,
  MapPressEvent,
} from "../../components/MapComponent";
import locationService from "../../services/locationService";

export default function MapScreen() {
  const [currentLocation, setCurrentLocation] = useState<MapLocation | null>(
    null
  );
  const [markers, setMarkers] = useState<MapMarker[]>([]);
  const [loading, setLoading] = useState(true);

  // Initialize location
  useEffect(() => {
    initializeLocation();
  }, []);

  const initializeLocation = async () => {
    try {
      const location = await locationService.getCurrentLocation();
      if (location) {
        setCurrentLocation(location.coords);

        // Add a marker for current location
        const currentLocationMarker: MapMarker = {
          id: "current-location",
          coordinate: {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          },
          title: "Your Location",
          description: "You are here",
        };
        setMarkers([currentLocationMarker]);
      }
    } catch (error) {
      console.error("Error getting location:", error);
      Alert.alert(
        "Location Error",
        "Unable to get your current location. Please check your location permissions.",
        [{ text: "OK" }]
      );
    } finally {
      setLoading(false);
    }
  };

  const handleMapPress = (event: MapPressEvent) => {
    const { coordinate } = event.nativeEvent;

    // Add a new marker where user tapped
    const newMarker: MapMarker = {
      id: `marker-${Date.now()}`,
      coordinate,
      title: "Custom Location",
      description: `Lat: ${coordinate.latitude.toFixed(
        4
      )}, Lng: ${coordinate.longitude.toFixed(4)}`,
    };

    setMarkers((prevMarkers) => [...prevMarkers, newMarker]);
  };

  const handleMarkerPress = (marker: MapMarker) => {
    Alert.alert(
      marker.title || "Location",
      marker.description || "No description available",
      [
        {
          text: "Remove Marker",
          style: "destructive",
          onPress: () => {
            setMarkers((prevMarkers) =>
              prevMarkers.filter((m) => m.id !== marker.id)
            );
          },
        },
        { text: "Cancel", style: "cancel" },
      ]
    );
  };

  return (
    <View className="flex-1 bg-[#FFE4D6] max-w-screen-md mx-auto w-full">
      <Header
        title="Safety Map"
        onNotificationPress={() => {}}
        showNotificationDot={false}
      />

      <View className="flex-1 pb-28">
        {loading ? (
          <View className="flex-1 items-center justify-center">
            <Text className="text-gray-600">Loading map...</Text>
          </View>
        ) : (
          <MapComponent
            initialRegion={currentLocation || undefined}
            markers={markers}
            onPress={handleMapPress}
            onMarkerPress={handleMarkerPress}
            showsUserLocation={true}
            followsUserLocation={false}
            className="flex-1"
          />
        )}

        {Platform.OS === "web" && (
          <View className="absolute bottom-2 left-2 bg-white/80 p-2 rounded">
            <Text className="text-xs text-gray-600">
              Web map powered by Google Maps JS API
            </Text>
          </View>
        )}

        <View className="absolute top-2 left-2 bg-white/80 p-2 rounded">
          <Text className="text-xs text-gray-600">
            Tap anywhere on the map to add a marker
          </Text>
        </View>
      </View>
    </View>
  );
}
