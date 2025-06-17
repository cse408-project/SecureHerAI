import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  Image,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useAuth } from "../context/AuthContext";
import { ProfileScreen } from "./ProfileScreen";
import { ImplementationStatusScreen } from "./ImplementationStatusScreen";

export const HomeScreen: React.FC = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const [showProfile, setShowProfile] = useState(false);
  const [showStatus, setShowStatus] = useState(false);
  const router = useRouter();

  const handleLogout = () => {
    // Show Alert for mobile (works on mobile, ignored on web)
    Alert.alert("Confirm Logout", "Are you sure you want to logout?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Logout",
        style: "destructive",
        onPress: () => {
          logout().catch((error) => {
            console.error("Logout failed:", error);
          });
        },
      },
    ]);

    // Automatic timeout for web compatibility (works on all platforms)
    setTimeout(() => {
      // This will only execute if the Alert didn't work (web case)
      // On mobile, the Alert will handle it before this timeout
      if (isAuthenticated) {
        // Still authenticated means Alert might not have worked
        logout().catch((error) => {
          console.error("Logout failed:", error);
        });
      }
    }, 1000); // Short timeout to detect if Alert worked
  };

  // Show profile screen if requested
  if (showProfile) {
    return <ProfileScreen onBack={() => setShowProfile(false)} />;
  }

  // Show implementation status screen if requested
  if (showStatus) {
    return <ImplementationStatusScreen onBack={() => setShowStatus(false)} />;
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      >
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
              Welcome Back!
            </Text>
            <Text className="text-gray-600 text-center">
              Hello, {user?.fullName}
            </Text>
          </View>

          {/* User Info */}
          <View className="bg-white rounded-lg p-6 mb-8 shadow-sm">
            <Text className="text-lg font-semibold text-text mb-4">
              Profile Information
            </Text>

            <View className="mb-3">
              <Text className="text-gray-600 text-sm">Email</Text>
              <Text className="text-text font-medium">{user?.email}</Text>
            </View>

            <View className="mb-3">
              <Text className="text-gray-600 text-sm">Role</Text>
              <Text className="text-text font-medium">
                {user?.role === "USER" ? "Regular User" : "Emergency Responder"}
              </Text>
            </View>

            {user?.responderInfo && (
              <>
                <View className="mb-3">
                  <Text className="text-gray-600 text-sm">Responder Type</Text>
                  <Text className="text-text font-medium">
                    {user.responderInfo.responderType}
                  </Text>
                </View>

                <View className="mb-3">
                  <Text className="text-gray-600 text-sm">Badge Number</Text>
                  <Text className="text-text font-medium">
                    {user.responderInfo.badgeNumber}
                  </Text>
                </View>

                <View className="mb-3">
                  <Text className="text-gray-600 text-sm">Status</Text>
                  <View className="flex-row items-center">
                    <View
                      className={`w-3 h-3 rounded-full mr-2 ${
                        user.responderInfo.status === "AVAILABLE"
                          ? "bg-green-500"
                          : user.responderInfo.status === "BUSY"
                          ? "bg-yellow-500"
                          : "bg-gray-500"
                      }`}
                    />
                    <Text className="text-text font-medium">
                      {user.responderInfo.status}
                    </Text>
                  </View>
                </View>
              </>
            )}
          </View>

          {/* Coming Soon */}
          <View className="bg-light-100 rounded-lg p-6 mb-8 border border-gray-200">
            <Text className="text-lg font-semibold text-text mb-2">
              Coming Soon
            </Text>
            <Text className="text-gray-600">
              Dashboard with SOS alerts, heat maps, route tracking, and
              AI-powered safety features will be available here.
            </Text>
          </View>

          {/* Action Buttons */}
          <View className="space-y-4">
            <TouchableOpacity
              className="bg-primary rounded-lg py-4"
              onPress={() => setShowProfile(true)}
            >
              <Text className="text-white text-center font-semibold text-lg">
                Edit Profile
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="bg-blue-500 rounded-lg py-4"
              onPress={() => setShowStatus(true)}
            >
              <Text className="text-white text-center font-semibold text-lg">
                Implementation Status
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="bg-purple-500 rounded-lg py-4"
              onPress={() => router.push("/test-deep-links" as any)}
            >
              <Text className="text-white text-center font-semibold text-lg">
                🔗 Test Deep Links
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="bg-red-500 rounded-lg py-4"
              onPress={handleLogout}
            >
              <Text className="text-white text-center font-semibold text-lg">
                Logout
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default HomeScreen;
