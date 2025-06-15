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
import ApiService from "../services/api";

interface ResetPasswordScreenProps {
  onBackToLogin: () => void;
  prefilledToken?: string;
  prefilledEmail?: string;
}

export const ResetPasswordScreen: React.FC<ResetPasswordScreenProps> = ({
  onBackToLogin,
  prefilledToken = "",
  prefilledEmail = "",
}) => {
  const [resetToken, setResetToken] = useState(prefilledToken);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  const handleResetPassword = async () => {
    if (!resetToken.trim()) {
      Alert.alert("Error", "Please enter your reset token");
      return;
    }

    if (!newPassword.trim()) {
      Alert.alert("Error", "Please enter a new password");
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters long");
      return;
    }

    setIsLoading(true);
    try {
      const response = await ApiService.resetPassword(
        resetToken.trim(),
        newPassword
      );

      if (response.success) {
        // Clear form fields
        setResetToken("");
        setNewPassword("");
        setConfirmPassword("");
        setResetSuccess(true);

        // Show Alert for mobile (works on mobile, ignored on web)
        Alert.alert(
          "Success",
          response.message ||
            "Your password has been reset successfully. Please login with your new password.",
          [
            {
              text: "OK",
              onPress: () => {
                // Call the callback directly after a small delay to ensure Alert closes
                setTimeout(() => {
                  onBackToLogin();
                }, 100);
              },
            },
          ]
        );

        // Automatic timeout redirect for web compatibility (works on all platforms)
        setTimeout(() => {
          onBackToLogin();
        }, 3000);
      } else {
        Alert.alert("Error", response.error || "Failed to reset password");
      }
    } catch {
      Alert.alert("Error", "Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Show success screen
  if (resetSuccess) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-4xl mb-4">✅</Text>
          <Text className="text-2xl font-bold text-primary mb-4 text-center">
            Password Reset Successful!
          </Text>
          <Text className="text-text-secondary text-center mb-8">
            Your password has been reset successfully. Redirecting to login in 3
            seconds...
          </Text>
          <TouchableOpacity
            className="bg-primary px-6 py-3 rounded-lg"
            onPress={onBackToLogin}
          >
            <Text className="text-white font-semibold">Go to Login Now</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="flex-1 px-8 py-12">
            {/* Header */}
            <View className="items-center mb-12">
              <Image
                source={require("../../assets/images/secureherai_logo.png")}
                style={{
                  width: 120,
                  height: 120,
                  resizeMode: "contain",
                }}
              />
              <Text className="text-3xl font-bold text-text mt-6 mb-2">
                Reset Password
              </Text>
              <Text className="text-gray-600 text-center">
                Enter your reset token and new password
              </Text>
            </View>

            {/* Reset Token Input */}
            <View className="mb-6">
              <Text className="text-gray-700 mb-2 font-medium">
                Reset Token
              </Text>
              <TextInput
                className="bg-white border border-gray-300 rounded-lg px-4 py-3 text-gray-800"
                placeholder="Enter reset token from email"
                value={resetToken}
                onChangeText={setResetToken}
                multiline
                textAlignVertical="top"
                style={{ minHeight: 80 }}
              />
            </View>

            {/* New Password Input */}
            <View className="mb-6">
              <Text className="text-gray-700 mb-2 font-medium">
                New Password
              </Text>
              <TextInput
                className="bg-white border border-gray-300 rounded-lg px-4 py-3 text-gray-800"
                placeholder="Enter new password"
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
              />
            </View>

            {/* Confirm Password Input */}
            <View className="mb-8">
              <Text className="text-gray-700 mb-2 font-medium">
                Confirm Password
              </Text>
              <TextInput
                className="bg-white border border-gray-300 rounded-lg px-4 py-3 text-gray-800"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
              />
            </View>

            {/* Reset Password Button */}
            <TouchableOpacity
              className={`rounded-lg py-4 mb-6 ${
                isLoading ? "bg-gray-400" : "bg-primary"
              }`}
              onPress={handleResetPassword}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text className="text-white text-center font-semibold text-lg">
                  Reset Password
                </Text>
              )}
            </TouchableOpacity>

            {/* Back to Login */}
            <TouchableOpacity className="py-3" onPress={onBackToLogin}>
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

export default ResetPasswordScreen;
