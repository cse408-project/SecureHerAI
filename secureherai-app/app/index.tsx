import React, { useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
// @ts-ignore
import { router } from "expo-router";
import { useAuth } from "../context/AuthContext";

export default function Index() {
  const { isAuthenticated, isLoading, user, token } = useAuth();

  useEffect(() => {
    console.log("Index.tsx - Auth state changed:", {
      isAuthenticated,
      isLoading,
      hasUser: !!user,
      hasToken: !!token,
    });

    // Use router.replace instead of Redirect component for more reliable navigation
    if (!isLoading) {
      if (isAuthenticated) {
        console.log("Index.tsx - User is authenticated, navigating to tabs...");
        router.replace("/(tabs)");
      } else {
        console.log(
          "Index.tsx - User is not authenticated, navigating to auth..."
        );
        router.replace("/(auth)");
      }
    }
  }, [isAuthenticated, isLoading, user, token]);

  // Always show loading while we determine where to navigate
  return (
    <View className="flex-1 items-center justify-center bg-background">
      <ActivityIndicator size="large" color="#4F46E5" />
    </View>
  );
}
