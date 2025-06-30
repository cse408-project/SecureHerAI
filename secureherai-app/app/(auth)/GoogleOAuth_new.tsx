import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as WebBrowser from "expo-web-browser";

// Required for expo-web-browser flow
WebBrowser.maybeCompleteAuthSession();

interface GoogleOAuthProps {
  onBack: () => void;
  onSuccess: (token: string) => void;
}

export const GoogleOAuth: React.FC<GoogleOAuthProps> = ({
  onBack,
  onSuccess,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const API_BASE_URL =
    process.env.EXPO_PUBLIC_API_BASE_URL || "http://localhost:8080/api";

  // Handle deep link authentication response
  useEffect(() => {
    const handleDeepLink = (url: string) => {
      if (url.includes("secureheraiapp://") || url.includes("secureherai://")) {
        const urlParams = new URLSearchParams(url.split("?")[1]);
        const token = urlParams.get("token");

        if (token) {
          setIsLoading(false);
          onSuccess(token);
        }
      }
    };

    const subscription = Linking.addEventListener("url", (event) => {
      handleDeepLink(event.url);
    });

    return () => subscription?.remove();
  }, [onSuccess]);

  const handleGoogleAuth = async () => {
    try {
      setIsLoading(true);

      // Open the backend OAuth endpoint in a web browser
      const authUrl = `${API_BASE_URL.replace(
        "/api",
        ""
      )}/oauth2/authorize/google`;

      console.log("Opening auth URL:", authUrl);

      const result = await WebBrowser.openAuthSessionAsync(
        authUrl,
        "secureheraiapp://oauth-callback"
      );

      if (result.type === "success" && result.url) {
        // Handle the redirect URL
        const urlParams = new URLSearchParams(result.url.split("?")[1]);
        const token = urlParams.get("token");

        if (token) {
          onSuccess(token);
        } else {
          Alert.alert(
            "Authentication Error",
            "No token received from authentication."
          );
        }
      } else if (result.type === "cancel") {
        Alert.alert(
          "Authentication Cancelled",
          "You cancelled the authentication process."
        );
      } else {
        Alert.alert(
          "Authentication Error",
          "An error occurred during authentication."
        );
      }
    } catch (error) {
      console.error("Google Auth Error:", error);
      Alert.alert(
        "Authentication Error",
        "Failed to authenticate with Google."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white px-6">
      <View className="flex-1 justify-center">
        {/* Header */}
        <View className="items-center mb-8">
          <Text className="text-3xl font-bold text-gray-900 mb-2">
            Sign in with Google
          </Text>
          <Text className="text-gray-600 text-center">
            Use your Google account to securely access SecureHerAI
          </Text>
        </View>

        {/* Google Sign In Button */}
        <TouchableOpacity
          onPress={handleGoogleAuth}
          disabled={isLoading}
          className="bg-white border border-gray-300 rounded-lg py-4 px-6 mb-6 flex-row items-center justify-center shadow-sm"
          style={{ elevation: 2 }}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#4285F4" />
          ) : (
            <>
              <Text className="text-gray-700 text-lg font-medium ml-3">
                Continue with Google
              </Text>
            </>
          )}
        </TouchableOpacity>

        {/* Loading State */}
        {isLoading && (
          <View className="items-center mb-6">
            <Text className="text-gray-500 text-sm">
              Redirecting to Google...
            </Text>
          </View>
        )}

        {/* Back Button */}
        <TouchableOpacity
          onPress={onBack}
          disabled={isLoading}
          className="items-center py-4"
        >
          <Text className="text-purple-600 text-lg font-medium">
            Back to Login Options
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default GoogleOAuth;
