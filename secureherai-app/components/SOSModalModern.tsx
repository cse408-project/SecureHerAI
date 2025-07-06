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
  SafeAreaView,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { useAlert } from "../context/AlertContext";
import { AlertResponse } from "../types/sos";
import apiService from "../services/api";
import AudioRecorder from "./AudioRecorder";

interface SOSModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: (alertResponse: AlertResponse) => void;
}

const SOSModalModern: React.FC<SOSModalProps> = ({ visible, onClose, onSuccess }) => {
  const [mode, setMode] = useState<"select" | "voice" | "text">("select");
  const [message, setMessage] = useState("");
  const [keyword, setKeyword] = useState("");
  const [recordingUrl, setRecordingUrl] = useState<string | null>(null);
  
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

  // Initialize when modal opens
  useEffect(() => {
    if (visible) {
      getLocation();
    } else {
      resetState();
    }
  }, [visible, getLocation]);

  const resetState = () => {
    setMode("select");
    setMessage("");
    setKeyword("");
    setRecordingUrl(null);
    setIsLoading(false);
    setShowCancelAlert(false);
    setLastAlertId(null);
  };

  const handleRecordingComplete = (audioUrl: string) => {
    console.log("✅ Recording completed and uploaded:", audioUrl);
    setRecordingUrl(audioUrl);
    showAlert("Success", "Audio recorded successfully! You can now submit your SOS alert.", "success");
  };

  const handleRecordingError = (error: string) => {
    console.error("❌ Recording error:", error);
    showAlert("Recording Error", error, "error");
  };

  const submitVoiceCommand = async () => {
    if (!recordingUrl) {
      showAlert("Error", "Please record your voice message first.", "error");
      return;
    }

    try {
      setIsLoading(true);
      console.log("Submitting voice command...");
      console.log("Using audio URL:", recordingUrl);
      console.log("Location:", location);

      // Send to backend
      const response = await apiService.submitSOSVoiceCommand(recordingUrl, location);

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
      <Text style={styles.title}>Emergency Alert</Text>
      <Text style={styles.subtitle}>
        How would you like to send your emergency alert?
      </Text>

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
      <TouchableOpacity style={styles.backButton} onPress={() => setMode("select")}>
        <MaterialIcons name="arrow-back" size={24} color="#007AFF" />
        <Text style={styles.backButtonText}>Back</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Voice Emergency Alert</Text>
      <Text style={styles.subtitle}>
        Record a clear message describing your emergency
      </Text>

      <View style={styles.voiceContainer}>
        <AudioRecorder
          onRecordingComplete={handleRecordingComplete}
          onError={handleRecordingError}
          maxDuration={10}
          disabled={isLoading}
        />
      </View>

      <View style={styles.instructionsContainer}>
        <Text style={styles.instructionsTitle}>Instructions:</Text>
        <Text style={styles.instructionsText}>
          • Speak clearly and describe your emergency{"\n"}
          • Include your location if different from shown{"\n"}
          • Recording will automatically stop after 10 seconds{"\n"}
          • Keywords like &quot;help&quot;, &quot;emergency&quot;, &quot;SOS&quot; will be detected
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
          (!recordingUrl || isLoading) && styles.submitButtonDisabled,
        ]}
        onPress={submitVoiceCommand}
        disabled={!recordingUrl || isLoading}
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
      <TouchableOpacity style={styles.backButton} onPress={() => setMode("select")}>
        <MaterialIcons name="arrow-back" size={24} color="#007AFF" />
        <Text style={styles.backButtonText}>Back</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Text Emergency Alert</Text>
      <Text style={styles.subtitle}>
        Describe your emergency situation
      </Text>

      <View style={styles.formContainer}>
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Emergency Keyword *</Text>
          <View style={styles.keywordContainer}>
            {["Help", "Emergency", "SOS", "Fire", "Medical"].map((kw) => (
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
          (!message.trim() || !keyword.trim() || isLoading) && styles.submitButtonDisabled,
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
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <SafeAreaView style={styles.container}>
          <View style={styles.modal}>
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Emergency SOS</Text>
              <TouchableOpacity onPress={handleCancel} disabled={isLoading}>
                <MaterialIcons 
                  name="close" 
                  size={24} 
                  color={isLoading ? "#ccc" : "#666"} 
                />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
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
        </SafeAreaView>
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
                style={[styles.cancelModalButton, styles.cancelModalButtonDanger]}
                onPress={handleCancel}
              >
                <Text style={[styles.cancelModalButtonText, styles.cancelModalButtonTextDanger]}>
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
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  container: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modal: {
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "90%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
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
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#e9ecef",
  },
  modeButtonTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginTop: 10,
    marginBottom: 5,
  },
  modeButtonSubtitle: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    gap: 5,
  },
  backButtonText: {
    fontSize: 16,
    color: "#007AFF",
  },
  voiceContainer: {
    marginBottom: 30,
  },
  instructionsContainer: {
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  instructionsText: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
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
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#f8f9fa",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#dee2e6",
  },
  keywordChipSelected: {
    backgroundColor: "#007AFF",
    borderColor: "#007AFF",
  },
  keywordChipText: {
    fontSize: 14,
    color: "#666",
  },
  keywordChipTextSelected: {
    color: "white",
  },
  keywordInput: {
    borderWidth: 1,
    borderColor: "#dee2e6",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#f8f9fa",
  },
  messageInput: {
    borderWidth: 1,
    borderColor: "#dee2e6",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#f8f9fa",
    minHeight: 100,
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
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    gap: 8,
  },
  locationText: {
    fontSize: 14,
    color: "#666",
    flex: 1,
  },
  submitButton: {
    backgroundColor: "#FF6B6B",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  submitButtonDisabled: {
    backgroundColor: "#ccc",
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "white",
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
