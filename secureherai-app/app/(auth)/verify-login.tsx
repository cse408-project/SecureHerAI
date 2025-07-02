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
  Image,
} from "react-native";
import { useAlert } from "../../context/AlertContext";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../context/AuthContext";
import OTPInput from "../../components/OTPInput";

export default function VerifyLogin() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const { verifyLoginCode } = useAuth();
  const [isVerifying, setIsVerifying] = useState(false);
  const { showAlert } = useAlert();

  const handleVerifyCode = async () => {
    if (!email.trim() || !code.trim()) {
      showAlert("Error", "Please fill in all fields", "error");
      return;
    }

    setIsVerifying(true);
    try {
      const response = await verifyLoginCode(email.trim(), code.trim());

      if (response.success) {
        showAlert("Success", "Login successful!", "success");
        // Navigation will be handled by auth context
      } else {
        showAlert("Error", response.error || "Verification failed", "error");
      }
    } catch (error) {
      console.error("Verification error:", error);
      showAlert("Error", "An unexpected error occurred", "error");
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#FFE4D6]">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="flex-1 justify-center px-6 py-8 max-w-screen-md mx-auto w-full">
            {/* Logo and Branding */}
            <View className="items-center mb-8">
              <View className="w-24 h-24 rounded-full bg-white shadow-lg items-center justify-center mb-4">
                <Image
                  source={require("../../assets/images/secureherai_logo.png")}
                  style={{
                    width: 60,
                    height: 60,
                    resizeMode: "contain",
                  }}
                />
              </View>
              <Text className="text-3xl font-bold text-[#67082F] mb-2">
                Verify Login
              </Text>
              <Text className="text-base text-gray-600 text-center">
                Enter your email and verification code
              </Text>
            </View>

            {/* Form */}
            <View className="bg-white rounded-xl p-6 shadow-sm mb-6">
              <View className="mb-4">
                <Text className="text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </Text>
                <TextInput
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-900"
                  placeholder="Enter your email"
                  placeholderTextColor="#9CA3AF"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              <OTPInput
                label="Verification Code"
                onTextChange={setCode}
                numberOfDigits={6}
                autoFocus={false}
                disabled={isVerifying}
              />

              <TouchableOpacity
                className={`w-full py-4 rounded-lg mb-6 ${
                  isVerifying
                    ? "bg-[#67082F]/50"
                    : "bg-[#67082F] active:bg-[#67082F]/90"
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
                  <Text className="text-[#67082F] font-semibold">
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
