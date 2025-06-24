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
} from "react-native";
import { showAlert } from "../../utils/alertManager";
import { SafeAreaView } from "react-native-safe-area-context";
// @ts-ignore
import { router } from "expo-router";
import { useAuth } from "../../context/AuthContext";

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { forgotPassword } = useAuth();

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      showAlert("Error", "Please enter your email address", [{ text: "OK" }]);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showAlert("Error", "Please enter a valid email address", [
        { text: "OK" },
      ]);
      return;
    }

    setIsLoading(true);
    try {
      const response = await forgotPassword(email.trim());

      if (response.success) {
        showAlert(
          "Success",
          response.message || "Password reset instructions sent to your email",
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
        showAlert(
          "Error",
          response.error || "Failed to send reset instructions",
          [{ text: "OK" }]
        );
      }
    } catch (error) {
      console.error("Forgot password error:", error);
      showAlert("Error", "An unexpected error occurred", [{ text: "OK" }]);
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
          <View className="flex-1 justify-center px-6 py-8">
            {/* Header */}
            <View className="items-center mb-8">
              <Text className="text-3xl font-bold text-primary mb-2">
                Forgot Password
              </Text>
              <Text className="text-base text-muted text-center">
                Enter your email to receive a password reset link
              </Text>
            </View>

            {/* Form */}
            <View className="mb-6">
              <View className="mb-6">
                <Text className="text-sm font-medium text-foreground mb-2">
                  Email Address
                </Text>
                <TextInput
                  className="w-full px-4 py-3 border border-border rounded-lg bg-background text-foreground"
                  placeholder="Enter your email"
                  placeholderTextColor="#9CA3AF"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoFocus
                />
              </View>

              <TouchableOpacity
                className={`w-full py-4 rounded-lg mb-6 ${
                  isLoading
                    ? "bg-primary/50"
                    : "bg-primary active:bg-primary/90"
                }`}
                onPress={handleForgotPassword}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-white text-center font-semibold text-lg">
                    Send Reset Link
                  </Text>
                )}
              </TouchableOpacity>

              {/* Back to Login */}
              <View className="items-center">
                <TouchableOpacity onPress={() => router.push("/(auth)")}>
                  <Text className="text-primary font-semibold">
                    Back to Login
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
