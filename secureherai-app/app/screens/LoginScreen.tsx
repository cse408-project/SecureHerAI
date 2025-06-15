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
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../context/AuthContext";

interface LoginScreenProps {
  onSwitchToRegister: () => void;
  onForgotPassword?: () => void;
  onGoogleOAuth?: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onSwitchToRegister,
  onForgotPassword,
  onGoogleOAuth,
}) => {
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
    } catch {
      Alert.alert("Error", "Network error. Please try again.");
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
        // User will be automatically logged in through context
        Alert.alert("Success", "Login successful!");
      } else {
        Alert.alert("Error", response.error || "Invalid verification code");
      }
    } catch {
      Alert.alert("Error", "Network error. Please try again.");
    } finally {
      setIsLoadingVerify(false);
    }
  };

  const handleBackToLogin = () => {
    setShowCodeInput(false);
    setLoginCode("");
    setLoginEmail("");
  };

  if (showCodeInput) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1"
        >
          <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
            <View className="flex-1 px-8 py-12">
              {/* Header */}
              <View className="items-center mb-12">
                <Image
                  source={require("../../assets/images/secureherai_logo.png")}
                  style={{
                    width: 100,
                    height: 100,
                    resizeMode: "contain",
                  }}
                />
                <Text className="text-3xl font-bold text-text mt-6 mb-2">
                  Verify Code
                </Text>
                <Text className="text-gray-600 text-center">
                  Enter the verification code sent to {loginEmail}
                </Text>
              </View>

              {/* Code Input */}
              <View className="mb-8">
                <Text className="text-sm font-medium text-gray-700 mb-2">
                  Verification Code
                </Text>
                <TextInput
                  className="bg-white border border-gray-300 rounded-lg px-4 py-3 text-base"
                  placeholder="Enter 6-digit code"
                  value={loginCode}
                  onChangeText={setLoginCode}
                  keyboardType="number-pad"
                  maxLength={6}
                  autoCapitalize="none"
                />
              </View>

              {/* Verify Button */}
              <TouchableOpacity
                className={`bg-primary rounded-lg py-4 mb-4 ${
                  isLoadingVerify ? "opacity-70" : ""
                }`}
                onPress={handleVerifyCode}
                disabled={isLoadingVerify}
              >
                {isLoadingVerify ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-white text-center font-semibold text-lg">
                    Verify Code
                  </Text>
                )}
              </TouchableOpacity>

              {/* Back to Login */}
              <TouchableOpacity className="py-2" onPress={handleBackToLogin}>
                <Text className="text-primary text-center font-medium">
                  Back to Login
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
          <View className="flex-1 px-8 py-12">
            {/* Header */}
            <View className="items-center mb-12">
              <Image
                source={require("../../assets/images/secureherai_logo.png")}
                style={{
                  width: 120,
                  height: 120,
                  resizeMode: "contain",
                }}
              />
              <Text className="text-4xl font-bold text-text mt-6 mb-2">
                SecureHerAI
              </Text>
              <Text className="text-gray-600 text-center">
                Your safety companion powered by AI
              </Text>
            </View>

            {/* Login Form */}
            <View className="mb-8">
              <View className="mb-6">
                <Text className="text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </Text>
                <TextInput
                  className="bg-white border border-gray-300 rounded-lg px-4 py-3 text-base"
                  placeholder="Enter your email"
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
                  className="bg-white border border-gray-300 rounded-lg px-4 py-3 text-base"
                  placeholder="Enter your password"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                />
              </View>
            </View>

            {/* Login Button */}
            <TouchableOpacity
              className={`bg-primary rounded-lg py-4 mb-4 ${
                isLoadingLogin ? "opacity-70" : ""
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

            {/* Forgot Password */}
            {onForgotPassword && (
              <TouchableOpacity className="py-3" onPress={onForgotPassword}>
                <Text className="text-primary text-center font-medium">
                  Forgot Password?
                </Text>
              </TouchableOpacity>
            )}

            {/* Google OAuth */}
            {onGoogleOAuth && (
              <>
                <View className="flex-row items-center my-6">
                  <View className="flex-1 h-px bg-gray-300" />
                  <Text className="mx-4 text-gray-500">or</Text>
                  <View className="flex-1 h-px bg-gray-300" />
                </View>

                <TouchableOpacity
                  className="bg-white border border-gray-300 rounded-lg py-4 mb-4 flex-row items-center justify-center"
                  onPress={onGoogleOAuth}
                >
                  <View className="w-5 h-5 bg-blue-500 rounded mr-3" />
                  <Text className="text-gray-700 font-semibold">
                    Continue with Google
                  </Text>
                </TouchableOpacity>
              </>
            )}

            {/* Switch to Register */}
            <View className="flex-row justify-center items-center mt-8">
              <Text className="text-gray-600">
                Don&apos;t have an account?{" "}
              </Text>
              <TouchableOpacity onPress={onSwitchToRegister}>
                <Text className="text-primary font-semibold">Sign Up</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default LoginScreen;
