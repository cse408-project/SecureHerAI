import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  ActivityIndicator,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Picker } from "@react-native-picker/picker";
// @ts-ignore
import { router } from "expo-router";
import ApiService from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { useAlert } from "../../context/AlertContext";
import type { CompleteProfileRequest } from "../../types/auth";
import DatePicker from "../../components/DatePicker";

export default function CompleteProfileScreen() {
  const { user } = useAuth();
  const { showAlert } = useAlert();
  const [formData, setFormData] = useState<CompleteProfileRequest>({
    phoneNumber: "",
    dateOfBirth: "",
    role: "USER",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<any>({});

  const updateFormData = (
    field: keyof CompleteProfileRequest,
    value: string
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const validateForm = (): boolean => {
    const newErrors: any = {};

    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = "Phone number is required";
    } else if (!/^\+?[\d\s-()]+$/.test(formData.phoneNumber.trim())) {
      newErrors.phoneNumber = "Please enter a valid phone number";
    }

    if (!formData.dateOfBirth.trim()) {
      newErrors.dateOfBirth = "Date of birth is required";
    }

    // Additional validation for responder role
    if (formData.role === "RESPONDER") {
      if (!formData.responderType) {
        newErrors.responderType = "Responder type is required";
      }
      if (!formData.badgeNumber?.trim()) {
        newErrors.badgeNumber = "Badge number is required";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCompleteProfile = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await ApiService.completeProfile(formData);

      if (response.success) {
        showAlert("Success", "Profile completed successfully!", "success");
        setTimeout(() => {
          router.replace("/");
        }, 1500);
      } else {
        showAlert(
          "Error",
          response.error || "Failed to complete profile",
          "error"
        );
      }
    } catch (error) {
      console.error("Complete profile error:", error);
      showAlert("Error", "Network error. Please try again.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#FFE4D6]">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="flex-1 justify-center px-6 py-8 max-w-screen-md mx-auto w-full">
            {/* Logo and Branding */}
            <View className="items-center mb-8">
              <View className="w-24 h-24 rounded-full bg-white shadow-lg items-center justify-center mb-4">
                <Image
                  source={require("../../assets/images/secureherai_logo.png")}
                  style={{
                    width: 60,
                    height: 60,
                    resizeMode: "contain",
                  }}
                />
              </View>
              <Text className="text-3xl font-bold text-[#67082F] mb-2">
                SecureHer AI
              </Text>
              <Text className="text-base text-gray-600 text-center">
                Complete Your Profile
              </Text>
            </View>

            {/* Complete Profile Form */}
            <View className="bg-white rounded-xl p-6 shadow-sm mb-6">
              <Text className="text-2xl font-bold text-[#67082F] mb-6 text-center">
                Almost There!
              </Text>

              {/* User Information Display */}
              {user && (
                <View className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-6">
                  <Text className="text-sm font-semibold text-gray-700 mb-2">
                    User Information:
                  </Text>
                  <Text className="text-gray-600">✓ Name: {user.fullName}</Text>
                  <Text className="text-gray-600">✓ Email: {user.email}</Text>
                </View>
              )}

              {/* Phone Number */}
              <View className="mb-4">
                <Text className="text-sm font-medium text-gray-700 mb-2">
                  Phone Number <Text className="text-red-500">*</Text>
                </Text>
                <TextInput
                  className={`w-full px-4 py-3 border rounded-lg bg-white text-gray-900 ${
                    errors.phoneNumber ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="+1234567890"
                  placeholderTextColor="#9CA3AF"
                  value={formData.phoneNumber}
                  onChangeText={(value) => updateFormData("phoneNumber", value)}
                  keyboardType="phone-pad"
                />
                {errors.phoneNumber && (
                  <Text className="text-red-500 text-sm mt-1">
                    {errors.phoneNumber}
                  </Text>
                )}
              </View>

              {/* Date of Birth */}
              <View className="mb-4">
                <DatePicker
                  label="Date of Birth"
                  value={formData.dateOfBirth}
                  onDateChange={(date) => updateFormData("dateOfBirth", date)}
                  placeholder="Select your birth date"
                  required
                />
                {errors.dateOfBirth && (
                  <Text className="text-red-500 text-sm mt-1">
                    {errors.dateOfBirth}
                  </Text>
                )}
              </View>

              {/* Role Selection */}
              <View className="mb-4">
                <Text className="text-sm font-medium text-gray-700 mb-2">
                  Role <Text className="text-red-500">*</Text>
                </Text>
                <View className="border border-gray-300 rounded-lg bg-white">
                  <Picker
                    selectedValue={formData.role}
                    onValueChange={(value) => updateFormData("role", value)}
                    style={{ color: "#000" }}
                  >
                    <Picker.Item label="Regular User" value="USER" />
                    <Picker.Item
                      label="Emergency Responder"
                      value="RESPONDER"
                    />
                  </Picker>
                </View>
              </View>

              {/* Responder-specific fields */}
              {formData.role === "RESPONDER" && (
                <>
                  <View className="mb-4">
                    <Text className="text-sm font-medium text-gray-700 mb-2">
                      Responder Type <Text className="text-red-500">*</Text>
                    </Text>
                    <View className="border border-gray-300 rounded-lg bg-white">
                      <Picker
                        selectedValue={formData.responderType}
                        onValueChange={(value) =>
                          updateFormData("responderType", value as any)
                        }
                        style={{ color: "#000" }}
                      >
                        <Picker.Item label="Select Type" value="" />
                        <Picker.Item label="Police Officer" value="POLICE" />
                        <Picker.Item
                          label="Medical Professional"
                          value="MEDICAL"
                        />
                        <Picker.Item label="Fire Fighter" value="FIRE" />
                        <Picker.Item
                          label="Security Personnel"
                          value="SECURITY"
                        />
                        <Picker.Item label="Other" value="OTHER" />
                      </Picker>
                    </View>
                    {errors.responderType && (
                      <Text className="text-red-500 text-sm mt-1">
                        {errors.responderType}
                      </Text>
                    )}
                  </View>

                  <View className="mb-6">
                    <Text className="text-sm font-medium text-gray-700 mb-2">
                      Badge Number <Text className="text-red-500">*</Text>
                    </Text>
                    <TextInput
                      className={`w-full px-4 py-3 border rounded-lg bg-white text-gray-900 ${
                        errors.badgeNumber
                          ? "border-red-500"
                          : "border-gray-300"
                      }`}
                      placeholder="Enter your badge number"
                      placeholderTextColor="#9CA3AF"
                      value={formData.badgeNumber}
                      onChangeText={(value) =>
                        updateFormData("badgeNumber", value)
                      }
                    />
                    {errors.badgeNumber && (
                      <Text className="text-red-500 text-sm mt-1">
                        {errors.badgeNumber}
                      </Text>
                    )}
                  </View>
                </>
              )}

              {/* Complete Profile Button */}
              <TouchableOpacity
                className={`w-full py-4 rounded-lg ${
                  isLoading
                    ? "bg-[#67082F]/50"
                    : "bg-[#67082F] active:bg-[#67082F]/90"
                }`}
                onPress={handleCompleteProfile}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-white text-center font-semibold text-lg">
                    Complete Profile
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
