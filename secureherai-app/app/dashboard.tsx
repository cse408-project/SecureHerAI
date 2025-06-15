import React from "react";
import { useAuth } from "./context/AuthContext";
import { HomeScreen } from "./screens/HomeScreen";
import { AuthScreen } from "./screens/AuthScreen";

export default function Dashboard() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <AuthScreen />;
  }

  return <HomeScreen />;
}
