import { Stack } from "expo-router";
import { AuthProvider } from "../context/AuthContext";
import "./global.css";
import React, { useEffect } from "react";
import { Platform } from "react-native";
import * as Linking from "expo-linking";

export default function RootLayout() {
  useEffect(() => {
    if (Platform.OS === "web") {
      // For web, handle initial URL
      const handleInitialURL = async () => {
        try {
          const initialURL = window.location.href;
          console.log("Initial URL (web):", initialURL);

          // You can parse and handle the URL here if needed
          if (
            initialURL.includes("reset-password") ||
            initialURL.includes("verify-login") ||
            initialURL.includes("auth")
          ) {
            console.log("Processing deep link on web:", initialURL);
          }
        } catch (error) {
          console.error("Error handling initial URL:", error);
        }
      };

      handleInitialURL();
    } else {
      // For native platforms, set up deep link handling
      const subscribeToDeepLinks = async () => {
        const initialURL = await Linking.getInitialURL();
        console.log("Initial URL:", initialURL);

        // Subscribe to URL events
        const subscription = Linking.addEventListener(
          "url",
          ({ url }: { url: string }) => {
            console.log("Incoming URL event:", url);
          }
        );

        return () => subscription.remove();
      };

      subscribeToDeepLinks();
    }
  }, []);

  return (
    <AuthProvider>
      <Stack
        screenOptions={{ headerShown: false }}
        // Apply our custom linking configuration
        initialRouteName="index"
      />
    </AuthProvider>
  );
}
