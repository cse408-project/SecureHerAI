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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Picker } from "@react-native-picker/picker";
// @ts-ignore
import { router } from "expo-router";
import { useAuth } from "../../context/AuthContext";
import { RegisterRequest } from "../../types/auth";

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
      Alert.alert("Validation Error", validationError);
      return;
    }

    setIsLoading(true);
    try {
      const response = await register(formData);

      if (response.success) {
        Alert.alert(
          "Success",
          response.message ||
            "Registration successful! Please verify your email.",
          [
            {
              text: "OK",
              onPress: () => {
                // Navigate back to login
                router.push("/(auth)");
              },
            },
          ]
        );
      } else {
        Alert.alert(
          "Registration Failed",
          response.error || "An error occurred"
        );
      }
    } catch (error) {
      console.error("Registration error:", error);
      Alert.alert("Error", "An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="flex-1 px-6 py-8">
            {/* Header */}
            <View className="items-center mb-8">
              <Text className="text-3xl font-bold text-primary mb-2">
                Create Account
              </Text>
              <Text className="text-base text-muted text-center">
                Join SecureHer AI community
              </Text>
            </View>

            {/* Registration Form */}
            <View className="mb-6">
              <View className="mb-4">
                <Text className="text-sm font-medium text-foreground mb-2">
                  Full Name
                </Text>
                <TextInput
                  className="w-full px-4 py-3 border border-border rounded-lg bg-background text-foreground"
                  placeholder="Enter your full name"
                  placeholderTextColor="#9CA3AF"
                  value={formData.fullName}
                  onChangeText={(value) => updateFormData("fullName", value)}
                  autoCapitalize="words"
                />
              </View>

              <View className="mb-4">
                <Text className="text-sm font-medium text-foreground mb-2">
                  Email Address
                </Text>
                <TextInput
                  className="w-full px-4 py-3 border border-border rounded-lg bg-background text-foreground"
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
                <Text className="text-sm font-medium text-foreground mb-2">
                  Phone Number
                </Text>
                <TextInput
                  className="w-full px-4 py-3 border border-border rounded-lg bg-background text-foreground"
                  placeholder="Enter your phone number"
                  placeholderTextColor="#9CA3AF"
                  value={formData.phoneNumber}
                  onChangeText={(value) => updateFormData("phoneNumber", value)}
                  keyboardType="phone-pad"
                />
              </View>

              <View className="mb-4">
                <Text className="text-sm font-medium text-foreground mb-2">
                  Date of Birth
                </Text>
                <TextInput
                  className="w-full px-4 py-3 border border-border rounded-lg bg-background text-foreground"
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#9CA3AF"
                  value={formData.dateOfBirth}
                  onChangeText={(value) => updateFormData("dateOfBirth", value)}
                />
              </View>

              <View className="mb-4">
                <Text className="text-sm font-medium text-foreground mb-2">
                  Role
                </Text>
                <View className="border border-border rounded-lg bg-background">
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
                <Text className="text-sm font-medium text-foreground mb-2">
                  Password
                </Text>
                <TextInput
                  className="w-full px-4 py-3 border border-border rounded-lg bg-background text-foreground"
                  placeholder="Enter your password"
                  placeholderTextColor="#9CA3AF"
                  value={formData.password}
                  onChangeText={(value) => updateFormData("password", value)}
                  secureTextEntry
                />
              </View>

              <View className="mb-6">
                <Text className="text-sm font-medium text-foreground mb-2">
                  Confirm Password
                </Text>
                <TextInput
                  className="w-full px-4 py-3 border border-border rounded-lg bg-background text-foreground"
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
                    ? "bg-primary/50"
                    : "bg-primary active:bg-primary/90"
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
              <View className="items-center">
                <Text className="text-muted mb-2">
                  Already have an account?
                </Text>
                <TouchableOpacity onPress={() => router.push("/(auth)")}>
                  <Text className="text-primary font-semibold">Sign In</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
