import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Linking,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function TestDeepLinks() {
  const testLinks = [
    {
      title: "Forgot Password",
      url: "http://localhost:8081/forgot-password",
    },
    {
      title: "Reset Password (Web)",
      url: "http://localhost:8081/reset-password?token=test123&email=test@example.com",
    },
    {
      title: "Reset Password (App)",
      url: "secureheraiapp://reset-password?token=test123&email=test@example.com",
    },
    {
      title: "Verify Login (Web)",
      url: "http://localhost:8081/verify-login?code=123456&email=test@example.com",
    },
    {
      title: "Verify Login (App)",
      url: "secureheraiapp://verify-login?code=123456&email=test@example.com",
    },
    {
      title: "Google OAuth Callback (Primary Scheme)",
      url: "secureheraiapp://auth?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwiZW1haWwiOiJ0ZXN0QGV4YW1wbGUuY29tIiwicm9zZSI6IlVTRVIiLCJmdWxsTmFtZSI6IlRlc3QgVXNlciIsImlhdCI6MTUxNjIzOTAyMn0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c",
    },
    {
      title: "Google OAuth Callback (Fallback Scheme)",
      url: "secureherai://auth?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwiZW1haWwiOiJ0ZXN0QGV4YW1wbGUuY29tIiwicm9zZSI6IlVTRVIiLCJmdWxsTmFtZSI6IlRlc3QgVXNlciIsImlhdCI6MTUxNjIzOTAyMn0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c",
    },
    {
      title: "Login Page",
      url: "http://localhost:8081/login",
    },
    {
      title: "Dashboard",
      url: "http://localhost:8081/dashboard",
    },
  ];

  const handleTestLink = async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);

      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert("Error", `Cannot open URL: ${url}`);
      }
    } catch (error) {
      console.error("Error opening URL:", error);
      Alert.alert("Error", "Failed to open URL");
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView className="flex-1 px-6 py-8">
        <Text className="text-2xl font-bold text-primary mb-8 text-center">
          🔗 Deep Link Test Page
        </Text>

        <Text className="text-text-secondary mb-6 text-center">
          Test the deep linking functionality by tapping on these buttons:
        </Text>

        {testLinks.map((link, index) => (
          <TouchableOpacity
            key={index}
            onPress={() => handleTestLink(link.url)}
            className="bg-white border border-border rounded-lg p-4 mb-4 shadow-sm"
          >
            <Text className="text-text font-semibold mb-2">{link.title}</Text>
            <Text className="text-text-secondary text-sm" numberOfLines={2}>
              {link.url}
            </Text>
          </TouchableOpacity>
        ))}

        <View className="mt-8 p-4 bg-secondary rounded-lg">
          <Text className="text-text font-semibold mb-2">📋 Instructions:</Text>
          <Text className="text-text-secondary text-sm">
            • Web links should open in browser/web version{"\n"}• App links
            should navigate within the app{"\n"}• If you&apos;re testing on web,
            app:// links won&apos;t work{"\n"}• If you&apos;re testing on
            mobile, all links should work
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
