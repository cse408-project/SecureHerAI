import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Platform,
  TouchableOpacity,
  Modal,
  ScrollView,
  TextInput,
  ActivityIndicator,
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

// Extended interface for map markers with report data
interface ExtendedMapMarker extends MapMarker {
  isOwnReport?: boolean;
  reportData?: ReportSummary;
  safePlace?: SafePlace;
}

export default function MapScreen() {
  const { showAlert } = useAlert();
  const [showNotifications, setShowNotifications] = useState(false);

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

  // Search functionality
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);

  // Map controls
  const [mapType, setMapType] = useState<"standard" | "satellite" | "hybrid">(
    "standard"
  );
  const [showPOIs, setShowPOIs] = useState(false);
  // const [showDropdown, setShowDropdown] = useState(false);
  // const [interactiveOptions, setInteractiveOptions] = useState<
  //   InteractiveOption[]
  // >([
  //   { id: "restaurants", label: "Restaurants", icon: "🍽️", enabled: true },
  //   { id: "shopping", label: "Shopping Centers", icon: "🛍️", enabled: true },
  //   {
  //     id: "transportation",
  //     label: "Public Transport",
  //     icon: "🚌",
  //     enabled: false,
  //   },
  //   {
  //     id: "education",
  //     label: "Schools & Universities",
  //     icon: "🏫",
  //     enabled: false,
  //   },
  //   { id: "entertainment", label: "Entertainment", icon: "🎭", enabled: false },
  //   { id: "hotels", label: "Hotels & Lodging", icon: "🏨", enabled: false },
  //   { id: "banks", label: "Banks & ATMs", icon: "🏦", enabled: false },
  //   { id: "gas_stations", label: "Gas Stations", icon: "⛽", enabled: false },
  // ]);

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

  // Search functionality
  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    setSearchLoading(true);
    try {
      // Simulate search API call - replace with actual search service
      // This could be Google Places API, Mapbox Geocoding, etc.
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Mock search results - replace with actual API results
      const mockResults = [
        {
          id: "1",
          name: `${query} - Restaurant`,
          address: `123 ${query} Street, Dhaka`,
          location: {
            latitude: 23.8103 + Math.random() * 0.01,
            longitude: 90.4125 + Math.random() * 0.01,
          },
          type: "restaurant",
          distance: "0.5 km",
        },
        {
          id: "2",
          name: `${query} - Shopping Center`,
          address: `456 ${query} Avenue, Dhaka`,
          location: {
            latitude: 23.8103 + Math.random() * 0.01,
            longitude: 90.4125 + Math.random() * 0.01,
          },
          type: "shopping",
          distance: "1.2 km",
        },
      ];

      setSearchResults(mockResults);
      setShowSearchResults(true);
    } catch (error) {
      console.error("Search error:", error);
      showAlert("Error", "Failed to search locations", "error");
    } finally {
      setSearchLoading(false);
    }
  };

  const selectSearchResult = (result: any) => {
    // Add marker for selected location
    const newMarker: ExtendedMapMarker = {
      id: `search-${result.id}`,
      coordinate: result.location,
      title: result.name,
      description: result.address,
      type: "custom",
      color: "#4285F4",
    };

    setMarkers((prev) => [
      ...prev.filter((m) => !m.id.startsWith("search-")),
      newMarker,
    ]);
    setCurrentLocation(result.location);
    setShowSearchResults(false);
    setSearchQuery(result.name);
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

  const getDirections = (destination: any) => {
    if (!currentLocation) {
      showAlert(
        "Location Required",
        "Please enable location services to get directions",
        "error"
      );
      return;
    }

    // For now, just show an alert - this could be expanded to open external map apps
    showAlert(
      "Directions",
      `Directions to ${destination.name} would open here`,
      "info"
    );

    // Optional: Open external map app
    // const url = Platform.select({
    //   ios: `maps:?daddr=${destination.location.latitude},${destination.location.longitude}`,
    //   android: `geo:0,0?q=${destination.location.latitude},${destination.location.longitude}(${destination.name})`,
    // });
    // if (url) Linking.openURL(url);
  };

  // Toggle interactive option
  // const toggleInteractiveOption = (id: string) => {
  //   setInteractiveOptions((prev) =>
  //     prev.map((option) =>
  //       option.id === id ? { ...option, enabled: !option.enabled } : option
  //     )
  //   );
  // };

  // const handleNormalPlaceDetails = useCallback(
  //   (placeName: string) => {
  //     // Handle normal place interactions - could open directions, details, etc.
  //     showAlert(
  //       "Place Information",
  //       `You selected ${placeName}. This would typically open directions or more details.`,
  //       "info"
  //     );
  //   },
  //   [showAlert]
  // );

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
              type: (report.incidentType as any),
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
  }, [safePlaces]);

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
      <View className="flex-1 bg-[#FFE4D6] max-w-screen-md mx-auto w-full">
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
              />

              {/* Search Bar Overlay - Top of Map
                <View className="absolute top-4 left-45 right-45 z-10">
                <View className="bg-white rounded-xl shadow-lg border border-gray-200">
                  <View className="flex-row items-center px-3 py-2.5">
                  <Ionicons name="search" size={18} color="#6B7280" />
                  <TextInput
                    placeholder="Search places..."
                    value={searchQuery}
                    onChangeText={(text) => {
                    setSearchQuery(text);
                    handleSearch(text);
                    }}
                    className="flex-1 ml-2 text-gray-800 text-sm"
                    placeholderTextColor="#9CA3AF"
                  />
                  {searchLoading && (
                    <ActivityIndicator size="small" color="#6366F1" />
                  )}
                  {searchQuery.length > 0 && (
                    <TouchableOpacity
                    onPress={() => {
                      setSearchQuery("");
                      setSearchResults([]);
                      setShowSearchResults(false);
                    }}
                    className="ml-2"
                    >
                    <Ionicons name="close" size={18} color="#6B7280" />
                    </TouchableOpacity>
                  )}
                  </View>

                  /* Search Results 
                  {showSearchResults && searchResults.length > 0 && (
                  <View className="border-t border-gray-200 max-h-40">
                    <ScrollView className="bg-white rounded-b-xl">
                    {searchResults.map((result) => (
                      <TouchableOpacity
                      key={result.id}
                      onPress={() => selectSearchResult(result)}
                      className="px-3 py-2.5 border-b border-gray-100 flex-row items-center justify-between"
                      >
                      <View className="flex-1">
                        <Text className="font-medium text-gray-800 text-sm">
                        {result.name}
                              </Text>
                              <Text className="text-gray-600 text-xs mt-1">
                                {result.address}
                              </Text>
                            </View>
                            <View className="items-end">
                              <Text className="text-blue-600 text-xs">
                                {result.distance}
                              </Text>
                              <TouchableOpacity
                                onPress={() => getDirections(result)}
                                className="mt-1"
                              >
                                <Ionicons
                                  name="navigate"
                                  size={16}
                                  color="#6366F1"
                                />
                              </TouchableOpacity>
                            </View>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  )}
                </View>
              </View> */}

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
                            <Text className="text-xs text-gray-600">Emergency</Text>
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
    </>
  );
}
