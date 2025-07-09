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
import { useAlert } from "../../context/AlertContext";
import { SafeAreaView } from "react-native-safe-area-context";
// @ts-ignore
import { router } from "expo-router";
import { useAuth } from "../../context/AuthContext";

export default function ResetPasswordScreen() {
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { showAlert } = useAlert();

  const { resetPassword } = useAuth();

  const handleResetPassword = async () => {
    if (!resetToken.trim() || !newPassword.trim() || !confirmPassword.trim()) {
      showAlert("Error", "Please fill in all fields", "error");
      return;
    }

    if (newPassword !== confirmPassword) {
      showAlert("Error", "Passwords do not match", "error");
      return;
    }

    if (newPassword.length < 6) {
      showAlert(
        "Error",
        "Password must be at least 6 characters long",
        "error"
      );
      return;
    }

    setIsLoading(true);
    try {
      const response = await resetPassword(resetToken.trim(), newPassword);

      if (response.success) {
        showAlert(
          "Success",
          response.message ||
            "Your password has been reset successfully. You can now log in with your new password.",
          "success"
        );
        // Navigate back to login after showing success
        setTimeout(() => {
          router.push("/(auth)");
        }, 2000);
      } else {
        showAlert(
          "Error",
          response.error || "Failed to reset password",
          "error"
        );
      }
    } catch (error) {
      console.error("Reset password error:", error);
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
                Your safety companion
              </Text>
            </View>

            {/* Form */}
            <View className="bg-white rounded-xl p-6 shadow-sm mb-6">
              <Text className="text-2xl font-bold text-[#67082F] mb-6 text-center">
                Reset Password
              </Text>

              <View className="mb-4">
                <Text className="text-sm font-medium text-gray-700 mb-2">
                  Reset Token
                </Text>
                <TextInput
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-900"
                  placeholder="Enter reset token from email"
                  placeholderTextColor="#9CA3AF"
                  value={resetToken}
                  onChangeText={setResetToken}
                  autoFocus
                />
              </View>

              <View className="mb-4">
                <Text className="text-sm font-medium text-gray-700 mb-2">
                  New Password
                </Text>
                <TextInput
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-900"
                  placeholder="Enter your new password"
                  placeholderTextColor="#9CA3AF"
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry
                />
              </View>

              <View className="mb-6">
                <Text className="text-sm font-medium text-gray-700 mb-2">
                  Confirm New Password
                </Text>
                <TextInput
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-900"
                  placeholder="Confirm your new password"
                  placeholderTextColor="#9CA3AF"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                />
              </View>

              <TouchableOpacity
                className={`w-full py-4 rounded-lg mb-4 ${
                  isLoading
                    ? "bg-[#67082F]/50"
                    : "bg-[#67082F] active:bg-[#67082F]/90"
                }`}
                onPress={handleResetPassword}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-white text-center font-semibold text-lg">
                    Reset Password
                  </Text>
                )}
              </TouchableOpacity>

              {/* Back to Login */}
              <View className="items-center">
                <TouchableOpacity
                  onPress={() => router.push("/(auth)")}
                  className="py-3"
                >
                  <Text className="text-[#67082F] font-medium">
                    ← Back to Login
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
