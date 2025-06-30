import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Alert,
  TouchableOpacity,
  Platform,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import DateTimePicker from "@react-native-community/datetimepicker";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";

import CustomTextInput from "../components/CustomTextInput";
import CustomButton from "../components/CustomButton";
import { decodeJWT } from "../utils/jwt";

export default function CompleteRegisterScreen() {
  const { token } = useLocalSearchParams();
  const [loading, setLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [googleInfo, setGoogleInfo] = useState(null);

  const [formData, setFormData] = useState({
    phoneNumber: "",
    dateOfBirth: new Date(),
    role: "USER",
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (token) {
      try {
        // Decode the temp token to get Google info
        const decodedToken = decodeJWT(token);
        setGoogleInfo({
          email: decodedToken.oauth_email,
          name: decodedToken.oauth_name,
          picture: decodedToken.oauth_picture,
        });
      } catch (error) {
        console.error("Error decoding token:", error);
        Alert.alert("Error", "Invalid registration token. Please try again.");
        router.replace("/(auth)");
      }
    } else {
      Alert.alert("Error", "No registration token found. Please try again.");
      router.replace("/(auth)");
    }
  }, [token]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = "Phone number is required";
    } else if (!/^\+?[\d\s-()]+$/.test(formData.phoneNumber.trim())) {
      newErrors.phoneNumber = "Please enter a valid phone number";
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
        dateOfBirth: formData.dateOfBirth.toISOString().split("T")[0], // YYYY-MM-DD format
        role: formData.role,
      };

      const response = await fetch(
        `http://192.168.0.103:8080/api/auth/complete-oauth-registration`,
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
        Alert.alert(
          "Success!",
          "Your account has been created successfully. Please sign in.",
          [
            {
              text: "OK",
              onPress: () => router.replace("/(auth)"),
            },
          ]
        );
      } else {
        Alert.alert(
          "Error",
          data.error || "Registration failed. Please try again."
        );
      }
    } catch (error) {
      console.error("Registration error:", error);
      Alert.alert(
        "Error",
        "Network error. Please check your connection and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const onDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || formData.dateOfBirth;
    setShowDatePicker(Platform.OS === "ios");
    setFormData((prev) => ({ ...prev, dateOfBirth: currentDate }));
  };

  const formatDate = (date) => {
    return date.toLocaleDateString();
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

          <CustomTextInput
            label="Phone Number"
            value={formData.phoneNumber}
            onChangeText={(text) =>
              setFormData((prev) => ({ ...prev, phoneNumber: text }))
            }
            placeholder="+1234567890"
            keyboardType="phone-pad"
            error={errors.phoneNumber}
            required
          />

          <View className="mb-4">
            <Text className="text-gray-700 font-medium mb-2">
              Date of Birth <Text className="text-red-500">*</Text>
            </Text>
            <TouchableOpacity
              onPress={() => setShowDatePicker(true)}
              className="bg-white border border-gray-300 rounded-lg px-4 py-3"
            >
              <Text className="text-gray-900">
                {formatDate(formData.dateOfBirth)}
              </Text>
            </TouchableOpacity>
          </View>

          {showDatePicker && (
            <DateTimePicker
              value={formData.dateOfBirth}
              mode="date"
              display="default"
              onChange={onDateChange}
              maximumDate={new Date()}
            />
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
        </View>

        {/* Complete Registration Button */}
        <CustomButton
          title="Complete Registration"
          onPress={handleCompleteRegistration}
          loading={loading}
          className="mb-8"
        />
      </ScrollView>
    </SafeAreaView>
  );
}
