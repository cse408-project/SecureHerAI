import React, { useState, useEffect } from "react";
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
  Switch,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Picker } from "@react-native-picker/picker";
import ApiService from "../services/api";
import { useAuth } from "../context/AuthContext";
import type { UpdateProfileRequest } from "../types/auth";

interface ProfileScreenProps {
  onBack: () => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ onBack }) => {
  const { user, logout } = useAuth();
  const [formData, setFormData] = useState<UpdateProfileRequest>({
    fullName: user?.fullName || "",
    phoneNumber: user?.phoneNumber || "",
    dateOfBirth: user?.dateOfBirth || "",
    emailAlerts: user?.notificationPreferences?.emailAlerts ?? true,
    smsAlerts: user?.notificationPreferences?.smsAlerts ?? true,
    pushNotifications: user?.notificationPreferences?.pushNotifications ?? true,
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        fullName: user.fullName || "",
        phoneNumber: user.phoneNumber || "",
        dateOfBirth: user.dateOfBirth || "",
        emailAlerts: user.notificationPreferences?.emailAlerts ?? true,
        smsAlerts: user.notificationPreferences?.smsAlerts ?? true,
        pushNotifications:
          user.notificationPreferences?.pushNotifications ?? true,
        ...(user.responderInfo && {
          status: user.responderInfo.status,
          responderType: user.responderInfo.responderType,
          badgeNumber: user.responderInfo.badgeNumber,
        }),
      });
    }
  }, [user]);

  const updateFormData = (field: keyof UpdateProfileRequest, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleUpdateProfile = async () => {
    // Basic validation
    if (!formData.fullName?.trim()) {
      Alert.alert("Error", "Please enter your full name");
      return;
    }

    // Validate phone number if provided
    if (formData.phoneNumber && formData.phoneNumber.trim()) {
      const phoneRegex = /^\+[1-9]\d{1,14}$/;
      if (!phoneRegex.test(formData.phoneNumber.trim())) {
        Alert.alert(
          "Error",
          "Please enter a valid phone number with country code"
        );
        return;
      }
    }

    // Validate date format if provided
    if (formData.dateOfBirth && formData.dateOfBirth.trim()) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(formData.dateOfBirth.trim())) {
        Alert.alert("Error", "Please enter date in YYYY-MM-DD format");
        return;
      }
    }

    setIsLoading(true);
    try {
      const response = await ApiService.updateProfile(formData);

      if (response.success) {
        Alert.alert("Success", "Profile updated successfully!");
        // Optionally refresh user data here
      } else {
        Alert.alert("Error", response.error || "Failed to update profile");
      }
    } catch {
      Alert.alert("Error", "Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const selectImage = () => {
    // Placeholder for image picker implementation
    Alert.alert(
      "Feature Coming Soon",
      "Profile picture upload will be available soon!"
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="flex-1 px-8 py-12">
            {/* Header */}
            <View className="items-center mb-8">
              <Image
                source={require("../../assets/images/secureherai_logo.png")}
                style={{
                  width: 80,
                  height: 80,
                  resizeMode: "contain",
                }}
              />
              <Text className="text-2xl font-bold text-text mt-4 mb-2">
                Edit Profile
              </Text>
            </View>

            {/* Profile Picture */}
            <View className="items-center mb-8">
              <View className="w-24 h-24 bg-gray-200 rounded-full items-center justify-center mb-4">
                {user?.profilePicture ? (
                  <Image
                    source={{ uri: user.profilePicture }}
                    className="w-24 h-24 rounded-full"
                  />
                ) : (
                  <Text className="text-2xl text-gray-500">
                    {user?.fullName?.charAt(0)?.toUpperCase() || "?"}
                  </Text>
                )}
              </View>
              <TouchableOpacity
                className="bg-primary px-4 py-2 rounded-lg"
                onPress={selectImage}
              >
                <Text className="text-white font-medium">Change Picture</Text>
              </TouchableOpacity>
            </View>

            {/* Full Name */}
            <View className="mb-6">
              <Text className="text-gray-700 mb-2 font-medium">Full Name</Text>
              <TextInput
                className="bg-white border border-gray-300 rounded-lg px-4 py-3 text-gray-800"
                placeholder="Enter your full name"
                value={formData.fullName}
                onChangeText={(value) => updateFormData("fullName", value)}
              />
            </View>

            {/* Email (read-only) */}
            <View className="mb-6">
              <Text className="text-gray-700 mb-2 font-medium">Email</Text>
              <TextInput
                className="bg-gray-100 border border-gray-300 rounded-lg px-4 py-3 text-gray-600"
                value={user?.email}
                editable={false}
              />
              <Text className="text-xs text-gray-500 mt-1">
                Email cannot be changed
              </Text>
            </View>

            {/* Phone Number */}
            <View className="mb-6">
              <Text className="text-gray-700 mb-2 font-medium">
                Phone Number
              </Text>
              <TextInput
                className="bg-white border border-gray-300 rounded-lg px-4 py-3 text-gray-800"
                placeholder="e.g., +8801234567890"
                value={formData.phoneNumber}
                onChangeText={(value) => updateFormData("phoneNumber", value)}
                keyboardType="phone-pad"
              />
            </View>

            {/* Date of Birth */}
            <View className="mb-6">
              <Text className="text-gray-700 mb-2 font-medium">
                Date of Birth
              </Text>
              <TextInput
                className="bg-white border border-gray-300 rounded-lg px-4 py-3 text-gray-800"
                placeholder="YYYY-MM-DD"
                value={formData.dateOfBirth}
                onChangeText={(value) => updateFormData("dateOfBirth", value)}
              />
            </View>

            {/* Responder-specific fields */}
            {user?.role === "RESPONDER" && user?.responderInfo && (
              <>
                <View className="mb-6">
                  <Text className="text-gray-700 mb-2 font-medium">Status</Text>
                  <View className="bg-white border border-gray-300 rounded-lg">
                    <Picker
                      selectedValue={formData.status}
                      onValueChange={(value) => updateFormData("status", value)}
                      style={{ height: 50 }}
                    >
                      <Picker.Item label="Available" value="AVAILABLE" />
                      <Picker.Item label="Busy" value="BUSY" />
                      <Picker.Item label="Off Duty" value="OFF_DUTY" />
                    </Picker>
                  </View>
                </View>

                <View className="mb-6">
                  <Text className="text-gray-700 mb-2 font-medium">
                    Responder Type
                  </Text>
                  <View className="bg-white border border-gray-300 rounded-lg">
                    <Picker
                      selectedValue={formData.responderType}
                      onValueChange={(value) =>
                        updateFormData("responderType", value)
                      }
                      style={{ height: 50 }}
                    >
                      <Picker.Item label="Police Officer" value="POLICE" />
                      <Picker.Item
                        label="Medical Professional"
                        value="MEDICAL"
                      />
                      <Picker.Item label="Fire Fighter" value="FIRE" />
                    </Picker>
                  </View>
                </View>

                <View className="mb-6">
                  <Text className="text-gray-700 mb-2 font-medium">
                    Badge Number
                  </Text>
                  <TextInput
                    className="bg-white border border-gray-300 rounded-lg px-4 py-3 text-gray-800"
                    placeholder="Enter your badge number"
                    value={formData.badgeNumber}
                    onChangeText={(value) =>
                      updateFormData("badgeNumber", value)
                    }
                  />
                </View>
              </>
            )}

            {/* Notification Preferences */}
            <View className="mb-8">
              <Text className="text-lg font-semibold text-text mb-4">
                Notification Preferences
              </Text>

              <View className="bg-white rounded-lg p-4 border border-gray-200">
                <View className="flex-row justify-between items-center mb-4">
                  <Text className="text-gray-700">Email Alerts</Text>
                  <Switch
                    value={formData.emailAlerts}
                    onValueChange={(value) =>
                      updateFormData("emailAlerts", value)
                    }
                  />
                </View>

                <View className="flex-row justify-between items-center mb-4">
                  <Text className="text-gray-700">SMS Alerts</Text>
                  <Switch
                    value={formData.smsAlerts}
                    onValueChange={(value) =>
                      updateFormData("smsAlerts", value)
                    }
                  />
                </View>

                <View className="flex-row justify-between items-center">
                  <Text className="text-gray-700">Push Notifications</Text>
                  <Switch
                    value={formData.pushNotifications}
                    onValueChange={(value) =>
                      updateFormData("pushNotifications", value)
                    }
                  />
                </View>
              </View>
            </View>

            {/* Action Buttons */}
            <TouchableOpacity
              className={`rounded-lg py-4 mb-4 ${
                isLoading ? "bg-gray-400" : "bg-primary"
              }`}
              onPress={handleUpdateProfile}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text className="text-white text-center font-semibold text-lg">
                  Update Profile
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity className="py-3 mb-4" onPress={onBack}>
              <Text className="text-primary text-center font-medium">
                Back to Home
              </Text>
            </TouchableOpacity>

            {/* Logout Button */}
            <TouchableOpacity
              className="bg-red-500 rounded-lg py-3"
              onPress={() => {
                Alert.alert("Logout", "Are you sure you want to logout?", [
                  { text: "Cancel", style: "cancel" },
                  { 
                    text: "Logout", 
                    style: "destructive", 
                    onPress: () => {
                      console.log("User confirmed logout from profile");
                      logout().then(() => {
                        console.log("Profile logout completed");
                      }).catch((error) => {
                        console.error("Error during profile logout:", error);
                      });
                    }
                  }
                ]);
              }}
            >
              <Text className="text-white text-center font-semibold">
                Logout
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default ProfileScreen;
