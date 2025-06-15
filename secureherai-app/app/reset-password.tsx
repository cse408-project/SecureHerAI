import React, { useEffect, useState } from "react";
import { View, Text, Alert } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ResetPasswordScreen } from "./screens/ResetPasswordScreen";

export default function ResetPassword() {
  const router = useRouter();
  const { token, email } = useLocalSearchParams();
  const [validParams, setValidParams] = useState(false);

  useEffect(() => {
    if (token && email) {
      setValidParams(true);
    } else {
      Alert.alert(
        "Invalid Link",
        "This password reset link is invalid or expired. Please request a new one.",
        [
          {
            text: "OK",
            onPress: () => router.replace("/"),
          },
        ]
      );
    }
  }, [token, email, router]);

  if (!validParams) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <Text className="text-text">Loading...</Text>
      </View>
    );
  }

  return (
    <ResetPasswordScreen
      prefilledToken={token as string}
      prefilledEmail={email as string}
      onBackToLogin={() => router.replace("/")}
    />
  );
}
