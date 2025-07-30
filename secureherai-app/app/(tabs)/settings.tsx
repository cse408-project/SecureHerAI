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
import Header from "../../components/Header";
import DatePicker from "../../components/DatePicker";
import ResponderFields from "../../components/ResponderFields";
import NotificationModal from "../../components/NotificationModal";
import cloudinaryService from "../../services/cloudinary";

interface UserProfile {
  userId: string;
  fullName: string;
  email: string;
  phoneNumber?: string;
  profilePicture?: string;
  dateOfBirth?: string;
  // Current location fields (now directly on User entity)
  currentLatitude?: number;
  currentLongitude?: number;
  lastLocationUpdate?: string;
  settings?: {
    emailAlerts: boolean;
    smsAlerts: boolean;
    pushNotifications: boolean;
    sosKeyword: string;
  };
  notificationPreferences?: {
    emailAlerts: boolean;
    smsAlerts: boolean;
    pushNotifications: boolean;
  };
  role?: string;
  responderInfo?: {
    responderType: string;
    badgeNumber: string;
    branchName?: string;
    address?: string;
    // currentLatitude and currentLongitude removed from responderInfo
    status: string;
    active: boolean;
  };
}

export default function SettingsScreen() {
  const [showNotifications, setShowNotifications] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [smsAlerts, setSmsAlerts] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [sosKeyword, setSosKeyword] = useState("help");
  const [showSosKeywordModal, setShowSosKeywordModal] = useState(false);
  const [newSosKeyword, setNewSosKeyword] = useState("");
  const [sosKeywordPassword, setSosKeywordPassword] = useState("");
  const [isUpdatingSosKeyword, setIsUpdatingSosKeyword] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showFullProfileModal, setShowFullProfileModal] = useState(false);
  const [profilePictureUrl, setProfilePictureUrl] = useState("");
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [showImagePickerModal, setShowImagePickerModal] = useState(false);

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
    branchName: "",
    address: "",
    currentLatitude: null as number | null,
    currentLongitude: null as number | null,
  });

  // Add errors state for ResponderFields
  const [errors, setErrors] = useState({
    responderType: "",
    badgeNumber: "",
    branchName: "",
    address: "",
    currentLatitude: "",
    currentLongitude: "",
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
      const response = await ApiService.getSettings();
      if (response.success && response.data && response.data.settings) {
        const settings = response.data.settings;
        setEmailAlerts(settings.emailAlerts);
        setSmsAlerts(settings.smsAlerts);
        setPushNotifications(settings.pushNotifications);
        setSosKeyword(settings.sosKeyword || "help");
      } else {
        // If no settings exist, keep defaults
        console.log("No settings found, using defaults");
      }
    } catch (error) {
      console.error("Failed to load settings:", error);
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

  const handleImageUpload = () => {
    setShowImagePickerModal(true);
  };

  const handleCameraUpload = async () => {
    try {
      setIsUploadingImage(true);
      showAlert("Info", "Opening camera...", "info");

      const result = await cloudinaryService.takePhotoWithCamera();

      if (result && !result.canceled && result.assets && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        await uploadImageToCloudinary(imageUri);
      } else {
        showAlert("Info", "Photo capture was cancelled", "info");
      }
    } catch (error) {
      console.error("Camera upload error:", error);
      showAlert("Error", "Failed to take photo. Please try again.", "error");
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleGalleryUpload = async () => {
    try {
      setIsUploadingImage(true);
      showAlert("Info", "Opening gallery...", "info");

      const result = await cloudinaryService.pickImageFromGallery();

      if (result && !result.canceled && result.assets && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        await uploadImageToCloudinary(imageUri);
      } else {
        showAlert("Info", "Image selection was cancelled", "info");
      }
    } catch (error) {
      console.error("Gallery upload error:", error);
      showAlert(
        "Error",
        "Failed to pick image from gallery. Please try again.",
        "error"
      );
    } finally {
      setIsUploadingImage(false);
    }
  };

  const uploadImageToCloudinary = async (imageUri: string) => {
    try {
      setIsUpdatingProfile(true);
      showAlert("Uploading", "Uploading image to Cloudinary...", "info");

      const uploadResult = await cloudinaryService.uploadProfilePicture(
        imageUri
      );

      if (uploadResult.success && uploadResult.url) {
        await updateProfilePicture(uploadResult.url);
        showAlert(
          "Success",
          "Profile picture uploaded successfully!",
          "success"
        );
      } else {
        showAlert(
          "Error",
          uploadResult.error || "Failed to upload image",
          "error"
        );
      }
    } catch (error) {
      console.error("Upload to Cloudinary error:", error);
      showAlert("Error", "Failed to upload image. Please try again.", "error");
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleEditProfile = () => {
    // Show options for updating profile picture
    handleImageUpload();
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
        branchName: profile.responderInfo?.branchName || "",
        address: profile.responderInfo?.address || "",
        currentLatitude: profile.currentLatitude || null,
        currentLongitude: profile.currentLongitude || null,
      });
      setErrors({
        responderType: "",
        badgeNumber: "",
        branchName: "",
        address: "",
        currentLatitude: "",
        currentLongitude: "",
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
      const newErrors: any = {};

      if (!editProfile.responderType.trim()) {
        newErrors.responderType = "Responder type is required";
      }
      if (!editProfile.badgeNumber.trim()) {
        newErrors.badgeNumber = "Badge number is required";
      }

      // Check if there are any validation errors
      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        showAlert("Error", "Please fix the validation errors", "error");
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
        if (editProfile.branchName.trim()) {
          updateData.branchName = editProfile.branchName.trim();
        }
        if (editProfile.address.trim()) {
          updateData.address = editProfile.address.trim();
        }
        if (editProfile.currentLatitude !== null) {
          updateData.currentLatitude = editProfile.currentLatitude;
        }
        if (editProfile.currentLongitude !== null) {
          updateData.currentLongitude = editProfile.currentLongitude;
        }
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
                      branchName: updateData.branchName,
                      address: updateData.address,
                      currentLatitude: updateData.currentLatitude,
                      currentLongitude: updateData.currentLongitude,
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

  // Delete Account functionality
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);
  const [deleteAccountData, setDeleteAccountData] = useState({
    password: "",
    confirmationText: "",
  });
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  const handleDeleteAccount = () => {
    setShowDeleteAccountModal(true);
  };

  const executeDeleteAccount = async () => {
    if (deleteAccountData.confirmationText !== "DELETE MY ACCOUNT") {
      showAlert(
        "Error",
        'Please type exactly "DELETE MY ACCOUNT" to confirm',
        "error"
      );
      return;
    }

    // For regular users (non-OAuth), password is required
    if (!deleteAccountData.password) {
      showAlert("Error", "Password is required", "error");
      return;
    }

    try {
      setIsDeletingAccount(true);
      const response = await ApiService.deleteAccount(
        deleteAccountData.password,
        deleteAccountData.confirmationText
      );

      if (response.success) {
        showAlert(
          "Account Deleted",
          "Your account has been permanently deleted.",
          "success"
        );
        setShowDeleteAccountModal(false);
        // Clear form
        setDeleteAccountData({ password: "", confirmationText: "" });
        // Logout user after successful deletion
        await logout();
      } else {
        showAlert(
          "Error",
          response.error || "Failed to delete account",
          "error"
        );
      }
    } catch (error) {
      console.error("Delete account error:", error);
      showAlert(
        "Error",
        "Failed to delete account. Please try again.",
        "error"
      );
    } finally {
      setIsDeletingAccount(false);
    }
  };

  const updateSosKeyword = async () => {
    if (!newSosKeyword.trim()) {
      showAlert("Error", "SOS keyword cannot be empty", "error");
      return;
    }

    if (newSosKeyword.trim().length < 2) {
      showAlert(
        "Error",
        "SOS keyword must be at least 2 characters long",
        "error"
      );
      return;
    }

    try {
      setIsUpdatingSosKeyword(true);
      const response = await ApiService.updateSosKeyword(
        newSosKeyword.trim(),
        sosKeywordPassword
      );

      if (response.success) {
        setSosKeyword(newSosKeyword.trim());
        setShowSosKeywordModal(false);
        setNewSosKeyword("");
        setSosKeywordPassword("");
        showAlert("Success", "SOS keyword updated successfully", "success");
      } else {
        showAlert(
          "Error",
          response.error || "Failed to update SOS keyword",
          "error"
        );
      }
    } catch (error) {
      console.error("Failed to update SOS keyword:", error);
      showAlert("Error", "Failed to update SOS keyword", "error");
    } finally {
      setIsUpdatingSosKeyword(false);
    }
  };

  const openSosKeywordModal = () => {
    setNewSosKeyword(sosKeyword);
    setSosKeywordPassword("");
    setShowSosKeywordModal(true);
  };

  if (isLoading) {
    return (
      <View className="flex-1 bg-[#FFE4D6] max-w-screen-md mx-auto w-full">
        <Header
          title="Settings"
          onNotificationPress={() => setShowNotifications(true)}
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
        onNotificationPress={() => setShowNotifications(true)}
        showNotificationDot={false}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        className="flex-1 p-4" 
        contentContainerStyle={{ paddingBottom: 120 }} 
      >
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
                  {profile.responderInfo.branchName && (
                    <Text className="text-[#67082F] text-xs mt-1">
                      🏢 Branch: {profile.responderInfo.branchName}
                    </Text>
                  )}
                  {(profile.responderInfo.address ||
                    (profile.currentLatitude &&
                      profile.currentLongitude)) && (
                    <Text className="text-[#67082F] text-xs mt-1">
                      📍 Location:{" "}
                      {profile.responderInfo.address ||
                        `${profile.currentLatitude?.toFixed(
                          6
                        )}, ${profile.currentLongitude?.toFixed(
                          6
                        )}`}
                    </Text>
                  )}
                  <Text
                    className={`text-xs font-medium mt-1 ${
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
              style={{
                backgroundColor: "#F3E8FF",
                borderColor: "#C084FC",
                borderWidth: 2,
                elevation: 2,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
              }}
              onPress={handleEditProfile}
              activeOpacity={0.7}
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

        {/* SOS Keyword Setting - Hidden for Responders */}
        {!profile?.responderInfo && (
          <>
            <Text className="text-lg font-semibold text-gray-800 mb-3 mt-6">
              Emergency Settings
            </Text>
            <View className="bg-white rounded-lg shadow-sm">
              <TouchableOpacity
                className="p-4 flex-row items-center justify-between"
                onPress={openSosKeywordModal}
              >
                <View className="flex-row items-center">
                  <MaterialIcons
                    name="crisis-alert"
                    size={24}
                    color="#67082F"
                    className="mr-3"
                  />
                  <View className="ml-3">
                    <Text className="text-gray-800 font-medium">SOS Keyword</Text>
                    <Text className="text-gray-500 text-sm">
                      Current: &quot;{sosKeyword}&quot;
                    </Text>
                  </View>
                </View>
                <MaterialIcons name="chevron-right" size={24} color="#67082F" />
              </TouchableOpacity>
            </View>
          </>
        )}

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
            onPress={handleDeleteAccount}
          >
            <View className="flex-row items-center">
              <MaterialIcons name="delete-forever" size={24} color="#DC2626" />
              <Text className="text-red-600 ml-3">Delete Account</Text>
            </View>
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

            {/* Camera and Gallery Options */}
            <View className="flex-row space-x-2 mb-4">
              <TouchableOpacity
                className="flex-1 bg-blue-50 rounded-lg p-3 border border-blue-200"
                onPress={() => {
                  setShowEditModal(false);
                  handleCameraUpload();
                }}
                disabled={isUploadingImage}
              >
                <View className="flex-row items-center justify-center">
                  {isUploadingImage ? (
                    <ActivityIndicator size="small" color="#3B82F6" />
                  ) : (
                    <>
                      <MaterialIcons
                        name="photo-camera"
                        size={20}
                        color="#3B82F6"
                      />
                      <Text className="text-blue-700 font-medium ml-2">
                        Camera
                      </Text>
                    </>
                  )}
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                className="flex-1 bg-green-50 rounded-lg p-3 border border-green-200"
                onPress={() => {
                  setShowEditModal(false);
                  handleGalleryUpload();
                }}
                disabled={isUploadingImage}
              >
                <View className="flex-row items-center justify-center">
                  {isUploadingImage ? (
                    <ActivityIndicator size="small" color="#10B981" />
                  ) : (
                    <>
                      <MaterialIcons
                        name="photo-library"
                        size={20}
                        color="#10B981"
                      />
                      <Text className="text-green-700 font-medium ml-2">
                        Gallery
                      </Text>
                    </>
                  )}
                </View>
              </TouchableOpacity>
            </View>

            <Text className="text-center text-gray-500 mb-4">— or —</Text>

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
          <View className="bg-white rounded-lg p-6 w-full max-w-md max-h-4/5 flex-1">
            <Text className="text-xl font-bold mb-4 text-center text-[#67082F]">
              Edit Profile
            </Text>

            <ScrollView
              className="flex-1"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 20 }}
            >
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

                    {/* Responder Information */}
                    <ResponderFields
                      formData={editProfile}
                      onFieldChange={(field, value) => {
                        setEditProfile((prev) => ({
                          ...prev,
                          [field]: value,
                        }));
                        // Clear error when user starts typing
                        if (errors[field as keyof typeof errors]) {
                          setErrors((prev) => ({
                            ...prev,
                            [field]: "",
                          }));
                        }
                      }}
                      errors={errors}
                    />
                  </View>
                </>
              )}
            </ScrollView>

            {/* Action Buttons - Fixed at bottom */}
            <View className="flex-row space-x-3 mt-4 pt-4 border-t border-gray-200">
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
          </View>
        </View>
      </Modal>

      {/* Delete Account Modal */}
      <Modal
        visible={showDeleteAccountModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowDeleteAccountModal(false)}
      >
        <View className="flex-1 bg-black/50 items-center justify-center p-4">
          <View className="bg-white rounded-lg p-6 w-full max-w-sm">
            <Text className="text-lg font-bold mb-4 text-center text-red-600">
              Delete Account
            </Text>

            <Text className="text-gray-600 mb-4 text-center">
              This action cannot be undone. All your data will be permanently
              deleted.
            </Text>

            {/* Password field - always show for now since we simplified the logic */}
            <View className="mb-4">
              <Text className="text-gray-700 mb-2">Enter your password:</Text>
              <TextInput
                className="border border-gray-300 rounded-lg p-3"
                placeholder="Password (leave empty for Google accounts)"
                secureTextEntry
                value={deleteAccountData.password}
                onChangeText={(text) =>
                  setDeleteAccountData((prev) => ({ ...prev, password: text }))
                }
              />
            </View>

            <View className="mb-4">
              <Text className="text-gray-700 mb-2">
                Type &quot;DELETE MY ACCOUNT&quot; to confirm:
              </Text>
              <TextInput
                className="border border-gray-300 rounded-lg p-3"
                placeholder="DELETE MY ACCOUNT"
                value={deleteAccountData.confirmationText}
                onChangeText={(text) =>
                  setDeleteAccountData((prev) => ({
                    ...prev,
                    confirmationText: text,
                  }))
                }
              />
            </View>

            <View className="flex-row space-x-3">
              <TouchableOpacity
                className="flex-1 bg-gray-200 rounded-lg p-4"
                onPress={() => {
                  setShowDeleteAccountModal(false);
                  setDeleteAccountData({ password: "", confirmationText: "" });
                }}
                disabled={isDeletingAccount}
              >
                <Text className="text-center text-gray-700 font-semibold">
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="flex-1 bg-red-600 rounded-lg p-4"
                onPress={executeDeleteAccount}
                disabled={isDeletingAccount}
              >
                {isDeletingAccount ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text className="text-center text-white font-semibold">
                    Delete Account
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Image Picker Modal */}
      <Modal
        visible={showImagePickerModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowImagePickerModal(false)}
      >
        <View className="flex-1 bg-black/50 items-center justify-center p-4">
          <View className="bg-white rounded-lg p-6 w-full max-w-sm">
            <Text className="text-lg font-bold mb-4 text-center text-[#67082F]">
              Select Image Source
            </Text>
            <Text className="text-gray-600 text-center mb-6">
              Choose how you want to add your profile picture
            </Text>

            {/* Camera Option */}
            <TouchableOpacity
              className="flex-row items-center p-4 bg-blue-50 rounded-lg border border-blue-200 mb-3"
              onPress={() => {
                setShowImagePickerModal(false);
                handleCameraUpload();
              }}
              disabled={isUploadingImage}
            >
              <MaterialIcons name="photo-camera" size={24} color="#3B82F6" />
              <Text className="text-blue-700 font-medium ml-3 flex-1">
                Take Photo
              </Text>
              <MaterialIcons name="chevron-right" size={20} color="#3B82F6" />
            </TouchableOpacity>

            {/* Gallery Option */}
            <TouchableOpacity
              className="flex-row items-center p-4 bg-green-50 rounded-lg border border-green-200 mb-3"
              onPress={() => {
                setShowImagePickerModal(false);
                handleGalleryUpload();
              }}
              disabled={isUploadingImage}
            >
              <MaterialIcons name="photo-library" size={24} color="#10B981" />
              <Text className="text-green-700 font-medium ml-3 flex-1">
                Gallery
              </Text>
              <MaterialIcons name="chevron-right" size={20} color="#10B981" />
            </TouchableOpacity>

            {/* URL Option */}
            <TouchableOpacity
              className="flex-row items-center p-4 bg-purple-50 rounded-lg border border-purple-200 mb-6"
              onPress={() => {
                setShowImagePickerModal(false);
                setProfilePictureUrl(profile?.profilePicture || "");
                setShowEditModal(true);
              }}
              disabled={isUploadingImage}
            >
              <MaterialIcons name="link" size={24} color="#8B5CF6" />
              <Text className="text-purple-700 font-medium ml-3 flex-1">
                Enter URL
              </Text>
              <MaterialIcons name="chevron-right" size={20} color="#8B5CF6" />
            </TouchableOpacity>

            {/* Cancel Button */}
            <TouchableOpacity
              className="bg-gray-200 rounded-lg p-4"
              onPress={() => setShowImagePickerModal(false)}
            >
              <Text className="text-center text-gray-700 font-medium">
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* SOS Keyword Modal */}
      <Modal
        visible={showSosKeywordModal}
        transparent={true}
        animationType="slide"
      >
        <View className="flex-1 bg-black/50 justify-center items-center">
          <View className="bg-white rounded-lg p-6 mx-4 w-full max-w-md">
            <Text className="text-xl font-bold text-gray-800 mb-4">
              Update SOS Keyword
            </Text>

            <Text className="text-gray-600 mb-4">
              This keyword will trigger emergency alerts when used in voice or
              text commands.
            </Text>

            <Text className="text-sm font-medium text-gray-700 mb-2">
              New SOS Keyword
            </Text>
            <TextInput
              className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-4"
              value={newSosKeyword}
              onChangeText={setNewSosKeyword}
              placeholder="Enter new keyword (e.g., emergency)"
              autoCapitalize="none"
            />

            <Text className="text-sm font-medium text-gray-700 mb-2">
              Confirm with Password (optional)
            </Text>
            <TextInput
              className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-6"
              value={sosKeywordPassword}
              onChangeText={setSosKeywordPassword}
              placeholder="Enter your password"
              secureTextEntry
            />

            <View className="flex-row space-x-3">
              <TouchableOpacity
                className="flex-1 bg-gray-200 rounded-lg p-3"
                onPress={() => {
                  setShowSosKeywordModal(false);
                  setNewSosKeyword("");
                  setSosKeywordPassword("");
                }}
              >
                <Text className="text-center text-gray-700 font-medium">
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="flex-1 bg-[#67082F] rounded-lg p-3"
                onPress={updateSosKeyword}
                disabled={isUpdatingSosKeyword}
              >
                {isUpdatingSosKeyword ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-center text-white font-medium">
                    Update
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Image Upload Loading Overlay */}
      {(isUploadingImage || isUpdatingProfile) && (
        <Modal visible={true} transparent={true} animationType="fade">
          <View className="flex-1 bg-black/70 items-center justify-center">
            <View className="bg-white rounded-lg p-6 items-center">
              <ActivityIndicator size="large" color="#67082F" />
              <Text className="mt-4 text-lg font-semibold text-[#67082F]">
                {isUploadingImage ? "Selecting Image..." : "Uploading Image..."}
              </Text>
              <Text className="mt-2 text-gray-600 text-center">
                Please wait while we process your image
              </Text>
            </View>
          </View>
        </Modal>
      )}

      {/* Note: We've removed the custom WebAlert component since we now use the universal alert system */}

      <NotificationModal
        visible={showNotifications}
        onClose={() => setShowNotifications(false)}
      />
    </View>
  );
}
