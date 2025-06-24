import { Stack } from "expo-router";
import { AuthProvider, useAuth } from "../context/AuthContext";
import "./global.css";
import React, { useEffect } from "react";
import { Platform } from "react-native";
import * as Linking from "expo-linking";
import { SplashScreenController } from "../components/SplashScreenController";
import {
  AlertProvider,
  setGlobalAlertFunction,
  useAlert,
} from "../utils/alertManager";

function RootLayoutComponent() {
  const { user, token, isLoading } = useAuth();
  const isAuthenticated = !!(user && token) && !isLoading;

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
    <Stack screenOptions={{ headerShown: false }}>
      {/* Protected tabs routes - only accessible when authenticated */}
      <Stack.Protected guard={isAuthenticated}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack.Protected>

      {/* Protected auth routes - only accessible when not authenticated */}
      <Stack.Protected guard={!isAuthenticated}>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      </Stack.Protected>

      {/* Common index screen for initial loading */}
      <Stack.Screen name="index" options={{ headerShown: false }} />
    </Stack>
  );
}

// Setup global alert function
function AlertWrapper() {
  const alertContext = useAlert();

  useEffect(() => {
    // Set the global alert function so it can be used outside of components
    setGlobalAlertFunction(alertContext.showAlert);
  }, [alertContext]);

  return null;
}

// Main Layout Component
export default function RootLayout() {
  return (
    <AuthProvider>
      <AlertProvider>
        <AlertWrapper />
        <SplashScreenController />
        <RootLayoutComponent />
      </AlertProvider>
    </AuthProvider>
  );
}
