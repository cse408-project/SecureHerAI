import React from "react";
import { View, Text, TouchableOpacity, ScrollView, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";

export default function OAuthErrorScreen() {
  const { error } = useLocalSearchParams();

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
              Authentication Failed
            </Text>

            <Text className="text-gray-700 text-center mb-6">
              {error || "An error occurred during authentication"}
            </Text>

            <TouchableOpacity
              className="w-full py-4 bg-[#67082F] rounded-lg mb-4"
              onPress={() => router.replace("/(auth)")}
            >
              <Text className="text-white text-center font-semibold text-lg">
                Back to Login
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="w-full py-4 border border-gray-300 rounded-lg"
              onPress={() => router.replace("/")}
            >
              <Text className="text-gray-700 text-center font-semibold">
                Go to Home
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
