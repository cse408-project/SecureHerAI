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

  // Performance optimization - stable route origins/destinations
  const [stableOrigin, setStableOrigin] = useState<MapLocation | null>(null);
  const [stableDestination, setStableDestination] =
    useState<MapLocation | null>(null);
  const [shouldUpdateRoute, setShouldUpdateRoute] = useState(false);

  // UI states
  const [loading, setLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<
    "connecting" | "connected" | "disconnected"
  >("connecting");
  const [mapLoaded, setMapLoaded] = useState(false);

  // Location tracking and polling - use refs to prevent multiple instances
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const locationUpdateRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastRouteUpdateRef = useRef<number>(0);
  const isPollingActive = useRef<boolean>(false);
  const isLocationUpdateActive = useRef<boolean>(false);

  // Map state was moved to refs to prevent re-renders

  // Performance optimization - only update route when significant change occurs
  const isSignificantLocationChange = useCallback(
    (oldLoc: MapLocation | null, newLoc: MapLocation | null): boolean => {
      if (!oldLoc || !newLoc) return true;

      const latDiff = Math.abs(oldLoc.latitude - newLoc.latitude);
      const lngDiff = Math.abs(oldLoc.longitude - newLoc.longitude);

      // Only update if location changed by more than ~10 meters
      return latDiff > 0.0001 || lngDiff > 0.0001;
    },
    []
  );

  // Manual route update - only called explicitly on manual reload
  const updateRouteCoordinates = useCallback(
    (origin: MapLocation | null, destination: MapLocation | null) => {
      // Only update if we have valid coordinates
      if (origin && destination) {
        console.log("🗺️ Manually updating route coordinates");
        setStableOrigin(origin);
        setStableDestination(destination);

        // Force component reload by updating key
        const now = Date.now();
        lastRouteUpdateRef.current = now;

        // Skip change detection - manual reload is always significant
      }
    },
    []
  );

  // Function to get participant location via REST API
  const fetchParticipantLocation = useCallback(async () => {
    try {
      const result = await apiService.getAlertParticipantLocation(alertId);

      console.log(
        `📍 Fetching ${userRole === "USER" ? "responder" : "user"} location...`,
        result
      );

      if (result.success && result.participantLocation) {
        const { latitude, longitude, lastUpdate } = result.participantLocation;

        if (latitude != null && longitude != null) {
          const newLocation: MapLocation = {
            latitude: latitude,
            longitude: longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          };

          console.log(
            `📍 Updated ${
              userRole === "USER" ? "responder" : "user"
            } location:`,
            newLocation
          );
          setTargetCurrentLocation(newLocation);
          setConnectionStatus("connected");
        } else {
          console.warn(
            `📍 ${
              userRole === "USER" ? "Responder" : "User"
            } location is null - they may not have shared location yet`
          );
          console.log("Location data:", { latitude, longitude, lastUpdate });
          setConnectionStatus("connecting");
          // Don't clear existing location if we had one before
        }
      } else {
        console.warn(
          "Failed to get participant location:",
          result.error || "Unknown error"
        );
        setConnectionStatus("disconnected");
      }
    } catch (error) {
      console.error("Error fetching participant location:", error);
      setConnectionStatus("disconnected");
    }
  }, [alertId, userRole]);

  // Stop location polling with proper cleanup
  const stopLocationPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
      isPollingActive.current = false;
      console.log("📍 Stopped location polling");
    }
  }, []);

  // No automatic polling - just a placeholder function
  const startLocationPolling = useCallback(() => {
    console.log("📍 Auto-polling disabled by user request");
    return;
  }, []);

  // Stop periodic location updates with proper cleanup
  const stopLocationUpdates = useCallback(() => {
    if (locationUpdateRef.current) {
      clearInterval(locationUpdateRef.current);
      locationUpdateRef.current = null;
      isLocationUpdateActive.current = false;
      console.log("📍 Stopped periodic location updates");
    }
  }, []);

  // No automatic location updates - just a placeholder function
  const startLocationUpdates = useCallback(() => {
    console.log("📍 Auto-location updates disabled by user request");
    return;
  }, []);

  // Initialize current location tracking
  const initializeCurrentLocation = useCallback(async () => {
    try {
      console.log("📍 Initializing current location...");
      const location = await locationService.getCurrentLocation();

      if (
        location &&
        location.coords &&
        location.coords.latitude != null &&
        location.coords.longitude != null
      ) {
        const mapLocation: MapLocation = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        };
        setCurrentLocation(mapLocation);
        console.log("📍 Initial location set:", mapLocation);

        // Update location on server so other participants can see it
        try {
          const updateResult = await apiService.updateLocation({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          });

          if (updateResult.success) {
            console.log("📍 Location updated on server successfully");
          } else {
            console.warn(
              "📍 Failed to update location on server:",
              updateResult.error
            );
          }
        } catch (error) {
          console.error("📍 Error updating location on server:", error);
        }
      } else {
        console.warn("📍 Invalid location data received");
      }
    } catch (error) {
      console.error("Error getting initial location:", error);
      showAlert("Failed to get current location", "error");
    }
  }, [showAlert]);

  // Initialize everything when component mounts - with proper cleanup prevention
  useEffect(() => {
    const initialize = async () => {
      console.log("🚀 Initializing NavigationScreen for alert:", alertId);

      // Initialize location tracking (one-time only)
      await initializeCurrentLocation();

      // Fetch participant location once
      await fetchParticipantLocation();

      setLoading(false);

      console.log("🚀 Initial data loaded - NO automatic reloading enabled");
    };

    initialize();

    // Cleanup on unmount - ensure complete cleanup
    return () => {
      console.log("🚀 Cleaning up NavigationScreen");
      stopLocationPolling();
      stopLocationUpdates();
    };
  }, [
    alertId,
    initializeCurrentLocation,
    fetchParticipantLocation,
    stopLocationPolling,
    stopLocationUpdates,
  ]);

  // Initialize stable coordinates for route - ONE TIME ONLY
  useEffect(() => {
    // Set origin and destination ONCE when locations are first available
    if (currentLocation && !stableOrigin) {
      console.log("🗺️ Setting initial stable origin");
      setStableOrigin(currentLocation);
    }

    // Use target or original location, whatever is available
    if (!stableDestination && (targetCurrentLocation || targetLocation)) {
      console.log("🗺️ Setting initial stable destination");
      setStableDestination(targetCurrentLocation || targetLocation);
    }

    // Once both are set, mark as loaded and don't update automatically anymore
    if (stableOrigin && stableDestination && !mapLoaded) {
      setMapLoaded(true);
      console.log(
        "🗺️ Initial route coordinates set - ready for manual reload only"
      );
    }
  }, [
    currentLocation,
    targetCurrentLocation,
    targetLocation,
    stableOrigin,
    stableDestination,
    mapLoaded,
  ]);

  // Only update route on manual reload, not on mode changes
  const previousModeRef = useRef<string>(routeMode);
  useEffect(() => {
    // Only log mode change
    if (previousModeRef.current !== routeMode) {
      console.log("🗺️ Route mode changed to:", routeMode);
      previousModeRef.current = routeMode;
      // Don't update route automatically - will happen on manual reload
    }
  }, [routeMode]);

  // Store map region in refs to prevent re-renders
  const mapRegionRef = useRef<MapLocation>(targetLocation);
  const potentialMapRegionRef = useRef<MapLocation | null>(null);

  // Calculate but don't set map region - only store in ref for manual reload
  useEffect(() => {
    if (
      currentLocation &&
      targetCurrentLocation &&
      currentLocation.latitude != null &&
      currentLocation.longitude != null &&
      targetCurrentLocation.latitude != null &&
      targetCurrentLocation.longitude != null
    ) {
      // Calculate region that encompasses both locations
      const latitudes = [
        currentLocation.latitude,
        targetCurrentLocation.latitude,
      ];
      const longitudes = [
        currentLocation.longitude,
        targetCurrentLocation.longitude,
      ];

      const minLat = Math.min(...latitudes);
      const maxLat = Math.max(...latitudes);
      const minLng = Math.min(...longitudes);
      const maxLng = Math.max(...longitudes);

      const latDelta = (maxLat - minLat) * 1.5 || 0.01;
      const lngDelta = (maxLng - minLng) * 1.5 || 0.01;

      // Store in ref but DON'T update the state to prevent re-renders
      potentialMapRegionRef.current = {
        latitude: (minLat + maxLat) / 2,
        longitude: (minLng + maxLng) / 2,
        latitudeDelta: Math.max(latDelta, 0.01),
        longitudeDelta: Math.max(lngDelta, 0.01),
      };

      console.log(
        "📍 Calculated new map region (not applied)",
        potentialMapRegionRef.current
      );
    }
  }, [currentLocation, targetCurrentLocation]);

  // Manual refresh function - prevent multiple simultaneous calls - SINGLE REFRESH ONLY
  const refreshInProgress = useRef<boolean>(false);
  const handleRefresh = useCallback(async () => {
    if (refreshInProgress.current) {
      console.log("🔄 Refresh already in progress, skipping...");
      return;
    }

    refreshInProgress.current = true;
    console.log("🔄 Manual refresh requested - SINGLE REFRESH ONLY");

    try {
      // Refresh participant location once
      await fetchParticipantLocation();

      // Refresh current location and update server once
      await manualLocationReload();
      await initializeCurrentLocation();

      // Update coordinates without redrawing route
      if (currentLocation) {
        setStableOrigin(currentLocation);
      }

      if (targetCurrentLocation || targetLocation) {
        setStableDestination(targetCurrentLocation || targetLocation);
      }

      showAlert("Locations refreshed", "success");
    } catch (error) {
      console.error("🔄 Error during refresh:", error);
      showAlert("Failed to refresh locations", "error");
    } finally {
      refreshInProgress.current = false;
    }
  }, [
    fetchParticipantLocation,
    manualLocationReload,
    initializeCurrentLocation,
    currentLocation,
    targetCurrentLocation,
    targetLocation,
    showAlert,
  ]);

  // Manual map reload function - resets map and forces SINGLE update
  const handleMapReload = useCallback(async () => {
    if (refreshInProgress.current) {
      console.log("🗺️ Map reload already in progress, skipping...");
      return;
    }

    refreshInProgress.current = true;
    console.log("🗺️ Manual map reload requested - SINGLE REFRESH ONLY");

    try {
      // Show loading indicator
      setLoading(true);

      // First reset map loaded state to force directions component to unmount
      setMapLoaded(false);

      // Fetch fresh data
      await initializeCurrentLocation();
      await fetchParticipantLocation();

      // Update coordinates with fresh data
      if (currentLocation) {
        setStableOrigin(currentLocation);
      }

      if (targetCurrentLocation || targetLocation) {
        setStableDestination(targetCurrentLocation || targetLocation);
      }

      // Apply the pre-calculated map region from the ref if it exists
      if (potentialMapRegionRef.current) {
        console.log("🗺️ Applying calculated map region on manual reload");
        mapRegionRef.current = potentialMapRegionRef.current;
      }

      // Apply the updated markers from the ref on manual reload
      if (potentialMarkersRef.current.length > 0) {
        console.log("🗺️ Applying updated markers on manual reload");
        setStableMarkers([...potentialMarkersRef.current]);
      }

      // Mark map as loaded again
      setTimeout(() => {
        setMapLoaded(true);
        showAlert("Map reloaded with fresh data", "success");
        setLoading(false);
        refreshInProgress.current = false;
      }, 500);
    } catch (error) {
      console.error("🗺️ Error during map reload:", error);
      showAlert("Failed to reload map", "error");
      setMapLoaded(true);
      setLoading(false);
      refreshInProgress.current = false;
    }
  }, [
    initializeCurrentLocation,
    fetchParticipantLocation,
    currentLocation,
    targetCurrentLocation,
    targetLocation,
    showAlert,
  ]);

  // Navigate back
  const handleBack = useCallback(() => {
    Alert.alert("End Navigation", "Are you sure you want to end navigation?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "End",
        style: "destructive",
        onPress: () => {
          router.back();
        },
      },
    ]);
  }, [router]);

  // Store potential markers in a ref without causing re-renders
  const potentialMarkersRef = useRef<MapMarker[]>([]);

  // Initialize markers only once and store stable reference
  const [stableMarkers, setStableMarkers] = useState<MapMarker[]>([
    {
      id: "target",
      coordinate: {
        latitude: targetLocation.latitude,
        longitude: targetLocation.longitude,
      },
      title: "Alert Location",
      description: "Original emergency location",
      color: "#FF0000",
    },
  ]);

  // Calculate potential markers but don't update automatically
  // useEffect(() => {
  //   // Build potential markers in ref without updating state
  //   const markerList: MapMarker[] = [];

  //   // Add target location marker (original alert location) - always present
  //   markerList.push({
  //     id: "target",
  //     coordinate: {
  //       latitude: targetLocation.latitude,
  //       longitude: targetLocation.longitude,
  //     },
  //     title: "Alert Location",
  //     description: "Original emergency location",
  //     color: "#FF0000",
  //   });

  //   // Add current location marker if available
  //   if (
  //     currentLocation &&
  //     currentLocation.latitude != null &&
  //     currentLocation.longitude != null
  //   ) {
  //     markerList.push({
  //       id: "current",
  //       coordinate: {
  //         latitude: currentLocation.latitude,
  //         longitude: currentLocation.longitude,
  //       },
  //       title: "Your Location",
  //       description: "Current position",
  //       color: "#FF6B8A",
  //     });
  //   }

  //   // Add current target location marker (other participant's current location)
  //   if (
  //     targetCurrentLocation &&
  //     targetCurrentLocation.latitude != null &&
  //     targetCurrentLocation.longitude != null
  //   ) {
  //     markerList.push({
  //       id: "targetCurrent",
  //       coordinate: {
  //         latitude: targetCurrentLocation.latitude,
  //         longitude: targetCurrentLocation.longitude,
  //       },
  //       title: userRole === "USER" ? "Responder Location" : "User Location",
  //       description: `Current ${
  //         userRole === "USER" ? "responder" : "user"
  //       } position`,
  //       color: userRole === "USER" ? "#00FF00" : "#0000FF",
  //     });
  //   }

  //   // Update reference only, not state
  //   potentialMarkersRef.current = markerList;

  //   // Set initial markers once when we have all data
  //   if (markerList.length > 1 && stableMarkers.length <= 1) {
  //     console.log("🗺️ Setting initial markers once");
  //     setStableMarkers(markerList);
  //   }
  // }, [
  //   currentLocation,
  //   targetCurrentLocation,
  //   targetLocation,
  //   userRole,
  //   stableMarkers.length,
  // ]);

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
      <View className="bg-[#67082F] px-4 pt-12 pb-4">
        <View className="flex-row justify-between items-center mb-2">
          <TouchableOpacity onPress={handleBack} className="mr-3">
            <MaterialIcons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>

          <View className="flex-1">
            <Text className="text-white text-lg font-bold">
              Navigation - {userRole === "USER" ? "To Responder" : "To User"}
            </Text>
          </View>
        </View>

        {/* Reload controls row */}
        <View className="flex-row justify-between items-center mt-1">
          <View className="flex-row items-center">
            <View className="w-2 h-2 rounded-full mr-2 bg-yellow-400" />
            <Text className="text-white text-sm opacity-80">
              Manual mode - tap reload button to update
            </Text>
          </View>

          <View className="flex-row items-center">
            <TouchableOpacity
              onPress={handleRefresh}
              className="bg-white/20 p-2 rounded-full mr-1"
            >
              <MaterialIcons name="refresh" size={20} color="white" />
            </TouchableOpacity>
            <Text className="text-white text-xs opacity-70 mr-3">Refresh</Text>

            <TouchableOpacity
              onPress={handleMapReload}
              className="bg-white/20 p-2 rounded-full mr-1"
            >
              <MaterialIcons name="map" size={20} color="white" />
            </TouchableOpacity>
            <Text className="text-white text-xs opacity-70">Map</Text>
          </View>
        </View>
      </View>

      {/* Map */}
      <View className="flex-1">
        {/* Web Places Input - Absolutely positioned over the map */}
        {Platform.OS === "web" && (
          <View className="absolute top-4 left-4 right-4 z-10">
            <WebPlacesInput
              placeholder="Search for a location..."
              onPlaceSelect={(place: any) => {
                if (place.geometry && place.geometry.location) {
                  // Update map region via ref instead of state
                  mapRegionRef.current = {
                    latitude: place.geometry.location.lat(),
                    longitude: place.geometry.location.lng(),
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01,
                  };
                }
              }}
            />
          </View>
        )}

        {/* Route Mode Selector - Absolutely positioned over the map */}
        {Platform.OS === "web" && (
          <View className="absolute top-20 right-4 z-10 bg-white rounded-lg p-2 shadow-md">
            {(["DRIVING", "WALKING", "BICYCLING", "TRANSIT"] as const).map(
              (mode) => (
                <TouchableOpacity
                  key={mode}
                  onPress={() => setRouteMode(mode)}
                  className={`p-2 rounded ${
                    routeMode === mode ? "bg-[#FF6B8A]" : "bg-gray-100"
                  } mb-1`}
                >
                  <Text
                    className={`text-xs ${
                      routeMode === mode ? "text-white" : "text-gray-700"
                    }`}
                  >
                    {mode}
                  </Text>
                </TouchableOpacity>
              )
            )}
          </View>
        )}

        {/* MapComponent - Use completely stable props to prevent re-renders */}
        <MapComponent
          key="static-map"
          markers={stableMarkers}
          initialRegion={targetLocation} // Use initial target location and never update
          showsUserLocation={true}
          followsUserLocation={false}
        >
          {/* Render directions inside MapComponent so it has access to Google Maps API */}
          {stableOrigin && stableDestination && mapLoaded && (
            <MapViewDirectionsWeb
              // Key including mapLoaded to force recreation when explicitly requested
              key={`map-directions-static`}
              origin={stableOrigin}
              destination={stableDestination}
              apikey={process.env.EXPO_PUBLIC_GOOGLE_MAPS_WEB_API_KEY || ""}
              strokeWidth={4}
              strokeColor="#4285F4"
              mode={routeMode}
              onReady={(result: any) => {
                console.log("🗺️ Navigation directions ready:", result);
                setRoute(result);
              }}
              onError={(errorMessage: any) => {
                console.error("🗺️ Navigation directions error:", errorMessage);
              }}
            />
          )}
        </MapComponent>
      </View>

      {/* Bottom Info Panel */}
      <View className="bg-white border-t border-gray-200 p-4">
        <View className="flex-row justify-between items-center mb-2">
          <Text className="text-lg font-bold text-gray-800">
            Tracking {userRole === "USER" ? "Responder" : "User"}
          </Text>
          <Text className="text-sm text-gray-500">
            Manual mode - Press reload for fresh data
          </Text>
        </View>

        {targetCurrentLocation &&
        targetCurrentLocation.latitude != null &&
        targetCurrentLocation.longitude != null ? (
          <View className="flex-row items-center">
            <MaterialIcons
              name={userRole === "USER" ? "local-police" : "person"}
              size={20}
              color="#FF6B8A"
            />
            <Text className="ml-2 text-gray-600">
              Location: {targetCurrentLocation.latitude.toFixed(6)},{" "}
              {targetCurrentLocation.longitude.toFixed(6)}
            </Text>
          </View>
        ) : (
          <View className="flex-row items-center">
            <ActivityIndicator size="small" color="#FF6B8A" />
            <Text className="ml-2 text-gray-500">
              {connectionStatus === "connecting"
                ? `Waiting for ${
                    userRole === "USER" ? "responder" : "user"
                  } to share location...`
                : connectionStatus === "disconnected"
                ? `Unable to connect to ${
                    userRole === "USER" ? "responder" : "user"
                  }`
                : `Getting ${
                    userRole === "USER" ? "responder" : "user"
                  } location...`}
            </Text>
          </View>
        )}

        {route && (
          <View className="mt-3 pt-3 border-t border-gray-100">
            <Text className="text-sm text-gray-600">
              Distance: {route.distance?.text || "Calculating..."} • Duration:{" "}
              {route.duration?.text || "Calculating..."}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

export default NavigationScreen;
