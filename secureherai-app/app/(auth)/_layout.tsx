import { Stack, Redirect } from "expo-router";
import React from "react";
import { useAuth } from "../../context/AuthContext";

export default function AuthLayout() {
  const { user, token, isLoading } = useAuth();
  
  // If user becomes authenticated while in this group, redirect to tabs
  if (!isLoading && user && token) {
    return <Redirect href="/(tabs)" />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="register" />
      <Stack.Screen name="forgot-password" />
      <Stack.Screen name="reset-password" />
      <Stack.Screen name="verify-login" />
      <Stack.Screen name="complete-profile" />
    </Stack>
  );
}
