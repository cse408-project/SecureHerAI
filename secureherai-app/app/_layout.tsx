import { Stack } from "expo-router";
import { AuthProvider } from "./context/AuthContext";
import "./global.css";
import React from "react";

export default function RootLayout() {
  return (
    <AuthProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </AuthProvider>
  );
}
