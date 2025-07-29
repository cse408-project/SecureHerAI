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
} from "../../components/MapComponent";
import MapViewDirectionsWeb from "../../components/MapViewDirectionsWeb";
import WebPlacesInput from "../../components/WebPlacesInput";
import locationService from "../../services/locationService";
import apiService from "../../services/api";
import { useAlert } from "../../context/AlertContext";
import { useLocation } from "../../context/LocationContext";

// Conditional import for MapViewDirections (only on native platforms)
let MapViewDirections: any = null;
try {
  if (Platform.OS !== "web") {
    MapViewDirections = require("react-native-maps-directions").default;
  }
} catch (error) {
  console.log("MapViewDirections not available on this platform:", error);
}

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

  // Map state
  const [mapRegion, setMapRegion] = useState<MapLocation>({
    latitude: targetLocation.latitude,
    longitude: targetLocation.longitude,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });

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

  useEffect(() => {
    handleMapReload();
  }, []);

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
          // Explicitly check for valid coordinates before sending
          if (
            typeof location.coords.latitude === "number" &&
            typeof location.coords.longitude === "number" &&
            !isNaN(location.coords.latitude) &&
            !isNaN(location.coords.longitude)
          ) {
            console.log("📍 Sending valid location to server:", {
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
            });

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
          } else {
            console.warn(
              "📍 Invalid coordinates - not sending to server",
              location.coords
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

  // Update map region when locations change - with stronger validation
  useEffect(() => {
    const isValidCoordinate = (value: any): value is number =>
      typeof value === "number" && !isNaN(value);

    const hasValidCoords = (loc: MapLocation | null): boolean =>
      !!loc &&
      isValidCoordinate(loc.latitude) &&
      isValidCoordinate(loc.longitude);

    // Only proceed if we have valid coordinates for both locations
    if (
      hasValidCoords(currentLocation) &&
      hasValidCoords(targetCurrentLocation)
    ) {
      console.log("🗺️ Both locations valid, updating map region");

      // Now we can safely use the coordinates - TypeScript needs non-null assertion
      // since we already validated above that these are not null
      const latitudes = [
        currentLocation!.latitude,
        targetCurrentLocation!.latitude,
      ];
      const longitudes = [
        currentLocation!.longitude,
        targetCurrentLocation!.longitude,
      ];

      const minLat = Math.min(...latitudes);
      const maxLat = Math.max(...latitudes);
      const minLng = Math.min(...longitudes);
      const maxLng = Math.max(...longitudes);

      // Ensure we have valid deltas
      const latDelta = Math.max((maxLat - minLat) * 1.5, 0.01);
      const lngDelta = Math.max((maxLng - minLng) * 1.5, 0.01);

      const newRegion = {
        latitude: (minLat + maxLat) / 2,
        longitude: (minLng + maxLng) / 2,
        latitudeDelta: latDelta,
        longitudeDelta: lngDelta,
      };

      console.log("🗺️ Setting map region:", newRegion);
      setMapRegion(newRegion);
    }
  }, [currentLocation, targetCurrentLocation]);

  // Single refresh management
  const refreshInProgress = useRef<boolean>(false); // Manual map reload function - resets map and forces SINGLE update
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

      try {
        // First ensure we have current location data
        await manualLocationReload();

        // Then initialize location with fresh data
        await initializeCurrentLocation();

        // Fetch the other participant's location
        await fetchParticipantLocation();
      } catch (locationError) {
        console.error("🗺️ Error getting location data:", locationError);
      }

      // Update coordinates with fresh data - check for valid data first
      if (
        currentLocation &&
        typeof currentLocation.latitude === "number" &&
        typeof currentLocation.longitude === "number" &&
        !isNaN(currentLocation.latitude) &&
        !isNaN(currentLocation.longitude)
      ) {
        console.log(
          "🗺️ Setting stable origin with valid location:",
          currentLocation
        );
        setStableOrigin(currentLocation);
      }

      // Choose target location based on availability
      const targetLoc = targetCurrentLocation || targetLocation;
      if (
        targetLoc &&
        typeof targetLoc.latitude === "number" &&
        typeof targetLoc.longitude === "number" &&
        !isNaN(targetLoc.latitude) &&
        !isNaN(targetLoc.longitude)
      ) {
        console.log(
          "🗺️ Setting stable destination with valid location:",
          targetLoc
        );
        setStableDestination(targetLoc);
      }

      // Mark map as loaded again
      setMapLoaded(true);
      showAlert("Map reloaded with fresh data", "success");
    } catch (error) {
      console.error("🗺️ Error during map reload:", error);
      showAlert("Failed to reload map", "error");
    } finally {
      // Always ensure these are reset in finally block
      setLoading(false);
      refreshInProgress.current = false;
    }
  }, [
    initializeCurrentLocation,
    fetchParticipantLocation,
    manualLocationReload,
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

  // Prepare markers for map - memoized to prevent constant re-renders
  const markers = useMemo(() => {
    const markerList: MapMarker[] = [];

    // Add current location marker
    if (
      currentLocation &&
      currentLocation.latitude != null &&
      currentLocation.longitude != null
    ) {
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
    if (
      targetCurrentLocation &&
      targetCurrentLocation.latitude != null &&
      targetCurrentLocation.longitude != null
    ) {
      markerList.push({
        id: "targetCurrent",
        coordinate: {
          latitude: targetCurrentLocation.latitude,
          longitude: targetCurrentLocation.longitude,
        },
        title: userRole === "USER" ? "Responder Location" : "User Location",
        description: `Current ${
          userRole === "USER" ? "responder" : "user"
        } position`,
        color: userRole === "USER" ? "#00FF00" : "#0000FF",
      });
    }

    return markerList;
  }, [currentLocation, targetCurrentLocation, targetLocation, userRole]); // Include targetLocation

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-white max-w-screen-md mx-auto w-full">
        <ActivityIndicator size="large" color="#FF6B8A" />
        <Text className="mt-4 text-gray-600">Loading navigation...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50 max-w-screen-md mx-auto w-full">
      {/* Header - Styled like details page with consistent branding */}
      <View className="bg-[#67082F] px-4 pt-12 pb-4 shadow-md">
        <View className="flex-row justify-between items-center mb-2">
          <TouchableOpacity onPress={handleBack} className="p-2 -ml-2">
            <MaterialIcons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>

          <View className="flex-1 ml-2">
            <Text className="text-white text-xl font-bold">
              {userRole === "USER" ? "Responder Navigation" : "User Navigation"}
            </Text>
          </View>
        </View>

        {/* Refined status and controls row */}
        <View className="flex-row justify-between items-center mt-2">
          <View className="flex-row items-center bg-[#ffffff20] px-3 py-1 rounded-full">
            <View className="w-2.5 h-2.5 rounded-full mr-2 bg-yellow-400" />
            <Text className="text-white text-sm font-medium">Manual mode</Text>
          </View>

          <TouchableOpacity
            onPress={handleMapReload}
            className="flex-row items-center bg-[#FF6B8A] px-3 py-1.5 rounded-full"
          >
            <MaterialIcons name="refresh" size={18} color="white" />
            <Text className="text-white text-sm font-medium ml-1">
              Reload Map
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Search field moved outside the map for better UI */}
      {/* {Platform.OS === "web" && (
        <View className="px-4 py-3 bg-white border-b border-gray-100">
          <View className="bg-gray-50 rounded-lg shadow-sm overflow-hidden">
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
        </View>
      )} */}

      {/* Map Container with refined controls */}
      <View className="flex-1 relative overflow-hidden">
        {/* Enhanced Route Mode Selector */}
        {Platform.OS === "web" && (
          <View className="absolute top-20 right-4 z-10 bg-white rounded-xl p-2 shadow-lg border border-gray-100">
            <Text className="text-xs text-gray-500 font-medium mb-1 px-1">
              Travel Mode
            </Text>
            {(["DRIVING", "WALKING", "BICYCLING", "TRANSIT"] as const).map(
              (mode) => (
                <TouchableOpacity
                  key={mode}
                  onPress={() => setRouteMode(mode)}
                  className={`p-2 rounded-lg ${
                    routeMode === mode ? "bg-[#67082F]" : "bg-gray-100"
                  } mb-1 flex-row items-center justify-center`}
                >
                  <MaterialIcons
                    name={
                      mode === "DRIVING"
                        ? "directions-car"
                        : mode === "WALKING"
                        ? "directions-walk"
                        : mode === "BICYCLING"
                        ? "directions-bike"
                        : "directions-transit"
                    }
                    size={14}
                    color={routeMode === mode ? "white" : "#67082F"}
                  />
                  <Text
                    className={`text-xs ml-1 ${
                      routeMode === mode ? "text-white" : "text-gray-700"
                    } font-medium`}
                  >
                    {mode.charAt(0) + mode.slice(1).toLowerCase()}
                  </Text>
                </TouchableOpacity>
              )
            )}
          </View>
        )}

        {/* MapComponent - Always rendered with stable props */}
        <MapComponent
          markers={markers}
          initialRegion={mapRegion}
          showsUserLocation={true}
          followsUserLocation={false}
        >
          {/* Render directions as children of MapComponent for proper Android support */}
          {stableOrigin && stableDestination && mapLoaded && (
            <>
              {(() => {
                console.log("=== NAVIGATION DIRECTIONS DEBUG ===");
                console.log("Platform:", Platform.OS);
                console.log("stableOrigin:", stableOrigin);
                console.log("stableDestination:", stableDestination);
                console.log("routeMode:", routeMode);
                console.log("MapViewDirections available:", !!MapViewDirections);
                console.log("API Key present:", !!process.env.EXPO_PUBLIC_GOOGLE_MAPS_WEB_API_KEY);
                return null;
              })()}
              {Platform.OS !== "web" && MapViewDirections ? (
                <MapViewDirections
                  origin={stableOrigin}
                  destination={stableDestination}
                  apikey={process.env.EXPO_PUBLIC_GOOGLE_MAPS_WEB_API_KEY || ""}
                  strokeWidth={4}
                  strokeColor="#4285F4"
                  mode={routeMode.toLowerCase() as any}
                  onReady={(result: any) => {
                    console.log("🗺️ Native navigation directions ready:", result);
                    if (route === null || !mapLoaded) {
                      setRoute(result);
                    }
                  }}
                  onError={(errorMessage: any) => {
                    console.error("🗺️ Native navigation directions error:", errorMessage);
                  }}
                />
              ) : Platform.OS === "web" ? (
                <MapViewDirectionsWeb
                  origin={stableOrigin}
                  destination={stableDestination}
                  apikey={process.env.EXPO_PUBLIC_GOOGLE_MAPS_WEB_API_KEY || ""}
                  strokeWidth={4}
                  strokeColor="#4285F4"
                  mode={routeMode}
                  onReady={(result: any) => {
                    console.log("🗺️ Web navigation directions ready:", result);
                    if (route === null || !mapLoaded) {
                      setRoute(result);
                    }
                  }}
                  onError={(errorMessage: any) => {
                    console.error("🗺️ Web navigation directions error:", errorMessage);
                  }}
                />
              ) : null}
            </>
          )}
        </MapComponent>
      </View>

      {/* Enhanced Bottom Info Panel */}
      <View className="bg-white shadow-lg border-t border-gray-100 rounded-t-3xl py-4 px-5 w-full">
        <View className="flex-row justify-between items-center mb-3">
          <View className="flex-row items-center">
            <View className="w-3 h-3 rounded-full mr-2 bg-[#67082F]" />
            <Text className="text-lg font-bold text-[#67082F]">
              {userRole === "USER" ? "Responder Status" : "User Status"}
            </Text>
          </View>

          {connectionStatus === "connected" && (
            <View className="px-3 py-1 bg-green-100 rounded-full">
              <Text className="text-xs text-green-700 font-medium">
                Connected
              </Text>
            </View>
          )}

          {connectionStatus === "connecting" && (
            <View className="px-3 py-1 bg-yellow-100 rounded-full">
              <Text className="text-xs text-yellow-700 font-medium">
                Connecting
              </Text>
            </View>
          )}

          {connectionStatus === "disconnected" && (
            <View className="px-3 py-1 bg-red-100 rounded-full">
              <Text className="text-xs text-red-700 font-medium">
                Disconnected
              </Text>
            </View>
          )}
        </View>

        {targetCurrentLocation &&
        targetCurrentLocation.latitude != null &&
        targetCurrentLocation.longitude != null ? (
          <View className="bg-gray-50 rounded-xl p-3 flex-row items-center mb-3">
            <View className="w-10 h-10 rounded-full bg-[#67082F20] items-center justify-center">
              <MaterialIcons
                name={userRole === "USER" ? "local-police" : "person"}
                size={22}
                color="#67082F"
              />
            </View>
            <View className="ml-3">
              <Text className="text-sm font-medium text-gray-900">
                {userRole === "USER" ? "Responder Location" : "User Location"}
              </Text>
              <Text className="text-xs text-gray-500">
                {targetCurrentLocation.latitude.toFixed(6)},{" "}
                {targetCurrentLocation.longitude.toFixed(6)}
              </Text>
            </View>
          </View>
        ) : (
          <View className="bg-gray-50 rounded-xl p-4 flex-row items-center mb-3">
            <ActivityIndicator size="small" color="#67082F" />
            <Text className="ml-3 text-gray-600 font-medium">
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
          <View className="bg-gray-50 rounded-xl p-3">
            <View className="flex-row justify-between items-center">
              <View className="flex-row items-center">
                <MaterialIcons name="directions" size={18} color="#67082F" />
                <Text className="ml-1 font-medium text-sm text-gray-900">
                  Distance
                </Text>
              </View>
              <Text className="font-bold text-sm text-[#67082F]">
                {route.distance !== undefined
                  ? typeof route.distance === "number"
                    ? route.distance.toString()
                    : route.distance.text
                  : "Calculating..."}
              </Text>
            </View>

            <View className="h-[1px] bg-gray-200 my-2" />

            <View className="flex-row justify-between items-center">
              <View className="flex-row items-center">
                <MaterialIcons name="access-time" size={18} color="#67082F" />
                <Text className="ml-1 font-medium text-sm text-gray-900">
                  Duration
                </Text>
              </View>
              <Text className="font-bold text-sm text-[#67082F]">
                {route.duration !== undefined
                  ? typeof route.duration === "number"
                    ? route.duration.toString()
                    : route.duration.text
                  : "Calculating..."}
              </Text>
            </View>
          </View>
        )}
      </View>
    </View>
  );
};

export default NavigationScreen;
