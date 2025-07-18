import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAudioRecording } from "../hooks/useAudioRecording";

interface AudioRecorderProps {
  onRecordingComplete?: (audioUrl: string) => void;
  onLocalRecordingComplete?: (localUri: string) => void;
  onError?: (error: string) => void;
  maxDuration?: number;
  disabled?: boolean;
  style?: any;
  autoUpload?: boolean; // New prop to control auto-upload behavior
}

export default function AudioRecorder({
  onRecordingComplete,
  onLocalRecordingComplete,
  onError,
  maxDuration = 10,
  disabled = false,
  style,
  autoUpload = true, // Default to true for backward compatibility
}: AudioRecorderProps) {
  const {
    isRecording,
    isProcessing,
    recordingDuration,
    recordingUri,
    hasPermission,
    startRecording,
    stopRecording,
    uploadRecording,
    requestPermissions,
    resetRecording,
    formatDuration,
  } = useAudioRecording({
    maxDuration,
    autoUpload,
    onProgress: (duration) => {
      // Progress updates are handled by the hook's internal state
    },
    onComplete: (result) => {
      if (autoUpload) {
        // Original behavior: auto-upload and return cloud URL
        if (result.success && result.url) {
          onRecordingComplete?.(result.url);
        } else {
          onError?.(result.error || "Upload failed");
        }
      } else {
        // New behavior: just return local URI
        if (result.success && result.localUri) {
          onLocalRecordingComplete?.(result.localUri);
        } else {
          onError?.(result.error || "Recording failed");
        }
      }
    },
    onError: (error) => {
      onError?.(error);
    },
  });

  const handleRecordPress = async () => {
    if (disabled) return;

    if (!hasPermission) {
      const granted = await requestPermissions();
      if (!granted) {
        Alert.alert(
          "Permission Required",
          "Microphone permission is required to record audio. Please enable it in your device settings.",
          [{ text: "OK" }]
        );
        return;
      }
    }

    if (isRecording) {
      await stopRecording();
    } else {
      resetRecording();
      await startRecording();
    }
  };

  const handleUploadPress = async () => {
    if (!recordingUri) {
      onError?.("No recording to upload");
      return;
    }

    const result = await uploadRecording();
    if (!result?.success) {
      Alert.alert(
        "Upload Failed",
        result?.error || "Failed to upload recording. Please try again.",
        [{ text: "OK" }]
      );
    }
  };

  const handleRetryPress = () => {
    resetRecording();
  };

  const getRecordButtonColor = () => {
    if (disabled) return "#ccc";
    if (isRecording) return "#ff4444";
    if (recordingUri) return "#4CAF50";
    return "#007AFF";
  };

  const getRecordButtonIcon = () => {
    if (isProcessing) return "ellipsis-horizontal";
    if (isRecording) return "stop";
    if (recordingUri) return "checkmark";
    return "mic";
  };

  const getStatusText = () => {
    if (isProcessing) return "Processing...";
    if (isRecording) return `Recording: ${formatDuration(recordingDuration)}`;
    if (recordingUri) return `Recorded: ${formatDuration(recordingDuration)}`;
    return "Tap to record";
  };

  const showUploadButton = autoUpload && recordingUri && !isProcessing;
  const showRetryButton = recordingUri && !isProcessing;

  return (
    <View style={[styles.container, style]}>
      {/* Status Text */}
      <Text style={styles.statusText}>{getStatusText()}</Text>

      {/* Duration Display */}
      {(isRecording || recordingUri) && (
        <View style={styles.durationContainer}>
          <Text style={styles.durationText}>
            {formatDuration(recordingDuration)} / {formatDuration(maxDuration)}
          </Text>
          {isRecording && <View style={styles.recordingIndicator} />}
        </View>
      )}

      {/* Control Buttons */}
      <View style={styles.buttonContainer}>
        {/* Record/Stop Button */}
        <TouchableOpacity
          style={[
            styles.recordButton,
            { backgroundColor: getRecordButtonColor() },
            disabled && styles.disabledButton,
          ]}
          onPress={handleRecordPress}
          disabled={disabled || isProcessing}
          activeOpacity={0.7}
        >
          <Ionicons name={getRecordButtonIcon()} size={30} color="white" />
        </TouchableOpacity>

        {/* Upload Button */}
        {showUploadButton && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleUploadPress}
            activeOpacity={0.7}
          >
            <Ionicons name="cloud-upload" size={20} color="#007AFF" />
            <Text style={styles.actionButtonText}>Upload</Text>
          </TouchableOpacity>
        )}

        {/* Retry Button */}
        {showRetryButton && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleRetryPress}
            activeOpacity={0.7}
          >
            <Ionicons name="refresh" size={20} color="#FF9500" />
            <Text style={styles.actionButtonText}>Retry</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Permission Warning */}
      {!hasPermission && (
        <View style={styles.permissionWarning}>
          <Ionicons name="warning" size={16} color="#FF9500" />
          <Text style={styles.permissionWarningText}>
            Microphone permission required
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    padding: 20,
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  statusText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#212529",
    marginBottom: 10,
    textAlign: "center",
  },
  durationContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  durationText: {
    fontSize: 14,
    color: "#6c757d",
    marginRight: 8,
  },
  recordingIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#ff4444",
    opacity: 0.8,
  },
  buttonContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 15,
  },
  recordButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  disabledButton: {
    opacity: 0.5,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingVertical: 8,
    backgroundColor: "#f8f9fa",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#dee2e6",
    gap: 5,
  },
  actionButtonText: {
    fontSize: 14,
    color: "#007AFF",
    fontWeight: "500",
  },
  permissionWarning: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#fff3cd",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#ffeaa7",
    gap: 5,
  },
  permissionWarningText: {
    fontSize: 12,
    color: "#856404",
  },
});
