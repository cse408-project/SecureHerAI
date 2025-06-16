import React, { useEffect, useState } from "react";
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
  const { login, setToken } = useAuth();
  const [isVerifying, setIsVerifying] = useState(false);
  const [verified, setVerified] = useState(false);
  const [hasAttempted, setHasAttempted] = useState(false);

  useEffect(() => {
    const handleAutoVerify = async () => {
      if (isVerifying || hasAttempted || !code || !email) return;

      setIsVerifying(true);
      setHasAttempted(true);

      try {
        console.log("Attempting to verify login with:", { email, code });

        const response = await ApiService.verifyLogin({
          email: email as string,
          loginCode: code as string,
        });

        console.log("Verification response:", response);

        if (response.success) {
          // Handle successful verification
          if (response.token) {
            // Use setToken method from AuthContext to store token and user data
            await setToken(response.token);
            setVerified(true);

            // Redirect immediately to homepage instead of showing alert
            setTimeout(() => {
              router.replace("/");
            }, 500); // Small delay to ensure state is updated
          } else {
            throw new Error("No token received from server");
          }
        } else {
          throw new Error(
            response.error || response.message || "Verification failed"
          );
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
    };

    if (code && email && !hasAttempted) {
      handleAutoVerify();
    } else if (!code || !email) {
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
  }, [code, email, hasAttempted, isVerifying, login, router, setToken]);

  const handleRetryVerification = async () => {
    setHasAttempted(false);
    // This will trigger the effect again
  };

  if (verified) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-2xl font-bold text-primary mb-4">
            ✅ Login Successful!
          </Text>
          <Text className="text-text text-center mb-8">
            Redirecting you to the homepage...
          </Text>
          <ActivityIndicator size="large" color="#4F46E5" />
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
            onPress={handleRetryVerification}
            className="bg-primary px-6 py-3 rounded-lg"
          >
            <Text className="text-white font-semibold">Retry Verification</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}
