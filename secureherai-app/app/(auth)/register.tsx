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

export default function RegisterScreen() {
  const [formData, setFormData] = useState<RegisterRequest>({
    fullName: "",
    email: "",
    password: "",
    phoneNumber: "",
    dateOfBirth: "",
    role: "USER",
  });
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { register } = useAuth();
  const { showAlert } = useAlert();

  const updateFormData = (field: keyof RegisterRequest, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const validateForm = (): string | null => {
    if (!formData.fullName.trim()) return "Full name is required";
    if (!formData.email.trim()) return "Email is required";
    if (!formData.password) return "Password is required";
    if (formData.password !== confirmPassword) return "Passwords do not match";
    if (!formData.phoneNumber.trim()) return "Phone number is required";
    if (!formData.dateOfBirth.trim()) return "Date of birth is required";

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) return "Invalid email format";

    if (formData.password.length < 6)
      return "Password must be at least 6 characters";

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
      const response = await register(formData);

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
                  Full Name
                </Text>
                <TextInput
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-900"
                  placeholder="Enter your full name"
                  placeholderTextColor="#9CA3AF"
                  value={formData.fullName}
                  onChangeText={(value) => updateFormData("fullName", value)}
                  autoCapitalize="words"
                />
              </View>

              <View className="mb-4">
                <Text className="text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </Text>
                <TextInput
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-900"
                  placeholder="Enter your email"
                  placeholderTextColor="#9CA3AF"
                  value={formData.email}
                  onChangeText={(value) => updateFormData("email", value)}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              <View className="mb-4">
                <Text className="text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </Text>
                <TextInput
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-900"
                  placeholder="Enter your phone number"
                  placeholderTextColor="#9CA3AF"
                  value={formData.phoneNumber}
                  onChangeText={(value) => updateFormData("phoneNumber", value)}
                  keyboardType="phone-pad"
                />
              </View>

              <DatePicker
                label="Date of Birth"
                value={formData.dateOfBirth}
                onDateChange={(date) => updateFormData("dateOfBirth", date)}
                placeholder="Select your birth date"
                required
              />

              <View className="mb-4">
                <Text className="text-sm font-medium text-gray-700 mb-2">
                  Role
                </Text>
                <View className="border border-gray-300 rounded-lg bg-white">
                  <Picker
                    selectedValue={formData.role}
                    onValueChange={(value) => updateFormData("role", value)}
                    style={{ color: "#000" }}
                  >
                    <Picker.Item label="User" value="USER" />
                    <Picker.Item label="Responder" value="RESPONDER" />
                  </Picker>
                </View>
              </View>

              <View className="mb-4">
                <Text className="text-sm font-medium text-gray-700 mb-2">
                  Password
                </Text>
                <TextInput
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-900"
                  placeholder="Enter your password"
                  placeholderTextColor="#9CA3AF"
                  value={formData.password}
                  onChangeText={(value) => updateFormData("password", value)}
                  secureTextEntry
                />
              </View>

              <View className="mb-6">
                <Text className="text-sm font-medium text-gray-700 mb-2">
                  Confirm Password
                </Text>
                <TextInput
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-900"
                  placeholder="Confirm your password"
                  placeholderTextColor="#9CA3AF"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                />
              </View>

              {/* Register Button */}
              <TouchableOpacity
                className={`w-full py-4 rounded-lg mb-6 ${
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
