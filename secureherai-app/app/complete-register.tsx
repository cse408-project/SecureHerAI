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
import { useAlert } from "../context/AlertContext";
import DatePicker from "../components/DatePicker";
import ResponderFields from "../components/ResponderFields";

import { decodeJWT } from "../utils/jwt";

export default function CompleteRegisterScreen() {
  const { token } = useLocalSearchParams();
  const { showAlert } = useAlert();
  const [loading, setLoading] = useState(false);
  const [googleInfo, setGoogleInfo] = useState<any>(null);

  const [formData, setFormData] = useState({
    phoneNumber: "",
    dateOfBirth: "",
    role: "USER",
    responderType: "POLICE",
    badgeNumber: "",
    branchName: "",
    address: "",
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
                <ResponderFields
                  formData={formData}
                  errors={errors}
                  onFieldChange={(field: string, value: string) => {
                    setFormData((prev) => ({ ...prev, [field]: value }));
                  }}
                  showTitle={true}
                />
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
