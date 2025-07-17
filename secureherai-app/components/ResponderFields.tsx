import React from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

interface ResponderFieldsProps {
  formData: {
    responderType?: string;
    badgeNumber?: string;
    branchName?: string;
    address?: string;
    currentLatitude?: number | null;
    currentLongitude?: number | null;
  };
  errors?: {
    responderType?: string;
    badgeNumber?: string;
    branchName?: string;
    address?: string;
  };
  onFieldChange: (field: string, value: string) => void;
  onDetectLocation: () => void;
  isDetectingLocation: boolean;
  showTitle?: boolean;
}

const ResponderFields: React.FC<ResponderFieldsProps> = ({
  formData,
  errors = {},
  onFieldChange,
  onDetectLocation,
  isDetectingLocation,
  showTitle = true,
}) => {
  return (
    <View className="mb-4 p-4 bg-[#67082F]/5 rounded-lg border border-[#67082F]/20">
      {showTitle && (
        <Text className="text-base font-semibold text-[#67082F] mb-3">
          👮‍♀️ Responder Information
        </Text>
      )}

      {/* Responder Type */}
      <View className="mb-4">
        <Text className="text-sm font-medium text-gray-700 mb-2">
          Responder Type <Text className="text-red-500">*</Text>
        </Text>
        <View className="border border-gray-300 rounded-lg bg-white">
          <View className="p-3">
            <TouchableOpacity
              className={`p-3 rounded-lg ${
                formData.responderType === "POLICE"
                  ? "bg-blue-100 border-2 border-blue-500"
                  : "bg-gray-100"
              }`}
              onPress={() => onFieldChange("responderType", "POLICE")}
            >
              <Text
                className={`text-center font-semibold ${
                  formData.responderType === "POLICE"
                    ? "text-blue-700"
                    : "text-gray-600"
                }`}
              >
                🚔 Police
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className={`p-3 rounded-lg mt-2 ${
                formData.responderType === "MEDICAL"
                  ? "bg-red-100 border-2 border-red-500"
                  : "bg-gray-100"
              }`}
              onPress={() => onFieldChange("responderType", "MEDICAL")}
            >
              <Text
                className={`text-center font-semibold ${
                  formData.responderType === "MEDICAL"
                    ? "text-red-700"
                    : "text-gray-600"
                }`}
              >
                🚑 Medical
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className={`p-3 rounded-lg mt-2 ${
                formData.responderType === "FIRE"
                  ? "bg-orange-100 border-2 border-orange-500"
                  : "bg-gray-100"
              }`}
              onPress={() => onFieldChange("responderType", "FIRE")}
            >
              <Text
                className={`text-center font-semibold ${
                  formData.responderType === "FIRE"
                    ? "text-orange-700"
                    : "text-gray-600"
                }`}
              >
                🚒 Fire Department
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className={`p-3 rounded-lg mt-2 ${
                formData.responderType === "SECURITY"
                  ? "bg-purple-100 border-2 border-purple-500"
                  : "bg-gray-100"
              }`}
              onPress={() => onFieldChange("responderType", "SECURITY")}
            >
              <Text
                className={`text-center font-semibold ${
                  formData.responderType === "SECURITY"
                    ? "text-purple-700"
                    : "text-gray-600"
                }`}
              >
                🛡️ Security
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className={`p-3 rounded-lg mt-2 ${
                formData.responderType === "OTHER"
                  ? "bg-gray-200 border-2 border-gray-500"
                  : "bg-gray-100"
              }`}
              onPress={() => onFieldChange("responderType", "OTHER")}
            >
              <Text
                className={`text-center font-semibold ${
                  formData.responderType === "OTHER"
                    ? "text-gray-700"
                    : "text-gray-600"
                }`}
              >
                ⚫ Other
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        {errors.responderType && (
          <Text className="text-red-500 text-sm mt-1">
            {errors.responderType}
          </Text>
        )}
      </View>

      {/* Badge Number */}
      <View className="mb-4">
        <Text className="text-sm font-medium text-gray-700 mb-2">
          Badge Number <Text className="text-red-500">*</Text>
        </Text>
        <TextInput
          className={`w-full px-4 py-3 border rounded-lg bg-white text-gray-900 ${
            errors.badgeNumber ? "border-red-500" : "border-gray-300"
          }`}
          placeholder="Enter your badge number"
          placeholderTextColor="#9CA3AF"
          value={formData.badgeNumber || ""}
          onChangeText={(value) => onFieldChange("badgeNumber", value)}
          autoCapitalize="characters"
        />
        {errors.badgeNumber && (
          <Text className="text-red-500 text-sm mt-1">
            {errors.badgeNumber}
          </Text>
        )}
      </View>

      {/* Branch Name */}
      <View className="mb-4">
        <Text className="text-sm font-medium text-gray-700 mb-2">
          Branch/Department Name <Text className="text-red-500">*</Text>
        </Text>
        <TextInput
          className={`w-full px-4 py-3 border rounded-lg bg-white text-gray-900 ${
            errors.branchName ? "border-red-500" : "border-gray-300"
          }`}
          placeholder="Enter your branch or department name"
          placeholderTextColor="#9CA3AF"
          value={formData.branchName || ""}
          onChangeText={(value) => onFieldChange("branchName", value)}
        />
        {errors.branchName && (
          <Text className="text-red-500 text-sm mt-1">{errors.branchName}</Text>
        )}
      </View>

      {/* Address */}
      <View className="mb-4">
        <Text className="text-sm font-medium text-gray-700 mb-2">
          Work Address <Text className="text-red-500">*</Text>
        </Text>
        <TextInput
          className={`w-full px-4 py-3 border rounded-lg bg-white text-gray-900 ${
            errors.address ? "border-red-500" : "border-gray-300"
          }`}
          placeholder="Enter your work address"
          placeholderTextColor="#9CA3AF"
          value={formData.address || ""}
          onChangeText={(value) => onFieldChange("address", value)}
          multiline
          numberOfLines={2}
        />
        {errors.address && (
          <Text className="text-red-500 text-sm mt-1">{errors.address}</Text>
        )}
      </View>

      {/* Current Location Detection */}
      <View className="mb-4">
        <Text className="text-sm font-medium text-gray-700 mb-2">
          Current Location (Optional)
        </Text>

        {/* GPS Detection Button */}
        <TouchableOpacity
          className="mb-3 p-3 bg-blue-50 rounded-lg border border-blue-200 flex-row items-center justify-center"
          onPress={onDetectLocation}
          disabled={isDetectingLocation}
        >
          {isDetectingLocation ? (
            <ActivityIndicator size="small" color="#67082F" />
          ) : (
            <MaterialIcons name="my-location" size={20} color="#67082F" />
          )}
          <Text
            className={`ml-2 font-medium ${
              isDetectingLocation ? "text-gray-500" : "text-[#67082F]"
            }`}
          >
            {isDetectingLocation ? "Detecting..." : "Detect Current Location"}
          </Text>
        </TouchableOpacity>

        {/* Show coordinates if detected */}
        {formData.currentLatitude && formData.currentLongitude && (
          <View className="mt-2 p-3 bg-green-50 rounded-lg border border-green-200">
            <Text className="text-green-800 text-sm font-medium">
              Location Detected:
            </Text>
            <Text className="text-green-700 text-xs mt-1">
              Lat: {formData.currentLatitude.toFixed(6)}, Lng:{" "}
              {formData.currentLongitude.toFixed(6)}
            </Text>
          </View>
        )}

        {/* Manual Coordinate Input */}
        <View className="flex-row space-x-2 mt-3">
          <View className="flex-1">
            <Text className="text-xs text-gray-500 mb-1">
              Latitude (Optional)
            </Text>
            <TextInput
              className="border border-gray-300 rounded-lg p-3 bg-white text-gray-900"
              placeholder="23.8103"
              value={formData.currentLatitude?.toString() || ""}
              onChangeText={(value) => onFieldChange("currentLatitude", value)}
              keyboardType="numeric"
            />
          </View>
          <View className="flex-1">
            <Text className="text-xs text-gray-500 mb-1">
              Longitude (Optional)
            </Text>
            <TextInput
              className="border border-gray-300 rounded-lg p-3 bg-white text-gray-900"
              placeholder="90.4125"
              value={formData.currentLongitude?.toString() || ""}
              onChangeText={(value) => onFieldChange("currentLongitude", value)}
              keyboardType="numeric"
            />
          </View>
        </View>

        <Text className="text-xs text-gray-500 mt-1">
          This helps us assign nearby incidents to you. Use the button above to
          detect automatically or enter coordinates manually.
        </Text>
      </View>
    </View>
  );
};

export default ResponderFields;
