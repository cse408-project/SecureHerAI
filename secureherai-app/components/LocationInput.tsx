import React, { useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import LocationSelectionModal, {
  SelectedLocation,
} from "./LocationSelectionModal";

interface LocationInputProps {
  label: string;
  value?: SelectedLocation;
  onLocationChange: (location: SelectedLocation | null) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
}

/**
 * Reusable Location Input Component
 *
 * This component provides a button that opens the LocationSelectionModal
 * and displays the selected location. It can be used in any form that needs
 * location selection.
 *
 * Usage:
 * ```tsx
 * const [location, setLocation] = useState<SelectedLocation | null>(null);
 *
 * <LocationInput
 *   label="Select Location"
 *   value={location}
 *   onLocationChange={setLocation}
 *   required={true}
 * />
 * ```
 */
const LocationInput: React.FC<LocationInputProps> = ({
  label,
  value,
  onLocationChange,
  placeholder = "Select location on map",
  required = false,
  disabled = false,
}) => {
  const [showModal, setShowModal] = useState(false);

  const handleLocationSelect = (location: SelectedLocation) => {
    onLocationChange(location);
    setShowModal(false);
  };

  const handleClearLocation = () => {
    onLocationChange(null);
  };

  return (
    <View className="mb-4">
      {/* Label */}
      <View className="flex-row items-center mb-2">
        <Text className="text-base font-medium text-gray-800">{label}</Text>
        {required && <Text className="text-red-500 ml-1">*</Text>}
      </View>

      {/* Location Selection Button */}
      <TouchableOpacity
        onPress={() => setShowModal(true)}
        disabled={disabled}
        className={`flex-row items-center p-3 border rounded-lg ${
          disabled
            ? "border-gray-200 bg-gray-100"
            : value
            ? "border-green-300 bg-green-50"
            : "border-gray-300 bg-white"
        }`}
      >
        <MaterialIcons
          name="place"
          size={20}
          color={disabled ? "#9CA3AF" : value ? "#10B981" : "#67082F"}
        />
        <View className="flex-1 ml-3">
          {value ? (
            <>
              <Text className="font-medium text-gray-900" numberOfLines={1}>
                {value.name || "Selected Location"}
              </Text>
              <Text className="text-sm text-gray-500" numberOfLines={1}>
                {value.address ||
                  `${value.latitude.toFixed(4)}, ${value.longitude.toFixed(4)}`}
              </Text>
            </>
          ) : (
            <Text className={`${disabled ? "text-gray-400" : "text-gray-500"}`}>
              {placeholder}
            </Text>
          )}
        </View>

        {/* Action buttons */}
        <View className="flex-row items-center">
          {value && !disabled && (
            <TouchableOpacity
              onPress={handleClearLocation}
              className="p-1 mr-2"
            >
              <MaterialIcons name="clear" size={20} color="#EF4444" />
            </TouchableOpacity>
          )}
          <MaterialIcons
            name="chevron-right"
            size={20}
            color={disabled ? "#9CA3AF" : "#6B7280"}
          />
        </View>
      </TouchableOpacity>

      {/* Coordinates Display (for debugging) */}
      {value && (
        <View className="mt-2 p-2 bg-gray-50 rounded">
          <Text className="text-xs text-gray-600">
            📍 {value.latitude.toFixed(6)}, {value.longitude.toFixed(6)}
          </Text>
        </View>
      )}

      {/* Location Selection Modal */}
      <LocationSelectionModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        onLocationSelect={handleLocationSelect}
        initialLocation={value}
        title={`Select ${label}`}
        confirmButtonText="Confirm Location"
        enableSearch={true}
        showCurrentLocationButton={true}
      />
    </View>
  );
};

export default LocationInput;
