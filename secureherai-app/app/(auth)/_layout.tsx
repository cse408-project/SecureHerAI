import { Stack } from "expo-router";
import React from "react";

export default function AuthLayout() {
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
