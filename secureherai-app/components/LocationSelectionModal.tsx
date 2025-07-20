import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Platform,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import MapComponent, {
  MapLocation,
  MapMarker,
  MapPressEvent,
} from "./MapComponent";
import locationService from "../services/locationService";
import { useAlert } from "../context/AlertContext";

export interface SelectedLocation {
  latitude: number;
  longitude: number;
  address?: string;
  name?: string;
}

interface SearchResult {
  id: string;
  name: string;
  address: string;
  location: {
    latitude: number;
    longitude: number;
  };
  type?: string;
  distance?: string;
}

interface LocationSelectionModalProps {
  visible: boolean;
  onClose: () => void;
  onLocationSelect: (location: SelectedLocation) => void;
  initialLocation?: SelectedLocation;
  title?: string;
  showCurrentLocationButton?: boolean;
  searchPlaceholder?: string;
  confirmButtonText?: string;
  enableSearch?: boolean;
}

const LocationSelectionModal: React.FC<LocationSelectionModalProps> = ({
  visible,
  onClose,
  onLocationSelect,
  initialLocation,
  title = "Select Location",
  showCurrentLocationButton = true,
  searchPlaceholder = "Search for a location...",
  confirmButtonText = "Confirm Location",
  enableSearch = true,
}) => {
  const { showAlert } = useAlert();

  // Map state
  const [currentLocation, setCurrentLocation] = useState<MapLocation | null>(
    null
  );
  const [selectedLocation, setSelectedLocation] =
    useState<SelectedLocation | null>(initialLocation || null);
  const [mapRegion, setMapRegion] = useState<MapLocation>({
    latitude: initialLocation?.latitude || 23.8103,
    longitude: initialLocation?.longitude || 90.4125,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);

  // UI state
  const [gettingCurrentLocation, setGettingCurrentLocation] = useState(false);
  const [loadingMap, setLoadingMap] = useState(true);

  // Initialize map when modal opens
  useEffect(() => {
    const initializeMap = async () => {
      setLoadingMap(true);
      try {
        if (initialLocation) {
          setSelectedLocation(initialLocation);
          setMapRegion({
            latitude: initialLocation.latitude,
            longitude: initialLocation.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          });
        } else {
          // Try to get current location
          const location = await locationService.getCurrentLocation();
          if (location) {
            setCurrentLocation(location.coords);
            setMapRegion({
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            });
          }
        }
      } catch (error) {
        console.error("Error initializing map:", error);
      } finally {
        setLoadingMap(false);
      }
    };

    if (visible) {
      initializeMap();
    } else {
      // Reset state when modal closes
      setSearchQuery("");
      setSearchResults([]);
      setShowSearchResults(false);
    }
  }, [visible, initialLocation]);

  const getCurrentLocation = async () => {
    setGettingCurrentLocation(true);
    try {
      const location = await locationService.getCurrentLocation();
      if (location) {
        const newLocation: SelectedLocation = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          address: "Current Location",
          name: "My Current Location",
        };

        setCurrentLocation(location.coords);
        setSelectedLocation(newLocation);
        setMapRegion({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        });

        showAlert("Location", "Current location updated", "success");
      }
    } catch (error) {
      console.error("Error getting current location:", error);
      showAlert("Error", "Unable to get current location", "error");
    } finally {
      setGettingCurrentLocation(false);
    }
  };

  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    setSearchLoading(true);
    try {
      // Simulate search API call - replace with actual search service
      // This should integrate with Google Places API or similar service
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Mock search results - replace with actual API results
      const mockResults: SearchResult[] = [
        {
          id: "1",
          name: `${query} - Restaurant`,
          address: `123 ${query} Street, Dhaka`,
          location: {
            latitude: mapRegion.latitude + (Math.random() - 0.5) * 0.01,
            longitude: mapRegion.longitude + (Math.random() - 0.5) * 0.01,
          },
          type: "restaurant",
          distance: "0.5 km",
        },
        {
          id: "2",
          name: `${query} - Shopping Center`,
          address: `456 ${query} Avenue, Dhaka`,
          location: {
            latitude: mapRegion.latitude + (Math.random() - 0.5) * 0.01,
            longitude: mapRegion.longitude + (Math.random() - 0.5) * 0.01,
          },
          type: "shopping",
          distance: "1.2 km",
        },
        {
          id: "3",
          name: `${query} - Office Building`,
          address: `789 ${query} Road, Dhaka`,
          location: {
            latitude: mapRegion.latitude + (Math.random() - 0.5) * 0.01,
            longitude: mapRegion.longitude + (Math.random() - 0.5) * 0.01,
          },
          type: "office",
          distance: "2.0 km",
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

  const selectSearchResult = (result: SearchResult) => {
    const newLocation: SelectedLocation = {
      latitude: result.location.latitude,
      longitude: result.location.longitude,
      address: result.address,
      name: result.name,
    };

    setSelectedLocation(newLocation);
    setMapRegion({
      latitude: result.location.latitude,
      longitude: result.location.longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    });
    setShowSearchResults(false);
    setSearchQuery(result.name);
  };

  const handleMapPress = (event: MapPressEvent) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;

    const newLocation: SelectedLocation = {
      latitude,
      longitude,
      address: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
      name: "Selected Location",
    };

    setSelectedLocation(newLocation);
  };

  const handleConfirm = () => {
    if (selectedLocation) {
      onLocationSelect(selectedLocation);
      onClose();
    } else {
      showAlert(
        "Location Required",
        "Please select a location on the map",
        "error"
      );
    }
  };

  const getLocationIcon = (type?: string) => {
    switch (type) {
      case "restaurant":
        return "🍽️";
      case "shopping":
        return "🛍️";
      case "office":
        return "🏢";
      case "hospital":
        return "🏥";
      case "school":
        return "🏫";
      default:
        return "📍";
    }
  };

  // Prepare map markers
  const mapMarkers: MapMarker[] = [];

  // Add current location marker
  if (currentLocation) {
    mapMarkers.push({
      id: "current-location",
      coordinate: {
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
      },
      title: "Your Current Location",
      description: "This is your current location",
      type: "user-location",
      color: "#4285F4",
    });
  }

  // Add selected location marker
  if (selectedLocation) {
    mapMarkers.push({
      id: "selected-location",
      coordinate: {
        latitude: selectedLocation.latitude,
        longitude: selectedLocation.longitude,
      },
      title: selectedLocation.name || "Selected Location",
      description:
        selectedLocation.address ||
        `${selectedLocation.latitude.toFixed(
          6
        )}, ${selectedLocation.longitude.toFixed(6)}`,
      type: "custom",
      color: "#10B981",
    });
  }

  return (
    <Modal
      animationType="slide"
      transparent={false}
      visible={visible}
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-[#FFE4D6]">
        {/* Header */}
        <View className="bg-white px-4 py-3 border-b border-gray-200">
          <View className="flex-row items-center justify-between">
            <TouchableOpacity onPress={onClose} className="p-2">
              <MaterialIcons name="close" size={24} color="#374151" />
            </TouchableOpacity>

            <Text className="text-lg font-semibold text-[#67082F] flex-1 text-center">
              {title}
            </Text>

            <TouchableOpacity
              onPress={handleConfirm}
              className="bg-[#67082F] px-4 py-2 rounded-lg"
              disabled={!selectedLocation}
            >
              <Text className="text-white font-medium text-sm">Confirm</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Section */}
        {enableSearch && (
          <View className="bg-white mx-4 mt-4 p-3 rounded-lg shadow-sm">
            <View className="flex-row items-center bg-gray-50 rounded-lg px-3 py-2">
              <MaterialIcons name="search" size={20} color="#6B7280" />
              <TextInput
                className="flex-1 ml-2 text-gray-900"
                placeholder={searchPlaceholder}
                value={searchQuery}
                onChangeText={(text) => {
                  setSearchQuery(text);
                  handleSearch(text);
                }}
                style={{ fontSize: 16 }}
              />
              {searchLoading && (
                <ActivityIndicator size="small" color="#67082F" />
              )}
            </View>

            {/* Current Location Button */}
            {showCurrentLocationButton && (
              <TouchableOpacity
                onPress={getCurrentLocation}
                disabled={gettingCurrentLocation}
                className="flex-row items-center justify-center mt-3 py-2 px-4 bg-blue-50 rounded-lg border border-blue-200"
              >
                {gettingCurrentLocation ? (
                  <ActivityIndicator size="small" color="#3B82F6" />
                ) : (
                  <MaterialIcons name="my-location" size={20} color="#3B82F6" />
                )}
                <Text className="ml-2 text-blue-600 font-medium">
                  Use Current Location
                </Text>
              </TouchableOpacity>
            )}

            {/* Search Results */}
            {showSearchResults && searchResults.length > 0 && (
              <ScrollView className="mt-3 max-h-40">
                {searchResults.map((result) => (
                  <TouchableOpacity
                    key={result.id}
                    onPress={() => selectSearchResult(result)}
                    className="flex-row items-center py-3 px-2 border-b border-gray-100"
                  >
                    <Text className="text-lg mr-3">
                      {getLocationIcon(result.type)}
                    </Text>
                    <View className="flex-1">
                      <Text
                        className="font-medium text-gray-900"
                        numberOfLines={1}
                      >
                        {result.name}
                      </Text>
                      <Text className="text-sm text-gray-500" numberOfLines={1}>
                        {result.address}
                      </Text>
                      {result.distance && (
                        <Text className="text-xs text-blue-600">
                          {result.distance}
                        </Text>
                      )}
                    </View>
                    <MaterialIcons
                      name="chevron-right"
                      size={20}
                      color="#9CA3AF"
                    />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>
        )}

        {/* Selected Location Info */}
        {selectedLocation && (
          <View className="bg-white mx-4 mt-4 p-3 rounded-lg shadow-sm">
            <View className="flex-row items-center">
              <MaterialIcons name="place" size={20} color="#10B981" />
              <View className="flex-1 ml-2">
                <Text className="font-medium text-gray-900" numberOfLines={1}>
                  {selectedLocation.name || "Selected Location"}
                </Text>
                <Text className="text-sm text-gray-500" numberOfLines={2}>
                  {selectedLocation.address ||
                    `${selectedLocation.latitude.toFixed(
                      6
                    )}, ${selectedLocation.longitude.toFixed(6)}`}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Map */}
        <View className="flex-1 mt-4 mx-4 mb-4 rounded-lg overflow-hidden shadow-sm">
          {loadingMap ? (
            <View className="flex-1 bg-gray-100 items-center justify-center">
              <ActivityIndicator size="large" color="#67082F" />
              <Text className="mt-2 text-gray-600">Loading map...</Text>
            </View>
          ) : (
            <MapComponent
              initialRegion={mapRegion}
              markers={mapMarkers}
              onPress={handleMapPress}
              style={{ flex: 1 }}
              showsUserLocation={false}
              followsUserLocation={false}
              showsPointsOfInterest={true}
              showsBuildings={true}
              mapType="standard"
              showsCompass={true}
              showsMyLocationButton={Platform.OS === "android"}
            />
          )}
        </View>

        {/* Instructions */}
        <View className="bg-amber-50 mx-4 mb-4 p-3 rounded-lg border border-amber-200">
          <View className="flex-row items-center">
            <MaterialIcons name="info" size={16} color="#D97706" />
            <Text className="ml-2 text-amber-700 text-sm flex-1">
              {enableSearch
                ? "Search for a location above or tap anywhere on the map to select"
                : "Tap anywhere on the map to select a location"}
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default LocationSelectionModal;
