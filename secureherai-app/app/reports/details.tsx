import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  ActivityIndicator,
  Image,
  Dimensions,
  Linking,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import {
  Video,
  ResizeMode,
  AVPlaybackStatus,
  VideoFullscreenUpdateEvent,
  VideoFullscreenUpdate,
} from "expo-av";
import { router, useLocalSearchParams } from "expo-router";
import { useAuth } from "../../context/AuthContext";
import { useAlert } from "../../context/AlertContext";
import apiService from "../../services/api";
import cloudinaryService from "../../services/cloudinary";
import { ReportDetails, UpdateReportRequest } from "../../types/report";
import {
  getIncidentTypeColor,
  getIncidentTypeIcon,
  getStatusColor,
} from "../../utils/incidentHelpers";
import LocationSelectionModal, {
  SelectedLocation,
} from "../../components/LocationSelectionModal";

export default function ReportDetailsScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { showAlert, showConfirmAlert } = useAlert();
  const [report, setReport] = useState<ReportDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingField, setEditingField] = useState<string>("");
  const [editValue, setEditValue] = useState("");
  const [showEvidenceModal, setShowEvidenceModal] = useState(false);
  const [selectedEvidenceIndex, setSelectedEvidenceIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [playbackProgress, setPlaybackProgress] = useState(0);
  const [playbackDuration, setPlaybackDuration] = useState(0);
  const [hasMediaError, setHasMediaError] = useState(false);
  const [isDeletingEvidence, setIsDeletingEvidence] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showIncidentTypeModal, setShowIncidentTypeModal] = useState(false);
  const videoRef = useRef<Video>(null);

  // Extract ID from params, handle both single string and array cases
  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  // Debug log the ID parameter
  console.log("Report Details Screen - Raw params:", params);
  console.log("Report Details Screen - Extracted ID:", id);
  console.log("Report Details Screen - ID type:", typeof id);

  useEffect(() => {
    if (id && id.trim()) {
      loadReportDetails();
    } else {
      console.error("No valid ID provided to ReportDetailsScreen");
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadReportDetails = async () => {
    if (!id || !id.trim()) {
      console.error("No report ID provided");
      showAlert("Error", "No report ID provided", "error", [
        { text: "OK", onPress: () => router.back() },
      ]);
      return;
    }

    console.log("Loading report details for ID:", id);

    try {
      const response = await apiService.getReportDetails(id.trim());
      console.log("Report details response:", response);

      if (response.success && response.report) {
        setReport(response.report);
        console.log("Report loaded successfully");
      } else {
        console.error("Failed to load report:", response.error);
        showAlert(
          "Error",
          response.error || "Failed to load report details",
          "error",
          [{ text: "OK", onPress: () => router.back() }]
        );
      }
    } catch (error) {
      console.error("Load report details error:", error);

      // Check if it's a network error
      if (
        error instanceof TypeError &&
        error.message.includes("Network request failed")
      ) {
        showAlert(
          "Error",
          "Network connection failed. Please check your internet connection.",
          "error",
          [
            { text: "Retry", onPress: () => loadReportDetails() },
            { text: "Go Back", onPress: () => router.back() },
          ]
        );
      } else {
        showAlert(
          "Error",
          "An unexpected error occurred while loading the report",
          "error",
          [
            { text: "Retry", onPress: () => loadReportDetails() },
            { text: "Go Back", onPress: () => router.back() },
          ]
        );
      }
    } finally {
      setLoading(false);
    }
  };

  // Check if current user can edit this report
  const canEditReport = (): boolean => {
    if (!report || !user) return false;

    // For now, we'll determine ownership by checking if the report is accessible
    // In the future, the API should include ownership information
    // User can edit if they are a responder
    if (user.role === "RESPONDER") return true;

    // For USER role, we need to assume they can only edit their own reports
    // Since the report details are accessible, we assume they own it if they're a USER
    if (user.role === "USER" && report.userId === user.userId) return true;

    return false;
  };

  const handleEdit = (field: string, currentValue: string) => {
    if (field === "incidentTime") {
      // For now, treat as text input - could be enhanced with date picker later
      setEditingField(field);
      setEditValue(currentValue);
      setShowEditModal(true);
    } else if (field === "location") {
      // Show location coordinates as "latitude,longitude"
      const locationValue = `${report?.location.latitude || ""},${
        report?.location.longitude || ""
      }`;
      setEditingField(field);
      setEditValue(locationValue);
      setShowEditModal(true);
    } else {
      setEditingField(field);
      setEditValue(currentValue);
      setShowEditModal(true);
    }
  };

  const handleLocationEdit = () => {
    if (!canEditReport()) return;
    setShowLocationModal(true);
  };

  const handleIncidentTypeEdit = () => {
    if (!canEditReport()) return;
    setShowIncidentTypeModal(true);
  };

  const handleLocationSelect = async (location: SelectedLocation) => {
    if (!report) return;

    try {
      const updateData: UpdateReportRequest = {
        reportId: report.reportId,
        location: {
          latitude: location.latitude.toString(),
          longitude: location.longitude.toString(),
        },
        address: location.address || location.name,
      };

      const response = await apiService.updateReport(updateData);
      if (response.success) {
        setReport({
          ...report,
          location: {
            latitude: location.latitude,
            longitude: location.longitude,
          },
          address: location.address || location.name || "",
        });
        setShowLocationModal(false);
        showAlert("Success", "Location updated successfully", "success");
      } else {
        showAlert(
          "Error",
          response.error || "Failed to update location",
          "error"
        );
      }
    } catch (error) {
      console.error("Update location error:", error);
      showAlert("Error", "An unexpected error occurred", "error");
    }
  };

  const handleIncidentTypeUpdate = async (
    newIncidentType: "harassment" | "theft" | "assault" | "emergency" | "other"
  ) => {
    if (!report) return;

    try {
      const updateData: UpdateReportRequest = {
        reportId: report.reportId,
        incidentType: newIncidentType,
      };

      const response = await apiService.updateReport(updateData);
      if (response.success) {
        setReport({
          ...report,
          incidentType: newIncidentType,
        });
        setShowIncidentTypeModal(false);
        showAlert("Success", "Incident type updated successfully", "success");
      } else {
        showAlert(
          "Error",
          response.error || "Failed to update incident type",
          "error"
        );
      }
    } catch (error) {
      console.error("Update incident type error:", error);
      showAlert("Error", "An unexpected error occurred", "error");
    }
  };

  const handleSaveEdit = async () => {
    if (!report || !editingField || !editValue.trim()) return;

    try {
      let updateData: UpdateReportRequest = {
        reportId: report.reportId,
      };

      // Handle different field types
      if (editingField === "address") {
        updateData.address = editValue.trim();
      } else if (editingField === "incidentTime") {
        updateData.incidentTime = editValue.trim();
      } else if (editingField === "location") {
        // Parse "latitude,longitude" format
        const [lat, lng] = editValue.trim().split(",");
        if (lat && lng) {
          updateData.location = {
            latitude: lat.trim(),
            longitude: lng.trim(),
          };
        } else {
          showAlert(
            "Error",
            "Please enter location in format: latitude,longitude",
            "error"
          );
          return;
        }
      } else if (editingField === "description") {
        updateData.description = editValue.trim();
      } else if (editingField === "actionTaken") {
        updateData.actionTaken = editValue.trim();
      } else if (editingField === "involvedParties") {
        updateData.involvedParties = editValue.trim();
      }

      const response = await apiService.updateReport(updateData);
      if (response.success) {
        // Update local state
        if (editingField === "address") {
          setReport({
            ...report,
            address: editValue.trim(),
          });
        } else if (editingField === "incidentTime") {
          setReport({
            ...report,
            incidentTime: editValue.trim(),
          });
        } else if (editingField === "location") {
          const [lat, lng] = editValue.trim().split(",");
          setReport({
            ...report,
            location: {
              ...report.location,
              latitude: parseFloat(lat.trim()),
              longitude: parseFloat(lng.trim()),
            },
          });
        } else if (editingField === "description") {
          setReport({
            ...report,
            description: editValue.trim(),
          });
        } else if (editingField === "actionTaken") {
          setReport({
            ...report,
            actionTaken: editValue.trim(),
          });
        } else if (editingField === "involvedParties") {
          setReport({
            ...report,
            involvedParties: editValue.trim(),
          });
        }
        setShowEditModal(false);
        showAlert("Success", "Report updated successfully", "success");
      } else {
        showAlert(
          "Error",
          response.error || "Failed to update report",
          "error"
        );
      }
    } catch (error) {
      console.error("Update report error:", error);
      showAlert("Error", "An unexpected error occurred", "error");
    }
  };

  const handleChangeVisibility = (
    newVisibility: "public" | "officials_only" | "private"
  ) => {
    showConfirmAlert(
      "Change Visibility",
      `Are you sure you want to change visibility to ${newVisibility.replace(
        "_",
        " "
      )}?`,
      async () => {
        if (!report) return;

        try {
          const updateData: UpdateReportRequest = {
            reportId: report.reportId,
            visibility: newVisibility,
          };

          const response = await apiService.updateReport(updateData);
          if (response.success) {
            setReport({ ...report, visibility: newVisibility });
            showAlert("Success", "Visibility updated successfully", "success");
          } else {
            showAlert(
              "Error",
              response.error || "Failed to update visibility",
              "error"
            );
          }
        } catch (error) {
          console.error("Update visibility error:", error);
          showAlert("Error", "An unexpected error occurred", "error");
        }
      },
      undefined,
      "warning"
    );
  };

  const handleDeleteReport = async () => {
    if (!report) return;

    console.log("🗑️ Delete button pressed!");
    console.log("🗑️ Delete button clicked for report:", report.reportId);

    console.log("🗑️ Showing custom confirmation alert...");
    showConfirmAlert(
      "Delete Report",
      "Are you sure you want to delete this report? This action cannot be undone.",
      async () => {
        console.log("🗑️ User confirmed deletion");
        try {
          const response = await apiService.deleteReport(report.reportId);
          if (response.success) {
            showAlert("Success", "Report deleted successfully", "success", [
              { text: "OK", onPress: () => router.back() },
            ]);
          } else {
            showAlert(
              "Error",
              response.error || "Failed to delete report",
              "error"
            );
          }
        } catch (error) {
          console.error("Delete report error:", error);
          showAlert("Error", "An unexpected error occurred", "error");
        }
      },
      () => {
        console.log("🗑️ User cancelled deletion");
      },
      "error"
    );
  };

  const handleChangeStatus = (
    newStatus: "submitted" | "under_review" | "resolved"
  ) => {
    showConfirmAlert(
      "Change Report Status",
      `Are you sure you want to change the status to "${newStatus.replace(
        "_",
        " "
      )}"?`,
      async () => {
        if (!report) return;

        try {
          const updateData: UpdateReportRequest = {
            reportId: report.reportId,
            status: newStatus,
          };

          const response = await apiService.updateReport(updateData);
          if (response.success) {
            setReport({ ...report, status: newStatus });
            showAlert(
              "Success",
              "Report status updated successfully",
              "success"
            );
          } else {
            showAlert(
              "Error",
              response.error || "Failed to update status",
              "error"
            );
          }
        } catch (error) {
          console.error("Update status error:", error);
          showAlert("Error", "An unexpected error occurred", "error");
        }
      },
      undefined,
      "warning"
    );
  };

  const handleDeleteEvidence = async () => {
    if (!report || !report.evidence || !report.evidence[selectedEvidenceIndex])
      return;

    const evidenceUrl = report.evidence[selectedEvidenceIndex];

    showConfirmAlert(
      "Delete Evidence",
      "Are you sure you want to delete this evidence? This action cannot be undone.",
      async () => {
        setIsDeletingEvidence(true);

        try {
          console.log(
            "🗑️ Starting evidence deletion process for URL:",
            evidenceUrl
          );

          // First, try to delete from Cloudinary
          console.log("🗑️ Step 1: Deleting from Cloudinary...");
          const cloudinaryResult = await cloudinaryService.deleteFileByUrl(
            evidenceUrl
          );

          if (cloudinaryResult.success) {
            console.log("✅ Successfully deleted from Cloudinary");
          } else {
            console.warn(
              "⚠️ Failed to delete from Cloudinary:",
              cloudinaryResult.error
            );
            // Continue with database deletion even if Cloudinary deletion fails
            // This prevents orphaned database records
          }

          // Then delete from database
          console.log("🗑️ Step 2: Deleting from database...");
          const response = await apiService.deleteEvidence(
            report.reportId,
            evidenceUrl
          );

          if (response.success) {
            console.log("✅ Successfully deleted from database");

            // Remove evidence from local state
            const updatedEvidence = report.evidence.filter(
              (_, index) => index !== selectedEvidenceIndex
            );
            setReport({
              ...report,
              evidence: updatedEvidence,
            });

            // Close modal if no more evidence
            if (updatedEvidence.length === 0) {
              setShowEvidenceModal(false);
            } else {
              // Adjust selected index if necessary
              if (selectedEvidenceIndex >= updatedEvidence.length) {
                setSelectedEvidenceIndex(updatedEvidence.length - 1);
              }
            }

            // Show success message
            const message = cloudinaryResult.success
              ? "Evidence deleted successfully from both storage and database"
              : "Evidence deleted from database (Cloudinary deletion failed)";

            showAlert("Success", message, "success");
          } else {
            console.error("❌ Failed to delete from database:", response.error);
            showAlert(
              "Error",
              response.error || "Failed to delete evidence from database",
              "error"
            );
          }
        } catch (error) {
          console.error("❌ Delete evidence error:", error);
          showAlert(
            "Error",
            "An unexpected error occurred during deletion",
            "error"
          );
        } finally {
          setIsDeletingEvidence(false);
        }
      },
      undefined,
      "error"
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const visibilityOptions = [
    { value: "public", label: "Public", icon: "public" },
    {
      value: "officials_only",
      label: "Officials Only",
      icon: "admin-panel-settings",
    },
    { value: "private", label: "Private", icon: "lock" },
  ] as const;

  const getFileTypeFromUrl = (url: string) => {
    // First check file extension - this is more reliable than URL path for determining actual file type
    const extension = url.split(".").pop()?.toLowerCase();
    if (extension) {
      // Audio files first (to prevent mp4 audio from being detected as video)
      if (["mp3", "wav", "ogg", "aac", "m4a", "flac"].includes(extension)) {
        return "audio";
      }
      // Image files
      else if (
        ["jpg", "jpeg", "png", "gif", "bmp", "webp", "svg"].includes(extension)
      ) {
        return "image";
      }
      // Video files
      else if (
        ["mp4", "avi", "mov", "wmv", "flv", "webm", "mkv", "3gp"].includes(
          extension
        )
      ) {
        return "video";
      }
      // Document files
      else if (
        [
          "pdf",
          "doc",
          "docx",
          "txt",
          "rtf",
          "xls",
          "xlsx",
          "ppt",
          "pptx",
        ].includes(extension)
      ) {
        return "document";
      }
    }

    // Fallback to URL path detection if extension is not recognized
    const lowercaseUrl = url.toLowerCase();
    if (lowercaseUrl.includes("/audio/") || lowercaseUrl.includes("_audio_")) {
      return "audio";
    } else if (
      lowercaseUrl.includes("/image/") ||
      lowercaseUrl.includes("_image_")
    ) {
      return "image";
    } else if (
      lowercaseUrl.includes("/video/") ||
      lowercaseUrl.includes("_video_")
    ) {
      return "video";
    } else if (
      lowercaseUrl.includes("/document/") ||
      lowercaseUrl.includes("_doc_") ||
      lowercaseUrl.includes("_document_")
    ) {
      return "document";
    }

    // Default to document if no type can be determined
    return "document";
  };

  const getFileIcon = (fileType: string) => {
    switch (fileType) {
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

  const getFileIconColor = (fileType: string) => {
    switch (fileType) {
      case "image":
        return "#10B981";
      case "video":
        return "#3B82F6";
      case "audio":
        return "#8B5CF6";
      case "document":
        return "#6B7280";
      default:
        return "#6B7280";
    }
  };

  const handlePlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    // Reset error state if media is loaded successfully
    if (status.isLoaded && hasMediaError) {
      setHasMediaError(false);
    }

    // Handle errors
    if (!status.isLoaded && status.error) {
      console.error("Media playback error:", status.error);
      setHasMediaError(true);
      setIsPlaying(false);
      showAlert(
        "Error",
        "Failed to load media. Please try opening in browser instead.",
        "error"
      );
      return;
    }

    setIsPlaying(status.isLoaded && status.isPlaying);

    if (status.isLoaded) {
      // Update duration when available
      if (status.durationMillis) {
        setPlaybackDuration(status.durationMillis / 1000); // Convert to seconds
      }

      // Update progress
      if (status.positionMillis) {
        setPlaybackProgress(status.positionMillis / 1000); // Convert to seconds
      }
    }
  };

  const togglePlayPause = async () => {
    if (videoRef.current) {
      if (isPlaying) {
        await videoRef.current.pauseAsync();
      } else {
        await videoRef.current.playAsync();
      }
    }
  };

  const toggleFullscreen = async () => {
    if (videoRef.current) {
      if (isFullscreen) {
        await videoRef.current.dismissFullscreenPlayer();
      } else {
        await videoRef.current.presentFullscreenPlayer();
      }
      setIsFullscreen(!isFullscreen);
    }
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds < 10 ? "0" : ""}${remainingSeconds}`;
  };

  const retryMediaLoad = async () => {
    setHasMediaError(false);

    // Small delay before retry
    await new Promise((resolve) => setTimeout(resolve, 500));

    if (
      videoRef.current &&
      report?.evidence &&
      report.evidence[selectedEvidenceIndex]
    ) {
      try {
        // Reload the video
        await videoRef.current.loadAsync(
          { uri: report.evidence[selectedEvidenceIndex] },
          { shouldPlay: false }
        );
        showAlert("Info", "Retrying media playback...", "info");
      } catch (error) {
        console.error("Error reloading media:", error);
        setHasMediaError(true);
        showAlert(
          "Error",
          "Failed to reload media. Please try opening in browser.",
          "error"
        );
      }
    }
  };

  if (loading) {
    return (
      <View className="flex-1 bg-gray-50 justify-center items-center">
        <Text className="text-gray-500">Loading report details...</Text>
      </View>
    );
  }

  if (!report) {
    return (
      <View className="flex-1 bg-gray-50 justify-center items-center">
        <Text className="text-gray-500">Report not found</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#FFE4D6] max-w-screen-md mx-auto w-full">
      {/* Header */}
      <View className="bg-white px-4 pt-12 pb-4 shadow-sm">
        <View className="flex-row items-center justify-between">
          <TouchableOpacity
            onPress={() => {
              // Check if we can go back, otherwise navigate to reports screen
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace("/(tabs)/reports");
              }
            }}
          >
            <MaterialIcons name="arrow-back" size={24} color="#67082F" />
          </TouchableOpacity>
          <Text className="text-lg font-bold text-[#67082F]">
            Report Details
          </Text>
          <View style={{ width: 24 }} />
        </View>
      </View>

      <ScrollView className="flex-1 p-4" showsVerticalScrollIndicator={false}>
        {/* Status and Basic Info */}
        <View className="bg-white rounded-lg p-4 mb-4 shadow-sm">
          <View className="flex-row justify-between items-center mb-3">
            <View className="flex-row items-center flex-1">
              <View
                className="w-12 h-12 rounded-full items-center justify-center mr-3 shadow-sm"
                style={{
                  backgroundColor: `${getIncidentTypeColor(
                    report.incidentType
                  )}15`,
                }}
              >
                <MaterialIcons
                  name={getIncidentTypeIcon(report.incidentType) as any}
                  size={24}
                  color={getIncidentTypeColor(report.incidentType)}
                />
              </View>
              <Text className="text-xl font-bold text-gray-800 capitalize flex-1">
                {report.incidentType}
              </Text>
              {canEditReport() && (
                <TouchableOpacity
                  onPress={handleIncidentTypeEdit}
                  className="ml-2 p-2"
                >
                  <MaterialIcons name="edit" size={20} color="#67082F" />
                </TouchableOpacity>
              )}
            </View>
            <View
              className="px-3 py-1 rounded-full"
              style={{ backgroundColor: `${getStatusColor(report.status)}20` }}
            >
              <Text
                className="text-sm font-medium capitalize"
                style={{ color: getStatusColor(report.status) }}
              >
                {report.status.replace("_", " ")}
              </Text>
            </View>
          </View>

          <Text className="text-gray-600 text-xs mb-2">
            Report ID: {report.reportId}
          </Text>

          {report.alertId && (
            <Text className="text-gray-600 text-xs mb-2">
              Alert ID: {report.alertId}
            </Text>
          )}

          <View className="flex-row items-center">
            <MaterialIcons name="schedule" size={16} color="#6B7280" />
            <Text className="text-gray-600 text-sm ml-1">
              Incident: {formatDate(report.incidentTime)}
            </Text>
          </View>
        </View>

        {/* Description */}
        <View className="bg-white rounded-lg p-4 mb-4 shadow-sm">
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-base font-semibold text-gray-800">
              Description
            </Text>
            {canEditReport() && (
              <TouchableOpacity
                onPress={() => handleEdit("description", report.description)}
              >
                <MaterialIcons name="edit" size={20} color="#67082F" />
              </TouchableOpacity>
            )}
          </View>
          <Text className="text-gray-700 leading-relaxed">
            {report.description}
          </Text>
        </View>

        {/* Location */}
        <View className="bg-white rounded-lg p-4 mb-4 shadow-sm">
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-base font-semibold text-gray-800">
              Location
            </Text>
            {canEditReport() && (
              <TouchableOpacity onPress={handleLocationEdit}>
                <MaterialIcons name="edit" size={20} color="#67082F" />
              </TouchableOpacity>
            )}
          </View>
          <View className="flex-row items-start">
            <MaterialIcons name="location-on" size={20} color="#67082F" />
            <View className="ml-2 flex-1">
              {report.address && (
                <Text className="text-gray-700 font-medium mb-1">
                  {report.address}
                </Text>
              )}
              <Text className="text-gray-600 text-sm">
                {report.location.latitude}, {report.location.longitude}
              </Text>
            </View>
          </View>
        </View>

        {/* Visibility Settings */}
        <View className="bg-white rounded-lg p-4 mb-4 shadow-sm">
          <Text className="text-base font-semibold text-gray-800 mb-3">
            Visibility
          </Text>
          <View className="space-y-2">
            {visibilityOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                className={`flex-row items-center p-3 rounded-lg ${
                  report.visibility === option.value
                    ? "bg-[#67082F]/10 border border-[#67082F]"
                    : "bg-gray-50 border border-transparent"
                }`}
                onPress={() => {
                  if (report.visibility !== option.value) {
                    handleChangeVisibility(option.value);
                  }
                }}
              >
                <MaterialIcons
                  name={option.icon as any}
                  size={20}
                  color={
                    report.visibility === option.value ? "#67082F" : "#6B7280"
                  }
                />
                <Text
                  className={`ml-3 text-sm font-medium ${
                    report.visibility === option.value
                      ? "text-[#67082F]"
                      : "text-gray-700"
                  }`}
                >
                  {option.label}
                </Text>
                {report.visibility === option.value && (
                  <MaterialIcons
                    name="check"
                    size={16}
                    color="#67082F"
                    style={{ marginLeft: "auto" }}
                  />
                )}
              </TouchableOpacity>
            ))}
          </View>

          {report.anonymous && (
            <View className="mt-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
              <View className="flex-row items-center">
                <MaterialIcons
                  name="visibility-off"
                  size={16}
                  color="#F59E0B"
                />
                <Text className="text-yellow-700 text-sm font-medium ml-2">
                  Anonymous Report
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Action Taken */}
        {report.actionTaken && (
          <View className="bg-white rounded-lg p-4 mb-4 shadow-sm">
            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-base font-semibold text-gray-800">
                Action Taken
              </Text>
              {canEditReport() && (
                <TouchableOpacity
                  onPress={() =>
                    handleEdit("actionTaken", report.actionTaken || "")
                  }
                >
                  <MaterialIcons name="edit" size={20} color="#67082F" />
                </TouchableOpacity>
              )}
            </View>
            <Text className="text-gray-700">{report.actionTaken}</Text>
          </View>
        )}

        {/* Involved Parties */}
        {report.involvedParties && (
          <View className="bg-white rounded-lg p-4 mb-4 shadow-sm">
            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-base font-semibold text-gray-800">
                Involved Parties
              </Text>
              {canEditReport() && (
                <TouchableOpacity
                  onPress={() =>
                    handleEdit("involvedParties", report.involvedParties || "")
                  }
                >
                  <MaterialIcons name="edit" size={20} color="#67082F" />
                </TouchableOpacity>
              )}
            </View>
            <Text className="text-gray-700">{report.involvedParties}</Text>
          </View>
        )}

        {/* Evidence */}
        <View className="bg-white rounded-lg p-4 mb-4 shadow-sm">
          <View className="flex-row items-center mb-3">
            <Text className="text-base font-semibold text-gray-800">
              Evidence
            </Text>
            {report.evidence && report.evidence.length > 0 && (
              <View className="ml-2 px-2 py-0.5 rounded-full bg-[#67082F]/10">
                <Text className="text-xs font-medium text-[#67082F]">
                  {report.evidence.length}
                </Text>
              </View>
            )}
          </View>

          {report.evidence && report.evidence.length > 0 ? (
            <View className="space-y-2">
              {report.evidence.map((evidenceUrl, index) => {
                const fileType = getFileTypeFromUrl(evidenceUrl);
                return (
                  <TouchableOpacity
                    key={index}
                    className="flex-row items-center p-3 bg-gray-50 rounded-lg"
                    onPress={() => {
                      setSelectedEvidenceIndex(index);
                      setShowEvidenceModal(true);
                    }}
                  >
                    <View
                      className="w-10 h-10 rounded-lg items-center justify-center mr-3"
                      style={{
                        backgroundColor: `${getFileIconColor(fileType)}15`,
                      }}
                    >
                      <MaterialIcons
                        name={getFileIcon(fileType) as any}
                        size={24}
                        color={getFileIconColor(fileType)}
                      />
                    </View>
                    <View className="flex-1">
                      <Text className="text-gray-800 font-medium">
                        Evidence #{index + 1}
                      </Text>
                      <Text className="text-gray-500 text-xs capitalize">
                        {fileType} •{" "}
                        {new Date(report.updatedAt).toLocaleDateString()}
                      </Text>
                    </View>
                    <MaterialIcons
                      name="visibility"
                      size={20}
                      color="#67082F"
                    />
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : (
            <View className="p-4 bg-gray-50 rounded-lg items-center">
              <MaterialIcons
                name="add-photo-alternate"
                size={40}
                color="#9CA3AF"
              />
              <Text className="text-gray-600 text-center mt-2">
                No evidence attached
              </Text>
              <Text className="text-gray-500 text-sm text-center mt-1">
                Add photos, videos or documents as evidence
              </Text>
              <TouchableOpacity
                className="mt-4 bg-[#67082F] rounded-lg px-4 py-2"
                onPress={() =>
                  router.push(
                    `/reports/evidence?reportId=${report.reportId}` as any
                  )
                }
              >
                <Text className="text-white font-medium">Upload Evidence</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Timestamps */}
        <View className="bg-white rounded-lg p-4 mb-4 shadow-sm">
          <Text className="text-base font-semibold text-gray-800 mb-3">
            Timeline
          </Text>
          <View className="space-y-2">
            <View className="flex-row items-center">
              <MaterialIcons name="schedule" size={16} color="#6B7280" />
              <Text className="text-gray-600 text-sm ml-2">
                Submitted: {formatDate(report.createdAt)}
              </Text>
            </View>
            <View className="flex-row items-center">
              <MaterialIcons name="update" size={16} color="#6B7280" />
              <Text className="text-gray-600 text-sm ml-2">
                Last updated: {formatDate(report.updatedAt)}
              </Text>
            </View>
          </View>
        </View>

        {/* Actions */}
        <View className="bg-white rounded-lg p-4 mb-8 shadow-sm">
          <Text className="text-base font-semibold text-gray-800 mb-3">
            Actions
          </Text>

          <TouchableOpacity
            className="flex-row items-center p-3 bg-[#67082F] rounded-lg mb-3"
            onPress={() =>
              router.push(
                `/reports/evidence?reportId=${report.reportId}` as any
              )
            }
          >
            <MaterialIcons name="cloud-upload" size={20} color="white" />
            <Text className="text-white font-medium ml-2">
              {report.evidence && report.evidence.length > 0
                ? "Add More Evidence"
                : "Upload Evidence"}
            </Text>
            <MaterialIcons
              name="arrow-forward"
              size={16}
              color="white"
              style={{ marginLeft: "auto" }}
            />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Edit Modal */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowEditModal(false)}
      >
        <View className="flex-1 bg-white">
          <View className="px-4 pt-12 pb-4 border-b border-gray-200">
            <View className="flex-row items-center justify-between">
              <TouchableOpacity onPress={() => setShowEditModal(false)}>
                <Text className="text-[#67082F] text-base">Cancel</Text>
              </TouchableOpacity>
              <Text className="text-lg font-semibold">Edit {editingField}</Text>
              <TouchableOpacity onPress={handleSaveEdit}>
                <Text className="text-[#67082F] text-base font-semibold">
                  Save
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View className="flex-1 p-4">
            <TextInput
              className="border border-gray-300 rounded-lg p-3 text-gray-800 min-h-32"
              placeholder={`Enter ${editingField}...`}
              value={editValue}
              onChangeText={setEditValue}
              multiline
              textAlignVertical="top"
              autoFocus
            />
          </View>
        </View>
      </Modal>

      {/* Evidence Viewing Modal */}
      <Modal
        visible={showEvidenceModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowEvidenceModal(false)}
      >
        <View className="flex-1 bg-black/90">
          {/* Header */}
          <View className="flex-row items-center justify-between p-4 pt-12">
            <Text className="text-white font-bold text-lg">
              Evidence #{selectedEvidenceIndex + 1}
            </Text>
            <View className="flex-row items-center space-x-4">
              <TouchableOpacity
                onPress={handleDeleteEvidence}
                disabled={isDeletingEvidence}
                className="p-2 rounded-full bg-red-600/20"
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                {isDeletingEvidence ? (
                  <ActivityIndicator size="small" color="#DC2626" />
                ) : (
                  <MaterialIcons name="delete" size={24} color="#DC2626" />
                )}
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setShowEvidenceModal(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <MaterialIcons name="close" size={28} color="white" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Content Container - Centered */}
          <View className="flex-1 justify-center items-center px-4">
            {report &&
              report.evidence &&
              report.evidence[selectedEvidenceIndex] && (
                <>
                  {getFileTypeFromUrl(
                    report.evidence[selectedEvidenceIndex]
                  ) === "image" ? (
                    <View
                      className="bg-gray-800 rounded-lg p-4 items-center justify-center"
                      style={{
                        width: Dimensions.get("window").width * 0.9,
                        height: Dimensions.get("window").height * 0.6,
                        maxWidth: 500,
                        maxHeight: 500,
                      }}
                    >
                      <Image
                        source={{ uri: report.evidence[selectedEvidenceIndex] }}
                        style={{
                          width: "100%",
                          height: "100%",
                          maxWidth: "100%",
                          maxHeight: "100%",
                        }}
                        resizeMode="contain"
                      />
                    </View>
                  ) : getFileTypeFromUrl(
                      report.evidence[selectedEvidenceIndex]
                    ) === "video" ? (
                    <View className="items-center">
                      <View
                        className="bg-gray-800 rounded-lg p-4 items-center justify-center"
                        style={{
                          width: Dimensions.get("window").width * 0.9,
                          height: Dimensions.get("window").height * 0.7,
                          maxWidth: 500,
                          maxHeight: 500,
                        }}
                      >
                        {/* Video playback with expo-av */}
                        {hasMediaError ? (
                          <View className="items-center justify-center py-8 px-4">
                            <MaterialIcons
                              name="error-outline"
                              size={60}
                              color="#EF4444"
                            />
                            <Text className="text-white text-center mt-4">
                              Unable to load video. Please try again or open in
                              browser.
                            </Text>
                            <View className="flex-row mt-4 space-x-3">
                              <TouchableOpacity
                                className="bg-[#10B981] px-4 py-2 rounded-lg flex-row items-center"
                                onPress={retryMediaLoad}
                              >
                                <MaterialIcons
                                  name="refresh"
                                  size={20}
                                  color="white"
                                  style={{ marginRight: 4 }}
                                />
                                <Text className="text-white font-medium">
                                  Retry
                                </Text>
                              </TouchableOpacity>
                              <TouchableOpacity
                                className="bg-[#3B82F6] px-4 py-2 rounded-lg flex-row items-center"
                                onPress={() =>
                                  Linking.openURL(
                                    report.evidence[selectedEvidenceIndex]
                                  )
                                }
                              >
                                <MaterialIcons
                                  name="open-in-browser"
                                  size={20}
                                  color="white"
                                  style={{ marginRight: 4 }}
                                />
                                <Text className="text-white font-medium">
                                  Open in Browser
                                </Text>
                              </TouchableOpacity>
                            </View>
                          </View>
                        ) : (
                          <Video
                            ref={videoRef}
                            source={{
                              uri: report.evidence[selectedEvidenceIndex],
                            }}
                            style={{
                              width: "100%",
                              height: "85%",
                              maxWidth: "100%",
                              maxHeight: "85%",
                            }}
                            useNativeControls
                            resizeMode={ResizeMode.CONTAIN}
                            isLooping={false}
                            onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
                            onFullscreenUpdate={(
                              event: VideoFullscreenUpdateEvent
                            ) => {
                              // Update fullscreen state when user uses native controls
                              if (
                                event.fullscreenUpdate ===
                                VideoFullscreenUpdate.PLAYER_DID_PRESENT
                              ) {
                                setIsFullscreen(true);
                              } else if (
                                event.fullscreenUpdate ===
                                VideoFullscreenUpdate.PLAYER_DID_DISMISS
                              ) {
                                setIsFullscreen(false);
                              }
                            }}
                          />
                        )}

                        {/* Playback time and progress */}
                        {!hasMediaError && (
                          <View className="w-full px-2 mt-2">
                            <View className="flex-row justify-between">
                              <Text className="text-white text-xs">
                                {formatTime(playbackProgress)}
                              </Text>
                              <Text className="text-white text-xs">
                                {formatTime(playbackDuration)}
                              </Text>
                            </View>
                          </View>
                        )}

                        {/* Control buttons */}
                        {!hasMediaError && (
                          <View className="flex-row items-center justify-between w-full mt-3">
                            <TouchableOpacity
                              className="bg-[#3B82F6] px-4 py-2 rounded-lg flex-row items-center"
                              onPress={togglePlayPause}
                            >
                              <MaterialIcons
                                name={isPlaying ? "pause" : "play-arrow"}
                                size={20}
                                color="white"
                                style={{ marginRight: 4 }}
                              />
                              <Text className="text-white font-medium">
                                {isPlaying ? "Pause" : "Play"}
                              </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                              className="bg-[#3B82F6] px-4 py-2 rounded-lg flex-row items-center"
                              onPress={toggleFullscreen}
                            >
                              <MaterialIcons
                                name={
                                  isFullscreen
                                    ? "fullscreen-exit"
                                    : "fullscreen"
                                }
                                size={20}
                                color="white"
                                style={{ marginRight: 4 }}
                              />
                              <Text className="text-white font-medium">
                                {isFullscreen ? "Exit" : "Fullscreen"}
                              </Text>
                            </TouchableOpacity>
                          </View>
                        )}

                        <TouchableOpacity
                          className="mt-4 bg-[#3B82F6] px-4 py-2 rounded-lg flex-row items-center"
                          onPress={() =>
                            Linking.openURL(
                              report.evidence[selectedEvidenceIndex]
                            )
                          }
                        >
                          <MaterialIcons
                            name="open-in-browser"
                            size={20}
                            color="white"
                            style={{ marginRight: 4 }}
                          />
                          <Text className="text-white font-medium">
                            Open in Browser
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ) : getFileTypeFromUrl(
                      report.evidence[selectedEvidenceIndex]
                    ) === "audio" ? (
                    <View className="items-center">
                      <View
                        className="bg-gray-800 rounded-lg p-8 items-center justify-center"
                        style={{
                          width: Dimensions.get("window").width * 0.9,
                          height: Dimensions.get("window").height * 0.5,
                          maxWidth: 400,
                          maxHeight: 300,
                        }}
                      >
                        {/* Audio visualization icon */}
                        {hasMediaError ? (
                          <View className="items-center justify-center py-4">
                            <MaterialIcons
                              name="error-outline"
                              size={60}
                              color="#EF4444"
                            />
                            <Text className="text-white text-center mt-4">
                              Unable to load audio. Please try again or open in
                              browser.
                            </Text>
                            <View className="flex-row mt-4 space-x-3">
                              <TouchableOpacity
                                className="bg-[#10B981] px-4 py-2 rounded-lg flex-row items-center"
                                onPress={retryMediaLoad}
                              >
                                <MaterialIcons
                                  name="refresh"
                                  size={20}
                                  color="white"
                                  style={{ marginRight: 4 }}
                                />
                                <Text className="text-white font-medium">
                                  Retry
                                </Text>
                              </TouchableOpacity>
                              <TouchableOpacity
                                className="bg-[#6366F1] px-4 py-2 rounded-lg flex-row items-center"
                                onPress={() =>
                                  Linking.openURL(
                                    report.evidence[selectedEvidenceIndex]
                                  )
                                }
                              >
                                <MaterialIcons
                                  name="open-in-browser"
                                  size={20}
                                  color="white"
                                  style={{ marginRight: 4 }}
                                />
                                <Text className="text-white font-medium">
                                  Open in Browser
                                </Text>
                              </TouchableOpacity>
                            </View>
                          </View>
                        ) : (
                          <View className="items-center w-full">
                            <View className="mb-4">
                              <MaterialIcons
                                name={isPlaying ? "graphic-eq" : "audiotrack"}
                                size={60}
                                color="#F59E0B"
                              />
                            </View>

                            {/* Audio player */}
                            <Video
                              ref={videoRef}
                              source={{
                                uri: report.evidence[selectedEvidenceIndex],
                              }}
                              style={{
                                height: 50,
                                width: "90%",
                                maxWidth: 300,
                              }}
                              useNativeControls
                              resizeMode={ResizeMode.CONTAIN}
                              isLooping={false}
                              onPlaybackStatusUpdate={
                                handlePlaybackStatusUpdate
                              }
                            />
                          </View>
                        )}

                        {/* Playback time and progress */}
                        {!hasMediaError && (
                          <View className="w-full mt-3">
                            <View className="flex-row justify-between">
                              <Text className="text-white text-xs">
                                {formatTime(playbackProgress)}
                              </Text>
                              <Text className="text-white text-xs">
                                {formatTime(playbackDuration)}
                              </Text>
                            </View>
                          </View>
                        )}

                        {/* Control buttons */}
                        {!hasMediaError && (
                          <TouchableOpacity
                            className="mt-6 bg-[#F59E0B] px-6 py-3 rounded-lg flex-row items-center"
                            onPress={togglePlayPause}
                          >
                            <MaterialIcons
                              name={isPlaying ? "pause" : "play-arrow"}
                              size={24}
                              color="white"
                              style={{ marginRight: 6 }}
                            />
                            <Text className="text-white font-bold">
                              {isPlaying ? "Pause" : "Play"}
                            </Text>
                          </TouchableOpacity>
                        )}

                        <TouchableOpacity
                          className="mt-4 bg-[#6366F1] px-4 py-2 rounded-lg flex-row items-center"
                          onPress={() =>
                            Linking.openURL(
                              report.evidence[selectedEvidenceIndex]
                            )
                          }
                        >
                          <MaterialIcons
                            name="open-in-browser"
                            size={20}
                            color="white"
                            style={{ marginRight: 4 }}
                          />
                          <Text className="text-white font-medium">
                            Open in Browser
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ) : (
                    <View className="items-center">
                      <View
                        className="bg-gray-800 rounded-lg p-8 items-center justify-center"
                        style={{
                          width: Dimensions.get("window").width * 0.9,
                          height: Dimensions.get("window").height * 0.5,
                          maxWidth: 400,
                          maxHeight: 300,
                        }}
                      >
                        <MaterialIcons
                          name={
                            getFileIcon(
                              getFileTypeFromUrl(
                                report.evidence[selectedEvidenceIndex]
                              )
                            ) as any
                          }
                          size={60}
                          color={getFileIconColor(
                            getFileTypeFromUrl(
                              report.evidence[selectedEvidenceIndex]
                            )
                          )}
                        />
                        <Text className="text-white mt-4 text-center font-medium">
                          This file type cannot be previewed directly.
                        </Text>
                        <Text className="text-white/70 text-sm mt-1 text-center">
                          {report.evidence[selectedEvidenceIndex]
                            .split("/")
                            .pop()}
                        </Text>
                        <TouchableOpacity
                          className="mt-6 bg-[#67082F] px-6 py-3 rounded-lg flex-row items-center"
                          onPress={() =>
                            Linking.openURL(
                              report.evidence[selectedEvidenceIndex]
                            )
                          }
                        >
                          <MaterialIcons
                            name="open-in-browser"
                            size={24}
                            color="white"
                            style={{ marginRight: 8 }}
                          />
                          <Text className="text-white font-bold">
                            Open File
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                </>
              )}

            <View className="flex-row justify-between items-center p-4">
              <TouchableOpacity
                className="bg-gray-800 p-3 rounded-full"
                disabled={selectedEvidenceIndex === 0}
                onPress={() =>
                  selectedEvidenceIndex > 0 &&
                  setSelectedEvidenceIndex(selectedEvidenceIndex - 1)
                }
                style={{ opacity: selectedEvidenceIndex === 0 ? 0.5 : 1 }}
              >
                <MaterialIcons name="arrow-back" size={24} color="white" />
              </TouchableOpacity>

              <View className="bg-gray-800/80 px-4 py-2 rounded-full">
                <Text className="text-white font-medium">
                  {selectedEvidenceIndex + 1} of {report?.evidence.length}
                </Text>
              </View>

              <TouchableOpacity
                className="bg-gray-800 p-3 rounded-full"
                disabled={
                  !report?.evidence ||
                  selectedEvidenceIndex >= report.evidence.length - 1
                }
                onPress={() =>
                  report?.evidence &&
                  selectedEvidenceIndex < report.evidence.length - 1 &&
                  setSelectedEvidenceIndex(selectedEvidenceIndex + 1)
                }
                style={{
                  opacity:
                    !report?.evidence ||
                    selectedEvidenceIndex >= report.evidence.length - 1
                      ? 0.5
                      : 1,
                }}
              >
                <MaterialIcons name="arrow-forward" size={24} color="white" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Incident Type Selection Modal */}
      <Modal
        visible={showIncidentTypeModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowIncidentTypeModal(false)}
      >
        <View className="flex-1 bg-black/50 justify-center items-center">
          <View className="bg-white rounded-lg p-6 m-4 w-11/12 max-w-md">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-lg font-bold text-[#67082F]">
                Update Incident Type
              </Text>
              <TouchableOpacity
                onPress={() => setShowIncidentTypeModal(false)}
                className="p-1 rounded-full"
              >
                <MaterialIcons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <Text className="text-gray-600 text-sm mb-4">
              Select the correct incident type for this report:
            </Text>

            <View className="space-y-3">
              {[
                {
                  value: "harassment",
                  label: "Harassment",
                  icon: "person-off",
                  color: "#DC2626",
                },
                {
                  value: "theft",
                  label: "Theft",
                  icon: "money-off",
                  color: "#7C2D12",
                },
                {
                  value: "assault",
                  label: "Assault",
                  icon: "pan-tool",
                  color: "#B91C1C",
                },
                {
                  value: "emergency",
                  label: "Emergency",
                  icon: "emergency",
                  color: "#EF4444",
                },
                {
                  value: "other",
                  label: "Other",
                  icon: "category",
                  color: "#6B7280",
                },
              ].map((type) => (
                <TouchableOpacity
                  key={type.value}
                  className={`flex-row items-center p-3 rounded-lg border-2 ${
                    report?.incidentType === type.value
                      ? "border-2"
                      : "bg-gray-50 border-gray-200"
                  }`}
                  style={
                    report?.incidentType === type.value
                      ? {
                          backgroundColor: `${type.color}15`,
                          borderColor: type.color,
                        }
                      : {}
                  }
                  onPress={() =>
                    handleIncidentTypeUpdate(
                      type.value as
                        | "harassment"
                        | "theft"
                        | "assault"
                        | "emergency"
                        | "other"
                    )
                  }
                >
                  <View
                    className="w-10 h-10 rounded-full items-center justify-center mr-3"
                    style={{
                      backgroundColor:
                        report?.incidentType === type.value
                          ? type.color
                          : `${type.color}20`,
                    }}
                  >
                    <MaterialIcons
                      name={type.icon as any}
                      size={20}
                      color={
                        report?.incidentType === type.value
                          ? "white"
                          : type.color
                      }
                    />
                  </View>
                  <Text
                    className={`text-base font-semibold ${
                      report?.incidentType === type.value
                        ? "text-gray-800"
                        : "text-gray-600"
                    }`}
                    style={
                      report?.incidentType === type.value
                        ? { color: type.color }
                        : {}
                    }
                  >
                    {type.label}
                  </Text>
                  {report?.incidentType === type.value && (
                    <View className="ml-auto">
                      <MaterialIcons
                        name="check-circle"
                        size={20}
                        color={type.color}
                      />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>

      {/* Location Selection Modal */}
      <LocationSelectionModal
        visible={showLocationModal}
        onClose={() => setShowLocationModal(false)}
        onLocationSelect={handleLocationSelect}
        initialLocation={
          report
            ? {
                latitude: report.location.latitude,
                longitude: report.location.longitude,
                address: report.address,
              }
            : undefined
        }
        title="Update Report Location"
        confirmButtonText="Update Location"
        showCurrentLocationButton={true}
        enableSearch={true}
      />
    </View>
  );
}
