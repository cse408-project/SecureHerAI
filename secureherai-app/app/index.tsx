import React from "react";
import { View, ActivityIndicator } from "react-native";
import { Redirect } from "expo-router";
import { useAuth } from "../context/AuthContext";

export default function Index() {
  const { user, token, isLoading } = useAuth();

  // Show loading screen while determining auth state
  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-[#FFE4D6]">
        <ActivityIndicator size="large" color="#67082F" />
      </View>
    );
  }
  
  // Use Redirect component instead of router.replace for smoother transitions
  // This will be handled by Protected routes in _layout.tsx
  const isAuthenticated = !!(user && token);
  
  if (isAuthenticated) {
    console.log("Index.tsx - User is authenticated, redirecting to tabs...");
    return <Redirect href="/(tabs)" />;
  } else {
    console.log("Index.tsx - User is not authenticated, redirecting to auth...");
    return <Redirect href="/(auth)" />;
  }
}
