import React, { useState, useEffect, useCallback } from "react";
import DatePicker from "../../components/DatePicker";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
  Image,
  Platform,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import apiService from "../../services/api";
import cloudinaryService from "../../services/cloudinary";
import { SubmitReportRequest } from "../../types/report";
import { useAlert } from "../../context/AlertContext";
import LocationSelectionModal, {
  SelectedLocation,
} from "../../components/LocationSelectionModal";

interface LocationData {
  latitude: string;
  longitude: string;
}

interface EvidenceFile {
  uri: string;
  cloudinaryUrl?: string;
  type: "image" | "video" | "audio" | "document";
  name: string;
  uploading?: boolean;
}

export default function SubmitReportScreen() {
  const searchParams = useLocalSearchParams();
  const [loading, setLoading] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(
    null
  );
  const [gettingLocation, setGettingLocation] = useState(false);

  // Form state
  const [incidentType, setIncidentType] = useState<
    "harassment" | "theft" | "assault" | "emergency" | "other"
  >("harassment");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [incidentDate, setIncidentDate] = useState("");
  const [incidentTime, setIncidentTime] = useState("");
  const [visibility, setVisibility] = useState<
    "public" | "officials_only" | "private"
  >("public");
  const [anonymous, setAnonymous] = useState(false);
  const [involvedParties, setInvolvedParties] = useState("");

  // Evidence state
  const [evidenceFiles, setEvidenceFiles] = useState<EvidenceFile[]>([]);
  const [showImagePickerModal, setShowImagePickerModal] = useState(false);
  const [isUploadingToCloud, setIsUploadingToCloud] = useState(false);

  // Location selection modal state
  const [showLocationModal, setShowLocationModal] = useState(false);

  // Form validation
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Alert context
  const { showAlert, showConfirmAlert } = useAlert();

  const getCurrentLocation = useCallback(async () => {
    setGettingLocation(true);
    try {
      // For demo purposes, immediately set default location without requiring user interaction
      setCurrentLocation({
        latitude: "23.8103",
        longitude: "90.4125",
      });
      setAddress("Dhaka, Bangladesh");

      // Show a toast or alert to inform the user (optional)
      // showAlert(
      //   'Location Set',
      //   'Using default location (Dhaka, Bangladesh) for demo purposes.',
      //   'info'
      // );
    } catch (error) {
      console.error("Error getting location:", error);
      showAlert("Error", "Could not get current location", "error");
    } finally {
      setGettingLocation(false);
    }
  }, [showAlert]);

  // Helper function to determine file type from URI
  const determineFileType = (
    uri: string
  ): "image" | "video" | "audio" | "document" => {
    const lowerUri = uri.toLowerCase();

    // Check for audio files
    if (
      lowerUri.includes("audio") ||
      lowerUri.includes(".mp3") ||
      lowerUri.includes(".wav") ||
      lowerUri.includes(".aac") ||
      lowerUri.includes(".ogg") ||
      lowerUri.includes(".flac") ||
      lowerUri.includes(".m4a")
    ) {
      return "audio";
    }

    // Check for video files
    if (
      lowerUri.includes("video") ||
      lowerUri.includes(".mp4") ||
      lowerUri.includes(".mov") ||
      lowerUri.includes(".avi") ||
      lowerUri.includes(".webm") ||
      lowerUri.includes(".flv") ||
      lowerUri.includes(".wmv")
    ) {
      return "video";
    }

    // Check for document files
    if (
      lowerUri.includes(".pdf") ||
      lowerUri.includes(".doc") ||
      lowerUri.includes(".docx") ||
      lowerUri.includes(".txt")
    ) {
      return "document";
    }

    // Default to image
    return "image";
  };

  // Function to clean up newly uploaded evidence files (not from SOS)
  const cleanupNewEvidenceFiles = async () => {
    try {
      const newlyUploadedFiles = evidenceFiles.filter((file) => {
        // Don't delete pre-existing SOS audio or evidence that came with the alert
        const isSOSEvidence =
          searchParams.autoFill === "true" &&
          (file.name.includes("Emergency Audio Recording") ||
            file.name.includes("SOS Audio Recording") ||
            file.cloudinaryUrl === searchParams.evidence ||
            searchParams.sosAudio === "true");

        return !isSOSEvidence && file.cloudinaryUrl;
      });

      for (const file of newlyUploadedFiles) {
        if (file.cloudinaryUrl) {
          try {
            await cloudinaryService.deleteFileByUrl(file.cloudinaryUrl);
            console.log(`Cleaned up evidence file: ${file.name}`);
          } catch (deleteError) {
            console.error(
              `Failed to delete evidence file ${file.name}:`,
              deleteError
            );
          }
        }
      }
    } catch (error) {
      console.error("Error during evidence cleanup:", error);
    }
  };

  // Function to handle cancellation
  const handleCancel = async () => {
    try {
      await cleanupNewEvidenceFiles();

      // Check if we can go back, otherwise navigate to reports screen
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace("/(tabs)/reports");
      }
    } catch (error) {
      console.error("Error during cancel cleanup:", error);

      // Still navigate back even if cleanup fails
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace("/(tabs)/reports");
      }
    }
  };

  useEffect(() => {
    // Set default date and time to current
    const now = new Date();
    setIncidentDate(now.toISOString().split("T")[0]);
    setIncidentTime(now.toTimeString().slice(0, 5));

    // Handle SOS/Alert pre-populated data
    if (searchParams.autoFill === "true") {
      // Set incident type based on trigger method or default to emergency for SOS
      const triggerMethod = searchParams.triggerMethod;
      if (
        triggerMethod === "VOICE_COMMAND" ||
        triggerMethod === "TEXT_COMMAND"
      ) {
        setIncidentType("emergency");
      } else {
        setIncidentType("emergency");
      }

      // Set description if provided
      if (searchParams.details && typeof searchParams.details === "string") {
        setDescription(searchParams.details);
      }

      // Set location if provided
      if (searchParams.location && typeof searchParams.location === "string") {
        const [lat, lng] = searchParams.location.split(",");
        if (lat && lng) {
          setCurrentLocation({
            latitude: lat.trim(),
            longitude: lng.trim(),
          });
        }
      }

      // Set address if provided
      if (searchParams.address && typeof searchParams.address === "string") {
        setAddress(searchParams.address);
      } else if (searchParams.location) {
        setAddress("Emergency Alert Location");
      }

      // Set incident date and time from alert if provided
      if (
        searchParams.triggeredAt &&
        typeof searchParams.triggeredAt === "string"
      ) {
        const alertDate = new Date(searchParams.triggeredAt);
        setIncidentDate(alertDate.toISOString().split("T")[0]);
        setIncidentTime(alertDate.toTimeString().slice(0, 5));
      }

      // Add evidence file if provided (audio from SOS)
      if (searchParams.evidence && typeof searchParams.evidence === "string") {
        const evidenceFile: EvidenceFile = {
          uri: searchParams.evidence,
          cloudinaryUrl: searchParams.evidence,
          type: "audio",
          name: "Emergency Audio Recording",
        };
        setEvidenceFiles([evidenceFile]);
      }
    } else {
      getCurrentLocation();
    }
  }, [
    searchParams?.autoFill,
    searchParams?.incidentType,
    searchParams?.description,
    searchParams?.triggerMethod,
    searchParams?.location,
    searchParams?.address,
    searchParams?.triggeredAt,
    searchParams?.evidence,
    searchParams?.details,
    getCurrentLocation,
  ]);

  // Location selection modal handlers
  const handleLocationSelect = () => {
    setShowLocationModal(true);
  };

  const onLocationSelect = (location: SelectedLocation) => {
    setCurrentLocation({
      latitude: location.latitude.toString(),
      longitude: location.longitude.toString(),
    });
    setAddress(
      location.address ||
        `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`
    );
    setShowLocationModal(false);
  };

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!description.trim() || description.length < 10) {
      newErrors.description = "Description must be at least 10 characters long";
    }

    if (!currentLocation) {
      newErrors.location = "Location is required";
    }

    if (!incidentDate) {
      newErrors.incidentDate = "Incident date is required";
    }

    if (!incidentTime) {
      newErrors.incidentTime = "Incident time is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    if (!currentLocation) {
      showAlert("Error", "Location is required to submit a report", "error");
      return;
    }

    // Check if any evidence files are still uploading
    const uploadingFiles = evidenceFiles.filter((file) => file.uploading);
    if (uploadingFiles.length > 0) {
      showAlert(
        "Warning",
        "Please wait for all evidence files to finish uploading",
        "warning"
      );
      return;
    }

    setLoading(true);

    try {
      // Combine date and time into ISO string
      const incidentDateTime = new Date(
        `${incidentDate}T${incidentTime}`
      ).toISOString();

      // Get successfully uploaded evidence URLs
      const evidenceUrls = evidenceFiles
        .map((file) => file.cloudinaryUrl)
        .filter((url): url is string => !!url);

      const reportData: SubmitReportRequest = {
        incidentType,
        description: description.trim(),
        location: currentLocation,
        address: address.trim() || undefined,
        incidentTime: incidentDateTime,
        visibility,
        anonymous,
        involvedParties: involvedParties.trim() || undefined,
        evidence: evidenceUrls.length > 0 ? evidenceUrls : undefined, // Include evidence if available
      };

      const response = await apiService.submitReport(reportData);

      if (response.success) {
        showAlert(
          "Success",
          evidenceUrls.length > 0
            ? `Your incident report has been submitted with ${
                evidenceUrls.length
              } evidence file${evidenceUrls.length > 1 ? "s" : ""}.`
            : "Your incident report has been submitted successfully.",
          "success"
        );

        // Automatically navigate to reports page after successful submission
        router.replace("/(tabs)/reports" as any);
      } else {
        // Check for duplicate report error
        if (
          response.error &&
          response.error.includes("similar report already exists")
        ) {
          showAlert(
            "Similar Report Detected",
            "Our system detected a very similar report that was recently submitted. To proceed:\n\n• Wait 15 minutes before submitting again, or\n• Add more specific details to differentiate this incident",
            "warning"
          );
        } else {
          // Handle other errors - clean up newly uploaded files
          await cleanupNewEvidenceFiles();
          showAlert(
            "Error",
            response.error || "Failed to submit report",
            "error"
          );
        }
      }
    } catch (error: any) {
      console.error("Submit error:", error);

      // Clean up newly uploaded evidence files on error
      await cleanupNewEvidenceFiles();

      // Check if the error response contains a message about duplicate reports
      if (
        error?.response?.data?.error &&
        typeof error.response.data.error === "string" &&
        error.response.data.error.includes("similar report already exists")
      ) {
        showAlert(
          "Duplicate Report Detected",
          `${error.response.data.error}\n\nYou can:\n• Add more specific details to your description\n• Wait 15 minutes before submitting again\n• Change the incident type or location if this is a different incident`,
          "warning"
        );
      } else {
        // Show more specific error message if available
        const errorMessage =
          error?.response?.data?.error ||
          error?.message ||
          "An unexpected error occurred";

        // Show a more user-friendly message with possible solutions
        showAlert(
          "Error Submitting Report",
          `${errorMessage}\n\nPossible solutions:\n• Check your internet connection\n• Try again in a few moments\n• Verify all required fields are filled`,
          "error"
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCameraUpload = async () => {
    try {
      setShowImagePickerModal(false);
      setIsUploadingToCloud(true);
      showAlert("Info", "Opening camera...", "info");

      const result = await cloudinaryService.takeEvidencePhotoWithCamera();

      if (result && !result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        const fileType = determineFileType(asset.uri);

        const newFile: EvidenceFile = {
          uri: asset.uri,
          type: fileType,
          name: `Evidence_${Date.now()}.${
            asset.uri.split(".").pop()?.toLowerCase() || "jpg"
          }`,
          uploading: true,
        };

        setEvidenceFiles((prev) => [...prev, newFile]);

        console.log("📸 Starting camera evidence upload:", {
          uri: asset.uri.substring(0, 100),
          type: fileType,
          platform: Platform.OS,
          size: asset.fileSize || 'unknown'
        });

        // Upload to Cloudinary
        const uploadResult = await cloudinaryService.uploadEvidence(asset.uri);

        if (uploadResult.success && uploadResult.url) {
          console.log("✅ Camera evidence upload successful:", uploadResult.url);
          setEvidenceFiles((prev) =>
            prev.map((file) =>
              file.uri === asset.uri
                ? { ...file, cloudinaryUrl: uploadResult.url, uploading: false }
                : file
            )
          );
          showAlert(
            "Success",
            "Evidence uploaded to cloud storage successfully!",
            "success"
          );
        } else {
          console.error("❌ Camera evidence upload failed:", uploadResult.error);
          showAlert(
            "Error",
            uploadResult.error || "Failed to upload to cloud storage",
            "error"
          );
          // Remove the failed file
          setEvidenceFiles((prev) =>
            prev.filter((file) => file.uri !== asset.uri)
          );
        }
      } else {
        showAlert("Info", "Photo capture was cancelled", "info");
      }
    } catch (error) {
      console.error("Camera upload error:", error);
      showAlert("Error", "Failed to take photo. Please try again.", "error");
    } finally {
      setIsUploadingToCloud(false);
    }
  };

  const handleGalleryUpload = async () => {
    try {
      setShowImagePickerModal(false);
      setIsUploadingToCloud(true);
      showAlert("Info", "Opening gallery...", "info");

      const result = await cloudinaryService.pickMultipleFilesFromGallery();

      if (
        result &&
        !result.canceled &&
        result.assets &&
        result.assets.length > 0
      ) {
        const newFiles: EvidenceFile[] = result.assets.map((asset, index) => ({
          uri: asset.uri,
          type: determineFileType(asset.uri),
          name: `Evidence_${Date.now()}_${index + 1}.${
            asset.uri.split(".").pop()?.toLowerCase() || "jpg"
          }`,
          uploading: true,
        }));

        setEvidenceFiles((prev) => [...prev, ...newFiles]);

        // Upload all files to Cloudinary
        const uploadPromises = result.assets.map(async (asset, index) => {
          try {
            console.log(`🖼️ Starting gallery evidence upload ${index + 1}/${result.assets.length}:`, {
              uri: asset.uri.substring(0, 100),
              type: determineFileType(asset.uri),
              platform: Platform.OS,
              width: asset.width || 'unknown',
              height: asset.height || 'unknown',
              size: asset.fileSize || 'unknown'
            });

            const uploadResult = await cloudinaryService.uploadEvidence(
              asset.uri
            );

            if (uploadResult.success && uploadResult.url) {
              console.log(`✅ Gallery evidence upload ${index + 1} successful:`, uploadResult.url);
              setEvidenceFiles((prev) =>
                prev.map((file) =>
                  file.uri === asset.uri
                    ? {
                        ...file,
                        cloudinaryUrl: uploadResult.url,
                        uploading: false,
                      }
                    : file
                )
              );
              return { success: true, uri: asset.uri, url: uploadResult.url };
            } else {
              console.error(`❌ Gallery evidence upload ${index + 1} failed:`, uploadResult.error);
              // Remove failed file
              setEvidenceFiles((prev) =>
                prev.filter((file) => file.uri !== asset.uri)
              );
              return {
                success: false,
                uri: asset.uri,
                error: uploadResult.error,
              };
            }
          } catch (uploadError) {
            console.error(`💥 Gallery evidence upload ${index + 1} exception:`, uploadError);
            setEvidenceFiles((prev) =>
              prev.filter((file) => file.uri !== asset.uri)
            );
            return { success: false, uri: asset.uri, error: "Upload failed" };
          }
        });

        const results = await Promise.all(uploadPromises);
        const successful = results.filter((r) => r.success).length;
        const failed = results.filter((r) => !r.success).length;

        if (successful > 0) {
          showAlert(
            "Success",
            `${successful} file(s) uploaded successfully!`,
            "success"
          );
        }
        if (failed > 0) {
          showAlert("Warning", `${failed} file(s) failed to upload`, "warning");
        }
      } else {
        showAlert("Info", "File selection was cancelled", "info");
      }
    } catch (error) {
      console.error("Gallery upload error:", error);
      showAlert(
        "Error",
        "Failed to pick files from gallery. Please try again.",
        "error"
      );
    } finally {
      setIsUploadingToCloud(false);
    }
  };

  const handleAddEvidence = () => {
    setShowImagePickerModal(true);
  };

  const removeEvidenceFile = (index: number) => {
    const file = evidenceFiles[index];

    // Prevent deletion of SOS audio
    const isSOSEvidence =
      searchParams.autoFill === "true" &&
      (file.name.includes("Emergency Audio Recording") ||
        file.name.includes("SOS Audio Recording") ||
        file.cloudinaryUrl === searchParams.evidence ||
        searchParams.sosAudio === "true");

    if (isSOSEvidence) {
      showAlert(
        "Cannot Remove",
        "This is the original SOS audio recording and cannot be removed. You can add additional evidence files if needed.",
        "warning"
      );
      return;
    }

    showConfirmAlert(
      "Remove Evidence",
      "Are you sure you want to remove this evidence file?",
      () => {
        setEvidenceFiles((prev) => prev.filter((_, i) => i !== index));
        showAlert("Info", "Evidence file removed", "info");
      },
      undefined,
      "warning"
    );
  };

  const getFileIcon = (type: "image" | "video" | "audio" | "document") => {
    switch (type) {
      case "image":
        return "image";
      case "video":
        return "videocam";
      case "audio":
        return "audiotrack";
      case "document":
        return "description";
      default:
        return "attachment";
    }
  };

  const getFileIconColor = (type: "image" | "video" | "audio" | "document") => {
    switch (type) {
      case "image":
        return "#10B981";
      case "video":
        return "#3B82F6";
      case "audio":
        return "#8B5CF6";
      case "document":
        return "#F59E0B";
      default:
        return "#6B7280";
    }
  };

  const incidentTypes = [
    {
      value: "harassment",
      label: "Harassment",
      icon: "person-off",
      color: "#DC2626",
    },
    { value: "theft", label: "Theft", icon: "money-off", color: "#7C2D12" },
    { value: "assault", label: "Assault", icon: "pan-tool", color: "#B91C1C" },
    {
      value: "emergency",
      label: "Emergency",
      icon: "emergency",
      color: "#EF4444",
    },
    { value: "other", label: "Other", icon: "category", color: "#6B7280" },
  ] as const;

  const visibilityOptions = [
    {
      value: "public",
      label: "Public",
      description: "Visible to all users and officials",
    },
    {
      value: "officials_only",
      label: "Officials Only",
      description: "Visible to authorities only",
    },
    { value: "private", label: "Private", description: "Visible only to you" },
  ] as const;

  return (
    <View className="flex-1 bg-[#FFE4D6] max-w-screen-md mx-auto w-full">
      {/* Header */}
      <View className="bg-white px-4 pt-12 pb-4 shadow-sm">
        <View className="flex-row items-center justify-between">
          <TouchableOpacity
            onPress={() => {
              // Use handleCancel to clean up any newly uploaded evidence
              handleCancel();
            }}
          >
            <MaterialIcons name="arrow-back" size={24} color="#67082F" />
          </TouchableOpacity>
          <Text className="text-lg font-bold text-[#67082F]">
            Submit Report
          </Text>
          <View style={{ width: 24 }} />
        </View>
      </View>

      <ScrollView className="flex-1 p-4" showsVerticalScrollIndicator={false}>
        {/* SOS Report Banner */}
        {searchParams.autoFill === "true" && (
          <View className="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-lg p-4 mb-4">
            <View className="flex-row items-center mb-2">
              <MaterialIcons name="emergency" size={20} color="#DC2626" />
              <Text className="text-red-700 font-bold ml-2">
                SOS Report Pre-filled
              </Text>
            </View>
            <Text className="text-red-600 text-sm">
              This form has been pre-filled with information from your emergency
              alert. You can edit all fields except location and audio
              recording, which are protected for security purposes.
            </Text>
          </View>
        )}

        {/* Incident Type */}
        <View className="bg-white rounded-lg p-4 mb-4 shadow-sm">
          <Text className="text-base font-semibold text-gray-800 mb-3">
            Incident Type
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {incidentTypes.map((type) => (
              <TouchableOpacity
                key={type.value}
                className={`flex-row items-center px-4 py-3 rounded-xl border-2 ${
                  incidentType === type.value
                    ? "border-2"
                    : "bg-gray-50 border-gray-200"
                }`}
                style={
                  incidentType === type.value
                    ? {
                        backgroundColor: `${type.color}15`,
                        borderColor: type.color,
                      }
                    : {}
                }
                onPress={() => setIncidentType(type.value)}
                disabled={false}
              >
                <View
                  className="w-8 h-8 rounded-full items-center justify-center mr-3"
                  style={{
                    backgroundColor:
                      incidentType === type.value
                        ? type.color
                        : `${type.color}20`,
                  }}
                >
                  <MaterialIcons
                    name={type.icon as any}
                    size={18}
                    color={incidentType === type.value ? "white" : type.color}
                  />
                </View>
                <Text
                  className={`text-sm font-semibold ${
                    incidentType === type.value
                      ? "text-gray-800"
                      : "text-gray-600"
                  }`}
                  style={
                    incidentType === type.value ? { color: type.color } : {}
                  }
                >
                  {type.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Description */}
        <View className="bg-white rounded-lg p-4 mb-4 shadow-sm">
          <Text className="text-base font-semibold text-gray-800 mb-3">
            Description
          </Text>
          <TextInput
            className={`border border-gray-300 rounded-lg p-3 text-gray-800 min-h-24 ${
              errors.description ? "border-red-500" : ""
            }`}
            placeholder="Describe what happened... (minimum 10 characters)"
            value={description}
            onChangeText={setDescription}
            multiline
            textAlignVertical="top"
            editable={true}
          />
          {errors.description && (
            <Text className="text-red-500 text-sm mt-1">
              {errors.description}
            </Text>
          )}
          <Text className="text-gray-500 text-xs mt-2">
            {description.length}/2000 characters
          </Text>
        </View>

        {/* Location */}
        <View className="bg-white rounded-lg p-4 mb-4 shadow-sm">
          <View className="flex-row items-center mb-3">
            <Text className="text-base font-semibold text-gray-800">
              Location
            </Text>
            {searchParams.autoFill === "true" && (
              <View className="ml-2 bg-orange-100 px-2 py-1 rounded">
                <Text className="text-orange-700 text-xs font-medium">
                  Pre-filled from SOS
                </Text>
              </View>
            )}
          </View>

          <TouchableOpacity
            className={`flex-row items-center justify-between p-3 rounded-lg mb-3 ${
              searchParams.autoFill === "true"
                ? "bg-gray-200 opacity-60"
                : "bg-gray-100"
            }`}
            onPress={getCurrentLocation}
            disabled={gettingLocation || searchParams.autoFill === "true"}
          >
            <View className="flex-row items-center flex-1">
              <MaterialIcons
                name="my-location"
                size={20}
                color={
                  gettingLocation || searchParams.autoFill === "true"
                    ? "#9CA3AF"
                    : "#67082F"
                }
              />
              <Text
                className={`ml-2 text-sm ${
                  gettingLocation || searchParams.autoFill === "true"
                    ? "text-gray-500"
                    : "text-gray-800"
                }`}
              >
                {searchParams.autoFill === "true"
                  ? "Location set from emergency alert"
                  : gettingLocation
                  ? "Getting location..."
                  : "Use current location"}
              </Text>
            </View>
            {currentLocation && (
              <MaterialIcons name="check-circle" size={20} color="#10B981" />
            )}
          </TouchableOpacity>

          {/* Select from Map Button */}
          <TouchableOpacity
            className="flex-row items-center p-3 border border-[#67082F] rounded-lg mb-3 bg-[#67082F]/5"
            onPress={handleLocationSelect}
            disabled={searchParams.autoFill === "true"}
          >
            <MaterialIcons name="place" size={20} color="#67082F" />
            <Text className="ml-2 text-sm font-medium text-[#67082F]">
              Select location on map
            </Text>
            <MaterialIcons name="chevron-right" size={20} color="#67082F" />
          </TouchableOpacity>

          {currentLocation && (
            <View className="p-3 bg-green-50 rounded-lg">
              <Text className="text-sm text-green-700">
                📍 {currentLocation.latitude}, {currentLocation.longitude}
              </Text>
            </View>
          )}

          {errors.location && (
            <Text className="text-red-500 text-sm mt-1">{errors.location}</Text>
          )}
        </View>

        {/* Address */}
        <View className="bg-white rounded-lg p-4 mb-4 shadow-sm">
          <View className="flex-row items-center mb-3">
            <Text className="text-base font-semibold text-gray-800">
              Address (Optional)
            </Text>
            {searchParams.autoFill === "true" && (
              <View className="ml-2 bg-orange-100 px-2 py-1 rounded">
                <Text className="text-orange-700 text-xs font-medium">
                  Pre-filled from SOS
                </Text>
              </View>
            )}
          </View>
          <TextInput
            className={`border rounded-lg p-3 ${
              searchParams.autoFill === "true"
                ? "border-gray-200 bg-gray-100 text-gray-600"
                : "border-gray-300 text-gray-800"
            }`}
            placeholder={
              searchParams.autoFill === "true"
                ? "Address set from emergency alert"
                : "Enter specific address or landmark"
            }
            value={address}
            onChangeText={
              searchParams.autoFill === "true" ? undefined : setAddress
            }
            editable={searchParams.autoFill !== "true"}
          />
          {searchParams.autoFill === "true" && (
            <Text className="text-xs text-gray-500 mt-2">
              📍 Address cannot be modified for emergency reports
            </Text>
          )}
        </View>

        {/* Incident Time */}
        <View className="bg-white rounded-lg p-4 mb-4 shadow-sm">
          <Text className="text-base font-semibold text-gray-800 mb-3">
            When did this happen?
          </Text>

          <View className="flex-row space-x-3">
            <View className="flex-1">
              {searchParams.autoFill === "true" ? (
                <View>
                  <Text className="text-sm font-medium text-gray-700 mb-2">
                    Date <Text className="text-red-500">*</Text>
                  </Text>
                  <View className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-100 flex-row items-center justify-between">
                    <Text className="flex-1 text-gray-600">
                      {incidentDate
                        ? new Date(incidentDate).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })
                        : "Select date"}
                    </Text>
                    <MaterialIcons
                      name="calendar-today"
                      size={20}
                      color="#9CA3AF"
                    />
                  </View>
                  <Text className="text-xs text-gray-500 mt-2">
                    Date cannot be modified for emergency reports
                  </Text>
                  {errors.incidentDate && (
                    <Text className="text-red-500 text-xs mt-1">
                      {errors.incidentDate}
                    </Text>
                  )}
                </View>
              ) : (
                <>
                  <DatePicker
                    label="Date"
                    value={incidentDate}
                    onDateChange={setIncidentDate}
                    required={true}
                    placeholder="Select date"
                    allowFutureDates={false}
                  />
                  {errors.incidentDate && (
                    <Text className="text-red-500 text-xs mt-1">
                      {errors.incidentDate}
                    </Text>
                  )}
                </>
              )}
            </View>

            <View className="flex-1">
              <Text className="text-sm text-gray-600 mb-2">Time</Text>
              <TextInput
                className={`border border-gray-300 rounded-lg p-3 text-gray-800 ${
                  errors.incidentTime ? "border-red-500" : ""
                } ${
                  searchParams.autoFill === "true"
                    ? "bg-gray-100 text-gray-600"
                    : ""
                }`}
                placeholder="HH:MM"
                value={incidentTime}
                onChangeText={
                  searchParams.autoFill === "true" ? undefined : setIncidentTime
                }
                placeholderTextColor="#9CA3AF"
                editable={searchParams.autoFill !== "true"}
              />
              {searchParams.autoFill === "true" && (
                <Text className="text-xs text-gray-500 mt-2">
                  Time cannot be modified for emergency reports
                </Text>
              )}
              {errors.incidentTime && (
                <Text className="text-red-500 text-xs mt-1">
                  {errors.incidentTime}
                </Text>
              )}
            </View>
          </View>
        </View>

        {/* Visibility */}
        <View className="bg-white rounded-lg p-4 mb-4 shadow-sm">
          <Text className="text-base font-semibold text-gray-800 mb-3">
            Who can see this report?
          </Text>
          {visibilityOptions.map((option) => (
            <TouchableOpacity
              key={option.value}
              className={`flex-row items-center p-3 rounded-lg mb-2 border ${
                visibility === option.value
                  ? "bg-[#67082F]/10 border-[#67082F]"
                  : "bg-gray-50 border-gray-200"
              }`}
              onPress={() => setVisibility(option.value)}
            >
              <View
                className={`w-5 h-5 rounded-full border-2 mr-3 ${
                  visibility === option.value
                    ? "border-[#67082F] bg-[#67082F]"
                    : "border-gray-400"
                }`}
              >
                {visibility === option.value && (
                  <View className="flex-1 items-center justify-center">
                    <View className="w-2 h-2 rounded-full bg-white" />
                  </View>
                )}
              </View>
              <View className="flex-1">
                <Text
                  className={`text-sm font-medium ${
                    visibility === option.value
                      ? "text-[#67082F]"
                      : "text-gray-800"
                  }`}
                >
                  {option.label}
                </Text>
                <Text className="text-xs text-gray-500">
                  {option.description}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Anonymous Option */}
        <View className="bg-white rounded-lg p-4 mb-4 shadow-sm">
          <TouchableOpacity
            className="flex-row items-center justify-between"
            onPress={() => setAnonymous(!anonymous)}
          >
            <View className="flex-1">
              <Text className="text-base font-semibold text-gray-800">
                Submit Anonymously
              </Text>
              <Text className="text-sm text-gray-600 mt-1">
                Your identity will be hidden in the report
              </Text>
            </View>
            <View
              className={`w-12 h-6 rounded-full ${
                anonymous ? "bg-[#67082F]" : "bg-gray-300"
              }`}
            >
              <View
                className={`w-5 h-5 rounded-full bg-white mt-0.5 transition-all ${
                  anonymous ? "ml-6" : "ml-0.5"
                }`}
              />
            </View>
          </TouchableOpacity>
        </View>

        {/* Involved Parties */}
        <View className="bg-white rounded-lg p-4 mb-4 shadow-sm">
          <Text className="text-base font-semibold text-gray-800 mb-3">
            Involved Parties (Optional)
          </Text>
          <TextInput
            className="border border-gray-300 rounded-lg p-3 text-gray-800 min-h-20"
            placeholder="Describe suspects, witnesses, or other involved parties..."
            value={involvedParties}
            onChangeText={setInvolvedParties}
            multiline
            textAlignVertical="top"
          />
        </View>

        {/* Evidence Upload Section */}
        <View className="bg-white rounded-lg p-4 mb-4 shadow-sm">
          <Text className="text-base font-semibold text-gray-800 mb-3">
            Evidence (Optional)
          </Text>

          <TouchableOpacity
            className="border-2 border-dashed border-gray-300 rounded-lg p-6 items-center mb-4"
            onPress={handleAddEvidence}
            disabled={isUploadingToCloud}
          >
            <MaterialIcons
              name="add-photo-alternate"
              size={48}
              color={isUploadingToCloud ? "#9CA3AF" : "#67082F"}
            />
            <Text
              className={`text-center mt-2 ${
                isUploadingToCloud ? "text-gray-400" : "text-gray-700"
              }`}
            >
              {isUploadingToCloud
                ? "Uploading..."
                : "Tap to add photos, videos or documents"}
            </Text>
            <Text className="text-gray-400 text-sm text-center mt-1">
              Camera, Gallery, or Files
            </Text>
          </TouchableOpacity>

          {evidenceFiles.length > 0 && (
            <View>
              <Text className="text-sm font-medium text-gray-700 mb-2">
                {evidenceFiles.length} file(s) selected
              </Text>
              {evidenceFiles.map((file, index) => {
                const isSOSEvidence =
                  searchParams.autoFill === "true" &&
                  (file.name.includes("Emergency Audio Recording") ||
                    file.name.includes("SOS Audio Recording") ||
                    file.cloudinaryUrl === searchParams.evidence ||
                    searchParams.sosAudio === "true");

                return (
                  <View
                    key={index}
                    className={`flex-row items-center justify-between p-3 rounded-lg mb-2 ${
                      isSOSEvidence
                        ? "bg-orange-50 border border-orange-200"
                        : "bg-gray-50"
                    }`}
                  >
                    <View className="flex-row items-center flex-1">
                      {file.type === "image" && file.uri ? (
                        <Image
                          source={{ uri: file.uri }}
                          className="w-10 h-10 rounded"
                          resizeMode="cover"
                        />
                      ) : (
                        <MaterialIcons
                          name={getFileIcon(file.type) as any}
                          size={20}
                          color={getFileIconColor(file.type)}
                        />
                      )}
                      <View className="ml-3 flex-1">
                        <View className="flex-row items-center">
                          <Text
                            className="text-gray-700 font-medium flex-1"
                            numberOfLines={1}
                          >
                            {file.name}
                          </Text>
                          {isSOSEvidence && (
                            <View className="bg-orange-100 px-2 py-1 rounded ml-2">
                              <Text className="text-orange-700 text-xs font-medium">
                                SOS
                              </Text>
                            </View>
                          )}
                        </View>
                        <Text className="text-gray-500 text-xs capitalize">
                          {file.type} •{" "}
                          {file.uploading
                            ? "Uploading..."
                            : file.cloudinaryUrl
                            ? "Uploaded"
                            : "Ready"}
                          {isSOSEvidence && " • Protected"}
                        </Text>
                      </View>
                    </View>

                    <View className="flex-row items-center">
                      {file.uploading && (
                        <ActivityIndicator
                          size="small"
                          color="#67082F"
                          className="mr-2"
                        />
                      )}
                      {file.cloudinaryUrl && !file.uploading && (
                        <MaterialIcons
                          name="cloud-done"
                          size={20}
                          color="#10B981"
                          className="mr-2"
                        />
                      )}
                      <TouchableOpacity
                        onPress={() => removeEvidenceFile(index)}
                        disabled={file.uploading || isSOSEvidence}
                      >
                        <MaterialIcons
                          name={isSOSEvidence ? "lock" : "close"}
                          size={20}
                          color={
                            file.uploading || isSOSEvidence
                              ? "#9CA3AF"
                              : "#EF4444"
                          }
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          {/* Evidence Guidelines */}
          <View className="bg-blue-50 rounded-lg p-3 mt-3 border border-blue-200">
            <View className="flex-row items-center mb-2">
              <MaterialIcons name="info" size={16} color="#3B82F6" />
              <Text className="text-blue-700 font-medium ml-2 text-sm">
                Evidence Guidelines
              </Text>
            </View>
            <Text className="text-blue-600 text-xs leading-relaxed">
              • Photos should be clear and show relevant details{"\n"}• Videos
              should be under 50MB{"\n"}• Evidence will be securely stored and
              shared only with authorized personnel
            </Text>
          </View>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          className={`bg-[#67082F] rounded-lg p-4 mb-8 ${
            loading || isUploadingToCloud ? "opacity-50" : ""
          }`}
          onPress={handleSubmit}
          disabled={loading || isUploadingToCloud}
        >
          {loading ? (
            <View className="flex-row items-center justify-center">
              <ActivityIndicator size="small" color="white" />
              <Text className="text-white text-center font-semibold text-base ml-2">
                Submitting...
              </Text>
            </View>
          ) : (
            <Text className="text-white text-center font-semibold text-base">
              Submit Report
              {evidenceFiles.length > 0 &&
                ` (${evidenceFiles.length} evidence file${
                  evidenceFiles.length > 1 ? "s" : ""
                })`}
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Image Picker Modal */}
      <Modal
        visible={showImagePickerModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowImagePickerModal(false)}
      >
        <View className="flex-1 bg-black/50 items-center justify-center p-4">
          <View className="bg-white rounded-lg p-6 w-full max-w-sm">
            <Text className="text-lg font-bold text-gray-800 mb-4 text-center">
              Select Evidence Source
            </Text>

            <TouchableOpacity
              className="flex-row items-center p-4 bg-gray-50 rounded-lg mb-3"
              onPress={handleCameraUpload}
            >
              <MaterialIcons name="camera-alt" size={24} color="#67082F" />
              <View className="ml-3 flex-1">
                <Text className="text-gray-800 font-medium">Camera</Text>
                <Text className="text-gray-500 text-sm">
                  Take a photo or video
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-row items-center p-4 bg-gray-50 rounded-lg mb-4"
              onPress={handleGalleryUpload}
            >
              <MaterialIcons name="photo-library" size={24} color="#67082F" />
              <View className="ml-3 flex-1">
                <Text className="text-gray-800 font-medium">Gallery</Text>
                <Text className="text-gray-500 text-sm">
                  Choose from gallery
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              className="p-3 bg-gray-200 rounded-lg"
              onPress={() => setShowImagePickerModal(false)}
            >
              <Text className="text-gray-700 text-center font-medium">
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Upload Loading Overlay */}
      {isUploadingToCloud && (
        <Modal visible={true} transparent={true} animationType="fade">
          <View className="flex-1 bg-black/70 items-center justify-center">
            <View className="bg-white rounded-lg p-6 items-center min-w-48">
              <ActivityIndicator size="large" color="#67082F" />
              <Text className="text-gray-800 font-medium mt-4">
                Uploading to Cloud
              </Text>
              <Text className="text-gray-500 text-sm text-center mt-2">
                Please wait while we securely upload your evidence...
              </Text>
            </View>
          </View>
        </Modal>
      )}

      {/* Location Selection Modal */}
      <LocationSelectionModal
        visible={showLocationModal}
        onClose={() => setShowLocationModal(false)}
        onLocationSelect={onLocationSelect}
        initialLocation={
          currentLocation
            ? {
                latitude: parseFloat(currentLocation.latitude),
                longitude: parseFloat(currentLocation.longitude),
                address: address,
                name: "Incident Location",
              }
            : undefined
        }
        title="Select Incident Location"
        confirmButtonText="Confirm Location"
        enableSearch={true}
        showCurrentLocationButton={true}
      />
    </View>
  );
}
