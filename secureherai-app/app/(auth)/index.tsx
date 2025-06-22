import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  ActivityIndicator,
} from "react-native";
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

  const { login, verifyLoginCode } = useAuth();

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Error", "Please fill in all fields");
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
        Alert.alert(
          "Success",
          response.message || "Login code sent to your email"
        );
      } else {
        Alert.alert("Error", response.error || "Login failed");
      }
    } catch (error) {
      console.error("Login error:", error);
      Alert.alert("Error", "An unexpected error occurred");
    } finally {
      setIsLoadingLogin(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!loginCode.trim()) {
      Alert.alert("Error", "Please enter the verification code");
      return;
    }

    setIsLoadingVerify(true);
    try {
      const response = await verifyLoginCode(loginEmail, loginCode.trim());

      if (response.success) {
        // Don't show alert, let auth context handle navigation
        console.log("Login successful, redirecting...");
        // The useAuth context will update isAuthenticated and app/index.tsx will handle redirect
      } else {
        Alert.alert("Error", response.error || "Verification failed");
      }
    } catch (error) {
      console.error("Verification error:", error);
      Alert.alert("Error", "An unexpected error occurred");
    } finally {
      setIsLoadingVerify(false);
    }
  };

  const handleGoBack = () => {
    setShowCodeInput(false);
    setLoginCode("");
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
            {/* Logo */}
            <View className="items-center mb-8">
              <Text className="text-3xl font-bold text-primary mb-2">
                SecureHer AI
              </Text>
              <Text className="text-base text-muted text-center">
                Your safety companion
              </Text>
            </View>

            {!showCodeInput ? (
              <>
                {/* Login Form */}
                <View className="mb-6">
                  <Text className="text-2xl font-bold text-foreground mb-6 text-center">
                    Welcome Back
                  </Text>

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
                      Password
                    </Text>
                    <TextInput
                      className="w-full px-4 py-3 border border-border rounded-lg bg-background text-foreground"
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
                        ? "bg-primary/50"
                        : "bg-primary active:bg-primary/90"
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
                      <Text className="text-primary font-medium">
                        Forgot Password?
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity
                    className="w-full py-4 border border-border rounded-lg mb-6 bg-background"
                    onPress={() => {
                      console.log("Google OAuth pressed");
                    }}
                  >
                    <Text className="text-foreground text-center font-semibold">
                      Continue with Google
                    </Text>
                  </TouchableOpacity>

                  <View className="items-center">
                    <Text className="text-muted mb-2">
                      Don&apos;t have an account?
                    </Text>
                    <TouchableOpacity
                      onPress={() => router.push("/(auth)/register")}
                    >
                      <Text className="text-primary font-semibold">
                        Create Account
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </>
            ) : (
              <>
                {/* Verification Code Form */}
                <View className="mb-6">
                  <Text className="text-2xl font-bold text-foreground mb-2 text-center">
                    Verify Your Email
                  </Text>
                  <Text className="text-base text-muted mb-6 text-center">
                    We&apos;ve sent a verification code to {loginEmail}
                  </Text>

                  <View className="mb-6">
                    <Text className="text-sm font-medium text-foreground mb-2">
                      Verification Code
                    </Text>
                    <TextInput
                      className="w-full px-4 py-3 border border-border rounded-lg bg-background text-foreground text-center text-xl tracking-widest"
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
                        ? "bg-primary/50"
                        : "bg-primary active:bg-primary/90"
                    }`}
                    onPress={handleVerifyCode}
                    disabled={isLoadingVerify}
                  >
                    {isLoadingVerify ? (
                      <ActivityIndicator color="white" />
                    ) : (
                      <Text className="text-white text-center font-semibrel text-lg">
                        Verify &amp; Sign In
                      </Text>
                    )}
                  </TouchableOpacity>

                  <View className="items-center mb-6">
                    <Text className="text-muted mb-2">
                      Didn&apos;t receive the code?
                    </Text>
                    <TouchableOpacity disabled={isLoadingLogin}>
                      <Text className="text-primary font-medium">
                        Resend Code
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <View className="items-center">
                    <TouchableOpacity onPress={handleGoBack}>
                      <Text className="text-muted">Back to Login</Text>
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
