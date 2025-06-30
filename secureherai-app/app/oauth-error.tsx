import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";

export default function OAuthErrorScreen() {
  const { error } = useLocalSearchParams();

  return (
    <SafeAreaView className="flex-1 bg-[#FFE4D6]">
      <View className="flex-1 justify-center px-6">
        <View className="bg-white rounded-xl p-6 shadow-sm">
          <Text className="text-2xl font-bold text-red-600 mb-4 text-center">
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
    </SafeAreaView>
  );
}
