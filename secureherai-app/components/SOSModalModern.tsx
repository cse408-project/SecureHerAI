import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  ScrollView,
  Platform,
  Dimensions,
  StatusBar,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { useAlert } from "../context/AlertContext";
import { AlertResponse } from "../types/sos";
import apiService from "../services/api";
import AudioRecorder from "./AudioRecorder";
import audioRecordingService from "../services/audioRecordingService";

interface SOSModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: (alertResponse: AlertResponse) => void;
}

const SOSModalModern: React.FC<SOSModalProps> = ({
  visible,
  onClose,
  onSuccess,
}) => {
  const [mode, setMode] = useState<"select" | "voice" | "text">("select");
  const [message, setMessage] = useState("");
  const [keyword, setKeyword] = useState("");
  const [recordingUri, setRecordingUri] = useState<string | null>(null);

  // Get screen dimensions for responsive design
  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
  const isAndroid = Platform.OS === 'android';
  const statusBarHeight = Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0;

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
  const { showAlert } = useAlert();

  // Get user location with permissions
  const getLocation = useCallback(async () => {
    try {
      console.log("Getting location...");
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        console.log("Location permission denied, using default location");
        showAlert(
          "Location",
          "Location permission denied. Using default location (Dhaka, Bangladesh).",
          "info"
        );
        return;
      }

      const userLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const reverseGeocode = await Location.reverseGeocodeAsync({
        latitude: userLocation.coords.latitude,
        longitude: userLocation.coords.longitude,
      });

      let address = "Unknown location";
      if (reverseGeocode.length > 0) {
        const addr = reverseGeocode[0];
        address = `${addr.street || ""} ${addr.city || ""} ${
          addr.region || ""
        } ${addr.country || ""}`.trim();
      }

      setLocation({
        latitude: userLocation.coords.latitude,
        longitude: userLocation.coords.longitude,
        address,
      });

      console.log("Location updated:", {
        latitude: userLocation.coords.latitude,
        longitude: userLocation.coords.longitude,
        address,
      });
    } catch (error) {
      console.error("Error getting location:", error);
      console.log("Using default location due to error");
    }
  }, [showAlert]);

  const resetState = useCallback(() => {
    setMode("select");
    setMessage("");
    setKeyword("");

    // Clean up any local recording when resetting
    if (recordingUri) {
      audioRecordingService
        .deleteLocalRecording(recordingUri)
        .catch((error) => {
          console.error("Failed to delete recording during reset:", error);
        });
    }

    setRecordingUri(null);
    setIsLoading(false);
    setShowCancelAlert(false);
    setLastAlertId(null);
  }, [recordingUri]);

  // Initialize when modal opens
  useEffect(() => {
    if (visible) {
      getLocation();
    } else {
      resetState();
    }
  }, [visible, getLocation, resetState]);

  const handleRecordingError = (error: string) => {
    console.error("❌ Recording error:", error);
    showAlert("Recording Error", error, "error");
  };

  const submitVoiceCommand = async () => {
    if (!recordingUri) {
      showAlert("Error", "Please record your voice message first.", "error");
      return;
    }

    let uploadedUrl: string | null = null;

    try {
      setIsLoading(true);
      console.log("Uploading audio first...");

      // First upload the audio to get the cloud URL
      const uploadResult = await audioRecordingService.uploadRecording(
        recordingUri
      );

      if (!uploadResult.success || !uploadResult.url) {
        // Upload failed - delete the local recording
        await audioRecordingService.deleteLocalRecording(recordingUri);
        console.log("Deleted local recording after upload failure");

        showAlert(
          "Error",
          uploadResult.error || "Failed to upload audio. Please try again.",
          "error"
        );
        setIsLoading(false);
        setRecordingUri(null); // Reset recording state
        return;
      }

      uploadedUrl = uploadResult.url;
      console.log("Audio uploaded successfully:", uploadedUrl);

      console.log("Submitting voice command...");
      console.log("Using audio URL:", uploadedUrl);
      console.log("Location:", location);

      // Send to backend with the uploaded audio URL
      const response = await apiService.submitSOSVoiceCommand(
        uploadedUrl,
        location
      );

      setIsLoading(false);

      if (!response.success) {
        // SOS submission failed - delete from both local and cloud
        await audioRecordingService.deleteRecording(
          recordingUri || undefined,
          uploadedUrl || undefined
        );
        console.log(
          "Deleted recording from both local and cloud after SOS submission failure"
        );

        showAlert(
          "Error",
          response.message || "Failed to send SOS alert.",
          "error"
        );
        setRecordingUri(null);
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

      // Clean up recordings on any error
      if (recordingUri || uploadedUrl) {
        await audioRecordingService.deleteRecording(
          recordingUri || undefined,
          uploadedUrl || undefined
        );
        console.log(
          "Deleted recording from both local and cloud after submission error"
        );
      }

      showAlert(
        "Error",
        "Failed to send SOS alert. Please try again.",
        "error"
      );
      setIsLoading(false);
      setRecordingUri(null); // Reset recording state
    }
  };

  const submitTextCommand = async () => {
    if (!message.trim()) {
      showAlert("Error", "Please enter an emergency message.", "error");
      return;
    }

    if (!keyword.trim()) {
      showAlert("Error", "Please select or enter a keyword.", "error");
      return;
    }

    try {
      setIsLoading(true);
      console.log("Submitting text command...");

      const response = await apiService.submitSOSTextCommand(
        message.trim(),
        keyword.trim(),
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

      console.log("Text command successful, response:", response);

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

  const handleCancel = async () => {
    if (lastAlertId) {
      try {
        setIsLoading(true);
        await apiService.cancelAlert(lastAlertId);
        showAlert("Success", "SOS alert cancelled successfully.", "success");
        setLastAlertId(null);
        setIsLoading(false);
        onClose();
      } catch (error) {
        console.error("Error cancelling alert:", error);
        showAlert("Error", "Failed to cancel alert.", "error");
        setIsLoading(false);
      }
    } else {
      onClose();
    }
  };

  const renderModeSelection = () => (
    <View style={styles.content}>
      <View style={styles.modeContainer}>
        <TouchableOpacity
          style={styles.modeButton}
          onPress={() => setMode("voice")}
        >
          <MaterialIcons name="mic" size={40} color="#FF6B6B" />
          <Text style={styles.modeButtonTitle}>Voice Alert</Text>
          <Text style={styles.modeButtonSubtitle}>
            Record a 10-second voice message
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.modeButton}
          onPress={() => setMode("text")}
        >
          <MaterialIcons name="message" size={40} color="#4ECDC4" />
          <Text style={styles.modeButtonTitle}>Text Alert</Text>
          <Text style={styles.modeButtonSubtitle}>
            Send a quick text message
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.locationInfo}>
        <MaterialIcons name="location-on" size={16} color="#666" />
        <Text style={styles.locationText} numberOfLines={2}>
          {location.address}
        </Text>
      </View>
    </View>
  );

  const renderVoiceMode = () => (
    <View style={styles.content}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => setMode("select")}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <MaterialIcons name="arrow-back" size={24} color="#007AFF" />
        <Text style={styles.backButtonText}>Back</Text>
      </TouchableOpacity>

      <View style={styles.voiceContainer}>
        <AudioRecorder
          autoUpload={false}
          onLocalRecordingComplete={(audioUri) => {
            // For SOS, we only store the local URI, don't upload yet
            console.log("✅ Recording completed locally:", audioUri);
            setRecordingUri(audioUri);
            showAlert(
              "Success",
              "Audio recorded successfully! You can now submit your SOS alert.",
              "success"
            );
          }}
          onError={handleRecordingError}
          maxDuration={10}
          disabled={isLoading}
        />
      </View>

      <View style={styles.instructionsContainer}>
        <Text style={styles.instructionsTitle}>Instructions:</Text>
        <Text style={styles.instructionsText}>
          • Speak clearly with keyword
          {/* {"\n"}• Include your
          location if different from shown{"\n"}• Recording will automatically
          stop after 10 seconds{"\n"}• Keywords like &quot;help&quot;,
          &quot;emergency&quot;, &quot;SOS&quot; will be detected */}
        </Text>
      </View>

      <View style={styles.locationInfo}>
        <MaterialIcons name="location-on" size={16} color="#666" />
        <Text style={styles.locationText} numberOfLines={2}>
          Emergency location: {location.address}
        </Text>
      </View>

      <TouchableOpacity
        style={[
          styles.submitButton,
          (!recordingUri || isLoading) && styles.submitButtonDisabled,
        ]}
        onPress={submitVoiceCommand}
        disabled={!recordingUri || isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="white" size="small" />
        ) : (
          <>
            <MaterialIcons name="send" size={20} color="white" />
            <Text style={styles.submitButtonText}>Send Emergency Alert</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );

  const renderTextMode = () => (
    <View style={styles.content}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => setMode("select")}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <MaterialIcons name="arrow-back" size={24} color="#007AFF" />
        <Text style={styles.backButtonText}>Back</Text>
      </TouchableOpacity>

      <View style={styles.formContainer}>
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Emergency Keyword *</Text>
          <View style={styles.keywordContainer}>
            {["Help", "Emergency"].map((kw) => (
              <TouchableOpacity
                key={kw}
                style={[
                  styles.keywordChip,
                  keyword === kw && styles.keywordChipSelected,
                ]}
                onPress={() => setKeyword(kw)}
              >
                <Text
                  style={[
                    styles.keywordChipText,
                    keyword === kw && styles.keywordChipTextSelected,
                  ]}
                >
                  {kw}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <TextInput
            style={styles.keywordInput}
            placeholder="Or type custom keyword..."
            value={keyword}
            onChangeText={setKeyword}
            maxLength={20}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Emergency Message *</Text>
          <TextInput
            style={styles.messageInput}
            placeholder="Describe your emergency situation..."
            value={message}
            onChangeText={setMessage}
            multiline
            numberOfLines={4}
            maxLength={500}
            textAlignVertical="top"
          />
          <Text style={styles.characterCount}>{message.length}/500</Text>
        </View>
      </View>

      <View style={styles.locationInfo}>
        <MaterialIcons name="location-on" size={16} color="#666" />
        <Text style={styles.locationText} numberOfLines={2}>
          Emergency location: {location.address}
        </Text>
      </View>

      <TouchableOpacity
        style={[
          styles.submitButton,
          (!message.trim() || !keyword.trim() || isLoading) &&
            styles.submitButtonDisabled,
        ]}
        onPress={submitTextCommand}
        disabled={!message.trim() || !keyword.trim() || isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="white" size="small" />
        ) : (
          <>
            <MaterialIcons name="send" size={20} color="white" />
            <Text style={styles.submitButtonText}>Send Emergency Alert</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );

  const renderContent = () => {
    switch (mode) {
      case "voice":
        return renderVoiceMode();
      case "text":
        return renderTextMode();
      default:
        return renderModeSelection();
    }
  };

  return (
    <Modal 
      visible={visible} 
      animationType="slide" 
      transparent
      statusBarTranslucent={isAndroid}
    >
      <View style={[styles.overlay, { paddingTop: statusBarHeight }]}>
        <View style={[
          styles.modal,
          { 
            maxWidth: Platform.OS === 'android' ? screenWidth * 0.95 : Math.min(400, screenWidth * 0.9),
            minHeight: Platform.OS === 'android' ? 500 : 500,
            maxHeight: screenHeight * 0.85
          }
        ]}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Emergency SOS</Text>
            <TouchableOpacity 
              onPress={handleCancel} 
              disabled={isLoading}
              style={styles.closeButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <MaterialIcons
                name="close"
                size={24}
                color={isLoading ? "#ccc" : "#666"}
              />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.contentWrapper}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {renderContent()}
          </ScrollView>

          {/* Cancel Alert Option */}
          {lastAlertId && (
            <View style={styles.cancelContainer}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowCancelAlert(true)}
                disabled={isLoading}
              >
                <MaterialIcons name="cancel" size={20} color="#FF6B6B" />
                <Text style={styles.cancelButtonText}>Cancel Last Alert</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      {/* Cancel Confirmation Modal */}
      <Modal visible={showCancelAlert} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.cancelModal}>
            <Text style={styles.cancelModalTitle}>Cancel Alert?</Text>
            <Text style={styles.cancelModalText}>
              Are you sure you want to cancel your emergency alert?
            </Text>
            <View style={styles.cancelModalButtons}>
              <TouchableOpacity
                style={styles.cancelModalButton}
                onPress={() => setShowCancelAlert(false)}
              >
                <Text style={styles.cancelModalButtonText}>Keep Alert</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.cancelModalButton,
                  styles.cancelModalButtonDanger,
                ]}
                onPress={handleCancel}
              >
                <Text
                  style={[
                    styles.cancelModalButtonText,
                    styles.cancelModalButtonTextDanger,
                  ]}
                >
                  Cancel Alert
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "center",
    alignItems: "center",
    padding: Platform.OS === 'android' ? 8 : 16,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
    minHeight: "100%",
  },
  container: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modal: {
    backgroundColor: "white",
    borderRadius: Platform.OS === 'android' ? 12 : 16,
    padding: 0,
    minHeight: Platform.OS === 'android' ? 500 : 500,
    width: "100%",
    maxWidth: Platform.OS === 'android' ? '95%' : 400,
    // Enhanced shadow for Android
    ...(Platform.OS === 'android' ? {
      elevation: 16,
    } : {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 8,
    }),
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    // Add extra padding for Android to account for different text rendering
    paddingVertical: Platform.OS === 'android' ? 22 : 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    // Better text rendering on Android
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  closeButton: {
    padding: 4,
    borderRadius: 12,
    backgroundColor: 'transparent',
  },
  contentWrapper: {
    flex: 1,
    maxHeight: Platform.OS === 'android' ? 350 : 300,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: Platform.OS === 'android' ? 16 : 20,
    paddingBottom: Platform.OS === 'android' ? 24 : 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 30,
    lineHeight: 22,
  },
  modeContainer: {
    gap: 15,
    marginBottom: 30,
  },
  modeButton: {
    backgroundColor: "#f8f9fa",
    borderRadius: Platform.OS === 'android' ? 8 : 12,
    padding: 20,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#e9ecef",
    // Better touch feedback on Android
    ...(Platform.OS === 'android' && {
      elevation: 2,
    }),
  },
  modeButtonTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginTop: 10,
    marginBottom: 5,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  modeButtonSubtitle: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    gap: 5,
    paddingVertical: Platform.OS === 'android' ? 8 : 4,
    paddingHorizontal: Platform.OS === 'android' ? 4 : 0,
  },
  backButtonText: {
    fontSize: 16,
    color: "#007AFF",
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  voiceContainer: {
    marginBottom: 30,
  },
  instructionsContainer: {
    backgroundColor: "#f8f9fa",
    borderRadius: Platform.OS === 'android' ? 8 : 12,
    padding: Platform.OS === 'android' ? 16 : 15,
    marginBottom: 20,
    ...(Platform.OS === 'android' && {
      elevation: 1,
    }),
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  instructionsText: {
    fontSize: 14,
    color: "#666",
    lineHeight: Platform.OS === 'android' ? 22 : 20,
    includeFontPadding: false,
  },
  formContainer: {
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 10,
  },
  keywordContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 10,
  },
  keywordChip: {
    paddingHorizontal: Platform.OS === 'android' ? 14 : 12,
    paddingVertical: Platform.OS === 'android' ? 8 : 6,
    backgroundColor: "#f8f9fa",
    borderRadius: Platform.OS === 'android' ? 12 : 16,
    borderWidth: 1,
    borderColor: "#dee2e6",
    minHeight: Platform.OS === 'android' ? 36 : 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  keywordChipSelected: {
    backgroundColor: "#007AFF",
    borderColor: "#007AFF",
    ...(Platform.OS === 'android' && {
      elevation: 2,
    }),
  },
  keywordChipText: {
    fontSize: 14,
    color: "#666",
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  keywordChipTextSelected: {
    color: "white",
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  keywordInput: {
    borderWidth: 1,
    borderColor: "#dee2e6",
    borderRadius: Platform.OS === 'android' ? 6 : 8,
    padding: Platform.OS === 'android' ? 14 : 12,
    fontSize: 16,
    backgroundColor: "#f8f9fa",
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  messageInput: {
    borderWidth: 1,
    borderColor: "#dee2e6",
    borderRadius: Platform.OS === 'android' ? 6 : 8,
    padding: Platform.OS === 'android' ? 14 : 12,
    fontSize: 16,
    backgroundColor: "#f8f9fa",
    minHeight: Platform.OS === 'android' ? 120 : 100,
    includeFontPadding: false,
    textAlignVertical: "top",
  },
  characterCount: {
    fontSize: 12,
    color: "#666",
    textAlign: "right",
    marginTop: 5,
  },
  locationInfo: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    padding: Platform.OS === 'android' ? 14 : 12,
    borderRadius: Platform.OS === 'android' ? 6 : 8,
    marginBottom: 20,
    gap: 8,
    ...(Platform.OS === 'android' && {
      elevation: 1,
    }),
  },
  locationText: {
    fontSize: 14,
    color: "#666",
    flex: 1,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  submitButton: {
    backgroundColor: "#FF6B6B",
    borderRadius: Platform.OS === 'android' ? 8 : 12,
    padding: Platform.OS === 'android' ? 18 : 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    // Better elevation on Android
    ...(Platform.OS === 'android' && {
      elevation: 4,
    }),
  },
  submitButtonDisabled: {
    backgroundColor: "#ccc",
    ...(Platform.OS === 'android' && {
      elevation: 1,
    }),
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "white",
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  cancelContainer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  cancelButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 12,
    backgroundColor: "#fff5f5",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#fed7d7",
  },
  cancelButtonText: {
    fontSize: 14,
    color: "#FF6B6B",
    fontWeight: "500",
  },
  cancelModal: {
    backgroundColor: "white",
    margin: 20,
    padding: 20,
    borderRadius: 12,
    alignItems: "center",
  },
  cancelModalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
  },
  cancelModalText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 22,
  },
  cancelModalButtons: {
    flexDirection: "row",
    gap: 10,
  },
  cancelModalButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#dee2e6",
    backgroundColor: "#f8f9fa",
  },
  cancelModalButtonDanger: {
    backgroundColor: "#FF6B6B",
    borderColor: "#FF6B6B",
  },
  cancelModalButtonText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
  },
  cancelModalButtonTextDanger: {
    color: "white",
  },
});

export default SOSModalModern;
