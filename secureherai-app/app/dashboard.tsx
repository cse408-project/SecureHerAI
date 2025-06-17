import React, { useEffect } from "react";
import { useAuth } from "./context/AuthContext";
import { HomeScreen } from "./screens/HomeScreen";
import { AuthScreen } from "./screens/AuthScreen";
import { useLocalSearchParams } from "expo-router";
import { View, Text, ActivityIndicator } from "react-native";

export default function Dashboard() {
  const { isAuthenticated, setToken } = useAuth();
  const { token } = useLocalSearchParams();
  const [processing, setProcessing] = React.useState(false);

  // Handle OAuth token from URL (for web)
  useEffect(() => {
    if (token && typeof token === "string") {
      console.log("Token detected in URL parameters");
      setProcessing(true);

      // Store the token directly without going through login process
      setToken(token);

      // Remove the token from the URL
      // This only works on web
      if (typeof window !== "undefined") {
        const url = new URL(window.location.href);
        url.searchParams.delete("token");
        window.history.replaceState({}, document.title, url.toString());
      }

      setTimeout(() => {
        setProcessing(false);
      }, 1000);
    }
  }, [token, setToken]);

  if (processing) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color="#0000ff" />
        <Text className="mt-4 text-text">Processing authentication...</Text>
      </View>
    );
  }

  if (!isAuthenticated) {
    return <AuthScreen />;
  }

  return <HomeScreen />;
}
