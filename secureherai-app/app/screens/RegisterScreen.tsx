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
import { useAuth } from "../context/AuthContext";
import { RegisterRequest } from "../types/auth";

interface RegisterScreenProps {
  onSwitchToLogin: () => void;
}

export const RegisterScreen: React.FC<RegisterScreenProps> = ({
  onSwitchToLogin,
}) => {
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

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email.trim())) return "Invalid email format";

    // Phone validation (basic)
    if (formData.phoneNumber.length < 10) return "Invalid phone number";

    // Date validation (basic YYYY-MM-DD format)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(formData.dateOfBirth)) {
      return "Date of birth must be in YYYY-MM-DD format";
    }

    // Responder validation
    if (formData.role === "RESPONDER") {
      if (!formData.responderType) return "Responder type is required";
      if (!formData.badgeNumber?.trim()) return "Badge number is required";
    }

    return null;
  };

  const handleRegister = async () => {
    const validationError = validateForm();
    if (validationError) {
      Alert.alert("Error", validationError);
      return;
    }

    setIsLoading(true);
    try {
      const response = await register({
        ...formData,
        email: formData.email.trim(),
        fullName: formData.fullName.trim(),
        phoneNumber: formData.phoneNumber.trim(),
      });

      if (response.success) {
        Alert.alert(
          "Success",
          response.message ||
            "Registration successful! Please check your email for verification.",
          [{ text: "OK", onPress: onSwitchToLogin }]
        );
      } else {
        Alert.alert("Error", response.error || "Registration failed");
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
        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
          <View className="flex-1 px-8 py-8">
            {/* Header */}
            <View className="items-center mb-8">
              <Image
                source={require("../../assets/images/secureherai_logo.png")}
                style={{
                  width: 80,
                  height: 80,
                  resizeMode: "contain",
                }}
              />
              <Text className="text-3xl font-bold text-text mt-4 mb-2">
                Join SecureHerAI
              </Text>
              <Text className="text-gray-600 text-center">
                Create your account to get started
              </Text>
            </View>

            {/* Registration Form */}
            <View className="mb-6">
              {/* Full Name */}
              <View className="mb-4">
                <Text className="text-sm font-medium text-gray-700 mb-2">
                  Full Name *
                </Text>
                <TextInput
                  className="bg-white border border-gray-300 rounded-lg px-4 py-3 text-base"
                  placeholder="Enter your full name"
                  value={formData.fullName}
                  onChangeText={(value) => updateFormData("fullName", value)}
                  autoCapitalize="words"
                />
              </View>

              {/* Email */}
              <View className="mb-4">
                <Text className="text-sm font-medium text-gray-700 mb-2">
                  Email Address *
                </Text>
                <TextInput
                  className="bg-white border border-gray-300 rounded-lg px-4 py-3 text-base"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChangeText={(value) => updateFormData("email", value)}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              {/* Phone Number */}
              <View className="mb-4">
                <Text className="text-sm font-medium text-gray-700 mb-2">
                  Phone Number *
                </Text>
                <TextInput
                  className="bg-white border border-gray-300 rounded-lg px-4 py-3 text-base"
                  placeholder="e.g., +8801712345678"
                  value={formData.phoneNumber}
                  onChangeText={(value) => updateFormData("phoneNumber", value)}
                  keyboardType="phone-pad"
                />
              </View>

              {/* Date of Birth */}
              <View className="mb-4">
                <Text className="text-sm font-medium text-gray-700 mb-2">
                  Date of Birth * (YYYY-MM-DD)
                </Text>
                <TextInput
                  className="bg-white border border-gray-300 rounded-lg px-4 py-3 text-base"
                  placeholder="1990-01-01"
                  value={formData.dateOfBirth}
                  onChangeText={(value) => updateFormData("dateOfBirth", value)}
                  keyboardType="numeric"
                />
              </View>

              {/* Role Selection */}
              <View className="mb-4">
                <Text className="text-sm font-medium text-gray-700 mb-2">
                  Role *
                </Text>
                <View className="bg-white border border-gray-300 rounded-lg">
                  <Picker
                    selectedValue={formData.role}
                    onValueChange={(value: string) =>
                      updateFormData("role", value as "USER" | "RESPONDER")
                    }
                    style={{ height: 50 }}
                  >
                    <Picker.Item label="Regular User" value="USER" />
                    <Picker.Item
                      label="Emergency Responder"
                      value="RESPONDER"
                    />
                  </Picker>
                </View>
              </View>

              {/* Responder Fields */}
              {formData.role === "RESPONDER" && (
                <>
                  <View className="mb-4">
                    <Text className="text-sm font-medium text-gray-700 mb-2">
                      Responder Type *
                    </Text>
                    <View className="bg-white border border-gray-300 rounded-lg">
                      <Picker
                        selectedValue={formData.responderType || ""}
                        onValueChange={(value: string) =>
                          updateFormData(
                            "responderType",
                            value as "POLICE" | "MEDICAL" | "FIRE"
                          )
                        }
                        style={{ height: 50 }}
                      >
                        <Picker.Item label="Select Type" value="" />
                        <Picker.Item label="Police" value="POLICE" />
                        <Picker.Item label="Medical" value="MEDICAL" />
                        <Picker.Item label="Fire Department" value="FIRE" />
                      </Picker>
                    </View>
                  </View>

                  <View className="mb-4">
                    <Text className="text-sm font-medium text-gray-700 mb-2">
                      Badge Number *
                    </Text>
                    <TextInput
                      className="bg-white border border-gray-300 rounded-lg px-4 py-3 text-base"
                      placeholder="e.g., POL-001"
                      value={formData.badgeNumber || ""}
                      onChangeText={(value) =>
                        updateFormData("badgeNumber", value)
                      }
                      autoCapitalize="characters"
                    />
                  </View>
                </>
              )}

              {/* Password */}
              <View className="mb-4">
                <Text className="text-sm font-medium text-gray-700 mb-2">
                  Password *
                </Text>
                <TextInput
                  className="bg-white border border-gray-300 rounded-lg px-4 py-3 text-base"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChangeText={(value) => updateFormData("password", value)}
                  secureTextEntry
                />
              </View>

              {/* Confirm Password */}
              <View className="mb-6">
                <Text className="text-sm font-medium text-gray-700 mb-2">
                  Confirm Password *
                </Text>
                <TextInput
                  className="bg-white border border-gray-300 rounded-lg px-4 py-3 text-base"
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                />
              </View>
            </View>

            {/* Register Button */}
            <TouchableOpacity
              className={`bg-primary rounded-lg py-4 mb-4 ${
                isLoading ? "opacity-70" : ""
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

            {/* Switch to Login */}
            <View className="flex-row justify-center items-center">
              <Text className="text-gray-600">Already have an account? </Text>
              <TouchableOpacity onPress={onSwitchToLogin}>
                <Text className="text-primary font-semibold">Sign In</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default RegisterScreen;
