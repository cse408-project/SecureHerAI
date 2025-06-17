import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import ApiService from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useNavigation } from "@react-navigation/native";

// Required for expo-web-browser flow
WebBrowser.maybeCompleteAuthSession();

interface GoogleOAuthScreenProps {
  onBack: () => void;
  onSuccess: (token: string) => void;
}

export const GoogleOAuthScreen: React.FC<GoogleOAuthScreenProps> = ({
  onBack,
  onSuccess,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const { handleGoogleLogin } = useAuth();
  // Use any for navigation since we don't have the type definitions
  const navigation = useNavigation<any>();
  const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || "http://localhost:8080/api";

  // Define processOAuthToken function with useCallback
  const processOAuthToken = useCallback(async (token: string) => {
    try {
      setIsLoading(true);
      const response = await handleGoogleLogin(token);
      
      if (response.success) {
        // Check if this is a new user (profile not complete)
        if (response.needsProfileCompletion) {
          // Navigate to profile completion screen
          navigation.navigate('CompleteProfile');
        } else {
          // Just proceed as normal
          onSuccess(token);
        }
      } else {
        Alert.alert("Authentication Error", response.error || "Failed to authenticate with Google");
      }
    } catch (error) {
      Alert.alert("Error", "Failed to process authentication");
      console.error("OAuth token processing error:", error);
    } finally {
      setIsLoading(false);
    }
  }, [handleGoogleLogin, onSuccess, setIsLoading, navigation]);

  // Set up deep link handling for OAuth callback
  useEffect(() => {
    const handleRedirect = (event: any) => {
      const { path, queryParams } = Linking.parse(event.url);
      
      if (path === 'auth' && queryParams?.token) {
        processOAuthToken(queryParams.token as string);
      }
    };

    // Add event listener for deep links
    const subscription = Linking.addEventListener("url", handleRedirect);

    return () => {
      // Clean up the event listener
      subscription.remove();
    };
  }, [processOAuthToken]);

  const handleGoogleLoginPress = async () => {
    setIsLoading(true);
    try {
      const response = await ApiService.getGoogleOAuthUrl();

      if (response.success && response.url) {
        // Get the full URL for OAuth
        const authUrl = `${API_BASE_URL}${response.url}`;
        
        // Open Google Auth in browser
        if (Platform.OS === 'web') {
          // For web, we need to handle the flow differently
          // Open in a new window and set up message listener
          const newWindow = window.open(authUrl, '_blank');
          
          if (newWindow) {
            const handleMessage = (event: any) => {
              if (event.data && event.data.token) {
                newWindow.close();
                processOAuthToken(event.data.token);
                window.removeEventListener('message', handleMessage);
              }
            };
            
            window.addEventListener('message', handleMessage);
          } else {
            Alert.alert(
              "Popup Blocked", 
              "The popup window was blocked. Please enable popups for this site."
            );
          }
        } else {
          // For mobile, use WebBrowser to handle the flow
          const result = await WebBrowser.openAuthSessionAsync(
            authUrl,
            Linking.createURL('auth')
          );
          
          if (result.type === 'cancel') {
            Alert.alert("Authentication Cancelled", "You cancelled the authentication process");
          }
        }
      } else {
        Alert.alert("Error", "Failed to get OAuth URL");
      }
    } catch (error) {
      console.error("Google login error:", error);
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
          onPress={handleGoogleLoginPress}
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
