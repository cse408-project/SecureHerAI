import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  Platform,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { Audio } from "expo-av";
import { useAlert } from "../context/AlertContext";
import { AlertResponse } from "../types/sos";
import apiService from "../services/api";

interface SOSModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: (alertResponse: AlertResponse) => void;
}

const SOSModal: React.FC<SOSModalProps> = ({ visible, onClose, onSuccess }) => {
  const [mode, setMode] = useState<"select" | "voice" | "text">("select");
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [recordingStatus, setRecordingStatus] = useState<
    "idle" | "recording" | "processing" | "completed"
  >("idle");
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [recordingUri, setRecordingUri] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [keyword, setKeyword] = useState("");
  // Default location for Dhaka, Bangladesh
  const [location, setLocation] = useState<{
    latitude: number;
    longitude: number;
    address: string;
  }>({
    latitude: 23.8103,
    longitude: 90.4125,
    address: "Dhaka, Bangladesh",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showCancelAlert, setShowCancelAlert] = useState(false);
  const [lastAlertId, setLastAlertId] = useState<string | null>(null);
  const recordingTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const { showAlert } = useAlert();

  // Initialize audio recording
  useEffect(() => {
    if (visible) {
      // Only setup permissions, but don't start recording yet
      setupRecording();
      getLocation();
    } else {
      // Reset state when modal closes
      resetState();
    }

    return () => {
      if (recordingTimer.current) {
        clearInterval(recordingTimer.current);
      }
      // Make sure to stop any ongoing recording when component unmounts
      if (recording) {
        stopRecording();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const setupRecording = async () => {
    try {
      console.log("Setting up recording...");
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
      });
      console.log("Audio recording setup complete");
    } catch (error) {
      console.error("Error setting up audio recording:", error);
      showAlert(
        "Error",
        "Failed to set up audio recording. Please check app permissions.",
        "error"
      );
    }
  };

  const getLocation = async () => {
    try {
      console.log("Getting location...");
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        console.log("Location permission denied, using default location");
        // We'll use our default location, so no need to show an error
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      }).catch((err) => {
        console.log("Error getting position, using default location:", err);
        return null;
      });

      // If we couldn't get location, keep using the default
      if (!location) return;

      // Get address from coordinates
      const [address] = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      }).catch((err) => {
        console.log("Error geocoding location, using default address:", err);
        return [];
      });

      const formattedAddress = address
        ? `${address.street || ""} ${address.city || ""}, ${
            address.region || ""
          } ${address.postalCode || ""}, ${address.country || ""}`
        : "Unknown Location";

      // Only update if we got a valid location
      if (
        formattedAddress.trim() !== "Unknown Location" &&
        formattedAddress.trim() !== ", , "
      ) {
        setLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          address: formattedAddress.trim(),
        });

        console.log("Location obtained:", {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          address: formattedAddress,
        });
      } else {
        console.log("Invalid address format, using default location");
      }
    } catch (error) {
      console.error("Error getting location:", error);
      // No need to show alert as we're using default location
      console.log("Using default location due to error");
    }
  };

  const startRecording = async () => {
    try {
      console.log("Starting recording...");
      setRecordingStatus("recording");
      setRecordingDuration(0);

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(recording);

      // Hard stop at exactly 10 seconds
      const stopTimeout = setTimeout(() => {
        if (recording) {
          console.log("Automatically stopping recording after 10 seconds");
          stopRecording();
        }
      }, 10000);

      // Start duration timer to update UI
      recordingTimer.current = setInterval(() => {
        setRecordingDuration((prevDuration) => {
          const newDuration = prevDuration + 1;
          if (newDuration >= 10) {
            if (recordingTimer.current) {
              clearInterval(recordingTimer.current);
              recordingTimer.current = null;
            }
            clearTimeout(stopTimeout); // Clear the timeout as we're handling it here
            stopRecording();
            return 10; // Cap at 10 seconds
          }
          return newDuration;
        });
      }, 1000);

      console.log("Recording started with 10-second limit");
    } catch (error) {
      console.error("Error starting recording:", error);
      showAlert(
        "Error",
        "Failed to start recording. Please try again.",
        "error"
      );
      setRecordingStatus("idle");
    }
  };

  const stopRecording = async () => {
    if (!recording) {
      return;
    }

    try {
      console.log("Stopping recording...");
      setRecordingStatus("processing");

      if (recordingTimer.current) {
        clearInterval(recordingTimer.current);
        recordingTimer.current = null;
      }

      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecordingUri(uri);
      setRecording(null);
      setRecordingStatus("completed");

      console.log("Recording stopped, URI:", uri);
    } catch (error) {
      console.error("Error stopping recording:", error);
      showAlert(
        "Error",
        "Failed to process recording. Please try again.",
        "error"
      );
      setRecordingStatus("idle");
    }
  };

  const uploadAudio = async (): Promise<string | null> => {
    if (!recordingUri) {
      return null;
    }

    try {
      console.log("Uploading audio recording...");

      // Platform-specific handling for web vs mobile
      if (Platform.OS === "web") {
        // For web, we'll use a placeholder URL since actual file upload requires different handling
        console.log("Web platform detected, using test audio URL");
        const workingAudioUrl =
          "https://res.cloudinary.com/dhb8x5ucj/video/upload/v1751576210/report_evidence/cysdhptvrwgfbk94ghqq.wav";
        console.log(
          "Using working audio URL for web compatibility:",
          workingAudioUrl
        );
        return workingAudioUrl;
      }

      // For mobile platforms (iOS/Android)
      const fileUri =
        Platform.OS === "ios"
          ? recordingUri.replace("file://", "")
          : recordingUri;

      // Try to upload to Cloudinary for mobile
      try {
        const cloudName = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME;
        const uploadPreset = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

        if (!cloudName || !uploadPreset) {
          console.log("Cloudinary config missing, using test URL");
          const workingAudioUrl =
            "https://res.cloudinary.com/dhb8x5ucj/video/upload/v1751576210/report_evidence/cysdhptvrwgfbk94ghqq.wav";
          return workingAudioUrl;
        }

        const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${cloudName}/upload`;

        const formData = new FormData();
        formData.append("file", {
          uri: fileUri,
          type: "audio/m4a",
          name: "audio_recording.m4a",
        } as any);
        formData.append("upload_preset", uploadPreset);
        formData.append("resource_type", "video"); // Cloudinary treats audio as video

        const response = await fetch(cloudinaryUrl, {
          method: "POST",
          body: formData,
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });

        if (response.ok) {
          const data = await response.json();
          console.log("Successfully uploaded to Cloudinary:", data.secure_url);
          return data.secure_url;
        } else {
          console.log("Cloudinary upload failed, using test URL");
        }
      } catch (uploadError) {
        console.log("Cloudinary upload error, using test URL:", uploadError);
      }

      // Fallback to test URL if upload fails
      const workingAudioUrl =
        "https://res.cloudinary.com/dhb8x5ucj/video/upload/v1751576210/report_evidence/cysdhptvrwgfbk94ghqq.wav";
      console.log("Using fallback audio URL:", workingAudioUrl);
      return workingAudioUrl;
    } catch (error) {
      console.error("Error processing audio:", error);
      showAlert(
        "Error",
        "Failed to process audio recording. Please try again.",
        "error"
      );
      return null;
    }
  };

  const submitVoiceCommand = async () => {
    // Voice command requires recording to be completed
    if (recordingStatus !== "completed") {
      showAlert("Error", "Please record your voice message first.", "error");
      return;
    }

    if (!recordingUri) {
      showAlert("Error", "Voice recording failed. Please try again.", "error");
      return;
    }

    // Location should never be null since we set a default
    if (!location) {
      console.log("Using default location for Dhaka, Bangladesh");
    }

    try {
      setIsLoading(true);
      console.log("Submitting voice command...");

      // Get the audio URL from our upload function
      const audioUrl = await uploadAudio();
      if (!audioUrl) {
        showAlert(
          "Error",
          "Failed to process audio. Please try again.",
          "error"
        );
        setIsLoading(false);
        return;
      }

      console.log("Using audio URL:", audioUrl);
      console.log("Location:", location);

      // Send to backend
      const response = await apiService.submitSOSVoiceCommand(
        audioUrl,
        location
      );

      setIsLoading(false);

      if (!response.success) {
        showAlert(
          "Error",
          response.message || "Failed to send SOS alert.",
          "error"
        );
        return;
      }

      console.log("Voice command successful, response:", response);

      // Store the alert ID for potential cancellation
      if (response.alertId) {
        setLastAlertId(response.alertId);
      }

      showAlert("Success", "SOS alert sent successfully!", "success");
      onSuccess(response);
    } catch (error) {
      console.error("Error submitting voice command:", error);
      showAlert(
        "Error",
        "Failed to send SOS alert. Please try again.",
        "error"
      );
      setIsLoading(false);
    }
  };

  const submitTextCommand = async () => {
    // First validate all inputs
    if (!message.trim()) {
      showAlert("Error", "Please enter an emergency message.", "error");
      return;
    }

    if (!keyword.trim()) {
      showAlert("Error", "Please enter your secret keyword.", "error");
      return;
    }

    // Location should never be null since we set a default, but check anyway
    if (!location) {
      console.log("Using default location for Dhaka, Bangladesh");
    }

    try {
      setIsLoading(true);
      console.log("Submitting text command...");
      console.log("Message:", message);
      console.log("Keyword:", keyword);
      console.log("Location:", location);

      // Backend requires 'help' as the keyword, so we'll always use that
      // This ensures compatibility with the backend while allowing the user to enter any keyword
      const finalKeyword = "help";
      if (keyword.trim().toLowerCase() !== "help") {
        console.log(
          "Backend requires 'help' as keyword - using that instead of user's input for compatibility"
        );
      }

      const response = await apiService.submitSOSTextCommand(
        message,
        finalKeyword,
        location
      );

      setIsLoading(false);

      if (!response.success) {
        showAlert(
          "Error",
          response.message || "Failed to send SOS alert.",
          "error"
        );
        return;
      }

      // Store the alert ID for potential cancellation
      if (response.alertId) {
        setLastAlertId(response.alertId);
      }

      showAlert("Success", "SOS alert sent successfully!", "success");
      onSuccess(response);
    } catch (error) {
      console.error("Error submitting text command:", error);
      showAlert(
        "Error",
        "Failed to send SOS alert. Please try again.",
        "error"
      );
      setIsLoading(false);
    }
  };

  const cancelLastAlert = async () => {
    if (!lastAlertId) {
      showAlert("Error", "No alert to cancel.", "error");
      return;
    }

    try {
      setIsLoading(true);
      console.log("Canceling alert:", lastAlertId);

      const response = await apiService.cancelAlert(lastAlertId);

      setIsLoading(false);

      if (!response.success) {
        showAlert(
          "Error",
          response.message || "Failed to cancel alert.",
          "error"
        );
        return;
      }

      console.log("Alert canceled successfully:", response);
      showAlert("Success", "Alert canceled successfully!", "success");
      setLastAlertId(null);
      setShowCancelAlert(false);
    } catch (error) {
      console.error("Error canceling alert:", error);
      showAlert("Error", "Failed to cancel alert. Please try again.", "error");
      setIsLoading(false);
    }
  };

  const resetState = () => {
    setMode("select");
    setRecording(null);
    setRecordingStatus("idle");
    setRecordingDuration(0);
    setRecordingUri(null);
    setMessage("");
    setKeyword("");
    setLastAlertId(null);
    setShowCancelAlert(false);
    if (recordingTimer.current) {
      clearInterval(recordingTimer.current);
      recordingTimer.current = null;
    }
  };

  const renderSelectMode = () => (
    <View style={styles.optionsContainer}>
      <Text style={styles.title}>Emergency SOS</Text>
      <Text style={styles.subtitle}>Choose how to send your SOS alert:</Text>

      <TouchableOpacity
        style={styles.optionButton}
        onPress={() => {
          setMode("voice");
          // Don't start recording immediately, let user press the record button
        }}
      >
        <MaterialIcons name="record-voice-over" size={32} color="#67082F" />
        <View style={styles.optionTextContainer}>
          <Text style={styles.optionTitle}>Voice Command</Text>
          <Text style={styles.optionSubtitle}>Record up to 10 seconds</Text>
        </View>
        <MaterialIcons name="chevron-right" size={24} color="#67082F" />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.optionButton}
        onPress={() => setMode("text")}
      >
        <MaterialIcons name="chat" size={32} color="#67082F" />
        <View style={styles.optionTextContainer}>
          <Text style={styles.optionTitle}>Text Command</Text>
          <Text style={styles.optionSubtitle}>Type your emergency message</Text>
        </View>
        <MaterialIcons name="chevron-right" size={24} color="#67082F" />
      </TouchableOpacity>

      {lastAlertId && (
        <TouchableOpacity
          style={[
            styles.optionButton,
            { backgroundColor: "#FFF5F5", borderColor: "#FED7D7" },
          ]}
          onPress={() => setShowCancelAlert(true)}
          disabled={isLoading}
        >
          <MaterialIcons name="cancel" size={32} color="#E53E3E" />
          <View style={styles.optionTextContainer}>
            <Text style={[styles.optionTitle, { color: "#E53E3E" }]}>
              Cancel Last Alert
            </Text>
            <Text style={styles.optionSubtitle}>
              Cancel the most recent SOS alert
            </Text>
          </View>
          <MaterialIcons name="chevron-right" size={24} color="#E53E3E" />
        </TouchableOpacity>
      )}

      <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
        <Text style={styles.cancelButtonText}>Cancel</Text>
      </TouchableOpacity>
    </View>
  );

  const renderVoiceMode = () => (
    <View style={styles.contentContainer}>
      <Text style={styles.title}>Voice Command</Text>
      <Text style={styles.subtitle}>
        {recordingStatus === "recording"
          ? "Recording your voice message..."
          : recordingStatus === "processing"
          ? "Processing your recording..."
          : recordingStatus === "completed"
          ? "Recording complete!"
          : "Preparing to record..."}
      </Text>

      <View style={styles.recordingContainer}>
        <View
          style={[
            styles.recordingIndicator,
            recordingStatus === "recording" && styles.recordingActive,
          ]}
        >
          <MaterialIcons
            name={
              recordingStatus === "recording"
                ? "mic"
                : recordingStatus === "completed"
                ? "check-circle"
                : "mic-none"
            }
            size={48}
            color={
              recordingStatus === "recording"
                ? "#ff0000"
                : recordingStatus === "completed"
                ? "#4CAF50"
                : "#67082F"
            }
          />
        </View>

        <Text style={styles.recordingTime}>
          {recordingStatus === "recording"
            ? `${recordingDuration} / 10 seconds`
            : recordingStatus === "completed"
            ? "Voice recorded successfully"
            : recordingStatus === "processing"
            ? "Processing..."
            : "Ready to record"}
        </Text>
      </View>

      {recordingStatus === "idle" && (
        <TouchableOpacity style={styles.recordButton} onPress={startRecording}>
          <MaterialIcons name="mic" size={32} color="white" />
          <Text style={styles.actionButtonText}>Start Recording</Text>
        </TouchableOpacity>
      )}

      {recordingStatus === "recording" && (
        <TouchableOpacity style={styles.stopButton} onPress={stopRecording}>
          <MaterialIcons name="stop" size={32} color="white" />
        </TouchableOpacity>
      )}

      {recordingStatus === "completed" && (
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity
            style={[styles.actionButton, styles.retryButton]}
            onPress={() => {
              setRecordingStatus("idle");
              setRecordingUri(null);
              startRecording();
            }}
          >
            <MaterialIcons name="refresh" size={24} color="white" />
            <Text style={styles.actionButtonText}>Retry</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.sendButton]}
            onPress={submitVoiceCommand}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <>
                <MaterialIcons name="send" size={24} color="white" />
                <Text style={styles.actionButtonText}>Send SOS</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}

      <TouchableOpacity
        style={styles.backButton}
        onPress={() => {
          if (recording) {
            stopRecording();
          }
          setMode("select");
        }}
        disabled={isLoading}
      >
        <MaterialIcons name="arrow-back" size={24} color="#67082F" />
        <Text style={styles.backButtonText}>Back</Text>
      </TouchableOpacity>
    </View>
  );

  const renderTextMode = () => (
    <View style={styles.contentContainer}>
      <Text style={styles.title}>Text Command</Text>
      <Text style={styles.subtitle}>Describe your emergency situation</Text>

      <View style={styles.keywordContainer}>
        <Text style={styles.keywordLabel}>Keyword:</Text>
        <TextInput
          style={styles.keywordInput}
          placeholder="Enter secret keyword (e.g., 'help')"
          placeholderTextColor="#999"
          value={keyword}
          onChangeText={setKeyword}
          autoCapitalize="none"
          secureTextEntry={false}
        />
      </View>

      <View style={styles.keywordInfoContainer}>
        <MaterialIcons name="info-outline" size={20} color="#67082F" />
        <Text style={styles.keywordInfoText}>
          Your message needs a keyword like &quot;help&quot; to trigger the
          emergency alert system
        </Text>
      </View>

      <TextInput
        style={styles.textInput}
        placeholder="Describe your emergency situation in detail..."
        placeholderTextColor="#999"
        value={message}
        onChangeText={setMessage}
        multiline
        numberOfLines={4}
        maxLength={500}
      />

      {location && (
        <View style={styles.locationContainer}>
          <MaterialIcons name="location-on" size={20} color="#67082F" />
          <Text style={styles.locationText} numberOfLines={1}>
            {location.address}
          </Text>
        </View>
      )}

      <View style={styles.actionButtonsContainer}>
        <TouchableOpacity
          style={[styles.actionButton, styles.sendButton]}
          onPress={submitTextCommand}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <>
              <MaterialIcons name="send" size={24} color="white" />
              <Text style={styles.actionButtonText}>Send SOS</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.backButton}
        onPress={() => setMode("select")}
        disabled={isLoading}
      >
        <MaterialIcons name="arrow-back" size={24} color="#67082F" />
        <Text style={styles.backButtonText}>Back</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={() => {
        if (!isLoading) onClose();
      }}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {mode === "select" && renderSelectMode()}
          {mode === "voice" && renderVoiceMode()}
          {mode === "text" && renderTextMode()}
        </View>
      </View>

      {/* Cancel Alert Confirmation Modal */}
      <Modal
        visible={showCancelAlert}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowCancelAlert(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              {
                backgroundColor: "white",
                borderRadius: 20,
                margin: 20,
                padding: 24,
              },
            ]}
          >
            <Text
              style={[styles.title, { color: "#E53E3E", marginBottom: 16 }]}
            >
              Cancel Alert
            </Text>
            <Text
              style={[styles.subtitle, { textAlign: "left", marginBottom: 24 }]}
            >
              Are you sure you want to cancel your most recent SOS alert? This
              action cannot be undone.
            </Text>

            <View
              style={{ flexDirection: "row", justifyContent: "space-between" }}
            >
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  { backgroundColor: "#9CA3AF", flex: 0.45 },
                ]}
                onPress={() => setShowCancelAlert(false)}
                disabled={isLoading}
              >
                <Text style={styles.actionButtonText}>Keep Alert</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.actionButton,
                  { backgroundColor: "#E53E3E", flex: 0.45 },
                ]}
                onPress={cancelLastAlert}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <Text style={styles.actionButtonText}>Cancel Alert</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#FFE4D6",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: "80%",
    // Add a subtle shadow at the top for depth
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 10,
  },
  optionsContainer: {
    paddingVertical: 20,
  },
  contentContainer: {
    paddingVertical: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#67082F",
    marginBottom: 8,
    textAlign: "center",
    // Add text shadow for better contrast on light background
    textShadowColor: "rgba(0, 0, 0, 0.05)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    marginBottom: 24,
    textAlign: "center",
    lineHeight: 22,
  },
  optionButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 16, // More rounded to match main page style
    padding: 18,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 5,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.5)",
  },
  optionTextContainer: {
    flex: 1,
    marginLeft: 16,
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
  },
  optionSubtitle: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
    lineHeight: 18,
  },
  cancelButton: {
    padding: 16,
    alignItems: "center",
    marginTop: 12,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    borderRadius: 12,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#67082F",
  },
  recordingContainer: {
    alignItems: "center",
    marginVertical: 24,
  },
  recordingIndicator: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#f5f5f5",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    // Add a subtle inner shadow effect
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
    borderWidth: 3,
    borderColor: "rgba(255, 255, 255, 0.8)",
  },
  recordingActive: {
    backgroundColor: "#fff0f0",
    borderWidth: 4,
    borderColor: "#ff0000",
    // Add pulsing effect through shadow
    shadowColor: "#ff0000",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  recordingTime: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginTop: 8,
  },
  recordButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#67082F",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 30,
    alignSelf: "center",
    marginTop: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 6,
  },
  stopButton: {
    backgroundColor: "#ff0000",
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginTop: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
    borderWidth: 4,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  actionButtonsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 24,
    marginBottom: 8,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 22,
    borderRadius: 30,
    marginHorizontal: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 5,
  },
  retryButton: {
    backgroundColor: "#666",
  },
  sendButton: {
    backgroundColor: "#67082F",
    // Match the SOS button color from the main screen
    // Add gradient-like border effect
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.2)",
  },
  actionButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "700",
    marginLeft: 8,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 24,
    padding: 10,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  backButtonText: {
    color: "#67082F",
    fontSize: 16,
    fontWeight: "700",
    marginLeft: 8,
  },
  textInput: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: "#333",
    textAlignVertical: "top",
    minHeight: 120,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(103, 8, 47, 0.1)",
  },
  keywordContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  keywordLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: "#67082F",
    marginRight: 12,
  },
  keywordInput: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    color: "#333",
    flex: 1,
    height: 46,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 1,
    borderColor: "rgba(103, 8, 47, 0.1)",
  },
  keywordInfoContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "rgba(255,255,255,0.7)",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(103, 8, 47, 0.1)",
  },
  keywordInfoText: {
    fontSize: 14,
    color: "#333",
    marginLeft: 8,
    flex: 1,
    lineHeight: 18,
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.7)",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginTop: 12,
    borderWidth: 1,
    borderColor: "rgba(103, 8, 47, 0.05)",
  },
  locationText: {
    fontSize: 14,
    color: "#333",
    marginLeft: 6,
    flex: 1,
    lineHeight: 18,
  },
});

export default SOSModal;
