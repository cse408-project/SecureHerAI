import React, { useState, useEffect, useRef } from "react";
import {
  View,
  TextInput,
  Text,
  Pressable,
  ScrollView,
  Platform,
} from "react-native";

interface PlaceResult {
  place_id: string;
  description: string;
  structured_formatting?: {
    main_text: string;
    secondary_text: string;
  };
  geometry?: {
    location: {
      lat: () => number;
      lng: () => number;
    };
  };
  name?: string;
  formatted_address?: string;
}

interface WebPlacesInputProps {
  placeholder: string;
  onPlaceSelect: (place: PlaceResult) => void;
  currentLocation?: {
    latitude: number;
    longitude: number;
  };
  safePlaces?: {
    id: string;
    placeName: string;
    location: {
      latitude: number;
      longitude: number;
    };
    address?: string;
  }[];
  zIndexBase?: number; // Add z-index prop to control stacking
  dropdownOffset?: number; // Add offset for dropdown positioning
  value?: string; // Add value prop for external control
  onValueChange?: (value: string) => void; // Add callback for value changes
}

const WebPlacesInput: React.FC<WebPlacesInputProps> = ({
  placeholder,
  onPlaceSelect,
  currentLocation,
  safePlaces = [],
  zIndexBase = 999999,
  dropdownOffset = 0,
  value,
  onValueChange,
}) => {
  const [query, setQuery] = useState(value || "");
  const [predictions, setPredictions] = useState<any[]>([]);
  const [showPredictions, setShowPredictions] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const autocompleteService = useRef<any>(null);
  const placesService = useRef<any>(null);
  const mapRef = useRef<any>(null);
  const isSelecting = useRef(false);

  // Update internal query when external value changes
  useEffect(() => {
    if (value !== undefined) {
      setQuery(value);
    }
  }, [value]);

  useEffect(() => {
    const initializeServices = () => {
      if (
        Platform.OS === "web" &&
        typeof window !== "undefined" &&
        window.google?.maps?.places
      ) {
        console.log("Initializing Google Places services...");

        // Initialize Google Places services
        autocompleteService.current =
          new window.google.maps.places.AutocompleteService();

        // Create a temporary map for PlacesService (required by Google API)
        const mapDiv = document.createElement("div");
        const centerLocation = currentLocation
          ? { lat: currentLocation.latitude, lng: currentLocation.longitude }
          : { lat: 23.8103, lng: 90.4125 }; // Fallback to Dhaka, Bangladesh

        mapRef.current = new window.google.maps.Map(mapDiv, {
          center: centerLocation,
          zoom: 13,
        });
        placesService.current = new window.google.maps.places.PlacesService(
          mapRef.current
        );

        setIsLoaded(true);
        console.log("Google Places services initialized successfully");
      } else {
        console.log("Google Maps API not yet loaded, retrying in 500ms...");
        setTimeout(initializeServices, 500);
      }
    };

    initializeServices();
  }, [currentLocation]);

  const showLocalSuggestions = () => {
    const localSuggestions: any[] = [];

    // Always show current location when focused
    if (currentLocation) {
      localSuggestions.push({
        place_id: "current-location",
        description: "📍 Current Location",
        structured_formatting: {
          main_text: "Current Location",
          secondary_text: "Your current position",
        },
        isLocal: true,
        location: currentLocation,
      });
    }

    // Show all safe places when focused
    safePlaces.forEach((place) => {
      localSuggestions.push({
        place_id: `safe-place-${place.id}`,
        description: `🛡️ ${place.placeName}`,
        structured_formatting: {
          main_text: place.placeName,
          secondary_text: place.address || "Safe Place",
        },
        isLocal: true,
        location: place.location,
      });
    });

    setPredictions(localSuggestions);
    setShowPredictions(localSuggestions.length > 0);
  };

  const searchPlaces = (input: string) => {
    console.log("Searching for:", input);

    if (!input.trim()) {
      console.log("Empty input, clearing predictions");
      setPredictions([]);
      setShowPredictions(false);
      return;
    }

    // Create local suggestions (current location + safe places)
    const localSuggestions: any[] = [];

    // Add current location if available
    if (currentLocation) {
      localSuggestions.push({
        place_id: "current-location",
        description: "📍 Current Location",
        structured_formatting: {
          main_text: "Current Location",
          secondary_text: "Your current position",
        },
        isLocal: true,
        location: currentLocation,
      });
    }

    // Add safe places that match the search
    safePlaces.forEach((place) => {
      if (
        place.placeName.toLowerCase().includes(input.toLowerCase()) ||
        place.address?.toLowerCase().includes(input.toLowerCase())
      ) {
        localSuggestions.push({
          place_id: `safe-place-${place.id}`,
          description: `🛡️ ${place.placeName}`,
          structured_formatting: {
            main_text: place.placeName,
            secondary_text: place.address || "Safe Place",
          },
          isLocal: true,
          location: place.location,
        });
      }
    });

    // Search Google Places if service is available
    if (autocompleteService.current) {
      const request = {
        input: input,
        componentRestrictions: { country: "bd" }, // Restrict to Bangladesh
        types: ["establishment", "geocode"], // Include both places and addresses
      };

      console.log("Making autocomplete request with:", request);

      autocompleteService.current.getPlacePredictions(
        request,
        (googlePredictions: any[], status: any) => {
          console.log(
            "Autocomplete response - Status:",
            status,
            "Predictions:",
            googlePredictions
          );

          let allPredictions = [...localSuggestions];

          if (
            status === window.google?.maps?.places?.PlacesServiceStatus?.OK &&
            googlePredictions
          ) {
            console.log(
              `Found ${googlePredictions.length} Google predictions:`,
              googlePredictions
            );
            // Add Google predictions after local ones
            allPredictions = [...localSuggestions, ...googlePredictions];
          }

          console.log(`Total predictions: ${allPredictions.length}`);
          setPredictions(allPredictions);
          setShowPredictions(allPredictions.length > 0);
        }
      );
    } else {
      // If Google service not available, just show local suggestions
      console.log(
        "AutocompleteService not available, showing local suggestions only"
      );
      setPredictions(localSuggestions);
      setShowPredictions(localSuggestions.length > 0);
    }
  };

  const handlePlaceSelect = (prediction: any) => {
    console.log("=== PLACE SELECTION STARTED ===");
    console.log("Place selected:", prediction);
    console.log("Is local suggestion:", prediction.isLocal);

    // Handle local suggestions (current location and safe places)
    if (prediction.isLocal) {
      console.log("Processing local suggestion...");
      const displayName =
        prediction.structured_formatting?.main_text ||
        prediction.description.replace(/^[📍🛡️]\s*/, "");
      setQuery(displayName);
      setShowPredictions(false);

      // Create a place object for local suggestions
      const localPlace = {
        place_id: prediction.place_id,
        description: prediction.description,
        structured_formatting: prediction.structured_formatting,
        geometry: {
          location: {
            lat: () => prediction.location.latitude,
            lng: () => prediction.location.longitude,
          },
        },
        name: displayName,
        formatted_address:
          prediction.structured_formatting?.secondary_text || "",
      };

      console.log("Calling onPlaceSelect with local place:", localPlace);
      onPlaceSelect(localPlace);
      console.log("=== LOCAL PLACE SELECTION COMPLETED ===");
      return;
    }

    // Handle Google Places predictions
    console.log("Processing Google Places prediction...");
    if (!placesService.current) {
      console.error("PlacesService not available");
      return;
    }

    const request = {
      placeId: prediction.place_id,
      fields: ["geometry.location", "name", "formatted_address"],
    };

    console.log("Making place details request for:", prediction.place_id);
    placesService.current.getDetails(request, (place: any, status: any) => {
      console.log("Place details response - Status:", status, "Place:", place);

      if (
        status === window.google.maps.places.PlacesServiceStatus.OK &&
        place
      ) {
        const displayName =
          place.name ||
          prediction.structured_formatting?.main_text ||
          prediction.description;
        console.log("Setting query to:", displayName);
        setQuery(displayName);
        setShowPredictions(false);
        console.log("Calling onPlaceSelect with Google place:", place);
        onPlaceSelect(place);
        console.log("=== GOOGLE PLACE SELECTION COMPLETED ===");
      } else {
        console.error("Failed to get place details:", status);
      }
    });
  };

  // Don't render on non-web platforms
  if (Platform.OS !== "web") {
    return null;
  }

  const dropdownStyle: any = {
    position: "absolute",
    top: 45 + dropdownOffset,
    left: 0,
    right: 0,
    backgroundColor: "white",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    maxHeight: 200,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    zIndex: zIndexBase + 2,
  };

  // Add web-specific styles
  if (Platform.OS === "web") {
    dropdownStyle.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.15)";
  }

  return (
    <View
      style={{
        position: "relative",
        zIndex: zIndexBase,
        // Ensure stacking context on web
        ...(Platform.OS === "web" && {
          isolation: "isolate" as any,
        }),
      }}
    >
      <TextInput
        style={{
          height: 40,
          borderWidth: 1,
          borderColor: "#ddd",
          borderRadius: 8,
          paddingHorizontal: 12,
          fontSize: 14,
          backgroundColor: "white",
          zIndex: zIndexBase + 1,
          position: "relative",
        }}
        placeholder={isLoaded ? placeholder : "Loading Places API..."}
        value={query}
        editable={isLoaded}
        onChangeText={(text) => {
          setQuery(text);
          onValueChange?.(text);
          if (isLoaded) {
            searchPlaces(text);
          }
        }}
        onFocus={() => {
          if (query.trim() === "") {
            // Show local suggestions when input is empty
            showLocalSuggestions();
          } else if (predictions.length > 0) {
            setShowPredictions(true);
          }
        }}
      />

      {!isLoaded && (
        <View
          style={{
            position: "absolute",
            top: 45,
            left: 0,
            right: 0,
            backgroundColor: "white",
            borderRadius: 8,
            borderWidth: 1,
            borderColor: "#ddd",
            padding: 12,
            zIndex: 10001,
          }}
        >
          <Text style={{ fontSize: 12, color: "#666", textAlign: "center" }}>
            Loading Google Places API...
          </Text>
        </View>
      )}

      {isLoaded && showPredictions && predictions.length > 0 && (
        <View style={dropdownStyle}>
          <ScrollView
            style={{
              maxHeight: 200,
              zIndex: 999999,
            }}
            contentContainerStyle={{
              zIndex: 999999,
            }}
          >
            {predictions.map((prediction, index) => {
              const isLocalSuggestion = prediction.isLocal;

              return (
                <Pressable
                  key={prediction.place_id}
                  style={({ pressed }) => ({
                    padding: 12,
                    borderBottomWidth: index < predictions.length - 1 ? 0.5 : 0,
                    borderBottomColor: "#eee",
                    backgroundColor: pressed
                      ? isLocalSuggestion
                        ? "#e6f0ff"
                        : "#f5f5f5"
                      : isLocalSuggestion
                      ? "#f8f9ff"
                      : "white",
                    cursor: Platform.OS === "web" ? "pointer" : undefined,
                    opacity: pressed ? 0.8 : 1,
                  })}
                  onPress={() => {
                    console.log("Pressable onPress triggered for:", prediction);
                    isSelecting.current = true;
                    handlePlaceSelect(prediction);
                    // Reset the flag after a short delay
                    setTimeout(() => {
                      isSelecting.current = false;
                    }, 100);
                  }}
                >
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: isLocalSuggestion ? "600" : "500",
                      color: isLocalSuggestion ? "#0066cc" : "#333",
                    }}
                  >
                    {prediction.structured_formatting?.main_text ||
                      prediction.description}
                  </Text>
                  {prediction.structured_formatting?.secondary_text && (
                    <Text
                      style={{
                        fontSize: 12,
                        color: isLocalSuggestion ? "#0066cc" : "#666",
                        marginTop: 2,
                        opacity: 0.8,
                      }}
                    >
                      {prediction.structured_formatting.secondary_text}
                    </Text>
                  )}
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      )}

      {isLoaded &&
        showPredictions &&
        predictions.length === 0 &&
        query.trim().length > 2 && (
          <View
            style={{
              position: "absolute",
              top: 45,
              left: 0,
              right: 0,
              backgroundColor: "white",
              borderRadius: 8,
              borderWidth: 1,
              borderColor: "#ddd",
              padding: 12,
              zIndex: 10001,
            }}
          >
            <Text style={{ fontSize: 12, color: "#666", textAlign: "center" }}>
              No places found for &ldquo;{query}&rdquo;
            </Text>
          </View>
        )}
    </View>
  );
};

export default WebPlacesInput;
