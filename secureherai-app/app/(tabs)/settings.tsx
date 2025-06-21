import {
  View,
  Text,
  TouchableOpacity,
  Switch,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
  TextInput,
  Modal,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import ApiService from "../../services/api";

interface UserProfile {
  userId: string;
  fullName: string;
  email: string;
  phoneNumber?: string;
  profilePicture?: string;
  dateOfBirth?: string;
  notificationPreferences?: {
    emailAlerts: boolean;
    smsAlerts: boolean;
    pushNotifications: boolean;
  };
  role?: string;
  responderInfo?: {
    responderType: string;
    badgeNumber: string;
    status: string;
    active: boolean;
  };
}

export default function SettingsScreen() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [smsAlerts, setSmsAlerts] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [profilePictureUrl, setProfilePictureUrl] = useState("");
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const { logout } = useAuth();

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      setIsLoading(true);
      const response = await ApiService.getUserProfile();
      if (response.success && response.data) {
        setProfile(response.data);
        // Set notification preferences
        if (response.data.notificationPreferences) {
          const prefs = response.data.notificationPreferences;
          setEmailAlerts(prefs.emailAlerts);
          setSmsAlerts(prefs.smsAlerts);
          setPushNotifications(prefs.pushNotifications);
        }
      }
    } catch (error) {
      console.error("Failed to load user profile:", error);
      Alert.alert("Error", "Failed to load profile data");
    } finally {
      setIsLoading(false);
    }
  };

  const updateNotificationSettings = async (
    type: "emailAlerts" | "smsAlerts" | "pushNotifications",
    value: boolean
  ) => {
    try {
      const updateData = {
        [type]: value,
      };

      const response = await ApiService.updateProfile(updateData);
      if (response.success) {
        // Update local state
        switch (type) {
          case "emailAlerts":
            setEmailAlerts(value);
            break;
          case "smsAlerts":
            setSmsAlerts(value);
            break;
          case "pushNotifications":
            setPushNotifications(value);
            break;
        }
      } else {
        Alert.alert("Error", "Failed to update notification settings");
        // Revert the change if it failed
        switch (type) {
          case "emailAlerts":
            setEmailAlerts(!value);
            break;
          case "smsAlerts":
            setSmsAlerts(!value);
            break;
          case "pushNotifications":
            setPushNotifications(!value);
            break;
        }
      }
    } catch (error) {
      console.error("Failed to update notification settings:", error);
      Alert.alert("Error", "Failed to update notification settings");
    }
  };

  const updateProfilePicture = async (url: string) => {
    try {
      const trimmedUrl = url.trim();

      // Basic client-side URL validation
      if (
        trimmedUrl &&
        !trimmedUrl.startsWith("http://") &&
        !trimmedUrl.startsWith("https://")
      ) {
        Alert.alert(
          "Invalid URL",
          "Profile picture URL must start with http:// or https://"
        );
        return;
      }

      setIsUpdatingProfile(true);
      const updateData = {
        profilePicture: trimmedUrl,
      };

      const response = await ApiService.updateProfile(updateData);
      if (response.success) {
        // Update local state
        setProfile((prev) =>
          prev ? { ...prev, profilePicture: trimmedUrl } : prev
        );
        setShowEditModal(false);
        setProfilePictureUrl("");
        Alert.alert("Success", "Profile picture updated successfully!");
      } else {
        Alert.alert(
          "Error",
          response.message || "Failed to update profile picture"
        );
      }
    } catch (error) {
      console.error("Failed to update profile picture:", error);
      Alert.alert("Error", "Failed to update profile picture");
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleEditProfile = () => {
    setProfilePictureUrl(profile?.profilePicture || "");
    setShowEditModal(true);
  };

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: () => logout(),
      },
    ]);
  };

  if (isLoading) {
    return (
      <View className="flex-1 bg-[#FFE4D6] items-center justify-center">
        <ActivityIndicator size="large" color="#67082F" />
        <Text className="mt-2 text-[#67082F]">Loading profile...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#FFE4D6]">
      <View className="bg-[#67082F] px-4 py-6 flex-row justify-between items-center pt-12">
        <Text className="text-white text-xl font-bold">Settings</Text>
      </View>

      <ScrollView className="flex-1 p-4">
        {/* Profile Section */}
        <View className="bg-white rounded-lg p-4 mb-4 shadow-sm">
          <View className="flex-row items-center mb-4">
            {profile?.profilePicture ? (
              <Image
                source={{ uri: profile.profilePicture }}
                className="w-16 h-16 rounded-full"
                style={{ backgroundColor: "#67082F10" }}
                onError={() => {
                  // If image fails to load, fall back to icon
                  console.log(
                    "Failed to load profile image:",
                    profile.profilePicture
                  );
                }}
              />
            ) : (
              <View className="w-16 h-16 bg-[#67082F]/10 rounded-full items-center justify-center">
                <MaterialIcons name="person" size={32} color="#67082F" />
              </View>
            )}
            <View className="ml-4 flex-1">
              <Text className="font-bold text-lg">
                {profile?.fullName || "Loading..."}
              </Text>
              <Text className="text-gray-600">{profile?.email || ""}</Text>
              {profile?.phoneNumber && (
                <Text className="text-gray-500 text-sm">
                  {profile.phoneNumber}
                </Text>
              )}
              {profile?.responderInfo && (
                <View className="mt-1">
                  <Text className="text-[#67082F] text-sm font-medium">
                    {profile.responderInfo.responderType} -{" "}
                    {profile.responderInfo.badgeNumber}
                  </Text>
                  <Text className="text-green-600 text-xs">
                    Status: {profile.responderInfo.status}
                  </Text>
                </View>
              )}
            </View>
          </View>
          <TouchableOpacity
            className="flex-row items-center"
            onPress={handleEditProfile}
          >
            <Text className="text-[#67082F]">Edit Profile Picture</Text>
            <MaterialIcons name="chevron-right" size={24} color="#67082F" />
          </TouchableOpacity>
        </View>

        {/* Notification Settings */}
        <View className="bg-white rounded-lg shadow-sm mb-4">
          <Text className="p-4 font-bold text-lg border-b border-gray-100">
            Notifications
          </Text>

          <TouchableOpacity className="p-4 flex-row items-center justify-between border-b border-gray-100">
            <View className="flex-row items-center">
              <MaterialIcons
                name="email"
                size={24}
                color="#67082F"
                className="mr-3"
              />
              <Text className="text-gray-800 ml-3">Email Alerts</Text>
            </View>
            <Switch
              value={emailAlerts}
              onValueChange={(value) =>
                updateNotificationSettings("emailAlerts", value)
              }
              trackColor={{ false: "#767577", true: "#67082F" }}
            />
          </TouchableOpacity>

          <TouchableOpacity className="p-4 flex-row items-center justify-between border-b border-gray-100">
            <View className="flex-row items-center">
              <MaterialIcons
                name="sms"
                size={24}
                color="#67082F"
                className="mr-3"
              />
              <Text className="text-gray-800 ml-3">SMS Alerts</Text>
            </View>
            <Switch
              value={smsAlerts}
              onValueChange={(value) =>
                updateNotificationSettings("smsAlerts", value)
              }
              trackColor={{ false: "#767577", true: "#67082F" }}
            />
          </TouchableOpacity>

          <TouchableOpacity className="p-4 flex-row items-center justify-between">
            <View className="flex-row items-center">
              <MaterialIcons
                name="notifications"
                size={24}
                color="#67082F"
                className="mr-3"
              />
              <Text className="text-gray-800 ml-3">Push Notifications</Text>
            </View>
            <Switch
              value={pushNotifications}
              onValueChange={(value) =>
                updateNotificationSettings("pushNotifications", value)
              }
              trackColor={{ false: "#767577", true: "#67082F" }}
            />
          </TouchableOpacity>
        </View>

        {/* Additional Options */}
        <View className="bg-white rounded-lg shadow-sm">
          <TouchableOpacity
            className="p-4 flex-row items-center justify-between border-b border-gray-100"
            onPress={() =>
              Alert.alert("Info", "Privacy Policy feature coming soon!")
            }
          >
            <View className="flex-row items-center">
              <MaterialIcons name="security" size={24} color="#67082F" />
              <Text className="text-gray-800 ml-3">Privacy Policy</Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color="#67082F" />
          </TouchableOpacity>

          <TouchableOpacity
            className="p-4 flex-row items-center justify-between border-b border-gray-100"
            onPress={() =>
              Alert.alert("Info", "Help & Support feature coming soon!")
            }
          >
            <View className="flex-row items-center">
              <MaterialIcons name="help-outline" size={24} color="#67082F" />
              <Text className="text-gray-800 ml-3">Help & Support</Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color="#67082F" />
          </TouchableOpacity>

          <TouchableOpacity
            className="p-4 flex-row items-center justify-between"
            onPress={handleLogout}
          >
            <View className="flex-row items-center">
              <MaterialIcons name="logout" size={24} color="#67082F" />
              <Text className="text-gray-800 ml-3">Logout</Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Profile Picture Edit Modal */}
      <Modal
        visible={showEditModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowEditModal(false)}
      >
        <View className="flex-1 bg-black/50 items-center justify-center p-4">
          <View className="bg-white rounded-lg p-6 w-full max-w-sm">
            <Text className="text-lg font-bold mb-4 text-center">
              Update Profile Picture
            </Text>

            {/* Current profile picture preview */}
            <View className="items-center mb-4">
              {profilePictureUrl ? (
                <Image
                  source={{ uri: profilePictureUrl }}
                  className="w-20 h-20 rounded-full"
                  style={{ backgroundColor: "#67082F10" }}
                  onError={() => {
                    Alert.alert(
                      "Error",
                      "Invalid image URL. Please check the URL and try again."
                    );
                  }}
                />
              ) : (
                <View className="w-20 h-20 bg-[#67082F]/10 rounded-full items-center justify-center">
                  <MaterialIcons name="person" size={40} color="#67082F" />
                </View>
              )}
            </View>

            <Text className="text-gray-600 mb-2">Profile Picture URL:</Text>
            <TextInput
              className="border border-gray-300 rounded-lg p-3 mb-4"
              placeholder="Enter image URL (https://...)"
              value={profilePictureUrl}
              onChangeText={setProfilePictureUrl}
              multiline={false}
              autoCapitalize="none"
              keyboardType="url"
            />

            <Text className="text-xs text-gray-500 mb-2">
              Enter a valid image URL (JPEG, PNG, GIF, etc.) that starts with
              http:// or https://
            </Text>

            <Text className="text-xs text-blue-600 mb-4">
              Example:
              https://images.unsplash.com/photo-1494790108755-2616b612c5b0?w=150&h=150&fit=crop&crop=face
            </Text>

            <View className="flex-row space-x-2 mb-4">
              <TouchableOpacity
                className="flex-1 bg-gray-200 rounded-lg p-3"
                onPress={() => {
                  setShowEditModal(false);
                  setProfilePictureUrl("");
                }}
                disabled={isUpdatingProfile}
              >
                <Text className="text-center text-gray-700">Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="flex-1 bg-red-500 rounded-lg p-3"
                onPress={() => updateProfilePicture("")}
                disabled={isUpdatingProfile}
              >
                {isUpdatingProfile ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text className="text-center text-white">Remove</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                className="flex-1 bg-[#67082F] rounded-lg p-3"
                onPress={() => updateProfilePicture(profilePictureUrl)}
                disabled={isUpdatingProfile || !profilePictureUrl.trim()}
              >
                {isUpdatingProfile ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text className="text-center text-white">Update</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
