import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
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
import WebPlacesInput from "./WebPlacesInput";

// Conditional import for GooglePlacesAutocomplete (only on native platforms)
let GooglePlacesAutocomplete: any = null;
try {
  if (Platform.OS !== "web") {
    // eslint-disable-next-line import/no-dynamic-require
    const GooglePlacesModule = require("react-native-google-places-autocomplete");
    GooglePlacesAutocomplete = GooglePlacesModule.GooglePlacesAutocomplete;
  }
} catch {
  console.log("GooglePlacesAutocomplete not available on this platform");
}

export interface SelectedLocation {
  latitude: number;
  longitude: number;
  address?: string;
  name?: string;
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
  const [searchText, setSearchText] = useState(""); // For web compatibility

  // UI state
  const [loadingMap, setLoadingMap] = useState(true);

  // Initialize map when modal opens
  useEffect(() => {
    const initializeMap = async () => {
      setLoadingMap(true);
      try {
        // Always try to get current location for search suggestions
        const location = await locationService.getCurrentLocation();
        if (location) {
          setCurrentLocation(location.coords);
        }

        if (initialLocation) {
          setSelectedLocation(initialLocation);
          setMapRegion({
            latitude: initialLocation.latitude,
            longitude: initialLocation.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          });
        } else {
          // Use current location as map center if no initial location
          if (location) {
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
      setSearchText("");
    }
  }, [visible, initialLocation]);

  // Removed getCurrentLocation function as it's not currently used
  // Can be re-added if a "Get Current Location" button is needed

  const selectLocationFromPlace = (place: any, details: any = null) => {
    let location: SelectedLocation;

    if (Platform.OS === "web") {
      // Web version using Google Places API result
      if (place.geometry?.location) {
        location = {
          latitude: place.geometry.location.lat(),
          longitude: place.geometry.location.lng(),
          address: place.formatted_address || place.name,
          name: place.name || "Selected Location",
        };
      } else {
        return;
      }
    } else {
      // Native version using react-native-google-places-autocomplete
      if (details?.geometry?.location) {
        location = {
          latitude: details.geometry.location.lat,
          longitude: details.geometry.location.lng,
          address: details.formatted_address || place.description,
          name: place.structured_formatting?.main_text || "Selected Location",
        };
      } else {
        return;
      }
    }

    setSelectedLocation(location);
    setMapRegion({
      latitude: location.latitude,
      longitude: location.longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    });

    // Clear search results and update search text
    if (Platform.OS === "web") {
      setSearchText(location.name || "");
    } else {
      // For native, the GooglePlacesAutocomplete will handle the text
    }
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
          <View
            className="bg-white mx-4 mt-4 p-3 rounded-lg shadow-sm"
            style={{
              zIndex: 200000,
              position: "relative",
              elevation: 200000, // For Android
            }}
          >
            {/* Location Search Field */}
            <View
              style={{
                zIndex: 300000,
                position: "relative",
                elevation: 300000, // For Android
              }}
            >
              {GooglePlacesAutocomplete && Platform.OS !== "web" ? (
                <GooglePlacesAutocomplete
                  placeholder={searchPlaceholder}
                  fetchDetails={true}
                  onPress={(data: any, details: any = null) => {
                    selectLocationFromPlace(data, details);
                  }}
                  query={{
                    key: process.env.EXPO_PUBLIC_GOOGLE_MAPS_WEB_API_KEY || "",
                    language: "en",
                    components: "country:bd",
                  }}
                  styles={{
                    container: {
                      flex: 1,
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
                      fontSize: 16,
                      borderWidth: 1,
                      borderColor: "#ddd",
                      borderRadius: 8,
                      backgroundColor: "#f9fafb",
                      paddingHorizontal: 12,
                    },
                    predefinedPlacesDescription: {
                      color: "#1faadb",
                    },
                    listView: {
                      position: "absolute",
                      top: 42,
                      left: 0,
                      right: 0,
                      backgroundColor: "white",
                      borderRadius: 8,
                      elevation: 5,
                      zIndex: 20001,
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.15,
                      shadowRadius: 8,
                      borderWidth: 1,
                      borderColor: "#e5e7eb",
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
                  placeholder={searchPlaceholder}
                  currentLocation={currentLocation || undefined}
                  safePlaces={[]} // Empty array since this is for general location search
                  zIndexBase={400000} // Very high z-index to appear above all modal content
                  value={searchText}
                  onValueChange={setSearchText}
                  onPlaceSelect={(place) => {
                    selectLocationFromPlace(place);
                  }}
                />
              )}
            </View>
          </View>
        )}

        {/* Selected Location Info */}
        {selectedLocation && (
          <View
            className="bg-white mx-4 mt-4 p-3 rounded-lg shadow-sm"
            style={{
              zIndex: 1,
              position: "relative",
            }}
          >
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
