import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import ApiService from "../services/api";

interface GoogleOAuthScreenProps {
  onBack: () => void;
  onSuccess: (token: string) => void;
}

export const GoogleOAuthScreen: React.FC<GoogleOAuthScreenProps> = ({
  onBack,
  onSuccess,
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      const response = await ApiService.getGoogleOAuthUrl();

      if (response.success && response.url) {
        // In a real app, you would:
        // 1. Open the OAuth URL in a WebView or browser
        // 2. Handle the redirect/callback
        // 3. Extract the token from the callback

        Alert.alert(
          "OAuth Integration",
          "Google OAuth would open here. This is a demo implementation.\n\nIn a production app, this would:\n1. Open Google login in WebView\n2. Handle the OAuth callback\n3. Complete the authentication flow",
          [
            { text: "Cancel", onPress: onBack },
            {
              text: "Simulate Success",
              onPress: () => {
                // Simulate successful OAuth flow
                onSuccess("demo-oauth-token");
              },
            },
          ]
        );
      } else {
        Alert.alert("Error", "Failed to get OAuth URL");
      }
    } catch {
      Alert.alert("Error", "Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
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
            Sign in with Google
          </Text>
          <Text className="text-gray-600 text-center">
            Continue with your Google account for quick access
          </Text>
        </View>

        {/* OAuth Info */}
        <View className="bg-blue-50 rounded-lg p-6 mb-8 border border-blue-200">
          <Text className="text-blue-800 font-semibold mb-2">
            OAuth Integration
          </Text>
          <Text className="text-blue-700 text-sm">
            This screen demonstrates Google OAuth integration. In a production
            app, this would open Google&apos;s authentication flow in a secure
            WebView.
          </Text>
        </View>

        {/* Google Sign In Button */}
        <TouchableOpacity
          className={`bg-white border border-gray-300 rounded-lg py-4 mb-6 flex-row items-center justify-center ${
            isLoading ? "opacity-70" : ""
          }`}
          onPress={handleGoogleLogin}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#4285f4" />
          ) : (
            <>
              <View className="w-5 h-5 bg-blue-500 rounded mr-3" />
              <Text className="text-gray-700 font-semibold text-lg">
                Continue with Google
              </Text>
            </>
          )}
        </TouchableOpacity>

        {/* OAuth Flow Info */}
        <View className="bg-gray-50 rounded-lg p-4 mb-8">
          <Text className="text-gray-700 font-medium mb-2">OAuth Flow:</Text>
          <Text className="text-gray-600 text-sm mb-1">
            1. Get OAuth URL from API
          </Text>
          <Text className="text-gray-600 text-sm mb-1">
            2. Open Google login in WebView
          </Text>
          <Text className="text-gray-600 text-sm mb-1">
            3. Handle OAuth callback
          </Text>
          <Text className="text-gray-600 text-sm mb-1">
            4. Extract token and authenticate
          </Text>
          <Text className="text-gray-600 text-sm">
            5. Complete profile if needed
          </Text>
        </View>

        {/* Back Button */}
        <TouchableOpacity className="py-3" onPress={onBack}>
          <Text className="text-primary text-center font-medium">
            Back to Login
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default GoogleOAuthScreen;
