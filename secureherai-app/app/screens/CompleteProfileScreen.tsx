import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  ActivityIndicator,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Picker } from "@react-native-picker/picker";
import ApiService from "../services/api";
import { useAuth } from "../context/AuthContext";
import type { CompleteProfileRequest } from "../types/auth";

interface CompleteProfileScreenProps {
  onProfileCompleted: () => void;
}

export const CompleteProfileScreen: React.FC<CompleteProfileScreenProps> = ({
  onProfileCompleted,
}) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState<CompleteProfileRequest>({
    phoneNumber: "",
    dateOfBirth: "",
    role: "USER",
  });
  const [isLoading, setIsLoading] = useState(false);

  const updateFormData = (
    field: keyof CompleteProfileRequest,
    value: string
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleCompleteProfile = async () => {
    // Validation
    if (!formData.phoneNumber.trim()) {
      Alert.alert("Error", "Please enter your phone number");
      return;
    }

    if (!formData.dateOfBirth.trim()) {
      Alert.alert("Error", "Please enter your date of birth");
      return;
    }

    // Validate phone number format
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    if (!phoneRegex.test(formData.phoneNumber.trim())) {
      Alert.alert(
        "Error",
        "Please enter a valid phone number with country code (e.g., +8801234567890)"
      );
      return;
    }

    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(formData.dateOfBirth.trim())) {
      Alert.alert("Error", "Please enter date in YYYY-MM-DD format");
      return;
    }

    // Additional validation for responder role
    if (formData.role === "RESPONDER") {
      if (!formData.responderType) {
        Alert.alert("Error", "Please select responder type");
        return;
      }
      if (!formData.badgeNumber?.trim()) {
        Alert.alert("Error", "Please enter your badge number");
        return;
      }
    }

    setIsLoading(true);
    try {
      const response = await ApiService.completeProfile(formData);

      if (response.success) {
        Alert.alert("Success", "Profile completed successfully!", [
          { text: "OK", onPress: onProfileCompleted },
        ]);
      } else {
        Alert.alert("Error", response.error || "Failed to complete profile");
      }
    } catch {
      Alert.alert("Error", "Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="flex-1 px-8 py-12">
            {/* Header */}
            <View className="items-center mb-12">
              <Image
                source={require("../../assets/images/secureherai_logo.png")}
                style={{
                  width: 120,
                  height: 120,
                  resizeMode: "contain",
                }}
              />
              <Text className="text-3xl font-bold text-text mt-6 mb-2">
                Complete Profile
              </Text>
              <Text className="text-gray-600 text-center">
                Welcome {user?.fullName}! Please complete your profile to
                continue.
              </Text>
            </View>

            {/* Phone Number */}
            <View className="mb-6">
              <Text className="text-gray-700 mb-2 font-medium">
                Phone Number
              </Text>
              <TextInput
                className="bg-white border border-gray-300 rounded-lg px-4 py-3 text-gray-800"
                placeholder="e.g., +8801234567890"
                value={formData.phoneNumber}
                onChangeText={(value) => updateFormData("phoneNumber", value)}
                keyboardType="phone-pad"
              />
            </View>

            {/* Date of Birth */}
            <View className="mb-6">
              <Text className="text-gray-700 mb-2 font-medium">
                Date of Birth
              </Text>
              <TextInput
                className="bg-white border border-gray-300 rounded-lg px-4 py-3 text-gray-800"
                placeholder="YYYY-MM-DD"
                value={formData.dateOfBirth}
                onChangeText={(value) => updateFormData("dateOfBirth", value)}
              />
            </View>

            {/* Role Selection */}
            <View className="mb-6">
              <Text className="text-gray-700 mb-2 font-medium">Role</Text>
              <View className="bg-white border border-gray-300 rounded-lg">
                <Picker
                  selectedValue={formData.role}
                  onValueChange={(value) => updateFormData("role", value)}
                  style={{ height: 50 }}
                >
                  <Picker.Item label="Regular User" value="USER" />
                  <Picker.Item label="Emergency Responder" value="RESPONDER" />
                </Picker>
              </View>
            </View>

            {/* Responder-specific fields */}
            {formData.role === "RESPONDER" && (
              <>
                <View className="mb-6">
                  <Text className="text-gray-700 mb-2 font-medium">
                    Responder Type
                  </Text>
                  <View className="bg-white border border-gray-300 rounded-lg">
                    <Picker
                      selectedValue={formData.responderType}
                      onValueChange={(value) =>
                        updateFormData("responderType", value)
                      }
                      style={{ height: 50 }}
                    >
                      <Picker.Item label="Select Type" value="" />
                      <Picker.Item label="Police Officer" value="POLICE" />
                      <Picker.Item
                        label="Medical Professional"
                        value="MEDICAL"
                      />
                      <Picker.Item label="Fire Fighter" value="FIRE" />
                    </Picker>
                  </View>
                </View>

                <View className="mb-6">
                  <Text className="text-gray-700 mb-2 font-medium">
                    Badge Number
                  </Text>
                  <TextInput
                    className="bg-white border border-gray-300 rounded-lg px-4 py-3 text-gray-800"
                    placeholder="Enter your badge number"
                    value={formData.badgeNumber}
                    onChangeText={(value) =>
                      updateFormData("badgeNumber", value)
                    }
                  />
                </View>
              </>
            )}

            {/* Complete Profile Button */}
            <TouchableOpacity
              className={`rounded-lg py-4 mb-6 ${
                isLoading ? "bg-gray-400" : "bg-primary"
              }`}
              onPress={handleCompleteProfile}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text className="text-white text-center font-semibold text-lg">
                  Complete Profile
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default CompleteProfileScreen;
