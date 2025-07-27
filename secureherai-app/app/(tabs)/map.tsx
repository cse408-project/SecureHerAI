import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  Platform,
  TouchableOpacity,
  Modal,
  ScrollView,
  Linking,
} from "react-native";
import { MaterialIcons, Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import Header from "../../components/Header";
import MapComponent, {
  MapLocation,
  MapMarker,
  MapPressEvent,
} from "../../components/MapComponent";
import { HeatmapPoint } from "../../components/HeatmapOverlay";
import locationService from "../../services/locationService";
import apiService from "../../services/api";
import { ReportSummary } from "../../types/report";
import { SafePlace } from "../../types/emergencyServices";
import { useAlert } from "../../context/AlertContext";
import NotificationModal from "../../components/NotificationModal";
import WebPlacesInput from "../../components/WebPlacesInput";
import MapViewDirectionsWeb from "../../components/MapViewDirectionsWeb";

// Conditional import for MapViewDirections (only on native platforms)
let MapViewDirections: any = null;
try {
  if (Platform.OS !== "web") {
    MapViewDirections = require("react-native-maps-directions").default;
  }
} catch (error) {
  console.log("MapViewDirections not available on this platform");
}

// Conditional import for GooglePlacesAutocomplete (only on native platforms)
let GooglePlacesAutocomplete: any = null;
try {
  if (Platform.OS !== "web") {
    const GooglePlacesModule = require("react-native-google-places-autocomplete");
    GooglePlacesAutocomplete = GooglePlacesModule.GooglePlacesAutocomplete;
  }
} catch (error) {
  console.log("GooglePlacesAutocomplete not available on this platform");
}

// Extended interface for map markers with report data
interface ExtendedMapMarker extends MapMarker {
  isOwnReport?: boolean;
  reportData?: ReportSummary;
  safePlace?: SafePlace;
}

export default function MapScreen() {
  const { showAlert } = useAlert();
  const [showNotifications, setShowNotifications] = useState(false);
  const mapRef = useRef<any>(null);

  const [currentLocation, setCurrentLocation] = useState<MapLocation | null>(
    null
  );
  const [markers, setMarkers] = useState<ExtendedMapMarker[]>([]);
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<ReportSummary[]>([]);
  const [safePlaces, setSafePlaces] = useState<SafePlace[]>([]);
  const [userReportIds, setUserReportIds] = useState<Set<string>>(new Set());
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [showReports, setShowReports] = useState(true);
  const [showSafePlaces, setShowSafePlaces] = useState(true);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showDropdown, setShowDropdown] = useState(true);

  // New directions functionality
  const [origin, setOrigin] = useState<MapLocation | null>(null);
  const [destination, setDestination] = useState<MapLocation | null>(null);
  const [showDirections, setShowDirections] = useState(false);
  const [distance, setDistance] = useState("");
  const [duration, setDuration] = useState("");
  const [showDirectionsModal, setShowDirectionsModal] = useState(false);
  const [travelMode, setTravelMode] = useState<
    "DRIVING" | "WALKING" | "BICYCLING" | "TRANSIT"
  >("DRIVING");

  // States for controlling the destination field visibility
  const [originSelected, setOriginSelected] = useState(false);
  const [showDestinationField, setShowDestinationField] = useState(false);
  const [originText, setOriginText] = useState("");
  const [destinationText, setDestinationText] = useState("");

  // Map controls
  const [mapType, setMapType] = useState<"standard" | "satellite" | "hybrid">(
    "standard"
  );
  const [showPOIs, setShowPOIs] = useState(false);

  // Helper functions for incident types
  const getIncidentTypeColor = (type: string): string => {
    switch (type) {
      case "harassment":
        return "#DC2626"; // Red
      case "theft":
        return "#7C2D12"; // Brown
      case "assault":
        return "#B91C1C"; // Dark Red
      case "emergency":
        return "#EF4444"; // Bright Red for emergencies
      default:
        return "#6B7280"; // Gray
    }
  };

  const getTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffInHours = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    );

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(
        (now.getTime() - date.getTime()) / (1000 * 60)
      );
      return `${diffInMinutes} minute${diffInMinutes !== 1 ? "s" : ""} ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours !== 1 ? "s" : ""} ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays} day${diffInDays !== 1 ? "s" : ""} ago`;
    }
  };

  // Create heatmap points from reports
  const createHeatmapPoints = (reports: ReportSummary[]): HeatmapPoint[] => {
    return reports.map((report) => {
      // Calculate weight based on incident type severity
      let weight = 0.5; // Base weight
      switch (report.incidentType) {
        case "emergency":
          weight = 1.0; // Highest severity for emergencies
          break;
        case "assault":
          weight = 0.95; // Very high severity
          break;
        case "harassment":
          weight = 0.9;
          break;
        case "theft":
          weight = 0.8;
          break;
        default:
          weight = 0.7;
      }

      return {
        latitude: report.location.latitude,
        longitude: report.location.longitude,
        weight,
        type: report.incidentType,
        timestamp: new Date(report.incidentTime),
      };
    });
  };

  const getIncidentTypeDescription = (type: string): string => {
    switch (type) {
      case "emergency":
        return "🚨 EMERGENCY ALERT: Immediate danger reported in this area. Avoid if possible and contact authorities.";
      case "harassment":
        return "🚨 This area has reported harassment incidents. Exercise caution and consider alternative routes if possible.";
      case "theft":
        return "🚨 Theft incidents reported in this area. Keep valuables secure and stay alert to surroundings.";
      case "assault":
        return "🚨 Physical assault reported. This area may be unsafe, especially during certain hours.";
      default:
        return "⚠️ Safety incident reported in this area. Please exercise appropriate caution.";
    }
  };

  const getCurrentLocation = async () => {
    try {
      const location = await locationService.getCurrentLocation();
      if (location) {
        setCurrentLocation(location.coords);
        showAlert("Location", "Current location updated", "success");
      }
    } catch (error) {
      console.error("Error getting current location:", error);
      showAlert("Error", "Unable to get current location", "error");
    }
  };

  // Handle directions
  const handleDirectionsReady = (result: any) => {
    setDistance(result.distance.toFixed(2) + " km");
    setDuration(result.duration.toFixed(2) + " min");

    // Fit the map to show the entire route
    if (mapRef.current && result.coordinates && result.coordinates.length > 0) {
      // Calculate bounds for reference (not directly used, but useful for debugging)
      // const bounds = {
      //   north: Math.max(...result.coordinates.map((coord: any) => coord.latitude)),
      //   south: Math.min(...result.coordinates.map((coord: any) => coord.latitude)),
      //   east: Math.max(...result.coordinates.map((coord: any) => coord.longitude)),
      //   west: Math.min(...result.coordinates.map((coord: any) => coord.longitude)),
      // };

      mapRef.current.fitToCoordinates(result.coordinates, {
        edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
        animated: true,
      });
    }
  };

  // Initialize location and load reports
  useEffect(() => {
    const initializeLocationAndReports = async () => {
      try {
        // Initialize location first
        const location = await locationService.getCurrentLocation();
        if (location) {
          setCurrentLocation(location.coords);

          // Add a marker for current location
          const currentLocationMarker: ExtendedMapMarker = {
            id: "current-location",
            coordinate: {
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
            },
            title: "Your Location",
            description: "You are here",
            type: "user-location",
            color: "#4285F4",
          };
          setMarkers([currentLocationMarker]);

          // Load safe places from favorite places only
          let allSafePlaces: SafePlace[] = [];

          // Get safe places from favorite places
          const placesResponse = await apiService.getPlaceInfos();
          if (placesResponse.success && placesResponse.data) {
            // Convert favorite places to safe places format
            // Based on FavoritePlaceInfo interface: { id, placeName, longitude, latitude, address, img_url, created_at }
            allSafePlaces =
              placesResponse.data.favoritePlaces?.map((place: any) => ({
                id: place.id,
                placeName: place.placeName, // Primary name field
                name: place.placeName, // For backward compatibility
                type: "safe_zone" as const,
                location: {
                  latitude: parseFloat(place.latitude), // Convert string to number
                  longitude: parseFloat(place.longitude), // Convert string to number
                },
                address: place.address,
                img_url: place.img_url, // Map img_url properly
                created_at: place.created_at,
                verified: true,
              })) || [];
            console.log(
              `Loaded ${allSafePlaces.length} safe places from favorites`
            );
          }

          // Set empty emergency services array and only safe places
          // setEmergencyServices([]);
          setSafePlaces(allSafePlaces);
        }

        // Then load reports
        const [userResponse, publicResponse] = await Promise.all([
          apiService.getUserReports(),
          apiService.getPublicReports(),
        ]);

        let allReports: ReportSummary[] = [];
        const userReportIdSet = new Set<string>();

        if (userResponse.success && userResponse.reports) {
          allReports = [...userResponse.reports];
          // Track user's own report IDs
          userResponse.reports.forEach((report) => {
            userReportIdSet.add(report.reportId);
          });
        }

        if (publicResponse.success && publicResponse.reports) {
          // Filter out duplicates (user's own reports that are also public)
          const userReportIds = new Set(
            userResponse.reports?.map((r) => r.reportId) || []
          );
          const uniquePublicReports = publicResponse.reports.filter(
            (report) => !userReportIds.has(report.reportId)
          );
          allReports = [...allReports, ...uniquePublicReports];
        }

        setUserReportIds(userReportIdSet);
        setReports(allReports);
      } catch (error) {
        console.error("Error initializing map:", error);
        showAlert("Error", "Failed to initialize map", "error");
      } finally {
        setLoading(false);
      }
    };

    initializeLocationAndReports();
  }, [showAlert]);

  // Update markers when display options change
  useEffect(() => {
    const updateMarkers = () => {
      const allMarkers: ExtendedMapMarker[] = [];

      // Add current location marker
      if (currentLocation) {
        allMarkers.push({
          id: "current-location",
          coordinate: {
            latitude: currentLocation.latitude,
            longitude: currentLocation.longitude,
          },
          title: "Your Location",
          description: "You are here",
          type: "user-location",
          color: "#4285F4",
        });
      }

      // Safety mode - show safe places if enabled
      if (showSafePlaces) {
        const safePlaceMarkers = safePlaces.map((place: SafePlace) => ({
          id: place.id,
          coordinate: place.location,
          title: `🛡️ ${place.placeName || place.name}`, // Match report style with emoji
          subtitle: `Safe Zone • ${place.verified ? "Verified" : "Pending"}`,
          description: `${
            place.address || "Verified safe location"
          }\n️ Designated safe space for emergency shelter and quick access assistance.${
            place.phone ? `\n📞 ${place.phone}` : ""
          }`,
          type: place.type || "safe_zone", // Default to safe_zone
          color: "#10B981", // Green for safe places
          img_url: place.img_url, // Use img_url for custom marker image
          safePlace: place,
          onCalloutPress: () => handleSafePlaceDetails(place),
        }));
        allMarkers.push(...safePlaceMarkers);
      }

      // Reports mode - show report markers if enabled
      if (showReports) {
        const reportMarkers = reports
          .filter(
            (report) =>
              report.location &&
              report.location.latitude &&
              report.location.longitude
          )
          .map((report) => {
            // console.log("Processing report:", report.reportId);
            const reportDate = new Date(report.incidentTime);
            const timeAgo = getTimeAgo(reportDate);
            const isRecent =
              new Date().getTime() - reportDate.getTime() < 24 * 60 * 60 * 1000; // Less than 24 hours
            const isOwnReport = userReportIds.has(report.reportId);

            return {
              id: report.reportId,
              isOwnReport: isOwnReport,
              coordinate: {
                latitude: report.location.latitude,
                longitude: report.location.longitude,
              },
              title: `${isOwnReport ? "🌟 MY REPORT: " : "🚨 "}${
                report.incidentType.charAt(0).toUpperCase() +
                report.incidentType.slice(1)
              }`,
              subtitle: `${report.visibility} • ${timeAgo}${
                isRecent ? " • 🔴" : ""
              }${isOwnReport ? " • 🌟 YOURS" : ""}`,
              description: `${
                report.description
              }\n\n${getIncidentTypeDescription(report.incidentType)}\n\n� ${
                report.visibility
              }${report.anonymous ? " • 🔒 ANONYMOUS" : ""}${
                isOwnReport ? " • 🌟 YOUR REPORT" : ""
              } • ⏰ ${timeAgo}${isRecent ? " • 🔴 RECENT" : ""}`,
              reportData: report,
              type: report.incidentType as any,
              color: getIncidentTypeColor(report.incidentType),
              onCalloutPress: () => handleReportDetails(report),
            };
          });

        console.log("Total report markers: ", reportMarkers.length);
        allMarkers.push(...reportMarkers);
      }

      setMarkers(allMarkers);
    };

    updateMarkers();
  }, [
    showReports,
    showSafePlaces,
    safePlaces,
    reports,
    currentLocation,
    userReportIds,
  ]);

  const handleMapPress = (event: MapPressEvent) => {
    // Map press functionality disabled - no more custom marker creation
    console.log("Map pressed at:", event.nativeEvent.coordinate);
  };

  const handleReportDetails = (report: ReportSummary) => {
    // Navigate to report details page
    router.push(`/reports/details?id=${report.reportId}` as any);
  };

  const handleSafePlaceDetails = (place: SafePlace) => {
    // Navigate to place details page
    router.push(`/places/details?id=${place.id}` as any);
  };

  // Expose functions to global scope for HTML links (web only)
  React.useEffect(() => {
    if (Platform.OS === "web") {
      (window as any).handleReportDetails = (reportId: string) => {
        router.push(`/reports/details?id=${reportId}` as any);
      };

      (window as any).handleSafePlaceDetails = (placeId: string) => {
        const place = safePlaces.find((p) => p.id === placeId);
        if (place) {
          handleSafePlaceDetails(place);
        }
      };
    }
  });

  // Update route when travel mode changes
  useEffect(() => {
    if (showDirections && origin && destination) {
      // Re-render directions with the new travel mode
      setOrigin({ ...origin, mode: travelMode.toLowerCase() });
    }
  }, [travelMode, origin, destination, showDirections]);

  const handleMarkerPress = (marker: ExtendedMapMarker) => {
    // This function is now mainly for the current location marker
    // Reports and safe places will use callouts instead
    if (marker.id === "current-location") {
      showAlert(
        marker.title || "Your Location",
        marker.description || "This is your current location",
        "info"
      );
    }
  };

  return (
    <>
      <View
        className="flex-1 bg-[#FFE4D6] max-w-screen-md mx-auto w-full"
        style={{
          // Ensure proper stacking context for web dropdowns
          ...(Platform.OS === "web" && {
            isolation: "isolate" as any,
          }),
        }}
      >
        <Header
          title={`Safety Map${
            showReports && showSafePlaces
              ? " - Reports & Safety"
              : showReports
              ? " - Reports"
              : showSafePlaces
              ? " - Emergency Services"
              : " - No Filters"
          }`}
          onNotificationPress={() => setShowNotifications(true)}
          showNotificationDot={false}
        />

        {/* Map Controls */}
        {/* Directions Section */}
        <View
          className="bg-white mx-4 mb-2 p-3 rounded-lg shadow-sm"
          style={{
            zIndex: 10000,
            // Ensure overflow is visible for dropdowns on web
            ...(Platform.OS === "web" && {
              overflow: "visible" as any,
            }),
          }}
        >
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-sm font-semibold text-gray-700">
              Navigation
            </Text>
            {showDirections && (
              <View className="flex-row items-center">
                <TouchableOpacity
                  onPress={() => setShowDirectionsModal(true)}
                  className="mr-2 bg-[#67082F] rounded-md px-2 py-1"
                >
                  <Text className="text-white text-xs font-medium">
                    {distance} • {duration}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    setShowDirections(false);
                    setOrigin(null);
                    setDestination(null);
                    setOriginSelected(false);
                    setShowDestinationField(false);
                    setOriginText("");
                    setDestinationText("");
                    // Remove navigation markers
                    setMarkers((prevMarkers) =>
                      prevMarkers.filter(
                        (marker) =>
                          marker.id !== "origin" && marker.id !== "destination"
                      )
                    );
                  }}
                  className="bg-gray-200 rounded-full p-1"
                >
                  <MaterialIcons name="close" size={12} color="#67082F" />
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Origin Input Field Row */}
          <View
            className="mb-3 flex-row items-center space-x-2"
            style={{
              zIndex: 20000,
              position: "relative",
            }}
          >
            {/* Input Field - Takes most of the space */}
            <View className="flex-1">
              {GooglePlacesAutocomplete && Platform.OS !== "web" ? (
                <GooglePlacesAutocomplete
                  placeholder="Enter starting point"
                  fetchDetails={true}
                  onPress={(data: any, details: any = null) => {
                    if (details?.geometry?.location) {
                      const location = {
                        latitude: details.geometry.location.lat,
                        longitude: details.geometry.location.lng,
                      };
                      setOrigin(location);
                      setOriginSelected(true);

                      // Create or update origin marker
                      const originMarker: ExtendedMapMarker = {
                        id: "origin",
                        coordinate: location,
                        title:
                          data.structured_formatting?.main_text || "Origin",
                        description: data.description || "",
                        type: "custom", // Changed from "general" to a valid type
                        color: "#4285F4", // Blue
                      };

                      // Filter out any existing origin marker
                      setMarkers((prevMarkers) => [
                        ...prevMarkers.filter(
                          (marker) =>
                            marker.id !== "origin" &&
                            marker.id !== "destination"
                        ),
                        originMarker,
                        ...(destination
                          ? [
                              {
                                id: "destination",
                                coordinate: destination,
                                title: "Destination",
                                description: "",
                                type: "custom", // Changed from "general" to a valid type
                                color: "#EA4335", // Red
                              } as ExtendedMapMarker,
                            ]
                          : []),
                      ]);

                      if (destination) {
                        setShowDirections(true);
                      }
                    }
                  }}
                  query={{
                    key: process.env.EXPO_PUBLIC_GOOGLE_MAPS_WEB_API_KEY || "",
                    language: "en",
                    components: "country:bd",
                  }}
                  styles={{
                    container: {
                      flex: 1,
                      marginBottom: 8,
                      zIndex: 20000,
                    },
                    textInputContainer: {
                      backgroundColor: "rgba(0,0,0,0)",
                      borderTopWidth: 0,
                      borderBottomWidth: 0,
                    },
                    textInput: {
                      marginLeft: 0,
                      marginRight: 0,
                      height: 40,
                      color: "#5d5d5d",
                      fontSize: 14,
                      borderWidth: 1,
                      borderColor: "#ddd",
                      borderRadius: 8,
                    },
                    predefinedPlacesDescription: {
                      color: "#1faadb",
                    },
                    listView: {
                      position: "absolute",
                      top: 40,
                      left: 0,
                      right: 0,
                      backgroundColor: "white",
                      borderRadius: 5,
                      elevation: 3,
                      zIndex: 20001,
                    },
                    row: {
                      padding: 13,
                      height: 50,
                      flexDirection: "row",
                    },
                    separator: {
                      height: 0.5,
                      backgroundColor: "#c8c7cc",
                    },
                    description: {
                      fontSize: 14,
                    },
                  }}
                  currentLocation={true}
                  currentLocationLabel="Current location"
                  enablePoweredByContainer={false}
                />
              ) : (
                <WebPlacesInput
                  placeholder="Enter starting point"
                  currentLocation={currentLocation || undefined}
                  safePlaces={safePlaces}
                  zIndexBase={20000}
                  value={originText}
                  onValueChange={setOriginText}
                  onPlaceSelect={(place) => {
                    console.log("=== ORIGIN PLACE SELECTED IN MAP ===");
                    console.log("Place received:", place);
                    console.log("Has geometry:", !!place.geometry);
                    console.log("Has location:", !!place.geometry?.location);

                    if (place.geometry?.location) {
                      const location = {
                        latitude: place.geometry.location.lat(),
                        longitude: place.geometry.location.lng(),
                      };
                      console.log("Setting origin to:", location);
                      setOrigin(location);
                      setOriginSelected(true);

                      // Create or update origin marker
                      const originMarker: ExtendedMapMarker = {
                        id: "origin",
                        coordinate: location,
                        title: place.name || "Origin",
                        description: place.formatted_address || "",
                        type: "custom",
                        color: "#00EE55",
                      };

                      console.log("Creating origin marker:", originMarker);
                      setMarkers((prevMarkers) => {
                        const newMarkers = [
                          ...prevMarkers.filter(
                            (marker) =>
                              marker.id !== "origin" &&
                              marker.id !== "destination"
                          ),
                          originMarker,
                          ...(destination
                            ? [
                                {
                                  id: "destination",
                                  coordinate: destination,
                                  title: "Destination",
                                  description: "",
                                  type: "custom",
                                  color: "#00EE55",
                                } as ExtendedMapMarker,
                              ]
                            : []),
                        ];
                        console.log("Updated markers array:", newMarkers);
                        return newMarkers;
                      });

                      if (destination) {
                        setShowDirections(true);
                      }
                    }
                  }}
                />
              )}
            </View>

            {/* Dropdown Button - shows beside the input field after origin is selected */}
            {originSelected && (
              <TouchableOpacity
                onPress={() => setShowDestinationField(!showDestinationField)}
                className="bg-gray-100 rounded-lg p-2"
                style={{ height: 40, justifyContent: "center" }}
              >
                <MaterialIcons
                  name={
                    showDestinationField
                      ? "keyboard-arrow-up"
                      : "keyboard-arrow-down"
                  }
                  size={24}
                  color="#67082F"
                />
              </TouchableOpacity>
            )}
          </View>

          {/* Destination Field - shows when dropdown is opened */}
          {originSelected && showDestinationField && (
            <View
              className="mb-2 flex-row items-center space-x-2"
              style={{
                zIndex: 15000, // Lower z-index than first field but high enough for proper suggestions
                position: "relative",
              }}
            >
              {/* Destination Input Field - Takes most of the space */}
              <View className="flex-1">
                {GooglePlacesAutocomplete && Platform.OS !== "web" ? (
                  <GooglePlacesAutocomplete
                    placeholder="Enter destination"
                    fetchDetails={true}
                    onPress={(data: any, details: any = null) => {
                      if (details?.geometry?.location) {
                        const location = {
                          latitude: details.geometry.location.lat,
                          longitude: details.geometry.location.lng,
                        };
                        setDestination(location);

                        // Create or update destination marker
                        const destinationMarker: ExtendedMapMarker = {
                          id: "destination",
                          coordinate: location,
                          title:
                            data.structured_formatting?.main_text ||
                            "Destination",
                          description: data.description || "",
                          type: "custom", // Changed from "general" to a valid type
                          color: "#EA4335", // Red
                        };

                        // Filter out any existing destination marker
                        setMarkers((prevMarkers) => [
                          ...prevMarkers.filter(
                            (marker) => marker.id !== "destination"
                          ),
                          destinationMarker,
                          ...(origin &&
                          !prevMarkers.some((marker) => marker.id === "origin")
                            ? [
                                {
                                  id: "origin",
                                  coordinate: origin,
                                  title: "Origin",
                                  description: "",
                                  type: "custom", // Changed from "general" to a valid type
                                  color: "#EA4335", // Blue
                                } as ExtendedMapMarker,
                              ]
                            : []),
                        ]);
                      }
                    }}
                    query={{
                      key:
                        process.env.EXPO_PUBLIC_GOOGLE_MAPS_WEB_API_KEY || "",
                      language: "en",
                      components: "country:bd",
                    }}
                    styles={{
                      container: {
                        flex: 1,
                        zIndex: 15000,
                      },
                      textInputContainer: {
                        backgroundColor: "rgba(0,0,0,0)",
                        borderTopWidth: 0,
                        borderBottomWidth: 0,
                      },
                      textInput: {
                        marginLeft: 0,
                        marginRight: 0,
                        height: 40,
                        color: "#5d5d5d",
                        fontSize: 14,
                        borderWidth: 1,
                        borderColor: "#ddd",
                        borderRadius: 8,
                      },
                      predefinedPlacesDescription: {
                        color: "#1faadb",
                      },
                      listView: {
                        position: "absolute",
                        top: 40,
                        left: 0,
                        right: 0,
                        backgroundColor: "white",
                        borderRadius: 5,
                        elevation: 3,
                        zIndex: 15001,
                      },
                      row: {
                        padding: 13,
                        height: 50,
                        flexDirection: "row",
                      },
                      separator: {
                        height: 0.5,
                        backgroundColor: "#c8c7cc",
                      },
                      description: {
                        fontSize: 14,
                      },
                    }}
                    enablePoweredByContainer={false}
                  />
                ) : (
                  <WebPlacesInput
                    placeholder="Enter destination"
                    currentLocation={currentLocation || undefined}
                    safePlaces={safePlaces}
                    zIndexBase={15000} // High enough for proper suggestions display
                    dropdownOffset={0} // No offset needed now since fields are properly separated
                    value={destinationText}
                    onValueChange={setDestinationText}
                    onPlaceSelect={(place) => {
                      console.log("=== DESTINATION PLACE SELECTED IN MAP ===");
                      console.log("Place received:", place);
                      console.log("Has geometry:", !!place.geometry);
                      console.log("Has location:", !!place.geometry?.location);

                      if (place.geometry?.location) {
                        const location = {
                          latitude: place.geometry.location.lat(),
                          longitude: place.geometry.location.lng(),
                        };
                        console.log("Setting destination to:", location);
                        setDestination(location);

                        // Create or update destination marker with RED color
                        const destinationMarker: ExtendedMapMarker = {
                          id: "destination",
                          coordinate: location,
                          title: place.name || "Destination",
                          description: place.formatted_address || "",
                          type: "custom",
                          color: "#EA4335", // RED for destination
                        };

                        console.log(
                          "Creating destination marker:",
                          destinationMarker
                        );
                        setMarkers((prevMarkers) => {
                          const newMarkers = [
                            ...prevMarkers.filter(
                              (marker) => marker.id !== "destination"
                            ),
                            destinationMarker,
                            ...(origin &&
                            !prevMarkers.some(
                              (marker) => marker.id === "origin"
                            )
                              ? [
                                  {
                                    id: "origin",
                                    coordinate: origin,
                                    title: "Origin",
                                    description: "",
                                    type: "custom",
                                    color: "#4285F4", // BLUE for origin
                                  } as ExtendedMapMarker,
                                ]
                              : []),
                          ];
                          console.log("Updated markers array:", newMarkers);
                          return newMarkers;
                        });
                      }
                    }}
                  />
                )}
              </View>

              {/* Navigation Button - shows beside destination field when destination is set */}
              {destination && (
                <TouchableOpacity
                  onPress={() => {
                    console.log("Navigation button pressed!");
                    console.log("Origin:", origin);
                    console.log("Destination:", destination);
                    if (origin && destination) {
                      setShowDirections(true);
                      console.log(
                        "Showing directions between origin and destination"
                      );
                    }
                  }}
                  className="bg-[#67082F] rounded-lg p-2"
                  style={{ height: 40, justifyContent: "center" }}
                >
                  <MaterialIcons name="directions" size={24} color="white" />
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        {/* Map Controls Section */}
        <View className="bg-white mx-4 mb-2 p-3 rounded-lg shadow-sm">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-sm font-semibold text-gray-700">
              Map Display Options
            </Text>
            <Text className="text-xs text-gray-500">
              {reports.length} report{reports.length !== 1 ? "s" : ""} •{" "}
              {safePlaces.length} safe places
            </Text>
          </View>

          <View className="flex-row justify-between items-start space-x-3">
            {/* Filter Button */}
            <TouchableOpacity
              className="flex-1 flex-row items-center justify-center py-2.5 px-3 bg-[#67082F] rounded-lg"
              onPress={() => setShowFilterModal(true)}
            >
              <MaterialIcons name="filter-list" size={16} color="white" />
              <Text className="text-white text-sm font-medium ml-1">
                Filters
              </Text>
              <View className="ml-2 bg-white/20 px-1.5 py-0.5 rounded-full">
                <Text className="text-white text-xs font-medium">
                  {(showReports ? 1 : 0) +
                    (showSafePlaces ? 1 : 0) +
                    (showHeatmap ? 1 : 0) +
                    (showPOIs ? 1 : 0)}
                </Text>
              </View>
            </TouchableOpacity>

            {/* Manage Button */}
            <TouchableOpacity
              className="flex-1 flex-row items-center justify-center py-2.5 px-3 bg-[#67082F] rounded-lg"
              onPress={() => router.push("/places/manage" as any)}
            >
              <MaterialIcons name="edit-location" size={16} color="white" />
              <Text className="text-white text-sm font-medium ml-1">
                Manage Safe Places
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View className="flex-1 pb-20 relative">
          {loading ? (
            <View className="flex-1 items-center justify-center">
              <Text className="text-gray-600">Loading map...</Text>
            </View>
          ) : (
            <>
              <MapComponent
                ref={mapRef}
                initialRegion={currentLocation || undefined}
                markers={markers}
                heatmapPoints={createHeatmapPoints(reports)}
                showHeatmap={showHeatmap}
                onPress={handleMapPress}
                onMarkerPress={handleMarkerPress}
                onCalloutPress={(marker) => {
                  const extended = marker as ExtendedMapMarker;
                  if (extended.reportData) {
                    handleReportDetails(extended.reportData);
                  } else if (extended.safePlace) {
                    handleSafePlaceDetails(extended.safePlace);
                  }
                }}
                showsUserLocation={true}
                followsUserLocation={false}
                // Built-in React Native Maps features:
                showsPointsOfInterest={showPOIs} // Toggle POIs on/off
                showsBuildings={true} // Show building outlines
                showsTraffic={false} // Keep traffic off to avoid distraction
                showsMyLocationButton={Platform.OS === "android"} // Android location button
                mapType={mapType} // Uses your mapType state
                showsCompass={true} // Show compass control
                // Scale can be cluttering
                className="flex-1"
              >
                {showDirections && origin && destination && (
                  <>
                    {Platform.OS !== "web" && MapViewDirections ? (
                      <MapViewDirections
                        origin={origin}
                        destination={destination}
                        apikey={
                          process.env.EXPO_PUBLIC_GOOGLE_MAPS_WEB_API_KEY || ""
                        }
                        strokeWidth={4}
                        strokeColor="#4285F4"
                        mode={travelMode.toLowerCase() as any}
                        onReady={handleDirectionsReady}
                      />
                    ) : Platform.OS === "web" ? (
                      <MapViewDirectionsWeb
                        origin={origin}
                        destination={destination}
                        apikey={
                          process.env.EXPO_PUBLIC_GOOGLE_MAPS_WEB_API_KEY || ""
                        }
                        strokeWidth={4}
                        strokeColor="#4285F4"
                        mode={travelMode}
                        onReady={handleDirectionsReady}
                      />
                    ) : null}
                  </>
                )}
              </MapComponent>
              {/* Map Controls - Right Side */}
              <View className="absolute top-20 right-4 z-10 space-y-2">
                {/* Current Location Button */}
                <TouchableOpacity
                  onPress={getCurrentLocation}
                  className="bg-white p-3 rounded-full shadow-lg border border-gray-200"
                >
                  <Ionicons name="locate" size={24} color="#6366F1" />
                </TouchableOpacity>

                {/* Map Type Toggle */}
                <TouchableOpacity
                  onPress={() =>
                    setMapType(
                      mapType === "standard" ? "satellite" : "standard"
                    )
                  }
                  className="bg-white p-3 rounded-full shadow-lg border border-gray-200"
                >
                  <Ionicons name="layers" size={24} color="#6366F1" />
                </TouchableOpacity>
              </View>

              {/* Web Attribution */}
              {Platform.OS === "web" && (
                <View className="absolute bottom-2 left-2 bg-white/80 p-2 rounded">
                  <Text className="text-xs text-gray-600">
                    Web map powered by Google Maps JS API
                  </Text>
                </View>
              )}
            </>
          )}

          {/* Legend Button - Top Right */}
          {(reports.length > 0 || safePlaces.length > 0) && (
            <View className="absolute top-20 left-4 z-20">
              <TouchableOpacity
                className="bg-white/95 p-3 rounded-full shadow-lg border border-gray-200"
                onPress={() => setShowDropdown(!showDropdown)}
              >
                <MaterialIcons name="info" size={20} color="#67082F" />
              </TouchableOpacity>

              {/* Legend Dropdown */}
              {showDropdown && (
                <View className="absolute top-12 left-0 bg-white/95 backdrop-blur-sm p-4 rounded-xl shadow-lg border border-gray-200 min-w-[280px] max-w-[320px]">
                  <View className="flex-row justify-between items-center mb-3">
                    <Text className="text-sm font-semibold text-gray-800">
                      Map Legend
                    </Text>
                    <TouchableOpacity
                      onPress={() => setShowDropdown(false)}
                      className="p-1"
                    >
                      <MaterialIcons name="close" size={16} color="#6B7280" />
                    </TouchableOpacity>
                  </View>

                  <View className="flex-row">
                    {/* Legend Column */}
                    <View className="flex-1 pr-3">
                      {showReports && (
                        <>
                          <View className="flex-row items-center mb-1">
                            <Text className="text-sm mr-2">🚨</Text>
                            <Text className="text-xs text-gray-600">
                              Harassment
                            </Text>
                          </View>
                          <View className="flex-row items-center mb-1">
                            <Text className="text-sm mr-2">💰</Text>
                            <Text className="text-xs text-gray-600">Theft</Text>
                          </View>
                          <View className="flex-row items-center mb-1">
                            <Text className="text-sm mr-2">⚠️</Text>
                            <Text className="text-xs text-gray-600">
                              Assault
                            </Text>
                          </View>
                          <View className="flex-row items-center mb-1">
                            <Text className="text-sm mr-2">🆘</Text>
                            <Text className="text-xs text-gray-600">
                              Emergency
                            </Text>
                          </View>
                        </>
                      )}

                      {showSafePlaces && (
                        <>
                          <View className="flex-row items-center mb-1">
                            <Text className="text-sm mr-2">🛡️</Text>
                            <Text className="text-xs text-gray-600">
                              Safe Place
                            </Text>
                          </View>
                        </>
                      )}

                      <View className="flex-row items-center mb-2">
                        <Text className="text-sm mr-2">📍</Text>
                        <Text className="text-xs text-gray-600">
                          Your Location
                        </Text>
                      </View>
                    </View>

                    {/* Statistics Column */}
                    <View className="flex-1 pl-3 border-l border-gray-200">
                      {/* <Text className="text-xs font-semibold text-gray-700 mb-2">
                        Statistics
                      </Text> */}

                      {showReports && reports.length > 0 && (
                        <>
                          <View className="flex-row justify-between mb-1">
                            <Text className="text-xs text-gray-600">
                              Total:
                            </Text>
                            <Text className="text-xs font-medium text-red-600">
                              {reports.length}
                            </Text>
                          </View>
                          <View className="flex-row justify-between mb-1">
                            <Text className="text-xs text-gray-600">
                              Harassment:
                            </Text>
                            <Text className="text-xs font-medium">
                              {
                                reports.filter(
                                  (r) => r.incidentType === "harassment"
                                ).length
                              }
                            </Text>
                          </View>
                          <View className="flex-row justify-between mb-1">
                            <Text className="text-xs text-gray-600">
                              Theft:
                            </Text>
                            <Text className="text-xs font-medium">
                              {
                                reports.filter(
                                  (r) => r.incidentType === "theft"
                                ).length
                              }
                            </Text>
                          </View>
                          <View className="flex-row justify-between mb-2">
                            <Text className="text-xs text-gray-600">
                              Assault:
                            </Text>
                            <Text className="text-xs font-medium">
                              {
                                reports.filter(
                                  (r) => r.incidentType === "assault"
                                ).length
                              }
                            </Text>
                          </View>
                          <View className="flex-row justify-between mb-2">
                            <Text className="text-xs text-gray-600">
                              Emergency:
                            </Text>
                            <Text className="text-xs font-medium">
                              {
                                reports.filter(
                                  (r) => r.incidentType === "emergency"
                                ).length
                              }
                            </Text>
                          </View>
                        </>
                      )}

                      {showSafePlaces && safePlaces.length > 0 && (
                        <View className="flex-row justify-between">
                          <Text className="text-xs text-gray-600">
                            Safe Places:
                          </Text>
                          <Text className="text-xs font-medium text-green-600">
                            {safePlaces.length}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                </View>
              )}
            </View>
          )}

          {showHeatmap && reports.length > 0 && (
            <View className="absolute bottom-20 left-2 right-2 bg-orange-50/90 p-3 rounded-lg shadow-sm border border-orange-200">
              <Text className="text-xs font-semibold text-orange-800 mb-1">
                🔥 Incident Density Heatmap
              </Text>
              <Text className="text-xs text-orange-700">
                Colored circles show areas with high incident activity.
                Darker/larger circles indicate higher severity or frequency of
                reported incidents. Red zones show the highest risk areas.
              </Text>
            </View>
          )}
        </View>

        {/* Filter Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={showFilterModal}
          onRequestClose={() => setShowFilterModal(false)}
        >
          <View className="flex-1 bg-black/50 justify-center items-center">
            <View className="bg-white rounded-lg p-6 m-4 w-11/12 max-w-md max-h-4/5">
              <View className="flex-row justify-between items-center mb-4">
                <Text className="text-lg font-bold text-[#67082F]">
                  Map Filters
                </Text>
                <TouchableOpacity
                  onPress={() => setShowFilterModal(false)}
                  className="p-1 rounded-full"
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <MaterialIcons name="close" size={24} color="#6B7280" />
                </TouchableOpacity>
              </View>

              <ScrollView
                showsVerticalScrollIndicator={false}
                className="flex-1"
              >
                {/* Display Options Section */}
                <Text className="text-sm font-semibold text-gray-700 mb-2">
                  Display Options
                </Text>

                {/* Reports Filter */}
                <TouchableOpacity
                  className={`flex-row items-center px-3 py-3 rounded-lg mb-3 border ${
                    showReports
                      ? "bg-red-50 border-red-200 border-2"
                      : "bg-gray-100 border-gray-200"
                  }`}
                  onPress={() => setShowReports(!showReports)}
                >
                  <MaterialIcons
                    name="report"
                    size={20}
                    color={showReports ? "#DC2626" : "#6B7280"}
                    style={{ marginRight: 12 }}
                  />
                  <View className="flex-1">
                    <Text
                      className={`text-sm font-medium ${
                        showReports ? "text-red-700" : "text-gray-700"
                      }`}
                    >
                      Incident Reports
                    </Text>
                    <Text className="text-xs text-gray-500">
                      {reports.length} report{reports.length !== 1 ? "s" : ""}{" "}
                      available
                    </Text>
                  </View>
                  <MaterialIcons
                    name={
                      showReports ? "check-circle" : "radio-button-unchecked"
                    }
                    size={20}
                    color={showReports ? "#DC2626" : "#9CA3AF"}
                  />
                </TouchableOpacity>

                {/* Safe Places Filter */}
                <TouchableOpacity
                  className={`flex-row items-center px-3 py-3 rounded-lg mb-3 border ${
                    showSafePlaces
                      ? "bg-green-50 border-green-200 border-2"
                      : "bg-gray-100 border-gray-200"
                  }`}
                  onPress={() => setShowSafePlaces(!showSafePlaces)}
                >
                  <MaterialIcons
                    name="shield"
                    size={20}
                    color={showSafePlaces ? "#059669" : "#6B7280"}
                    style={{ marginRight: 12 }}
                  />
                  <View className="flex-1">
                    <Text
                      className={`text-sm font-medium ${
                        showSafePlaces ? "text-green-700" : "text-gray-700"
                      }`}
                    >
                      Safe Places
                    </Text>
                    <Text className="text-xs text-gray-500">
                      {safePlaces.length} safe place
                      {safePlaces.length !== 1 ? "s" : ""} available
                    </Text>
                  </View>
                  <MaterialIcons
                    name={
                      showSafePlaces ? "check-circle" : "radio-button-unchecked"
                    }
                    size={20}
                    color={showSafePlaces ? "#059669" : "#9CA3AF"}
                  />
                </TouchableOpacity>

                {/* Heatmap Option */}
                <TouchableOpacity
                  className={`flex-row items-center px-3 py-3 rounded-lg mb-3 border ${
                    showHeatmap
                      ? "bg-orange-50 border-orange-200 border-2"
                      : "bg-gray-100 border-gray-200"
                  }`}
                  onPress={() => setShowHeatmap(!showHeatmap)}
                >
                  <View className="flex-1">
                    <View className="flex-row items-center mb-1">
                      <MaterialIcons
                        name="whatshot"
                        size={16}
                        color={showHeatmap ? "#EA580C" : "#6B7280"}
                        style={{ marginRight: 8 }}
                      />
                      <Text className="text-sm font-medium text-gray-900">
                        Density Areas
                      </Text>
                    </View>
                    <Text className="text-xs text-gray-500">
                      Highlight high activity areas
                    </Text>
                  </View>
                  <View className="ml-4">
                    <MaterialIcons
                      name={
                        showHeatmap ? "check-circle" : "radio-button-unchecked"
                      }
                      size={20}
                      color={showHeatmap ? "#EA580C" : "#9CA3AF"}
                    />
                  </View>
                </TouchableOpacity>

                {/* Points of Interest Option */}
                <TouchableOpacity
                  className={`flex-row items-center px-3 py-3 rounded-lg mb-3 border ${
                    showPOIs
                      ? "bg-blue-50 border-blue-200 border-2"
                      : "bg-gray-100 border-gray-200"
                  }`}
                  onPress={() => setShowPOIs(!showPOIs)}
                >
                  <View className="flex-1">
                    <View className="flex-row items-center mb-1">
                      <MaterialIcons
                        name="place"
                        size={16}
                        color={showPOIs ? "#2563EB" : "#6B7280"}
                        style={{ marginRight: 8 }}
                      />
                      <Text className="text-sm font-medium text-gray-900">
                        Points of Interest
                      </Text>
                    </View>
                    <Text className="text-xs text-gray-500">
                      Show restaurants, shops, and other places
                    </Text>
                  </View>
                  <View className="ml-4">
                    <MaterialIcons
                      name={
                        showPOIs ? "check-circle" : "radio-button-unchecked"
                      }
                      size={20}
                      color={showPOIs ? "#2563EB" : "#9CA3AF"}
                    />
                  </View>
                </TouchableOpacity>
              </ScrollView>

              {/* Action Buttons */}
              <View className="flex-row justify-between space-x-3 mt-6 pt-4 border-t border-gray-200">
                <TouchableOpacity
                  className="flex-1 px-4 py-3 bg-gray-100 rounded-lg mr-2"
                  onPress={() => {
                    setShowReports(false);
                    setShowSafePlaces(false);
                    setShowHeatmap(false);
                    setShowPOIs(false);
                  }}
                >
                  <Text className="text-center text-gray-700 font-medium">
                    Clear All
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  className="flex-1 px-4 py-3 bg-[#67082F] rounded-lg ml-2"
                  onPress={() => setShowFilterModal(false)}
                >
                  <Text className="text-center text-white font-semibold">
                    Apply
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
      <NotificationModal
        visible={showNotifications}
        onClose={() => setShowNotifications(false)}
      />

      {/* Directions Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showDirectionsModal}
        onRequestClose={() => setShowDirectionsModal(false)}
      >
        <View className="flex-1 bg-black/50 justify-center items-center">
          <View className="bg-white rounded-lg p-6 m-4 w-11/12 max-w-md">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-lg font-bold text-[#67082F]">
                Route Information
              </Text>
              <TouchableOpacity
                onPress={() => setShowDirectionsModal(false)}
                className="p-1 rounded-full"
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <MaterialIcons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <View className="mb-4">
              <View className="mb-3">
                <Text className="text-gray-500 text-sm mb-1">From</Text>
                <Text className="text-gray-800 font-medium">
                  {origin
                    ? `${origin.latitude.toFixed(
                        4
                      )}, ${origin.longitude.toFixed(4)}`
                    : "Current Location"}
                </Text>
              </View>

              <View className="mb-4">
                <Text className="text-gray-500 text-sm mb-1">To</Text>
                <Text className="text-gray-800 font-medium">
                  {destination
                    ? `${destination.latitude.toFixed(
                        4
                      )}, ${destination.longitude.toFixed(4)}`
                    : ""}
                </Text>
              </View>

              <View className="flex-row items-center mb-2">
                <MaterialIcons
                  name="access-time"
                  size={20}
                  color="#67082F"
                  style={{ marginRight: 8 }}
                />
                <Text className="text-gray-700 text-base font-medium">
                  Estimated Time:
                </Text>
                <Text className="text-gray-800 text-base font-bold ml-2">
                  {duration}
                </Text>
              </View>

              <View className="flex-row items-center mb-4">
                <MaterialIcons
                  name="straighten"
                  size={20}
                  color="#67082F"
                  style={{ marginRight: 8 }}
                />
                <Text className="text-gray-700 text-base font-medium">
                  Distance:
                </Text>
                <Text className="text-gray-800 text-base font-bold ml-2">
                  {distance}
                </Text>
              </View>

              <View className="mb-4">
                <Text className="text-gray-700 text-base mb-2">
                  <MaterialIcons
                    name="directions"
                    size={20}
                    color="#67082F"
                    style={{ marginRight: 8 }}
                  />
                  Travel Mode:
                </Text>
                <View className="flex-row flex-wrap">
                  {["DRIVING", "WALKING", "BICYCLING", "TRANSIT"].map(
                    (mode) => (
                      <TouchableOpacity
                        key={mode}
                        className={`mr-2 mb-2 py-2 px-3 rounded-full ${
                          mode === travelMode ? "bg-[#67082F]" : "bg-gray-200"
                        }`}
                        onPress={() => {
                          setTravelMode(
                            mode as
                              | "DRIVING"
                              | "WALKING"
                              | "BICYCLING"
                              | "TRANSIT"
                          );
                          if (origin) {
                            setOrigin({ ...origin, mode });
                          }
                        }}
                      >
                        <Text
                          className={`${
                            mode === travelMode ? "text-white" : "text-gray-800"
                          } text-xs font-medium`}
                        >
                          {mode.charAt(0) + mode.slice(1).toLowerCase()}
                        </Text>
                      </TouchableOpacity>
                    )
                  )}
                </View>
              </View>
            </View>

            <View className="flex-row space-x-2">
              <TouchableOpacity
                className="bg-gray-200 py-3 rounded-lg flex-1"
                onPress={() => setShowDirectionsModal(false)}
              >
                <Text className="text-gray-800 text-center font-semibold">
                  Close
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="bg-[#67082F] py-3 rounded-lg flex-1"
                onPress={() => {
                  // Open in external maps app with the right travel mode
                  const mode = origin?.mode?.toLowerCase() || "driving";
                  const url = Platform.select({
                    ios: `maps:0,0?saddr=${origin?.latitude},${
                      origin?.longitude
                    }&daddr=${destination?.latitude},${
                      destination?.longitude
                    }&dirflg=${
                      mode === "driving"
                        ? "d"
                        : mode === "walking"
                        ? "w"
                        : mode === "bicycling"
                        ? "b"
                        : mode === "transit"
                        ? "r"
                        : "d"
                    }`,
                    android: `google.navigation:q=${destination?.latitude},${destination?.longitude}&mode=${mode}`,
                  });

                  if (url) {
                    Linking.openURL(url).catch((err) =>
                      showAlert(
                        "Error",
                        "Could not open navigation app",
                        "error"
                      )
                    );
                  }
                }}
              >
                <Text className="text-white text-center font-semibold">
                  Navigate
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}
