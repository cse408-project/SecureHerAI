import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import { Picker } from "@react-native-picker/picker";
import { MaterialIcons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { useAlert } from "../context/AlertContext";
import DatePicker from "../components/DatePicker";

import { decodeJWT } from "../utils/jwt";

export default function CompleteRegisterScreen() {
  const { token } = useLocalSearchParams();
  const { showAlert } = useAlert();
  const [loading, setLoading] = useState(false);
  const [googleInfo, setGoogleInfo] = useState<any>(null);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);

  const [formData, setFormData] = useState({
    phoneNumber: "",
    dateOfBirth: "",
    role: "USER",
    responderType: "POLICE",
    badgeNumber: "",
    branchName: "",
    address: "",
    currentLatitude: null as number | null,
    currentLongitude: null as number | null,
  });

  const [errors, setErrors] = useState<any>({});

  useEffect(() => {
    if (token) {
      try {
        // Decode the temp token to get Google info
        const decodedToken = decodeJWT(token as string);
        setGoogleInfo({
          email: decodedToken.oauth_email,
          name: decodedToken.oauth_name,
          picture: decodedToken.oauth_picture,
        });
      } catch (error) {
        console.error("Error decoding token:", error);
        showAlert(
          "Error",
          "Invalid registration token. Please try again.",
          "error"
        );
        router.replace("/(auth)");
      }
    } else {
      showAlert(
        "Error",
        "No registration token found. Please try again.",
        "error"
      );
      router.replace("/(auth)");
    }
  }, [token, showAlert]);

  const detectCurrentLocation = async () => {
    setIsDetectingLocation(true);
    try {
      // Request permission to access location
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        showAlert(
          "Permission Required",
          "Location permission is required to detect your current location.",
          "error"
        );
        return;
      }

      // Get current position
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      // Update coordinates
      setFormData((prev) => ({
        ...prev,
        currentLatitude: location.coords.latitude,
        currentLongitude: location.coords.longitude,
      }));

      // Try to get address from coordinates
      try {
        const addressResponse = await Location.reverseGeocodeAsync({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });

        if (addressResponse.length > 0) {
          const address = addressResponse[0];
          const fullAddress = [
            address.name,
            address.street,
            address.city,
            address.region,
            address.country,
          ]
            .filter(Boolean)
            .join(", ");

          if (fullAddress) {
            setFormData((prev) => ({
              ...prev,
              address: fullAddress,
            }));
          }
        }
      } catch (reverseGeoError) {
        console.log("Reverse geocoding failed:", reverseGeoError);
        // Still update coordinates even if address lookup fails
      }

      showAlert(
        "Location Detected",
        "Your current location has been detected successfully.",
        "success"
      );
    } catch (error) {
      console.error("Location detection failed:", error);
      showAlert(
        "Location Error",
        "Failed to detect your location. Please check your GPS settings and try again.",
        "error"
      );
    } finally {
      setIsDetectingLocation(false);
    }
  };

  const validateForm = () => {
    const newErrors: any = {};

    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = "Phone number is required";
    } else if (!/^\+?[\d\s-()]+$/.test(formData.phoneNumber.trim())) {
      newErrors.phoneNumber = "Please enter a valid phone number";
    }

    if (!formData.dateOfBirth.trim()) {
      newErrors.dateOfBirth = "Date of birth is required";
    }

    // Validate responder fields if role is RESPONDER
    if (formData.role === "RESPONDER") {
      if (!formData.badgeNumber.trim()) {
        newErrors.badgeNumber = "Badge number is required for responders";
      }
      if (!formData.branchName.trim()) {
        newErrors.branchName = "Branch name is required for responders";
      }
      if (!formData.address.trim()) {
        newErrors.address = "Address is required for responders";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCompleteRegistration = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const requestData = {
        token: token,
        phoneNumber: formData.phoneNumber.trim(),
        dateOfBirth: formData.dateOfBirth, // Already in YYYY-MM-DD format from DatePicker
        role: formData.role,
        ...(formData.role === "RESPONDER" && {
          responderType: formData.responderType,
          badgeNumber: formData.badgeNumber.trim(),
          branchName: formData.branchName.trim(),
          address: formData.address.trim(),
          ...(formData.currentLatitude !== null &&
            formData.currentLongitude !== null && {
              currentLatitude: formData.currentLatitude,
              currentLongitude: formData.currentLongitude,
            }),
        }),
      };

      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_BASE_URL}/auth/complete-oauth-registration`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestData),
        }
      );

      const data = await response.json();

      if (data.success) {
        // Clear form data
        setFormData({
          phoneNumber: "",
          dateOfBirth: "",
          role: "USER",
          responderType: "POLICE",
          badgeNumber: "",
          branchName: "",
          address: "",
          currentLatitude: null,
          currentLongitude: null,
        });

        showAlert(
          "Success!",
          "Your account has been created successfully. You will now be redirected to the login screen.",
          "success"
        );

        // Navigate to login after a short delay
        setTimeout(() => {
          router.replace("/(auth)");
        }, 1500);
      } else {
        showAlert(
          "Error",
          data.error || "Registration failed. Please try again.",
          "error"
        );
      }
    } catch (error) {
      console.error("Registration error:", error);
      showAlert(
        "Error",
        "Network error. Please check your connection and try again.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  if (!googleInfo) {
    return (
      <SafeAreaView className="flex-1 bg-[#FFE4D6] justify-center items-center">
        <ActivityIndicator size="large" color="#67082F" />
        <Text className="text-gray-700 mt-4">Loading your information...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#FFE4D6]">
      <StatusBar style="dark" />
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
            <View className="items-center mb-6">
              <View className="w-24 h-24 rounded-full bg-white shadow-lg items-center justify-center mb-4">
                <Image
                  source={require("../assets/images/secureherai_logo.png")}
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
              <Text className="text-base text-gray-600 text-center mb-2">
                Complete Your Registration
              </Text>
            </View>

            {/* Form Container */}
            <View className="bg-white rounded-xl p-6 shadow-sm mb-6">
              {/* Google Info Display */}
              <View className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-6">
                <Text className="text-sm font-semibold text-gray-700 mb-2">
                  Google Account Info:
                </Text>
                <Text className="text-gray-600">
                  ✓ Email: {googleInfo.email}
                </Text>
                <Text className="text-gray-600">✓ Name: {googleInfo.name}</Text>
              </View>

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
                  onChangeText={(text: string) =>
                    setFormData((prev) => ({ ...prev, phoneNumber: text }))
                  }
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
                  onDateChange={(date) =>
                    setFormData((prev) => ({ ...prev, dateOfBirth: date }))
                  }
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
                    onValueChange={(value) =>
                      setFormData((prev) => ({ ...prev, role: value }))
                    }
                    style={{ color: "#000" }}
                  >
                    <Picker.Item label="User" value="USER" />
                    <Picker.Item label="Responder" value="RESPONDER" />
                  </Picker>
                </View>
              </View>

              {/* Responder-specific fields */}
              {formData.role === "RESPONDER" && (
                <View className="mb-4 p-4 bg-[#67082F]/5 rounded-lg border border-[#67082F]/20">
                  <Text className="text-base font-semibold text-[#67082F] mb-3">
                    👮‍♀️ Responder Information
                  </Text>

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
                          onPress={() =>
                            setFormData((prev) => ({
                              ...prev,
                              responderType: "POLICE",
                            }))
                          }
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
                          onPress={() =>
                            setFormData((prev) => ({
                              ...prev,
                              responderType: "MEDICAL",
                            }))
                          }
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
                          onPress={() =>
                            setFormData((prev) => ({
                              ...prev,
                              responderType: "FIRE",
                            }))
                          }
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
                          onPress={() =>
                            setFormData((prev) => ({
                              ...prev,
                              responderType: "SECURITY",
                            }))
                          }
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
                          onPress={() =>
                            setFormData((prev) => ({
                              ...prev,
                              responderType: "OTHER",
                            }))
                          }
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
                        errors.badgeNumber
                          ? "border-red-500"
                          : "border-gray-300"
                      }`}
                      placeholder="Enter your badge number"
                      placeholderTextColor="#9CA3AF"
                      value={formData.badgeNumber}
                      onChangeText={(text: string) =>
                        setFormData((prev) => ({ ...prev, badgeNumber: text }))
                      }
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
                      Branch/Station Name{" "}
                      <Text className="text-red-500">*</Text>
                    </Text>
                    <TextInput
                      className={`w-full px-4 py-3 border rounded-lg bg-white text-gray-900 ${
                        errors.branchName ? "border-red-500" : "border-gray-300"
                      }`}
                      placeholder="Enter your branch or station name"
                      placeholderTextColor="#9CA3AF"
                      value={formData.branchName}
                      onChangeText={(text: string) =>
                        setFormData((prev) => ({ ...prev, branchName: text }))
                      }
                    />
                    {errors.branchName && (
                      <Text className="text-red-500 text-sm mt-1">
                        {errors.branchName}
                      </Text>
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
                      value={formData.address}
                      onChangeText={(text: string) =>
                        setFormData((prev) => ({ ...prev, address: text }))
                      }
                      multiline
                      numberOfLines={2}
                    />
                    {errors.address && (
                      <Text className="text-red-500 text-sm mt-1">
                        {errors.address}
                      </Text>
                    )}
                  </View>

                  {/* Current Location */}
                  <View className="mb-4">
                    <Text className="text-sm font-medium text-gray-700 mb-2">
                      Current Location (Optional)
                    </Text>

                    {/* GPS Detection Button */}
                    <TouchableOpacity
                      className="mb-3 p-3 bg-blue-50 rounded-lg border border-blue-200 flex-row items-center justify-center"
                      onPress={detectCurrentLocation}
                      disabled={isDetectingLocation}
                    >
                      {isDetectingLocation ? (
                        <ActivityIndicator size="small" color="#3B82F6" />
                      ) : (
                        <MaterialIcons
                          name="my-location"
                          size={20}
                          color="#3B82F6"
                        />
                      )}
                      <Text className="text-blue-700 font-medium ml-2">
                        {isDetectingLocation
                          ? "Detecting Location..."
                          : "Detect Current Location"}
                      </Text>
                    </TouchableOpacity>

                    <View className="flex-row space-x-2">
                      <View className="flex-1">
                        <Text className="text-xs text-gray-500 mb-1">
                          Latitude
                        </Text>
                        <TextInput
                          className="border border-gray-300 rounded-lg p-3 bg-white text-gray-900"
                          placeholder="23.8103"
                          value={formData.currentLatitude?.toString() || ""}
                          onChangeText={(value) =>
                            setFormData((prev) => ({
                              ...prev,
                              currentLatitude: value ? parseFloat(value) : null,
                            }))
                          }
                          keyboardType="numeric"
                        />
                      </View>
                      <View className="flex-1">
                        <Text className="text-xs text-gray-500 mb-1">
                          Longitude
                        </Text>
                        <TextInput
                          className="border border-gray-300 rounded-lg p-3 bg-white text-gray-900"
                          placeholder="90.4125"
                          value={formData.currentLongitude?.toString() || ""}
                          onChangeText={(value) =>
                            setFormData((prev) => ({
                              ...prev,
                              currentLongitude: value
                                ? parseFloat(value)
                                : null,
                            }))
                          }
                          keyboardType="numeric"
                        />
                      </View>
                    </View>
                    <Text className="text-xs text-gray-400 mt-1">
                      Use the button above to automatically detect your
                      location, or enter coordinates manually
                    </Text>
                  </View>
                </View>
              )}

              {/* Complete Registration Button */}
              <TouchableOpacity
                className={`w-full py-4 rounded-lg ${
                  loading
                    ? "bg-[#67082F]/50"
                    : "bg-[#67082F] active:bg-[#67082F]/90"
                } mb-2`}
                onPress={handleCompleteRegistration}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-white text-center font-semibold text-lg">
                    Complete Registration
                  </Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Login Link */}
            <View className="items-center">
              <Text className="text-gray-600 mb-2">
                Already have an account?
              </Text>
              <TouchableOpacity onPress={() => router.replace("/(auth)")}>
                <Text className="text-[#67082F] font-semibold">Sign In</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
