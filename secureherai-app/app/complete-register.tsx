import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import { useAlert } from "../context/AlertContext";
import DatePicker from "../components/DatePicker";

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
        }),
      };

      const response = await fetch(
        `http://localhost:8080/api/auth/complete-oauth-registration`,
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
      <SafeAreaView className="flex-1 bg-gray-50 justify-center items-center">
        <Text className="text-gray-600">Loading...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar style="dark" />

      <ScrollView className="flex-1 px-6 py-4">
        {/* Header */}
        <View className="mb-6">
          <TouchableOpacity onPress={() => router.back()} className="mb-4">
            <Feather name="arrow-left" size={24} color="#374151" />
          </TouchableOpacity>

          <Text className="text-2xl font-bold text-gray-900 mb-2">
            Complete Your Registration
          </Text>
          <Text className="text-gray-600 mb-4">
            Welcome, {googleInfo.name}! Please provide the remaining information
            to complete your account setup.
          </Text>

          {/* Google Info Display */}
          <View className="bg-white p-4 rounded-lg border border-gray-200 mb-6">
            <Text className="text-sm font-semibold text-gray-700 mb-2">
              Google Account Info:
            </Text>
            <Text className="text-gray-600">✓ Email: {googleInfo.email}</Text>
            <Text className="text-gray-600">✓ Name: {googleInfo.name}</Text>
          </View>
        </View>

        {/* Missing Information */}
        <View className="mb-6">
          <Text className="text-lg font-semibold text-gray-900 mb-4">
            Additional Information Required
          </Text>

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

          <View className="mb-4">
            <Text className="text-gray-700 font-medium mb-2">
              Role <Text className="text-red-500">*</Text>
            </Text>
            <View className="bg-white border border-gray-300 rounded-lg">
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
            <>
              <View className="mb-4">
                <Text className="text-gray-700 font-medium mb-2">
                  Responder Type <Text className="text-red-500">*</Text>
                </Text>
                <View className="bg-white border border-gray-300 rounded-lg">
                  <Picker
                    selectedValue={formData.responderType}
                    onValueChange={(value) =>
                      setFormData((prev) => ({ ...prev, responderType: value }))
                    }
                    style={{ color: "#000" }}
                  >
                    <Picker.Item label="Police" value="POLICE" />
                    <Picker.Item label="Medical" value="MEDICAL" />
                  </Picker>
                </View>
              </View>

              <View className="mb-4">
                <Text className="text-gray-700 font-medium mb-2">
                  Badge Number <Text className="text-red-500">*</Text>
                </Text>
                <TextInput
                  className={`w-full px-4 py-3 border rounded-lg bg-white text-gray-900 ${
                    errors.badgeNumber ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="Enter your badge number"
                  placeholderTextColor="#9CA3AF"
                  value={formData.badgeNumber}
                  onChangeText={(text: string) =>
                    setFormData((prev) => ({ ...prev, badgeNumber: text }))
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
        </View>

        {/* Complete Registration Button */}
        <TouchableOpacity
          className={`w-full py-4 rounded-lg ${
            loading ? "bg-[#67082F]/50" : "bg-[#67082F] active:bg-[#67082F]/90"
          } mb-8`}
          onPress={handleCompleteRegistration}
          disabled={loading}
        >
          <Text className="text-white text-center font-semibold text-lg">
            {loading ? "Completing Registration..." : "Complete Registration"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
