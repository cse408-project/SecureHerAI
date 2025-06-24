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

export default function ResetPasswordScreen() {
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { resetPassword } = useAuth();

  const handleResetPassword = async () => {
    if (!resetToken.trim() || !newPassword.trim() || !confirmPassword.trim()) {
      showAlert("Error", "Please fill in all fields", [{ text: "OK" }]);
      return;
    }

    if (newPassword !== confirmPassword) {
      showAlert("Error", "Passwords do not match", [{ text: "OK" }]);
      return;
    }

    if (newPassword.length < 6) {
      showAlert("Error", "Password must be at least 6 characters long", [
        { text: "OK" },
      ]);
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
          [
            {
              text: "OK",
              onPress: () => {
                // Navigate back to login
                console.log("Navigate back to login");
                router.push("/(auth)");
              },
            },
          ]
        );
      } else {
        showAlert("Error", response.error || "Failed to reset password", [
          { text: "OK" },
        ]);
      }
    } catch (error) {
      console.error("Reset password error:", error);
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
                Reset Password
              </Text>
              <Text className="text-base text-muted text-center">
                Enter your new password
              </Text>
            </View>

            {/* Form */}
            <View className="mb-6">
              <View className="mb-4">
                <Text className="text-sm font-medium text-foreground mb-2">
                  Reset Token
                </Text>
                <TextInput
                  className="w-full px-4 py-3 border border-border rounded-lg bg-background text-foreground"
                  placeholder="Enter reset token from email"
                  placeholderTextColor="#9CA3AF"
                  value={resetToken}
                  onChangeText={setResetToken}
                  autoFocus
                />
              </View>

              <View className="mb-4">
                <Text className="text-sm font-medium text-foreground mb-2">
                  New Password
                </Text>
                <TextInput
                  className="w-full px-4 py-3 border border-border rounded-lg bg-background text-foreground"
                  placeholder="Enter your new password"
                  placeholderTextColor="#9CA3AF"
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry
                  autoFocus
                />
              </View>

              <View className="mb-6">
                <Text className="text-sm font-medium text-foreground mb-2">
                  Confirm New Password
                </Text>
                <TextInput
                  className="w-full px-4 py-3 border border-border rounded-lg bg-background text-foreground"
                  placeholder="Confirm your new password"
                  placeholderTextColor="#9CA3AF"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                />
              </View>

              <TouchableOpacity
                className={`w-full py-4 rounded-lg mb-6 ${
                  isLoading
                    ? "bg-primary/50"
                    : "bg-primary active:bg-primary/90"
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
                <TouchableOpacity>
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
