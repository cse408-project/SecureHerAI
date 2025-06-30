import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { useAlert } from "../context/AlertContext";

export default function OAuthSuccessScreen() {
  const { token, email, name, picture, error } = useLocalSearchParams();
  const { showAlert } = useAlert();
  const [countdown, setCountdown] = useState(10);

  useEffect(() => {
    if (error) {
      showAlert("Authentication Error", error as string, "error");
      return;
    }

    if (!token) {
      showAlert("Authentication Error", "No token received", "error");
      return;
    }

    // Success case - show success message
    showAlert("Success", "Successfully authenticated with Google!", "success");

    // Start countdown
    const countdownInterval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          // Navigate to home after countdown
          router.replace("/");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(countdownInterval);
  }, [token, email, name, picture, error, showAlert]);

  const handleContinue = () => {
    router.replace("/");
  };

  if (error) {
    return (
      <SafeAreaView className="flex-1 bg-[#FFE4D6]">
        <View className="flex-1 justify-center px-6">
          <View className="bg-white rounded-xl p-6 shadow-sm">
            <Text className="text-2xl font-bold text-red-600 mb-4 text-center">
              Authentication Error
            </Text>
            <Text className="text-gray-700 text-center mb-6">{error}</Text>
            <TouchableOpacity
              className="w-full py-4 bg-[#67082F] rounded-lg"
              onPress={() => router.replace("/(auth)")}
            >
              <Text className="text-white text-center font-semibold text-lg">
                Back to Login
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#FFE4D6]">
      <ScrollView className="flex-1" contentContainerStyle={{ flexGrow: 1 }}>
        <View className="flex-1 justify-center px-6">
          <View className="bg-white rounded-xl p-6 shadow-sm">
            <Text className="text-2xl font-bold text-green-600 mb-4 text-center">
              Authentication Successful!
            </Text>

            <Text className="text-gray-700 text-center mb-6">
              You have successfully authenticated with Google.
            </Text>

            {/* User Info Display */}
            <View className="bg-gray-50 rounded-lg p-4 mb-6">
              <Text className="text-lg font-semibold text-gray-800 mb-2">
                Authentication Details:
              </Text>

              {email && (
                <View className="mb-2">
                  <Text className="text-sm font-medium text-gray-600">
                    Email:
                  </Text>
                  <Text className="text-gray-800">{email}</Text>
                </View>
              )}

              {name && (
                <View className="mb-2">
                  <Text className="text-sm font-medium text-gray-600">
                    Name:
                  </Text>
                  <Text className="text-gray-800">{name}</Text>
                </View>
              )}

              <View className="mb-2">
                <Text className="text-sm font-medium text-gray-600">
                  Token:
                </Text>
                <Text className="text-gray-800 text-xs font-mono">
                  {token ? `${(token as string).substring(0, 20)}...` : "N/A"}
                </Text>
              </View>
            </View>

            {/* Action Buttons */}
            <TouchableOpacity
              className="w-full py-4 bg-[#67082F] rounded-lg mb-4"
              onPress={handleContinue}
            >
              <Text className="text-white text-center font-semibold text-lg">
                Continue to App
              </Text>
            </TouchableOpacity>

            {/* Auto-redirect countdown */}
            <View className="items-center">
              <Text className="text-gray-600 text-sm">
                Auto-redirecting in {countdown} seconds...
              </Text>
              <ActivityIndicator
                size="small"
                color="#67082F"
                className="mt-2"
              />
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
