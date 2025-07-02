import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  ActivityIndicator,
  Image,
} from "react-native";
import { useAlert } from "../../context/AlertContext";
import { SafeAreaView } from "react-native-safe-area-context";
// @ts-ignore
import { router } from "expo-router";
import { useAuth } from "../../context/AuthContext";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginCode, setLoginCode] = useState("");
  const [isLoadingLogin, setIsLoadingLogin] = useState(false);
  const [isLoadingVerify, setIsLoadingVerify] = useState(false);
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const { showAlert } = useAlert();

  const { login, verifyLoginCode } = useAuth();

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      showAlert("Error", "Please fill in all fields", "error");
      return;
    }

    setIsLoadingLogin(true);
    try {
      const response = await login(email.trim(), password);

      if (response.success) {
        setLoginEmail(email.trim());
        setShowCodeInput(true);
        setEmail("");
        setPassword("");
        showAlert(
          "Success",
          response.message || "Login code sent to your email",
          "success"
        );
      } else {
        showAlert("Error", response.error || "Login failed", "error");
      }
    } catch (error) {
      console.error("Login error:", error);
      showAlert("Error", "An unexpected error occurred", "error");
    } finally {
      setIsLoadingLogin(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!loginCode.trim()) {
      showAlert("Error", "Please enter the verification code", "error");
      return;
    }

    setIsLoadingVerify(true);
    try {
      const response = await verifyLoginCode(loginEmail, loginCode.trim());

      if (response.success) {
        console.log("Login successful, navigating to index for re-routing...");
        // Navigate to index to trigger auth state check and re-routing
        router.replace("/");
      } else {
        showAlert("Error", response.error || "Verification failed", "error");
      }
    } catch (error) {
      console.error("Verification error:", error);
      showAlert("Error", "An unexpected error occurred", "error");
    } finally {
      setIsLoadingVerify(false);
    }
  };

  const handleGoBack = () => {
    setShowCodeInput(false);
    setLoginCode("");
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
                SecureHer AI
              </Text>
              <Text className="text-base text-gray-600 text-center">
                Your safety companion
              </Text>
            </View>

            {!showCodeInput ? (
              <>
                {/* Login Form */}
                <View className="bg-white rounded-xl p-6 shadow-sm mb-6">
                  <Text className="text-2xl font-bold text-[#67082F] mb-6 text-center">
                    Welcome Back
                  </Text>

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

                  <View className="mb-6">
                    <Text className="text-sm font-medium text-gray-700 mb-2">
                      Password
                    </Text>
                    <TextInput
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-900"
                      placeholder="Enter your password"
                      placeholderTextColor="#9CA3AF"
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry
                    />
                  </View>

                  <TouchableOpacity
                    className={`w-full py-4 rounded-lg mb-4 ${
                      isLoadingLogin
                        ? "bg-[#67082F]/50"
                        : "bg-[#67082F] active:bg-[#67082F]/90"
                    }`}
                    onPress={handleLogin}
                    disabled={isLoadingLogin}
                  >
                    {isLoadingLogin ? (
                      <ActivityIndicator color="white" />
                    ) : (
                      <Text className="text-white text-center font-semibold text-lg">
                        Sign In
                      </Text>
                    )}
                  </TouchableOpacity>

                  <View className="items-center mb-6">
                    <TouchableOpacity
                      className="py-3"
                      onPress={() => router.push("/(auth)/forgot-password")}
                    >
                      <Text className="text-[#67082F] font-medium">
                        Forgot Password?
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity
                    className="w-full py-4 border border-gray-300 rounded-lg mb-6 bg-white"
                    onPress={() => {
                      console.log("Google OAuth pressed");
                    }}
                  >
                    <Text className="text-gray-700 text-center font-semibold">
                      Continue with Google
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Sign up link */}
                <View className="items-center">
                  <Text className="text-gray-600 mb-2">
                    Don&apos;t have an account?
                  </Text>
                  <TouchableOpacity
                    onPress={() => router.push("/(auth)/register")}
                  >
                    <Text className="text-[#67082F] font-semibold">
                      Create Account
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <>
                {/* Verification Code Form */}
                <View className="bg-white rounded-xl p-6 shadow-sm mb-6">
                  <Text className="text-2xl font-bold text-[#67082F] mb-2 text-center">
                    Verify Your Email
                  </Text>
                  <Text className="text-base text-gray-600 mb-6 text-center">
                    We&apos;ve sent a verification code to {loginEmail}
                  </Text>

                  <View className="mb-6">
                    <Text className="text-sm font-medium text-gray-700 mb-2">
                      Verification Code
                    </Text>
                    <TextInput
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-900 text-center text-xl tracking-widest"
                      placeholder="000000"
                      placeholderTextColor="#9CA3AF"
                      value={loginCode}
                      onChangeText={setLoginCode}
                      keyboardType="number-pad"
                      maxLength={6}
                      autoFocus
                    />
                  </View>

                  <TouchableOpacity
                    className={`w-full py-4 rounded-lg mb-4 ${
                      isLoadingVerify
                        ? "bg-[#67082F]/50"
                        : "bg-[#67082F] active:bg-[#67082F]/90"
                    }`}
                    onPress={handleVerifyCode}
                    disabled={isLoadingVerify}
                  >
                    {isLoadingVerify ? (
                      <ActivityIndicator color="white" />
                    ) : (
                      <Text className="text-white text-center font-semibold text-lg">
                        Verify &amp; Sign In
                      </Text>
                    )}
                  </TouchableOpacity>

                  <View className="items-center mb-6">
                    <Text className="text-gray-600 mb-2">
                      Didn&apos;t receive the code?
                    </Text>
                    <TouchableOpacity disabled={isLoadingLogin}>
                      <Text className="text-[#67082F] font-medium">
                        Resend Code
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <View className="items-center">
                    <TouchableOpacity onPress={handleGoBack}>
                      <Text className="text-gray-600">Back to Login</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
