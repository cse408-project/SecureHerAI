import {
  View,
  Text,
  TouchableOpacity,
  Switch,
  ScrollView,
  ActivityIndicator,
  Image,
  TextInput,
  Modal,
} from "react-native";
import { useAlert } from "../../context/AlertContext";
import { MaterialIcons } from "@expo/vector-icons";
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import ApiService from "../../services/api";
import Header from "../../src/components/Header";
import DatePicker from "../../components/DatePicker";

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
  const [showFullProfileModal, setShowFullProfileModal] = useState(false);
  const [profilePictureUrl, setProfilePictureUrl] = useState("");
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // Full profile edit state
  const [editProfile, setEditProfile] = useState({
    fullName: "",
    phoneNumber: "",
    dateOfBirth: "",
    profilePicture: "",
    // Responder fields
    status: "",
    responderType: "",
    badgeNumber: "",
  });

  const { showAlert, showConfirmAlert } = useAlert();
  const { logout } = useAuth();

  const loadUserProfile = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await ApiService.getUserProfile();
      if (response.success && response.data) {
        setProfile(response.data);
      }
    } catch (error) {
      console.error("Failed to load user profile:", error);
      showAlert("Error", "Failed to load profile data", "error");
    } finally {
      setIsLoading(false);
    }
  }, [showAlert]);

  const loadNotificationPreferences = useCallback(async () => {
    try {
      const response = await ApiService.getNotificationPreferences();
      if (response.success && response.data) {
        const prefs = response.data.preferences;
        setEmailAlerts(prefs.emailAlerts);
        setSmsAlerts(prefs.smsAlerts);
        setPushNotifications(prefs.pushNotifications);
      } else {
        // If no preferences exist, keep defaults
        console.log("No notification preferences found, using defaults");
      }
    } catch (error) {
      console.error("Failed to load notification preferences:", error);
      // Keep defaults if loading fails
    }
  }, []);

  useEffect(() => {
    loadUserProfile();
    loadNotificationPreferences();
  }, [loadUserProfile, loadNotificationPreferences]);

  const updateNotificationSettings = async (
    type: "emailAlerts" | "smsAlerts" | "pushNotifications",
    value: boolean
  ) => {
    try {
      // Create the preferences object with current values and the updated value
      const preferences = {
        emailAlerts: type === "emailAlerts" ? value : emailAlerts,
        smsAlerts: type === "smsAlerts" ? value : smsAlerts,
        pushNotifications:
          type === "pushNotifications" ? value : pushNotifications,
      };

      const response = await ApiService.updateNotificationPreferences(
        preferences
      );
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
        showAlert("Success", "Notification preferences updated", "success");
      } else {
        showAlert(
          "Error",
          response.error || "Failed to update notification settings",
          "error"
        );
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
      showAlert("Error", "Failed to update notification settings", "error");

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
        showAlert(
          "Invalid URL",
          "Profile picture URL must start with http:// or https://",
          "error"
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
        showAlert(
          "Success",
          "Profile picture updated successfully!",
          "success"
        );
      } else {
        showAlert(
          "Error",
          response.message || "Failed to update profile picture",
          "error"
        );
      }
    } catch (error) {
      console.error("Failed to update profile picture:", error);
      showAlert("Error", "Failed to update profile picture", "error");
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleEditProfile = () => {
    setProfilePictureUrl(profile?.profilePicture || "");
    setShowEditModal(true);
  };

  const handleFullProfileEdit = () => {
    if (profile) {
      setEditProfile({
        fullName: profile.fullName || "",
        phoneNumber: profile.phoneNumber || "",
        dateOfBirth: profile.dateOfBirth || "",
        profilePicture: profile.profilePicture || "",
        status: profile.responderInfo?.status || "",
        responderType: profile.responderInfo?.responderType || "",
        badgeNumber: profile.responderInfo?.badgeNumber || "",
      });
      setShowFullProfileModal(true);
    }
  };

  const updateFullProfile = async () => {
    if (!editProfile.fullName.trim()) {
      showAlert("Error", "Full name is required", "error");
      return;
    }

    if (!editProfile.phoneNumber.trim()) {
      showAlert("Error", "Phone number is required", "error");
      return;
    }

    // Validate responder fields if they exist
    const isResponder = profile?.responderInfo !== null;
    if (isResponder) {
      if (!editProfile.responderType.trim()) {
        showAlert("Error", "Responder type is required", "error");
        return;
      }
      if (!editProfile.badgeNumber.trim()) {
        showAlert("Error", "Badge number is required", "error");
        return;
      }
    }

    try {
      setIsUpdatingProfile(true);
      const updateData: any = {
        fullName: editProfile.fullName.trim(),
        phoneNumber: editProfile.phoneNumber.trim(),
        dateOfBirth: editProfile.dateOfBirth.trim(),
        profilePicture: editProfile.profilePicture.trim(),
        emailAlerts: emailAlerts,
        smsAlerts: smsAlerts,
        pushNotifications: pushNotifications,
      };

      // Add responder fields if user is a responder
      if (isResponder) {
        updateData.status = editProfile.status || "AVAILABLE";
        updateData.responderType = editProfile.responderType.trim();
        updateData.badgeNumber = editProfile.badgeNumber.trim();
      }

      const response = await ApiService.updateProfile(updateData);
      if (response.success) {
        // Update local state
        setProfile((prev) =>
          prev
            ? {
                ...prev,
                fullName: updateData.fullName,
                phoneNumber: updateData.phoneNumber,
                dateOfBirth: updateData.dateOfBirth,
                profilePicture: updateData.profilePicture,
                responderInfo: isResponder
                  ? {
                      ...prev.responderInfo!,
                      status: updateData.status,
                      responderType: updateData.responderType,
                      badgeNumber: updateData.badgeNumber,
                    }
                  : prev.responderInfo,
              }
            : prev
        );
        setShowFullProfileModal(false);
        showAlert("Success", "Profile updated successfully!", "success");
      } else {
        showAlert(
          "Error",
          response.message || "Failed to update profile",
          "error"
        );
      }
    } catch (error) {
      console.error("Failed to update profile:", error);
      showAlert("Error", "Failed to update profile", "error");
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleLogout = () => {
    // Use our platform-agnostic alert system
    showConfirmAlert(
      "Logout",
      "Are you sure you want to logout?",
      executeLogout,
      undefined,
      "warning"
    );
  };

  const executeLogout = async () => {
    try {
      await logout();
      // Protected routes will handle redirection automatically
    } catch (error) {
      console.error("Logout error:", error);
      showAlert("Error", "Failed to log out. Please try again.", "error");
    }
  };

  if (isLoading) {
    return (
      <View className="flex-1 bg-[#FFE4D6] max-w-screen-md mx-auto w-full">
        <Header
          title="Settings"
          onNotificationPress={() => {}}
          showNotificationDot={false}
        />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#67082F" />
          <Text className="mt-2 text-[#67082F]">Loading profile...</Text>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#FFE4D6] max-w-screen-md mx-auto w-full">
      <Header
        title="Settings"
        onNotificationPress={() => {}}
        showNotificationDot={false}
      />

      <ScrollView className="flex-1 p-4 pb-28">
        {/* Profile Section */}
        <View className="bg-white rounded-lg p-4 mb-4 shadow-sm">
          <Text className="text-lg font-bold text-[#67082F] mb-4">
            Profile Information
          </Text>

          <View className="flex-row items-start mb-4">
            {profile?.profilePicture ? (
              <Image
                source={{ uri: profile.profilePicture }}
                className="w-20 h-20 rounded-full"
                style={{ backgroundColor: "#67082F10" }}
                onError={() => {
                  console.log(
                    "Failed to load profile image:",
                    profile.profilePicture
                  );
                }}
              />
            ) : (
              <View className="w-20 h-20 bg-[#67082F]/10 rounded-full items-center justify-center">
                <MaterialIcons name="person" size={40} color="#67082F" />
              </View>
            )}

            <View className="ml-4 flex-1">
              <Text className="font-bold text-xl text-gray-900 mb-1">
                {profile?.fullName || "Loading..."}
              </Text>
              <Text className="text-gray-600 mb-1">{profile?.email || ""}</Text>
              {profile?.phoneNumber && (
                <Text className="text-gray-500 text-sm mb-1">
                  📞 {profile.phoneNumber}
                </Text>
              )}
              {profile?.dateOfBirth && (
                <Text className="text-gray-500 text-sm mb-1">
                  🎂 {new Date(profile.dateOfBirth).toLocaleDateString()}
                </Text>
              )}
              {profile?.responderInfo && (
                <View className="mt-2 p-2 bg-[#67082F]/10 rounded-lg">
                  <Text className="text-[#67082F] text-sm font-medium">
                    👮‍♀️ {profile.responderInfo.responderType} -{" "}
                    {profile.responderInfo.badgeNumber}
                  </Text>
                  <Text
                    className={`text-xs font-medium ${
                      profile.responderInfo.status === "AVAILABLE"
                        ? "text-green-600"
                        : profile.responderInfo.status === "BUSY"
                        ? "text-red-600"
                        : "text-gray-600"
                    }`}
                  >
                    Status: {profile.responderInfo.status}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Profile Actions */}
          <View className="space-y-2">
            <TouchableOpacity
              className="flex-row items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200"
              onPress={handleFullProfileEdit}
            >
              <View className="flex-row items-center">
                <MaterialIcons name="edit" size={20} color="#3B82F6" />
                <Text className="text-blue-700 font-semibold ml-3">
                  Edit Full Profile
                </Text>
              </View>
              <MaterialIcons name="chevron-right" size={24} color="#67082F" />
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-row items-center justify-between p-3 bg-purple-50 rounded-lg border border-purple-200"
              onPress={handleEditProfile}
            >
              <View className="flex-row items-center">
                <MaterialIcons name="photo-camera" size={20} color="#8B5CF6" />
                <Text className="text-purple-700 font-semibold ml-3">
                  Update Profile Picture
                </Text>
              </View>
              <MaterialIcons name="chevron-right" size={24} color="#67082F" />
            </TouchableOpacity>
          </View>
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
              showAlert("Info", "Privacy Policy feature coming soon!", "info")
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
              showAlert("Info", "Help & Support feature coming soon!", "info")
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
                    showAlert(
                      "Error",
                      "Invalid image URL. Please check the URL and try again.",
                      "error"
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

      {/* Full Profile Edit Modal */}
      <Modal
        visible={showFullProfileModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowFullProfileModal(false)}
      >
        <View className="flex-1 bg-black/50 items-center justify-center p-4">
          <View className="bg-white rounded-lg p-6 w-full max-w-md max-h-4/5">
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text className="text-xl font-bold mb-4 text-center text-[#67082F]">
                Edit Profile
              </Text>

              {/* Profile Picture Preview */}
              <View className="items-center mb-6">
                {editProfile.profilePicture ? (
                  <Image
                    source={{ uri: editProfile.profilePicture }}
                    className="w-24 h-24 rounded-full"
                    style={{ backgroundColor: "#67082F10" }}
                    onError={() => {
                      showAlert(
                        "Error",
                        "Invalid profile picture URL",
                        "error"
                      );
                    }}
                  />
                ) : (
                  <View className="w-24 h-24 bg-[#67082F]/10 rounded-full items-center justify-center">
                    <MaterialIcons name="person" size={48} color="#67082F" />
                  </View>
                )}
              </View>

              {/* Full Name */}
              <View className="mb-4">
                <Text className="text-sm font-medium text-gray-700 mb-2">
                  Full Name *
                </Text>
                <TextInput
                  className="border border-gray-300 rounded-lg p-3 bg-white text-gray-900"
                  placeholder="Enter your full name"
                  value={editProfile.fullName}
                  onChangeText={(value) =>
                    setEditProfile((prev) => ({ ...prev, fullName: value }))
                  }
                  autoCapitalize="words"
                />
              </View>

              {/* Phone Number */}
              <View className="mb-4">
                <Text className="text-sm font-medium text-gray-700 mb-2">
                  Phone Number *
                </Text>
                <TextInput
                  className="border border-gray-300 rounded-lg p-3 bg-white text-gray-900"
                  placeholder="Enter your phone number"
                  value={editProfile.phoneNumber}
                  onChangeText={(value) =>
                    setEditProfile((prev) => ({ ...prev, phoneNumber: value }))
                  }
                  keyboardType="phone-pad"
                />
              </View>

              {/* Date of Birth */}
              <DatePicker
                label="Date of Birth"
                value={editProfile.dateOfBirth}
                onDateChange={(date) =>
                  setEditProfile((prev) => ({ ...prev, dateOfBirth: date }))
                }
                placeholder="Select your birth date"
              />

              {/* Profile Picture URL */}
              <View className="mb-6">
                <Text className="text-sm font-medium text-gray-700 mb-2">
                  Profile Picture URL
                </Text>
                <TextInput
                  className="border border-gray-300 rounded-lg p-3 bg-white text-gray-900"
                  placeholder="Enter image URL (https://...)"
                  value={editProfile.profilePicture}
                  onChangeText={(value) =>
                    setEditProfile((prev) => ({
                      ...prev,
                      profilePicture: value,
                    }))
                  }
                  autoCapitalize="none"
                  keyboardType="url"
                />
                <Text className="text-xs text-gray-500 mt-1">
                  Enter a valid image URL starting with http:// or https://
                </Text>
              </View>

              {/* Responder Fields - Only show if user is a responder */}
              {profile?.responderInfo && (
                <>
                  <View className="mb-4 p-4 bg-[#67082F]/5 rounded-lg border border-[#67082F]/20">
                    <Text className="text-base font-semibold text-[#67082F] mb-3">
                      👮‍♀️ Responder Information
                    </Text>

                    {/* Responder Status */}
                    <View className="mb-4">
                      <Text className="text-sm font-medium text-gray-700 mb-2">
                        Status
                      </Text>
                      <View className="border border-gray-300 rounded-lg bg-white">
                        <View className="p-3">
                          <TouchableOpacity
                            className={`p-3 rounded-lg ${
                              editProfile.status === "AVAILABLE"
                                ? "bg-green-100 border-2 border-green-500"
                                : "bg-gray-100"
                            }`}
                            onPress={() =>
                              setEditProfile((prev) => ({
                                ...prev,
                                status: "AVAILABLE",
                              }))
                            }
                          >
                            <Text
                              className={`text-center font-semibold ${
                                editProfile.status === "AVAILABLE"
                                  ? "text-green-700"
                                  : "text-gray-600"
                              }`}
                            >
                              🟢 Available
                            </Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            className={`p-3 rounded-lg mt-2 ${
                              editProfile.status === "BUSY"
                                ? "bg-red-100 border-2 border-red-500"
                                : "bg-gray-100"
                            }`}
                            onPress={() =>
                              setEditProfile((prev) => ({
                                ...prev,
                                status: "BUSY",
                              }))
                            }
                          >
                            <Text
                              className={`text-center font-semibold ${
                                editProfile.status === "BUSY"
                                  ? "text-red-700"
                                  : "text-gray-600"
                              }`}
                            >
                              🔴 Busy
                            </Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            className={`p-3 rounded-lg mt-2 ${
                              editProfile.status === "OFF_DUTY"
                                ? "bg-gray-200 border-2 border-gray-500"
                                : "bg-gray-100"
                            }`}
                            onPress={() =>
                              setEditProfile((prev) => ({
                                ...prev,
                                status: "OFF_DUTY",
                              }))
                            }
                          >
                            <Text
                              className={`text-center font-semibold ${
                                editProfile.status === "OFF_DUTY"
                                  ? "text-gray-700"
                                  : "text-gray-600"
                              }`}
                            >
                              ⚫ Off Duty
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>

                    {/* Responder Type */}
                    <View className="mb-4">
                      <Text className="text-sm font-medium text-gray-700 mb-2">
                        Responder Type *
                      </Text>
                      <View className="border border-gray-300 rounded-lg bg-white">
                        <View className="p-3">
                          <TouchableOpacity
                            className={`p-3 rounded-lg ${
                              editProfile.responderType === "POLICE"
                                ? "bg-blue-100 border-2 border-blue-500"
                                : "bg-gray-100"
                            }`}
                            onPress={() =>
                              setEditProfile((prev) => ({
                                ...prev,
                                responderType: "POLICE",
                              }))
                            }
                          >
                            <Text
                              className={`text-center font-semibold ${
                                editProfile.responderType === "POLICE"
                                  ? "text-blue-700"
                                  : "text-gray-600"
                              }`}
                            >
                              🚔 Police
                            </Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            className={`p-3 rounded-lg mt-2 ${
                              editProfile.responderType === "MEDICAL"
                                ? "bg-red-100 border-2 border-red-500"
                                : "bg-gray-100"
                            }`}
                            onPress={() =>
                              setEditProfile((prev) => ({
                                ...prev,
                                responderType: "MEDICAL",
                              }))
                            }
                          >
                            <Text
                              className={`text-center font-semibold ${
                                editProfile.responderType === "MEDICAL"
                                  ? "text-red-700"
                                  : "text-gray-600"
                              }`}
                            >
                              🚑 Medical
                            </Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            className={`p-3 rounded-lg mt-2 ${
                              editProfile.responderType === "FIRE"
                                ? "bg-orange-100 border-2 border-orange-500"
                                : "bg-gray-100"
                            }`}
                            onPress={() =>
                              setEditProfile((prev) => ({
                                ...prev,
                                responderType: "FIRE",
                              }))
                            }
                          >
                            <Text
                              className={`text-center font-semibold ${
                                editProfile.responderType === "FIRE"
                                  ? "text-orange-700"
                                  : "text-gray-600"
                              }`}
                            >
                              🚒 Fire Department
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>

                    {/* Badge Number */}
                    <View className="mb-4">
                      <Text className="text-sm font-medium text-gray-700 mb-2">
                        Badge Number *
                      </Text>
                      <TextInput
                        className="border border-gray-300 rounded-lg p-3 bg-white text-gray-900"
                        placeholder="Enter your badge number"
                        value={editProfile.badgeNumber}
                        onChangeText={(value) =>
                          setEditProfile((prev) => ({
                            ...prev,
                            badgeNumber: value,
                          }))
                        }
                        autoCapitalize="characters"
                      />
                    </View>
                  </View>
                </>
              )}

              {/* Action Buttons */}
              <View className="flex-row space-x-3">
                <TouchableOpacity
                  className="flex-1 bg-gray-200 rounded-lg p-4"
                  onPress={() => setShowFullProfileModal(false)}
                  disabled={isUpdatingProfile}
                >
                  <Text className="text-center text-gray-700 font-semibold">
                    Cancel
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  className="flex-1 bg-[#67082F] rounded-lg p-4"
                  onPress={updateFullProfile}
                  disabled={isUpdatingProfile}
                >
                  {isUpdatingProfile ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <Text className="text-center text-white font-semibold">
                      Save Changes
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Note: We've removed the custom WebAlert component since we now use the universal alert system */}
    </View>
  );
}
