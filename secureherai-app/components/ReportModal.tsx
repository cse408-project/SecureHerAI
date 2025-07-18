import React, { useState } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useAlert } from "../context/AlertContext";
import { AlertResponse } from "../types/sos";
import { router } from "expo-router";

interface ReportModalProps {
  visible: boolean;
  onClose: () => void;
  alertData: AlertResponse | null;
}

const ReportModal: React.FC<ReportModalProps> = ({
  visible,
  onClose,
  alertData,
}) => {
  const [details, setDetails] = useState(alertData?.alertMessage || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showAlert } = useAlert();

  const handleSubmit = async () => {
    if (!alertData) {
      showAlert("Error", "No alert data available.", "error");
      return;
    }

    if (!details.trim()) {
      showAlert("Error", "Please provide incident details.", "error");
      return;
    }

    try {
      setIsSubmitting(true);

      // Prepare pre-populated data for the report submission page navigate to the actual report submission page
      const reportParams = new URLSearchParams({
        autoFill: "true",
        details: details.trim(),
        location: `${alertData.latitude},${alertData.longitude}`,
        address: alertData.address || "",
        incidentType: "assault", // Default for SOS alerts
        triggerMethod: alertData.triggerMethod || "",
        alertId: alertData.alertId || "",
        triggeredAt: alertData.triggeredAt || "",
      });

      // Add audio evidence if available
      if (alertData.audioRecording) {
        reportParams.append("evidence", alertData.audioRecording);
      }

      // Navigate to report submission page with pre-populated data
      onClose();
      router.push(`/reports/submit?${reportParams.toString()}` as any);
    } catch (error) {
      console.error("Error preparing report:", error);
      setIsSubmitting(false);
      showAlert(
        "Error",
        "Failed to prepare report. Please try again.",
        "error"
      );
    }
  };

  if (!alertData) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={() => {
        if (!isSubmitting) onClose();
      }}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.title}>Submit Incident Report</Text>
            <Text style={styles.subtitle}>
              Please provide details about the incident
            </Text>

            <View style={styles.infoContainer}>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Location:</Text>
                <Text style={styles.infoValue}>{alertData.address}</Text>
              </View>

              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Time:</Text>
                <Text style={styles.infoValue}>
                  {alertData.triggeredAt
                    ? new Date(alertData.triggeredAt).toLocaleString()
                    : "Unknown"}
                </Text>
              </View>

              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Alert Type:</Text>
                <Text style={styles.infoValue}>
                  {alertData.triggerMethod || "Unknown"}
                </Text>
              </View>
            </View>

            <Text style={styles.inputLabel}>Incident Details:</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Describe what happened..."
              placeholderTextColor="#999"
              value={details}
              onChangeText={setDetails}
              multiline
              numberOfLines={8}
              maxLength={1000}
            />

            <View style={styles.actionButtonsContainer}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={onClose}
                disabled={isSubmitting}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text style={styles.submitButtonText}>Submit Report</Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
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
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#67082F",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    marginBottom: 24,
    textAlign: "center",
  },
  infoContainer: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  infoItem: {
    flexDirection: "row",
    marginBottom: 12,
    alignItems: "flex-start",
  },
  infoLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    width: 100,
  },
  infoValue: {
    fontSize: 16,
    color: "#666",
    flex: 1,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: "#333",
    textAlignVertical: "top",
    minHeight: 180,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  actionButtonsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
    marginBottom: 10,
  },
  cancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 30,
    backgroundColor: "#f5f5f5",
    flex: 1,
    marginRight: 8,
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#666",
    fontSize: 16,
    fontWeight: "600",
  },
  submitButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 30,
    backgroundColor: "#67082F",
    flex: 1,
    marginLeft: 8,
    alignItems: "center",
  },
  submitButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default ReportModal;
