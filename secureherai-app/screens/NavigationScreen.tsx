import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Alert,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import MapComponent, {
  MapLocation,
  MapMarker,
} from "../components/MapComponent";
import MapViewDirectionsWeb from "../components/MapViewDirectionsWeb";
import WebPlacesInput from "../components/WebPlacesInput";
import locationService from "../services/locationService";
import apiService from "../services/api";
import { useAlert } from "../context/AlertContext";
import { useLocation } from "../context/LocationContext";

const NavigationScreen: React.FC = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { showAlert } = useAlert();
  const { manualLocationReload } = useLocation();

  // Extract params
  const alertId = params.alertId as string;
  const userRole = params.userRole as "USER" | "RESPONDER";
  const targetLocation = JSON.parse(params.targetLocation as string);

  // Location states
  const [currentLocation, setCurrentLocation] = useState<MapLocation | null>(
    null
  );
  const [targetCurrentLocation, setTargetCurrentLocation] =
    useState<MapLocation | null>(null);
  const [route, setRoute] = useState<any>(null);
  const [routeMode, setRouteMode] = useState<
    "DRIVING" | "WALKING" | "BICYCLING" | "TRANSIT"
  >("DRIVING");

  // UI states
  const [loading, setLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<
    "connecting" | "connected" | "disconnected"
  >("connecting");

  // Location tracking and polling
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Map state
  const [mapRegion, setMapRegion] = useState<MapLocation>({
    latitude: targetLocation.latitude,
    longitude: targetLocation.longitude,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });

  // Function to get participant location via REST API
  const fetchParticipantLocation = useCallback(async () => {
    try {
      const result = await apiService.getAlertParticipantLocation(alertId);
      
      if (result.success && result.participantLocation) {
        const newLocation: MapLocation = {
          latitude: result.participantLocation.latitude,
          longitude: result.participantLocation.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        };

        console.log(`📍 Updated ${userRole === "USER" ? "responder" : "user"} location:`, newLocation);
        setTargetCurrentLocation(newLocation);
        setConnectionStatus("connected");
      } else {
        console.warn("Failed to get participant location:", result.error);
      }
    } catch (error) {
      console.error("Error fetching participant location:", error);
      setConnectionStatus("disconnected");
    }
  }, [alertId, userRole]);

  // Start location polling
  const startLocationPolling = useCallback(() => {
    // Initial fetch
    fetchParticipantLocation();
    
    // Set up polling every 5 seconds
    pollingRef.current = setInterval(() => {
      fetchParticipantLocation();
    }, 5000);
    
    console.log("📍 Started location polling for alert:", alertId);
  }, [fetchParticipantLocation, alertId]);

  // Stop location polling
  const stopLocationPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
      console.log("📍 Stopped location polling");
    }
  }, []);

  // Initialize current location tracking
  const initializeCurrentLocation = useCallback(async () => {
    try {
      console.log("📍 Initializing current location...");
      const location = await locationService.getCurrentLocation();
      
      if (location) {
        const mapLocation: MapLocation = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        };
        setCurrentLocation(mapLocation);
        console.log("📍 Initial location set:", mapLocation);
      }
    } catch (error) {
      console.error("Error getting initial location:", error);
      showAlert("Failed to get current location", "error");
    }
  }, [showAlert]);

  // Initialize everything when component mounts
  useEffect(() => {
    const initialize = async () => {
      console.log("🚀 Initializing NavigationScreen for alert:", alertId);
      
      // Initialize location tracking
      await initializeCurrentLocation();
      
      // Start polling for participant location
      startLocationPolling();
      
      setLoading(false);
    };

    initialize();

    // Cleanup on unmount
    return () => {
      stopLocationPolling();
    };
  }, [alertId, initializeCurrentLocation, startLocationPolling, stopLocationPolling]);

  // Update map region when locations change
  useEffect(() => {
    if (currentLocation && targetCurrentLocation) {
      // Calculate region that encompasses both locations
      const latitudes = [currentLocation.latitude, targetCurrentLocation.latitude];
      const longitudes = [currentLocation.longitude, targetCurrentLocation.longitude];
      
      const minLat = Math.min(...latitudes);
      const maxLat = Math.max(...latitudes);
      const minLng = Math.min(...longitudes);
      const maxLng = Math.max(...longitudes);
      
      const latDelta = (maxLat - minLat) * 1.5 || 0.01;
      const lngDelta = (maxLng - minLng) * 1.5 || 0.01;
      
      setMapRegion({
        latitude: (minLat + maxLat) / 2,
        longitude: (minLng + maxLng) / 2,
        latitudeDelta: Math.max(latDelta, 0.01),
        longitudeDelta: Math.max(lngDelta, 0.01),
      });
    }
  }, [currentLocation, targetCurrentLocation]);

  // Manual refresh function
  const handleRefresh = useCallback(async () => {
    console.log("🔄 Manual refresh requested");
    
    // Refresh participant location
    await fetchParticipantLocation();
    
    // Refresh current location
    await manualLocationReload();
    await initializeCurrentLocation();
    
    showAlert("Locations refreshed", "success");
  }, [fetchParticipantLocation, manualLocationReload, initializeCurrentLocation, showAlert]);

  // Navigate back
  const handleBack = useCallback(() => {
    Alert.alert(
      "End Navigation",
      "Are you sure you want to end navigation?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "End",
          style: "destructive",
          onPress: () => {
            router.back();
          },
        },
      ]
    );
  }, [router]);

  // Prepare markers for map
  const markers = useMemo(() => {
    const markerList: MapMarker[] = [];

    // Add current location marker
    if (currentLocation) {
      markerList.push({
        id: "current",
        coordinate: {
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
        },
        title: "Your Location",
        description: "Current position",
        color: "#FF6B8A",
      });
    }

    // Add target location marker (original alert location)
    markerList.push({
      id: "target", 
      coordinate: {
        latitude: targetLocation.latitude,
        longitude: targetLocation.longitude,
      },
      title: "Alert Location",
      description: "Original emergency location",
      color: "#FF0000",
    });

    // Add current target location marker (other participant's current location)
    if (targetCurrentLocation) {
      markerList.push({
        id: "targetCurrent",
        coordinate: {
          latitude: targetCurrentLocation.latitude,
          longitude: targetCurrentLocation.longitude,
        },
        title: userRole === "USER" ? "Responder Location" : "User Location",
        description: `Current ${userRole === "USER" ? "responder" : "user"} position`,
        color: userRole === "USER" ? "#00FF00" : "#0000FF",
      });
    }

    return markerList;
  }, [currentLocation, targetLocation, targetCurrentLocation, userRole]);

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#FF6B8A" />
        <Text className="mt-4 text-gray-600">Loading navigation...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      {/* Header */}
      <View className="bg-[#67082F] px-4 pt-12 pb-4 flex-row justify-between items-center">
        <TouchableOpacity onPress={handleBack} className="mr-3">
          <MaterialIcons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        
        <View className="flex-1">
          <Text className="text-white text-lg font-bold">
            Navigation - {userRole === "USER" ? "To Responder" : "To User"}
          </Text>
          <View className="flex-row items-center mt-1">
            <View 
              className={`w-2 h-2 rounded-full mr-2 ${
                connectionStatus === "connected" ? "bg-green-400" :
                connectionStatus === "connecting" ? "bg-yellow-400" : "bg-red-400"
              }`} 
            />
            <Text className="text-white text-sm opacity-80">
              {connectionStatus === "connected" ? "Live tracking" :
               connectionStatus === "connecting" ? "Connecting..." : "Disconnected"}
            </Text>
          </View>
        </View>

        <TouchableOpacity 
          onPress={handleRefresh}
          className="bg-white/20 p-2 rounded-full"
        >
          <MaterialIcons name="refresh" size={20} color="white" />
        </TouchableOpacity>
      </View>

      {/* Map */}
      <View className="flex-1">
        {Platform.OS === "web" ? (
          <>
            {/* Web Places Input */}
            <View className="absolute top-4 left-4 right-4 z-10">
              <WebPlacesInput
                placeholder="Search for a location..."
                onPlaceSelect={(place: any) => {
                  if (place.geometry && place.geometry.location) {
                    setMapRegion({
                      latitude: place.geometry.location.lat(),
                      longitude: place.geometry.location.lng(),
                      latitudeDelta: 0.01,
                      longitudeDelta: 0.01,
                    });
                  }
                }}
              />
            </View>

            {/* Route Mode Selector */}
            <View className="absolute top-20 right-4 z-10 bg-white rounded-lg p-2 shadow-md">
              {(["DRIVING", "WALKING", "BICYCLING", "TRANSIT"] as const).map((mode) => (
                <TouchableOpacity
                  key={mode}
                  onPress={() => setRouteMode(mode)}
                  className={`p-2 rounded ${routeMode === mode ? "bg-[#FF6B8A]" : "bg-gray-100"} mb-1`}
                >
                  <Text className={`text-xs ${routeMode === mode ? "text-white" : "text-gray-700"}`}>
                    {mode}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Directions Component */}
            {currentLocation && (
              <MapViewDirectionsWeb
                origin={currentLocation}
                destination={targetCurrentLocation || targetLocation}
                apikey={process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || ""}
                mode={routeMode}
                onReady={(result: any) => {
                  setRoute(result);
                }}
              />
            )}
          </>
        ) : (
          <MapComponent
            markers={markers}
            initialRegion={mapRegion}
            showsUserLocation={true}
            followsUserLocation={false}
          />
        )}
      </View>

      {/* Bottom Info Panel */}
      <View className="bg-white border-t border-gray-200 p-4">
        <View className="flex-row justify-between items-center mb-2">
          <Text className="text-lg font-bold text-gray-800">
            Tracking {userRole === "USER" ? "Responder" : "User"}
          </Text>
          <Text className="text-sm text-gray-500">
            Updated: {connectionStatus === "connected" ? "Live" : "Offline"}
          </Text>
        </View>
        
        {targetCurrentLocation ? (
          <View className="flex-row items-center">
            <MaterialIcons 
              name={userRole === "USER" ? "local-police" : "person"} 
              size={20} 
              color="#FF6B8A" 
            />
            <Text className="ml-2 text-gray-600">
              Location: {targetCurrentLocation.latitude.toFixed(6)}, {targetCurrentLocation.longitude.toFixed(6)}
            </Text>
          </View>
        ) : (
          <View className="flex-row items-center">
            <ActivityIndicator size="small" color="#FF6B8A" />
            <Text className="ml-2 text-gray-500">
              Waiting for {userRole === "USER" ? "responder" : "user"} location...
            </Text>
          </View>
        )}

        {route && (
          <View className="mt-3 pt-3 border-t border-gray-100">
            <Text className="text-sm text-gray-600">
              Distance: {route.distance?.text || "Calculating..."} • 
              Duration: {route.duration?.text || "Calculating..."}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

export default NavigationScreen;
