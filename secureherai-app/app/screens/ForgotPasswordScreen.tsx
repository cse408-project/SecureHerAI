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
import ApiService from "../services/api";

interface ForgotPasswordScreenProps {
  onBackToLogin: () => void;
  onGoToResetPassword?: (email: string) => void;
}

export const ForgotPasswordScreen: React.FC<ForgotPasswordScreenProps> = ({
  onBackToLogin,
  onGoToResetPassword,
}) => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      Alert.alert("Error", "Please enter your email address");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      Alert.alert("Error", "Please enter a valid email address");
      return;
    }

    setIsLoading(true);
    try {
      const response = await ApiService.forgotPassword(email.trim());

      if (response.success) {
        const message =
          response.message || "Password reset instructions sent to your email";

        // Set success state for visual feedback
        setEmailSent(true);

        if (onGoToResetPassword) {
          // Show Alert for mobile
          Alert.alert(
            "Email Sent",
            `${message}\n\nYou can also enter the reset code manually.`,
            [
              { text: "Wait for Email", onPress: onBackToLogin },
              {
                text: "Enter Code Now",
                onPress: () => onGoToResetPassword(email.trim()),
              },
            ]
          );

          // Automatic timeout for web compatibility
          setTimeout(() => {
            // Auto-navigate to reset password after 5 seconds if no action taken
            onGoToResetPassword(email.trim());
          }, 5000);
        } else {
          Alert.alert("Success", message, [
            { text: "OK", onPress: onBackToLogin },
          ]);

          // Automatic timeout for web compatibility
          setTimeout(() => {
            onBackToLogin();
          }, 3000);
        }
      } else {
        Alert.alert("Error", response.error || "Failed to send reset email");
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
          <View className="flex-1 px-8 py-12">
            {/* Header */}
            <View className="items-center mb-12">
              <Text className="text-3xl font-bold text-text mb-2">
                Forgot Password?
              </Text>
              <Text className="text-gray-600 text-center">
                Enter your email address and we&apos;ll send you instructions to
                reset your password
              </Text>
            </View>

            {/* Email Input */}
            <View className="mb-8">
              <Text className="text-sm font-medium text-gray-700 mb-2">
                Email Address
              </Text>
              <TextInput
                className="bg-white border border-gray-300 rounded-lg px-4 py-3 text-base"
                placeholder="Enter your email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            {/* Success Message */}
            {emailSent && (
              <View className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <Text className="text-green-800 text-center font-medium mb-2">
                  ✅ Email Sent Successfully!
                </Text>
                <Text className="text-green-600 text-center text-sm mb-3">
                  Password reset instructions have been sent to your email
                  address.
                </Text>
                <Text className="text-green-600 text-center text-sm">
                  Auto-redirecting to reset password in 5 seconds...
                </Text>
              </View>
            )}

            {/* Send Reset Button */}
            <TouchableOpacity
              className={`bg-primary rounded-lg py-4 mb-4 ${
                isLoading ? "opacity-70" : ""
              }`}
              onPress={handleForgotPassword}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white text-center font-semibold text-lg">
                  Send Reset Instructions
                </Text>
              )}
            </TouchableOpacity>

            {/* I have a reset code */}
            {onGoToResetPassword && (
              <TouchableOpacity
                className="bg-secondary border border-primary rounded-lg py-4 mb-4"
                onPress={() => onGoToResetPassword(email.trim() || "")}
              >
                <Text className="text-primary text-center font-semibold text-lg">
                  I Have a Reset Code
                </Text>
              </TouchableOpacity>
            )}

            {/* Back to Login */}
            <TouchableOpacity className="py-2" onPress={onBackToLogin}>
              <Text className="text-primary text-center font-medium">
                Back to Login
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default ForgotPasswordScreen;
