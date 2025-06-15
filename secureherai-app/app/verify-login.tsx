import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import ApiService from "./services/api";
import { useAuth } from "./context/AuthContext";

export default function VerifyLogin() {
  const router = useRouter();
  const { code, email } = useLocalSearchParams();
  const { login } = useAuth();
  const [isVerifying, setIsVerifying] = useState(false);
  const [verified, setVerified] = useState(false);

  const handleAutoVerify = useCallback(async () => {
    if (isVerifying) return;

    setIsVerifying(true);
    try {
      const response = await ApiService.verifyLogin({
        email: email as string,
        loginCode: code as string,
      });

      if (response.success) {
        await login(response.data.token, response.data.user);
        setVerified(true);

        Alert.alert(
          "Login Successful",
          "You have been successfully logged in!",
          [
            {
              text: "Continue",
              onPress: () => router.replace("/"),
            },
          ]
        );
      } else {
        throw new Error(response.message || "Verification failed");
      }
    } catch (error: any) {
      console.error("Login verification error:", error);
      Alert.alert(
        "Verification Failed",
        error.message ||
          "Failed to verify login. The code may be expired or invalid.",
        [
          {
            text: "Try Again",
            onPress: () => router.replace("/"),
          },
        ]
      );
    } finally {
      setIsVerifying(false);
    }
  }, [code, email, login, router, isVerifying]);

  useEffect(() => {
    if (code && email) {
      handleAutoVerify();
    } else {
      Alert.alert(
        "Invalid Link",
        "This login verification link is invalid or expired.",
        [
          {
            text: "OK",
            onPress: () => router.replace("/"),
          },
        ]
      );
    }
  }, [code, email, handleAutoVerify, router]);

  if (verified) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-2xl font-bold text-primary mb-4">
            ✅ Verified!
          </Text>
          <Text className="text-text text-center mb-8">
            Your login has been verified successfully. Redirecting you to the
            app...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 items-center justify-center px-8">
        <ActivityIndicator size="large" color="#4F46E5" className="mb-4" />
        <Text className="text-xl font-semibold text-text mb-4">
          {isVerifying ? "Verifying Login..." : "Processing..."}
        </Text>
        <Text className="text-text-secondary text-center mb-8">
          Please wait while we verify your login request.
        </Text>

        {!isVerifying && (
          <TouchableOpacity
            onPress={handleAutoVerify}
            className="bg-primary px-6 py-3 rounded-lg"
          >
            <Text className="text-white font-semibold">Retry Verification</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}
