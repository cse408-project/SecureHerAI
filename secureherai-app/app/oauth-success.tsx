import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { useAlert } from "../context/AlertContext";
import { useAuth } from "../context/AuthContext";

export default function OAuthSuccessScreen() {
  const { token, error } = useLocalSearchParams();
  const { showAlert } = useAlert();
  const { setToken, handleGoogleLogin } = useAuth();
  // const [countdown, setCountdown] = useState(2);

  useEffect(() => {
    const handleOAuthSuccess = async () => {
      if (error) {
        showAlert("Authentication Error", error as string, "error");
        return;
      }

      if (!token) {
        showAlert("Authentication Error", "No token received", "error");
        return;
      }

      try {
        console.log("OAuth Success Screen - Processing token");

        // Use the dedicated Google login handler from AuthContext
        // This will properly validate the token, store it, and get user data

        showAlert(
          "Success",
          "Successfully authenticated with Google!",
          "success"
        );

        await setToken(token as string);
        await handleGoogleLogin(token as string);
        console.log("Token saved and user data fetched successfully");

        // Start countdown without showing an additional alert
        // const countdownInterval = setInterval(() => {
        //   setCountdown((prev) => {
        //     if (prev <= 1) {
        //       clearInterval(countdownInterval);
        // Navigate to index to trigger authentication check
        router.replace("/");
        return 0;
        //     }
        //     return prev - 1;
        //   });
        // }, 1000);

        // return () => clearInterval(countdownInterval);
      } catch (error) {
        console.error("Error processing OAuth success:", error);
        showAlert("Error", "Failed to process authentication", "error");
      }
    };

    handleOAuthSuccess();
  }, [token, error]);

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
        <View className="flex-1 justify-center px-6 py-8 max-w-screen-md mx-auto w-full">
          {/* Logo and Branding */}
          <View className="items-center mb-8">
            <View className="w-24 h-24 rounded-full bg-white shadow-lg items-center justify-center mb-4">
              <Image
                source={require("../assets/images/secureherai_logo.png")}
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

          <View className="bg-white rounded-xl p-6 shadow-sm mb-6">
            <Text className="text-2xl font-bold text-[#67082F] mb-6 text-center">
              Authentication Successful!
            </Text>

            <Text className="text-gray-700 text-center mb-6">
              You have successfully authenticated with Google.
            </Text>

            {/* Action Buttons */}
            <TouchableOpacity
              className="w-full py-4 bg-[#67082F] rounded-lg mb-4"
              onPress={handleContinue}
            >
              <Text className="text-white text-center font-semibold text-lg">
                Continue to App
              </Text>
            </TouchableOpacity>

            {/* Auto-redirect countdown
            <View className="items-center">
              <Text className="text-gray-600 text-sm">
                Auto-redirecting in {countdown} seconds...
              </Text>
              <ActivityIndicator
                size="small"
                color="#67082F"
                className="mt-2"
              />
            </View> */}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
