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
import { useAuth } from "../../context/AuthContext";
import { useAlert } from "../../context/AlertContext";
import { RegisterRequest } from "../../types/auth";
import DatePicker from "../../components/DatePicker";
import ResponderFields from "../../components/ResponderFields";

export default function RegisterScreen() {
  const [formData, setFormData] = useState<RegisterRequest>({
    fullName: "",
    email: "",
    password: "",
    phoneNumber: "",
    dateOfBirth: "",
    role: "USER",
    responderType: undefined,
    badgeNumber: "",
    branchName: "",
    address: "",
  });
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingGoogle, setIsLoadingGoogle] = useState(false);
  const [errors, setErrors] = useState<any>({});

  const { register, initiateGoogleLogin } = useAuth();
  const { showAlert } = useAlert();

  const updateFormData = (field: keyof RegisterRequest, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const validateForm = (): string | null => {
    const newErrors: any = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = "Full name is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        newErrors.email = "Invalid email format";
      }
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    if (formData.password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = "Phone number is required";
    } else if (!/^\+?[\d\s-()]+$/.test(formData.phoneNumber.trim())) {
      newErrors.phoneNumber = "Please enter a valid phone number";
    }

    if (!formData.dateOfBirth.trim()) {
      newErrors.dateOfBirth = "Date of birth is required";
    }

    // Additional validation for responders
    if (formData.role === "RESPONDER") {
      if (!formData.responderType) {
        newErrors.responderType = "Responder type is required for responders";
      }
      if (!formData.badgeNumber?.trim()) {
        newErrors.badgeNumber = "Badge number is required for responders";
      }
      if (!formData.branchName?.trim()) {
        newErrors.branchName = "Branch name is required for responders";
      }
      if (!formData.address?.trim()) {
        newErrors.address = "Address is required for responders";
      }
    }

    setErrors(newErrors);

    // If there are errors, show the first one
    const errorKeys = Object.keys(newErrors);
    if (errorKeys.length > 0) {
      return newErrors[errorKeys[0]];
    }

    return null;
  };

  const handleRegister = async () => {
    const validationError = validateForm();
    if (validationError) {
      showAlert("Validation Error", validationError, "error");
      return;
    }

    setIsLoading(true);
    try {
      // Clean up form data - remove empty optional fields for USER role
      const cleanFormData = { ...formData };
      if (formData.role === "USER") {
        delete cleanFormData.responderType;
        delete cleanFormData.badgeNumber;
        delete cleanFormData.branchName;
        delete cleanFormData.address;
      }

      const response = await register(cleanFormData);

      if (response.success) {
        showAlert(
          "Success",
          response.message ||
            "Registration successful! Please verify your email.",
          "success"
        );
        // Navigate back to login after showing success
        setTimeout(() => {
          router.push("/(auth)");
        }, 2000);
      } else {
        showAlert(
          "Registration Failed",
          response.error || "An error occurred",
          "error"
        );
      }
    } catch (error) {
      console.error("Registration error:", error);
      showAlert("Error", "An unexpected error occurred", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setIsLoadingGoogle(true);
    try {
      // Use the AuthContext method to initiate Google login
      await initiateGoogleLogin();
      // Navigation will happen in AuthContext's deep link handler
    } catch (error) {
      console.error("Google Auth Error:", error);
      showAlert(
        "Authentication Error",
        "Failed to start Google authentication",
        "error"
      );
    } finally {
      setIsLoadingGoogle(false);
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
                Join our safety community
              </Text>
            </View>

            {/* Registration Form */}
            <View className="bg-white rounded-xl p-6 shadow-sm mb-6">
              <Text className="text-2xl font-bold text-[#67082F] mb-6 text-center">
                Create Account
              </Text>
              <View className="mb-4">
                <Text className="text-sm font-medium text-gray-700 mb-2">
                  Full Name <Text className="text-red-500">*</Text>
                </Text>
                <TextInput
                  className={`w-full px-4 py-3 border rounded-lg bg-white text-gray-900 ${
                    errors.fullName ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="Enter your full name"
                  placeholderTextColor="#9CA3AF"
                  value={formData.fullName}
                  onChangeText={(value) => updateFormData("fullName", value)}
                  autoCapitalize="words"
                />
                {errors.fullName && (
                  <Text className="text-red-500 text-sm mt-1">
                    {errors.fullName}
                  </Text>
                )}
              </View>

              <View className="mb-4">
                <Text className="text-sm font-medium text-gray-700 mb-2">
                  Email Address <Text className="text-red-500">*</Text>
                </Text>
                <TextInput
                  className={`w-full px-4 py-3 border rounded-lg bg-white text-gray-900 ${
                    errors.email ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="Enter your email"
                  placeholderTextColor="#9CA3AF"
                  value={formData.email}
                  onChangeText={(value) => updateFormData("email", value)}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                {errors.email && (
                  <Text className="text-red-500 text-sm mt-1">
                    {errors.email}
                  </Text>
                )}
              </View>

              <View className="mb-4">
                <Text className="text-sm font-medium text-gray-700 mb-2">
                  Phone Number <Text className="text-red-500">*</Text>
                </Text>
                <TextInput
                  className={`w-full px-4 py-3 border rounded-lg bg-white text-gray-900 ${
                    errors.phoneNumber ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="Enter your phone number"
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

              <View className="mb-4">
                <Text className="text-sm font-medium text-gray-700 mb-2">
                  Role <Text className="text-red-500">*</Text>
                </Text>
                <View className="border border-gray-300 rounded-lg bg-white">
                  <Picker
                    selectedValue={formData.role}
                    onValueChange={(value) => {
                      updateFormData("role", value);
                      // Reset responder-specific fields when changing role
                      if (value === "USER") {
                        setFormData((prev) => ({
                          ...prev,
                          role: value,
                          responderType: undefined,
                          badgeNumber: "",
                          branchName: "",
                          address: "",
                          currentLatitude: undefined,
                          currentLongitude: undefined,
                        }));
                      }
                    }}
                    style={{ color: "#000" }}
                  >
                    <Picker.Item label="User" value="USER" />
                    <Picker.Item label="Responder" value="RESPONDER" />
                  </Picker>
                </View>
                {formData.role === "RESPONDER" && (
                  <View className="mt-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <Text className="text-blue-800 text-sm font-medium">
                      Responder Registration
                    </Text>
                    <Text className="text-blue-700 text-xs mt-1">
                      As a responder, you&apos;ll receive incident alerts and
                      can assist users in your area.
                    </Text>
                  </View>
                )}
              </View>

              {/* Responder-specific fields */}
              {formData.role === "RESPONDER" && (
                <ResponderFields
                  formData={formData}
                  errors={errors}
                  onFieldChange={(field: string, value: string) =>
                    updateFormData(field as keyof RegisterRequest, value)
                  }
                  showTitle={true}
                />
              )}

              <View className="mb-4">
                <Text className="text-sm font-medium text-gray-700 mb-2">
                  Password <Text className="text-red-500">*</Text>
                </Text>
                <TextInput
                  className={`w-full px-4 py-3 border rounded-lg bg-white text-gray-900 ${
                    errors.password ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="Enter your password"
                  placeholderTextColor="#9CA3AF"
                  value={formData.password}
                  onChangeText={(value) => updateFormData("password", value)}
                  secureTextEntry
                />
                {errors.password && (
                  <Text className="text-red-500 text-sm mt-1">
                    {errors.password}
                  </Text>
                )}
              </View>

              <View className="mb-6">
                <Text className="text-sm font-medium text-gray-700 mb-2">
                  Confirm Password <Text className="text-red-500">*</Text>
                </Text>
                <TextInput
                  className={`w-full px-4 py-3 border rounded-lg bg-white text-gray-900 ${
                    errors.confirmPassword
                      ? "border-red-500"
                      : "border-gray-300"
                  }`}
                  placeholder="Confirm your password"
                  placeholderTextColor="#9CA3AF"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                />
                {errors.confirmPassword && (
                  <Text className="text-red-500 text-sm mt-1">
                    {errors.confirmPassword}
                  </Text>
                )}
              </View>

              {/* Register Button */}
              <TouchableOpacity
                className={`w-full py-4 rounded-lg mb-4 ${
                  isLoading
                    ? "bg-[#67082F]/50"
                    : "bg-[#67082F] active:bg-[#67082F]/90"
                }`}
                onPress={handleRegister}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-white text-center font-semibold text-lg">
                    Create Account
                  </Text>
                )}
              </TouchableOpacity>

              {/* Divider */}
              <View className="flex-row items-center mb-4">
                <View className="flex-1 h-px bg-gray-300" />
                <Text className="mx-4 text-gray-500 text-sm">or</Text>
                <View className="flex-1 h-px bg-gray-300" />
              </View>

              {/* Google Sign Up Button */}
              <TouchableOpacity
                className="w-full py-4 rounded-lg border border-gray-300 bg-white flex-row items-center justify-center mb-6"
                onPress={handleGoogleSignUp}
                disabled={isLoadingGoogle}
              >
                {isLoadingGoogle ? (
                  <ActivityIndicator color="#67082F" className="mr-2" />
                ) : (
                  <View className="flex-row items-center justify-center">
                    <Image
                      source={require("../../assets/images/google_icon.png")}
                      style={{ width: 20, height: 20, marginRight: 8 }}
                    />
                    <Text className="text-gray-700 font-semibold text-lg">
                      Sign up with Google
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>

            {/* Sign in link */}
            <View className="items-center">
              <Text className="text-gray-600 mb-2">
                Already have an account?
              </Text>
              <TouchableOpacity onPress={() => router.push("/(auth)")}>
                <Text className="text-[#67082F] font-semibold">Sign In</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
