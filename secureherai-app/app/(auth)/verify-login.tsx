import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  ActivityIndicator,
  TouchableOpacity,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
} from "react-native";
import { showAlert } from "../../utils/alertManager";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../context/AuthContext";

export default function VerifyLogin() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const { verifyLoginCode } = useAuth();
  const [isVerifying, setIsVerifying] = useState(false);

  const handleVerifyCode = async () => {
    if (!email.trim() || !code.trim()) {
      showAlert("Error", "Please fill in all fields", [{ text: "OK" }]);
      return;
    }

    setIsVerifying(true);
    try {
      const response = await verifyLoginCode(email.trim(), code.trim());

      if (response.success) {
        showAlert("Success", "Login successful!", [{ text: "OK" }]);
        // Navigation will be handled by auth context
      } else {
        showAlert("Error", response.error || "Verification failed", [
          { text: "OK" },
        ]);
      }
    } catch (error) {
      console.error("Verification error:", error);
      showAlert("Error", "An unexpected error occurred", [{ text: "OK" }]);
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="flex-1 justify-center px-6 py-8">
            {/* Header */}
            <View className="items-center mb-8">
              <Text className="text-3xl font-bold text-primary mb-2">
                Verify Login
              </Text>
              <Text className="text-base text-muted text-center">
                Enter your email and verification code
              </Text>
            </View>

            {/* Form */}
            <View className="mb-6">
              <View className="mb-4">
                <Text className="text-sm font-medium text-foreground mb-2">
                  Email Address
                </Text>
                <TextInput
                  className="w-full px-4 py-3 border border-border rounded-lg bg-background text-foreground"
                  placeholder="Enter your email"
                  placeholderTextColor="#9CA3AF"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              <View className="mb-6">
                <Text className="text-sm font-medium text-foreground mb-2">
                  Verification Code
                </Text>
                <TextInput
                  className="w-full px-4 py-3 border border-border rounded-lg bg-background text-foreground text-center text-xl tracking-widest"
                  placeholder="000000"
                  placeholderTextColor="#9CA3AF"
                  value={code}
                  onChangeText={setCode}
                  keyboardType="number-pad"
                  maxLength={6}
                />
              </View>

              <TouchableOpacity
                className={`w-full py-4 rounded-lg mb-6 ${
                  isVerifying
                    ? "bg-primary/50"
                    : "bg-primary active:bg-primary/90"
                }`}
                onPress={handleVerifyCode}
                disabled={isVerifying}
              >
                {isVerifying ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-white text-center font-semibold text-lg">
                    Verify & Sign In
                  </Text>
                )}
              </TouchableOpacity>

              {/* Back to Login */}
              <View className="items-center">
                <TouchableOpacity>
                  <Text className="text-primary font-semibold">
                    Back to Login
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
