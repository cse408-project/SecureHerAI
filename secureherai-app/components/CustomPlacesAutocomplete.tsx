import React, { useState, useEffect } from 'react';
import { 
  View, 
  TextInput, 
  FlatList, 
  Text, 
  TouchableOpacity, 
  ActivityIndicator,
  Platform 
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

interface Place {
  place_id: string;
  description: string;
  structured_formatting?: {
    main_text: string;
    secondary_text: string;
  };
}

interface PlaceDetails {
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  formatted_address: string;
  name: string;
}

interface CustomPlacesAutocompleteProps {
  placeholder: string;
  onPress: (place: any, details: any) => void;
  currentLocation?: { latitude: number; longitude: number };
  value?: string;
  onChangeText?: (text: string) => void;
  query?: {
    key: string;
    language?: string;
    components?: string;
    types?: string;
    radius?: number;
  };
  styles?: {
    container?: any;
    textInputContainer?: any;
    textInput?: any;
    listView?: any;
    row?: any;
    separator?: any;
    description?: any;
  };
  currentLocationLabel?: string;
  enablePoweredByContainer?: boolean;
  fetchDetails?: boolean;
  predefinedPlaces?: any[];
}

const CustomPlacesAutocomplete: React.FC<CustomPlacesAutocompleteProps> = ({
  placeholder,
  onPress,
  currentLocation,
  value = '',
  onChangeText,
  query,
  styles = {},
  currentLocationLabel = "Current Location",
  enablePoweredByContainer = true,
  fetchDetails = true,
  predefinedPlaces = []
}) => {
  const [inputValue, setInputValue] = useState(value);
  const [predictions, setPredictions] = useState<Place[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showPredictions, setShowPredictions] = useState(false);
  const [sessionToken, setSessionToken] = useState('');

  // Generate a random session token for the Google Places API
  useEffect(() => {
    const generateSessionToken = () => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      let result = '';
      for (let i = 0; i < 32; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return result;
    };
    setSessionToken(generateSessionToken());
  }, []);

  // Update internal value when external value changes
  useEffect(() => {
    if (value !== undefined) {
      setInputValue(value);
    }
  }, [value]);

  // Handle input change and fetch predictions
  const handleInputChange = async (text: string) => {
    setInputValue(text);
    if (onChangeText) onChangeText(text);
    
    if (text.length > 2) {
      setIsLoading(true);
      try {
        await searchPlaces(text);
      } catch (error) {
        console.error('Error fetching place predictions:', error);
      } finally {
        setIsLoading(false);
      }
    } else {
      setPredictions([]);
      setShowPredictions(false);
    }
  };

  const searchPlaces = async (input: string) => {
    if (!query?.key) {
      console.error('Google Places API key not provided');
      return;
    }

    try {
      let url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
        input
      )}&key=${query.key}&sessiontoken=${sessionToken}`;
      
      // Add optional parameters
      if (query.components) {
        url += `&components=${query.components}`;
      }
      if (query.types) {
        url += `&types=${query.types}`;
      }
      if (query.language) {
        url += `&language=${query.language}`;
      }
      
      // Add location bias if available
      if (currentLocation && query.radius) {
        url += `&location=${currentLocation.latitude},${currentLocation.longitude}&radius=${query.radius}`;
      }
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.predictions) {
        setPredictions(data.predictions);
        setShowPredictions(true);
      } else {
        setPredictions([]);
        setShowPredictions(false);
      }
    } catch (error) {
      console.error('Error fetching place predictions:', error);
      setPredictions([]);
      setShowPredictions(false);
    }
  };

  // Get place details when a prediction is selected
  const getPlaceDetails = async (placeId: string): Promise<PlaceDetails | null> => {
    if (!query?.key) {
      console.error('Google Places API key not provided');
      return null;
    }

    try {
      const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&key=${query.key}&sessiontoken=${sessionToken}&fields=geometry,formatted_address,name`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.result) {
        return data.result;
      }
    } catch (error) {
      console.error('Error fetching place details:', error);
    }
    return null;
  };

  // Handle selecting a place from the predictions
  const handleSelectPlace = async (place: Place) => {
    setIsLoading(true);
    try {
      let details = null;
      
      if (fetchDetails) {
        details = await getPlaceDetails(place.place_id);
      }
      
      // Update input value
      const displayText = place.structured_formatting?.main_text || place.description;
      setInputValue(displayText);
      if (onChangeText) onChangeText(displayText);
      
      // Clear predictions
      setPredictions([]);
      setShowPredictions(false);
      
      // Call the onPress callback with compatible format
      const placeData = {
        description: place.description,
        structured_formatting: place.structured_formatting,
        place_id: place.place_id
      };

      const detailsData = details ? {
        geometry: {
          location: {
            lat: details.geometry.location.lat,
            lng: details.geometry.location.lng
          }
        },
        formatted_address: details.formatted_address,
        name: details.name
      } : null;

      onPress(placeData, detailsData);
    } catch (error) {
      console.error('Error selecting place:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle selecting current location
  const handleSelectCurrentLocation = () => {
    if (currentLocation) {
      setInputValue(currentLocationLabel);
      if (onChangeText) onChangeText(currentLocationLabel);
      
      setPredictions([]);
      setShowPredictions(false);
      
      // Call the onPress callback with current location
      const placeData = {
        description: currentLocationLabel,
        structured_formatting: {
          main_text: currentLocationLabel,
          secondary_text: "Your current position"
        }
      };

      const detailsData = {
        geometry: {
          location: {
            lat: currentLocation.latitude,
            lng: currentLocation.longitude
          }
        },
        formatted_address: "Current Location",
        name: currentLocationLabel
      };

      onPress(placeData, detailsData);
    }
  };

  const handleFocus = () => {
    if (inputValue.length > 2) {
      setShowPredictions(predictions.length > 0);
    }
  };

  const handleBlur = () => {
    // Delay hiding predictions to allow for selection
    setTimeout(() => {
      setShowPredictions(false);
    }, 200);
  };

  // Combine default styles with custom styles
  const containerStyle = {
    flex: 1,
    position: 'relative' as const,
    zIndex: 1000,
    ...styles.container
  };

  const textInputContainerStyle = {
    backgroundColor: 'transparent',
    borderTopWidth: 0,
    borderBottomWidth: 0,
    ...styles.textInputContainer
  };

  const textInputStyle = {
    height: 40,
    color: '#5d5d5d',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#f9fafb',
    paddingHorizontal: 12,
    ...styles.textInput
  };

  const listViewStyle = {
    position: 'absolute' as const,
    top: 42,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderRadius: 8,
    elevation: 5,
    zIndex: 1001,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    maxHeight: 200,
    ...styles.listView
  };

  const rowStyle = {
    paddingHorizontal: 13,
    paddingVertical: 10,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    minHeight: 50,
    ...styles.row
  };

  const separatorStyle = {
    height: 0.5,
    backgroundColor: '#c8c7cc',
    ...styles.separator
  };

  const descriptionStyle = {
    fontSize: 14,
    color: '#333',
    ...styles.description
  };

  // Don't render on web - use WebPlacesInput instead
  if (Platform.OS === 'web') {
    return null;
  }

  return (
    <View style={containerStyle}>
      <View style={textInputContainerStyle}>
        <View style={{ position: 'relative' }}>
          <TextInput
            style={textInputStyle}
            placeholder={placeholder}
            value={inputValue}
            onChangeText={handleInputChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholderTextColor="#9CA3AF"
          />
          {isLoading && (
            <ActivityIndicator 
              size="small" 
              color="#67082F" 
              style={{ 
                position: 'absolute', 
                right: 10, 
                top: 10 
              }} 
            />
          )}
        </View>
      </View>

      {showPredictions && (
        <View style={listViewStyle}>
          <FlatList
            data={[
              // Add current location as first item if available
              ...(currentLocation ? [{
                place_id: 'current-location',
                description: currentLocationLabel,
                structured_formatting: {
                  main_text: currentLocationLabel,
                  secondary_text: 'Your current position'
                },
                isCurrentLocation: true
              }] : []),
              // Add predefined places
              ...predefinedPlaces,
              // Add predictions from Google Places API
              ...predictions
            ]}
            keyExtractor={(item, index) => item.place_id || `item-${index}`}
            renderItem={({ item, index }) => (
              <>
                <TouchableOpacity 
                  style={rowStyle}
                  onPress={() => {
                    if (item.isCurrentLocation) {
                      handleSelectCurrentLocation();
                    } else {
                      handleSelectPlace(item);
                    }
                  }}
                >
                  {item.isCurrentLocation && (
                    <MaterialIcons 
                      name="my-location" 
                      size={18} 
                      color="#4285F4" 
                      style={{ marginRight: 8 }} 
                    />
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={[descriptionStyle, { fontWeight: '500' }]}>
                      {item.structured_formatting?.main_text || item.description}
                    </Text>
                    {item.structured_formatting?.secondary_text && (
                      <Text style={[descriptionStyle, { fontSize: 12, color: '#666', marginTop: 2 }]}>
                        {item.structured_formatting.secondary_text}
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>
                {index < predictions.length + (currentLocation ? 1 : 0) + predefinedPlaces.length - 1 && (
                  <View style={separatorStyle} />
                )}
              </>
            )}
            style={{ maxHeight: 200 }}
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled={true}
          />
        </View>
      )}

      {/* Powered by Google (if enabled) */}
      {enablePoweredByContainer && showPredictions && (
        <View style={{
          position: 'absolute',
          bottom: -25,
          right: 10,
          backgroundColor: 'white',
          paddingHorizontal: 5,
          paddingVertical: 2,
          borderRadius: 3,
          elevation: 2
        }}>
          <Text style={{ fontSize: 10, color: '#666' }}>Powered by Google</Text>
        </View>
      )}
    </View>
  );
};

export default CustomPlacesAutocomplete;
