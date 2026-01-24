import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Modal,
  ActivityIndicator,
} from "react-native";
import { useEffect, useState, useCallback, useRef } from "react";
import { StatusBar } from "expo-status-bar";
import { MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useAlert } from "../context/AlertContext";
import { useNotifications } from "../context/NotificationContext";
import Header from "./Header";
import NotificationModal from "./NotificationModal";
import ForwardAlertModal from "./ForwardAlertModal";
import AlertDetailsModal from "./AlertDetailsModal";
import { Alert as AlertType } from "../types/sos";
import {
  AlertStatus,
  ResponderStatus,
  getSeverityColor,
  getResponderStatusColor,
} from "../types/AlertStatus";
import apiService from "../services/api";
import locationService from "../services/locationService";

// Interface for accepted alert response from backend
interface AcceptedAlertResponder {
  alertId: string;
  responderId: string;
  responderStatus: string; // The responder's status on this alert
  alertStatus: string; // The alert's current status (ACCEPTED, CRITICAL, etc.)
  acceptedAt: string;
  arrivalTime?: string;
  notes?: string;
  latitude?: number;
  longitude?: number;
  address?: string;
  alertMessage?: string;
  triggerMethod?: string;
  triggeredAt?: string;
  resolvedAt?: string;
  eta?: string; // Estimated time of arrival
  forwarded?: boolean; // Flag indicating if this alert was forwarded
  // Added for severity-based routing
  severity?: string; // CRITICAL, HIGH, MEDIUM, LOW
  incidentType?: string;
  isCritical?: boolean; // Flag indicating if this was originally a critical alert
  victim?: {
    userId: string;
    fullName: string;
    phone: string;
    profilePicture?: string;
  };
}

export default function ResponderHomepage() {
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isBackgroundLoading, setIsBackgroundLoading] = useState(false);
  const [pendingAlerts, setPendingAlerts] = useState<AlertType[]>([]);
  const [acceptedAlerts, setAcceptedAlerts] = useState<
    AcceptedAlertResponder[]
  >([]);
  const [criticalAlerts, setCriticalAlerts] = useState<
    AcceptedAlertResponder[]
  >([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showForwardModal, setShowForwardModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedAlertId, setSelectedAlertId] = useState<string>("");
  const [selectedAcceptedAlert, setSelectedAcceptedAlert] =
    useState<AcceptedAlertResponder | null>(null);
  const [showAlertDetailsModal, setShowAlertDetailsModal] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_selectedAlertForDetails, setSelectedAlertForDetails] = useState<
    string | null
  >(null);
  const [selectedAlertObject, setSelectedAlertObject] =
    useState<AlertType | null>(null);
  const [selectedAlertIsAccepted, setSelectedAlertIsAccepted] = useState(false);
  const [currentResponderStatus, setCurrentResponderStatus] = useState<
    string | null
  >(null);
  const [alertDetailsData, setAlertDetailsData] = useState<any>(null);
  const [loadingUserDetails, setLoadingUserDetails] = useState(false);
  const { showAlert, showConfirmAlert } = useAlert();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const {
    emergencyAlerts,
    isConnected,
    connectRealtime,
    clearEmergencyAlert: _clearEmergencyAlert,
  } = useNotifications();
  const isInitialLoad = useRef(true);

  const loadAlerts = useCallback(async (isBackground: boolean = false) => {
    try {
      // Only show full loading spinner on initial load
      if (!isBackground && isInitialLoad.current) {
        setLoading(true);
      } else {
        setIsBackgroundLoading(true);
      }
      console.log("ResponderHomepage: Loading pending and accepted alerts");

      // Load both pending and accepted alerts in parallel
      const [pendingResponse, acceptedResponse] = await Promise.all([
        apiService.getPendingAlerts(),
        apiService.getAcceptedAlerts(),
      ]);

      console.log("Response of accepted alerts:", acceptedResponse);

      if (pendingResponse.success && pendingResponse.data) {
        console.log(
          "ResponderHomepage: Loaded",
          pendingResponse.data.length,
          "pending alerts",
        );
        setPendingAlerts(pendingResponse.data);
      } else {
        console.error(
          "ResponderHomepage: Failed to load pending alerts:",
          pendingResponse.error || "Unknown error",
        );
        setPendingAlerts([]);
      }

      if (acceptedResponse.success && acceptedResponse.data) {
        console.log(
          "ResponderHomepage: Loaded",
          acceptedResponse.data.length,
          "accepted/critical alerts",
        );

        // Separate ACCEPTED and CRITICAL alerts based on multiple criteria:
        // 1. alertStatus field (CRITICAL vs ACCEPTED)
        // 2. severity field (CRITICAL)
        // 3. isCritical flag
        const acceptedOnly = acceptedResponse.data.filter(
          (alert: AcceptedAlertResponder) => {
            // Check if this is a critical alert (CRITICAL or HIGH severity)
            const isCriticalAlert =
              alert.alertStatus === "CRITICAL" ||
              alert.severity === "CRITICAL" ||
              alert.severity === "HIGH" ||
              alert.isCritical === true;

            // Non-critical alerts go to accepted list
            return !isCriticalAlert;
          },
        );

        const criticalOnly = acceptedResponse.data.filter(
          (alert: AcceptedAlertResponder) => {
            // Check if this is a critical alert using multiple criteria (include HIGH)
            return (
              alert.alertStatus === "CRITICAL" ||
              alert.severity === "CRITICAL" ||
              alert.severity === "HIGH" ||
              alert.isCritical === true
            );
          },
        );

        setAcceptedAlerts(acceptedOnly);
        setCriticalAlerts(criticalOnly);

        console.log("Separated accepted alerts:", acceptedOnly.length);
        console.log("Separated critical alerts:", criticalOnly.length);
      } else {
        console.error(
          "ResponderHomepage: Failed to load accepted alerts:",
          acceptedResponse.error || "Unknown error",
        );
        setAcceptedAlerts([]);
        setCriticalAlerts([]);
      }
    } catch (error) {
      console.error("ResponderHomepage: Error loading alerts:", error);
      setPendingAlerts([]);
      setAcceptedAlerts([]);
      setCriticalAlerts([]);
    } finally {
      setLoading(false);
      setIsBackgroundLoading(false);
      isInitialLoad.current = false;
    }
  }, []);

  // Connect to real-time services on mount
  useEffect(() => {
    loadAlerts(false); // Initial load
    connectRealtime(); // Connect WebSocket for real-time updates

    // Reduced polling interval as fallback - only every 2 minutes since we have WebSocket now
    const interval = setInterval(() => loadAlerts(true), 120000);

    return () => clearInterval(interval);
  }, [loadAlerts, connectRealtime]);

  // Handle incoming real-time emergency alerts
  useEffect(() => {
    if (emergencyAlerts.length > 0) {
      // Refresh pending alerts when we receive new emergency alerts via WebSocket
      loadAlerts(true);
    }
  }, [emergencyAlerts, loadAlerts]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAlerts(false);
    setRefreshing(false);
  };

  const handleAcceptAlert = (alertId: string) => {
    showConfirmAlert(
      "Accept Emergency Alert",
      "Are you sure you want to accept this emergency alert? You will be assigned as the responding officer.",
      async () => {
        try {
          // Accept the emergency alert using the new accept-alert endpoint
          const response = await apiService.acceptAlert(alertId);

          if (response.success) {
            // Enable emergency tracking for responder (real-time location sharing with victim)
            try {
              await locationService.enableEmergencyTracking(alertId, false); // false = responder
              console.log(
                "🚨 Responder emergency tracking enabled for alert:",
                alertId,
              );
            } catch (trackingError) {
              console.error(
                "Failed to enable emergency tracking:",
                trackingError,
              );
            }

            showAlert(
              "Success",
              "Emergency alert accepted. You are now the assigned responder.",
              "success",
            );
            loadAlerts(); // Refresh the list to move alert from pending to accepted
          } else {
            showAlert(
              "Error",
              response.error || "Failed to accept alert. Please try again.",
              "error",
            );
          }
        } catch (error) {
          console.error("Error accepting alert:", error);
          showAlert(
            "Error",
            "Failed to accept alert. Please try again.",
            "error",
          );
        }
      },
      undefined,
      "info",
    );
  };

  const handleCancelPendingAlert = (alertId: string) => {
    showConfirmAlert(
      "Cancel Alert Response",
      "Are you sure you want to cancel your response to this emergency alert? This will remove it from your pending alerts.",
      async () => {
        try {
          const response = await apiService.cancelResponderResponse(
            alertId,
            "Responder declined",
          );

          if (response.success) {
            showAlert(
              "Success",
              "Alert response canceled successfully.",
              "success",
            );
            loadAlerts(); // Refresh the list to remove canceled alert
          } else {
            showAlert(
              "Error",
              response.error || "Failed to cancel alert. Please try again.",
              "error",
            );
          }
        } catch (error) {
          console.error("Error canceling alert:", error);
          showAlert(
            "Error",
            "Failed to cancel alert. Please try again.",
            "error",
          );
        }
      },
      undefined,
      "warning",
    );
  };

  const handleForwardAlert = (alertId: string) => {
    setSelectedAlertId(alertId);
    setShowForwardModal(true);
  };

  const submitForwardAlert = async (responderIds: string[]) => {
    if (!selectedAlertId || responderIds.length === 0) {
      showAlert("Error", "Please select at least one responder", "error");
      return;
    }

    try {
      setLoading(true);
      const response = await apiService.forwardAlert(
        selectedAlertId,
        responderIds,
      );

      if (response.success) {
        const count = response.forwardedCount || responderIds.length;
        showAlert(
          "Success",
          `Alert forwarded to ${count} responder${count > 1 ? "s" : ""} successfully`,
          "success",
        );
        setShowForwardModal(false);
        setSelectedAlertId("");
        loadAlerts(); // Refresh the list
      } else {
        showAlert(
          "Error",
          response.error || "Failed to forward alert. Please try again.",
          "error",
        );
      }
    } catch (error) {
      console.error("Error forwarding alert:", error);
      showAlert("Error", "Failed to forward alert. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = (alertResponder: AcceptedAlertResponder) => {
    setSelectedAcceptedAlert(alertResponder);
    setShowStatusModal(true);
  };

  /**
   * Update responder status (EN_ROUTE, ARRIVED, RESOLVED)
   * This updates the AlertResponder record, not the Alert itself
   */
  const updateResponderStatusLocal = async (status: ResponderStatus) => {
    if (!selectedAcceptedAlert) return;

    try {
      setLoading(true);

      const response = await apiService.updateResponderStatus(
        selectedAcceptedAlert.alertId,
        status,
      );

      if (response.success) {
        // Disable emergency tracking when resolved
        if (status === ResponderStatus.RESOLVED) {
          try {
            await locationService.disableEmergencyTracking();
            console.log("✅ Emergency tracking disabled - resolved");
          } catch (trackingError) {
            console.error(
              "Failed to disable emergency tracking:",
              trackingError,
            );
          }
        }

        const statusMessage =
          status === ResponderStatus.EN_ROUTE
            ? "Status updated: On the way"
            : status === ResponderStatus.ARRIVED
              ? "Status updated: Arrived at scene"
              : "Alert marked as resolved";

        showAlert("Success", statusMessage, "success");
        setShowStatusModal(false);
        setSelectedAcceptedAlert(null);
        loadAlerts();
      } else {
        showAlert(
          "Error",
          response.error || "Failed to update status. Please try again.",
          "error",
        );
      }
    } catch (error) {
      console.error("Error updating responder status:", error);
      showAlert("Error", "Failed to update status. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Cancel the responder's response to an alert
   */
  const handleCancelAlert = async () => {
    if (!selectedAcceptedAlert) return;

    showConfirmAlert(
      "Cancel Response",
      "Are you sure you want to cancel your response to this alert? This cannot be undone.",
      async () => {
        try {
          setLoading(true);

          const response = await apiService.cancelResponderResponse(
            selectedAcceptedAlert.alertId,
            "Responder canceled",
          );

          if (response.success) {
            try {
              await locationService.disableEmergencyTracking();
            } catch (trackingError) {
              console.error("Failed to disable tracking:", trackingError);
            }

            showAlert("Success", "Your response has been canceled", "success");
            setShowStatusModal(false);
            setSelectedAcceptedAlert(null);
            loadAlerts();
          } else {
            showAlert(
              "Error",
              response.error || "Failed to cancel. Please try again.",
              "error",
            );
          }
        } catch (error) {
          console.error("Error canceling alert:", error);
          showAlert("Error", "Failed to cancel. Please try again.", "error");
        } finally {
          setLoading(false);
        }
      },
      undefined,
      "warning",
    );
  };

  // Legacy function - keep for updating alert status (severity changes)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const updateAlertStatus = async (status: AlertStatus) => {
    if (!selectedAcceptedAlert) return;

    try {
      setLoading(true);

      // Update the overall alert status (for severity changes like FALSE_ALARM)
      const response = await apiService.updateAlertStatus(
        selectedAcceptedAlert.alertId,
        status,
      );

      if (response.success) {
        // Disable emergency tracking when alert is resolved or closed
        if (status === AlertStatus.FINISHED) {
          try {
            await locationService.disableEmergencyTracking();
            console.log(
              "✅ Emergency tracking disabled - alert resolved/closed",
            );
          } catch (trackingError) {
            console.error(
              "Failed to disable emergency tracking:",
              trackingError,
            );
          }
        }

        showAlert("Success", "Alert status updated", "success");
        setShowStatusModal(false);
        setSelectedAcceptedAlert(null);
        loadAlerts(); // Refresh the list
      } else {
        showAlert(
          "Error",
          response.error || "Failed to update alert status. Please try again.",
          "error",
        );
      }
    } catch (error) {
      console.error("Error updating alert status:", error);
      showAlert(
        "Error",
        "Failed to update alert status. Please try again.",
        "error",
      );
    } finally {
      setLoading(false);
    }
  };

  // Helper function to convert AcceptedAlertResponder to AlertType for modal display
  const convertToAlertType = (
    alertResponder: AcceptedAlertResponder,
  ): AlertType => {
    return {
      id: alertResponder.alertId,
      userId: alertResponder.victim?.userId || "",
      latitude: alertResponder.latitude || 0,
      longitude: alertResponder.longitude || 0,
      address: alertResponder.address || "",
      triggerMethod: alertResponder.triggerMethod || "",
      alertMessage: alertResponder.alertMessage || "",
      audioRecording: null,
      triggeredAt: alertResponder.triggeredAt || "",
      status: alertResponder.alertStatus as any,
      verificationStatus: "VERIFIED",
      canceledAt: null,
      resolvedAt: alertResponder.resolvedAt || null,
      notes: alertResponder.notes,
      severity: alertResponder.severity as any,
      incidentType: alertResponder.incidentType as any,
      isCritical: alertResponder.isCritical,
    };
  };

  const handleViewAlertDetails = async (
    alertId: string,
    alert?: AlertType | AcceptedAlertResponder,
    isAccepted: boolean = false,
  ) => {
    setSelectedAlertForDetails(alertId);
    setSelectedAlertIsAccepted(isAccepted);
    setShowAlertDetailsModal(true);
    setLoadingUserDetails(true);

    // Convert to AlertType if it's an AcceptedAlertResponder
    if (alert) {
      if ("alertId" in alert) {
        // It's an AcceptedAlertResponder
        const acceptedAlert = alert as AcceptedAlertResponder;
        setSelectedAlertObject(convertToAlertType(acceptedAlert));
        setCurrentResponderStatus(acceptedAlert.responderStatus || null);
      } else {
        // It's already an AlertType (pending alert)
        setSelectedAlertObject(alert as AlertType);
        setCurrentResponderStatus(null);
      }
    } else {
      setSelectedAlertObject(null);
      setCurrentResponderStatus(null);
    }

    try {
      // Get full alert details including user information using the composite key approach
      const detailsResponse = await apiService.getAlertUserDetails(alertId);
      if (detailsResponse.success) {
        setAlertDetailsData(detailsResponse.data);
      } else {
        setAlertDetailsData(null);
        showAlert("Warning", "Could not load alert details", "warning");
      }
    } catch (error) {
      console.error("Error loading alert details:", error);
      setAlertDetailsData(null);
      showAlert("Error", "Failed to load alert details", "error");
    } finally {
      setLoadingUserDetails(false);
    }
  };

  const handleViewReport = async (alertId: string) => {
    try {
      // Get the auto-generated report for this alert
      const reportResponse = await apiService.getReportByAlertId(alertId);

      if (reportResponse.success && reportResponse.report) {
        // Report exists, navigate to view it (read-only)
        const reportParams = new URLSearchParams({
          id: reportResponse.report.reportId,
          mode: "view",
          fromAlert: "true",
        });

        router.push(`/reports/details?${reportParams.toString()}` as any);
      } else {
        // Report doesn't exist yet, show error
        showAlert(
          "Report Not Found",
          "The report for this alert hasn't been generated yet. Please wait a moment and try again.",
          "warning",
        );
      }
    } catch (error) {
      console.error("Error fetching report for alert:", error);
      showAlert(
        "Error",
        "Failed to fetch report for this alert. Please try again.",
        "error",
      );
    }
  };

  const handleUpdateReport = async (alertId: string) => {
    try {
      // Get the auto-generated report for this alert
      const reportResponse = await apiService.getReportByAlertId(alertId);

      if (reportResponse.success && reportResponse.report) {
        // Report exists, navigate to update it
        const reportParams = new URLSearchParams({
          id: reportResponse.report.reportId,
          mode: "update",
          fromAlert: "true",
        });

        router.push(`/reports/details?${reportParams.toString()}` as any);
      } else {
        // Report doesn't exist yet, show error
        showAlert(
          "Report Not Found",
          "The report for this alert hasn't been generated yet. Please wait a moment and try again.",
          "warning",
        );
      }
    } catch (error) {
      console.error("Error fetching report for alert:", error);
      showAlert(
        "Error",
        "Failed to fetch report for this alert. Please try again.",
        "error",
      );
    }
  };

  const handleNavigateToUser = async (alertId: string) => {
    try {
      // Get alert details to extract location
      const detailsResponse = await apiService.getAlertUserDetails(alertId);
      if (detailsResponse.success && detailsResponse.data?.alert) {
        const alert = detailsResponse.data.alert;
        const user = detailsResponse.data.user;

        if (!alert.latitude || !alert.longitude) {
          showAlert(
            "Error",
            "Alert location is not available for navigation",
            "error",
          );
          return;
        }

        // Navigate to NavigationScreen with responder role
        const targetLocation = {
          latitude: alert.latitude,
          longitude: alert.longitude,
          address: alert.address || "Alert Location",
        };

        router.push({
          pathname: "/navigation" as any,
          params: {
            alertId: alertId,
            userRole: "RESPONDER",
            targetLocation: JSON.stringify(targetLocation),
            targetUserId: user?.userId || alert.userId || "user",
          },
        });
      } else {
        showAlert(
          "Error",
          "Could not load alert details for navigation",
          "error",
        );
      }
    } catch (error) {
      console.error("Error starting navigation:", error);
      showAlert(
        "Error",
        "Failed to start navigation. Please try again.",
        "error",
      );
    }
  };

  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const alertTime = new Date(dateString);
    const diffInMinutes = Math.floor(
      (now.getTime() - alertTime.getTime()) / (1000 * 60),
    );

    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;

    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  const getAlertTypeIcon = (triggerMethod: string) => {
    switch (triggerMethod?.toLowerCase()) {
      case "voice":
        return "record-voice-over";
      case "text":
        return "message";
      case "manual":
        return "touch-app";
      default:
        return "warning";
    }
  };

  const getAlertTypeColor = (triggerMethod: string) => {
    switch (triggerMethod?.toLowerCase()) {
      case "voice":
        return "#F59E0B"; // amber
      case "text":
        return "#3B82F6"; // blue
      case "manual":
        return "#EF4444"; // red
      default:
        return "#6B7280"; // gray
    }
  };

  /**
   * Get priority level based on alert severity (AI-analyzed from backend)
   * Falls back to time-based calculation if severity not available
   */
  const getPriorityLevel = (alert: AlertType) => {
    // Use AI-analyzed severity from backend if available
    const severity = alert.severity?.toUpperCase();

    if (severity) {
      switch (severity) {
        case "CRITICAL":
          return { level: "CRITICAL", color: "#DC2626", bgColor: "#FEE2E2" };
        case "HIGH":
          return { level: "HIGH", color: "#EA580C", bgColor: "#FED7AA" };
        case "MEDIUM":
          return { level: "MEDIUM", color: "#D97706", bgColor: "#FEF3C7" };
        case "LOW":
          return { level: "LOW", color: "#059669", bgColor: "#D1FAE5" };
      }
    }

    // Also check if alert itself is marked as critical (status-based)
    if (alert.status === "CRITICAL" || alert.isCritical) {
      return { level: "CRITICAL", color: "#DC2626", bgColor: "#FEE2E2" };
    }

    // Fallback to time-based calculation if no severity available
    const alertAge =
      new Date().getTime() - new Date(alert.triggeredAt).getTime();
    const ageInMinutes = alertAge / (1000 * 60);

    if (ageInMinutes < 5)
      return { level: "CRITICAL", color: "#DC2626", bgColor: "#FEE2E2" };
    if (ageInMinutes < 15)
      return { level: "HIGH", color: "#EA580C", bgColor: "#FED7AA" };
    if (ageInMinutes < 60)
      return { level: "MEDIUM", color: "#D97706", bgColor: "#FEF3C7" };
    return { level: "LOW", color: "#059669", bgColor: "#D1FAE5" };
  };

  return (
    <View className="flex-1 bg-[#FFE4D6] max-w-screen-md mx-auto w-full">
      <StatusBar style="light" />
      <Header
        title="Emergency Response Center"
        onNotificationPress={() => setShowNotifications(true)}
        useRealNotificationCount={true}
      />

      <ScrollView
        className="flex-1 p-4"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Quick Stats */}
        <View className="mb-6">
          <View className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <Text className="text-lg font-bold text-gray-800 mb-3">
              📊 Response Overview
            </Text>
            <View className="flex-row justify-between">
              <View className="items-center">
                <Text className="text-2xl font-bold text-red-600">
                  {pendingAlerts.length}
                </Text>
                <Text className="text-sm text-gray-600">Pending Alerts</Text>
              </View>
              <View className="items-center">
                <Text className="text-2xl font-bold text-orange-600">
                  {criticalAlerts.length}
                </Text>
                <Text className="text-sm text-gray-600">Critical</Text>
              </View>
              <View className="items-center">
                <Text className="text-2xl font-bold text-green-600">
                  {acceptedAlerts.length}
                </Text>
                <Text className="text-sm text-gray-600">Accepted</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        {/* <View className="mb-6">
          <Text className="text-lg font-bold text-gray-800 mb-3">
            🚀 Quick Actions
          </Text>
          <View className="flex-row justify-between">
            <TouchableOpacity
              className="bg-blue-600 rounded-lg p-4 flex-1 mr-2 items-center"
              onPress={() => router.push("/reports/submit" as any)}
            >
              <MaterialIcons name="assignment" size={24} color="white" />
              <Text className="text-white font-semibold mt-1 text-center">
                Submit Report
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="bg-green-600 rounded-lg p-4 flex-1 ml-2 items-center"
              onPress={() => router.push("/settings" as any)}
            >
              <MaterialIcons name="settings" size={24} color="white" />
              <Text className="text-white font-semibold mt-1 text-center">
                Status Settings
              </Text>
            </TouchableOpacity>
          </View>
        </View> */}

        {/* Real-time Connection Status */}
        <View className="flex-row items-center justify-end mb-2 px-1">
          <View
            className={`w-2 h-2 rounded-full mr-2 ${
              isConnected ? "bg-green-500" : "bg-gray-400"
            }`}
          />
          <Text className="text-xs text-gray-500">
            {isConnected ? "Live updates active" : "Connecting..."}
          </Text>
          {isBackgroundLoading && (
            <ActivityIndicator
              size="small"
              color="#6B7280"
              style={{ marginLeft: 8 }}
            />
          )}
        </View>

        {/* Pending Alerts Section */}
        <View className="mb-6">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-lg font-bold text-gray-800">
              🚨 Pending Emergency Alerts
            </Text>
            <TouchableOpacity
              onPress={() => loadAlerts(false)}
              className="bg-gray-100 rounded-full p-2"
            >
              <MaterialIcons name="refresh" size={20} color="#374151" />
            </TouchableOpacity>
          </View>

          {loading ? (
            <View className="bg-white rounded-xl p-8 items-center">
              <ActivityIndicator size="large" color="#EF4444" />
              <Text className="text-gray-500 mt-2">
                Loading emergency alerts...
              </Text>
            </View>
          ) : pendingAlerts.length === 0 ? (
            <View className="bg-white rounded-xl p-8 items-center">
              <MaterialIcons name="check-circle" size={48} color="#10B981" />
              <Text className="text-gray-800 text-lg font-semibold mt-2">
                All Clear
              </Text>
              <Text className="text-gray-500 text-center mt-1">
                No pending emergency alerts at the moment
              </Text>
              <Text className="text-gray-400 text-sm text-center mt-2">
                {isConnected
                  ? "New emergency alerts will appear here instantly"
                  : "New emergency alerts will appear here automatically"}
              </Text>
            </View>
          ) : (
            <View className="space-y-3">
              {pendingAlerts.map((alert: AlertType) => {
                const priority = getPriorityLevel(alert);
                const alertTypeColor = getAlertTypeColor(alert.triggerMethod);

                return (
                  <View
                    key={alert.id}
                    className="bg-white rounded-xl p-4 shadow-sm border border-gray-100"
                  >
                    {/* Header */}
                    <View className="flex-row items-start justify-between mb-3">
                      <View className="flex-row items-center">
                        <View
                          className="w-10 h-10 rounded-full items-center justify-center mr-3"
                          style={{ backgroundColor: alertTypeColor + "20" }}
                        >
                          <MaterialIcons
                            name={getAlertTypeIcon(alert.triggerMethod)}
                            size={20}
                            color={alertTypeColor}
                          />
                        </View>
                        <View>
                          <Text className="font-bold text-gray-800 text-base">
                            {`Emergency Alert #${alert.id
                              .slice(-8)
                              .toUpperCase()}`}
                          </Text>
                          <View className="flex-row items-center">
                            <Text className="text-gray-500 text-sm">
                              {getTimeAgo(alert.triggeredAt)}
                            </Text>
                            {alert.forwarded && (
                              <View className="ml-2 px-2 py-0.5 bg-blue-100 rounded-full border border-blue-300">
                                <Text className="text-xs text-blue-700 font-semibold">
                                  Forwarded
                                </Text>
                              </View>
                            )}
                          </View>
                        </View>
                      </View>

                      <View
                        className="px-2 py-1 rounded-full"
                        style={{ backgroundColor: priority.bgColor }}
                      >
                        <Text
                          className="text-xs font-semibold"
                          style={{ color: priority.color }}
                        >
                          {priority.level}
                        </Text>
                      </View>
                    </View>
                    {/* Alert Details */}
                    <View className="mb-3">
                      <View className="flex-row items-center mb-2">
                        <MaterialIcons
                          name="location-on"
                          size={16}
                          color="#6B7280"
                        />
                        <Text className="text-gray-600 ml-1 flex-1">
                          {alert.address ||
                            `${alert.latitude}, ${alert.longitude}`}
                        </Text>
                      </View>

                      {alert.alertMessage && (
                        <View className="flex-row items-start mb-2">
                          <MaterialIcons
                            name="message"
                            size={16}
                            color="#6B7280"
                          />
                          <Text className="text-gray-600 ml-1 flex-1">
                            {alert.alertMessage}
                          </Text>
                        </View>
                      )}

                      {alert.notes && (
                        <View className="flex-row items-start mb-2">
                          <MaterialIcons
                            name="info"
                            size={16}
                            color="#3B82F6"
                          />
                          <Text className="text-blue-600 ml-1 flex-1">
                            Note: {alert.notes}
                          </Text>
                        </View>
                      )}

                      <View className="flex-row items-center">
                        <MaterialIcons
                          name="access-time"
                          size={16}
                          color="#6B7280"
                        />
                        <Text className="text-gray-600 ml-1">
                          Trigger Method:{" "}
                          {alert.triggerMethod?.charAt(0).toUpperCase() +
                            alert.triggerMethod?.slice(1)}
                        </Text>
                      </View>
                    </View>
                    {/* Action Buttons */}
                    <View className="flex-row flex-wrap gap-2">
                      <TouchableOpacity
                        className="bg-red-600 rounded-lg px-3 py-2"
                        onPress={() => handleAcceptAlert(alert.id)}
                      >
                        <View className="flex-row items-center">
                          <MaterialIcons name="check" size={16} color="white" />
                          <Text className="text-white font-semibold ml-1">
                            Accept
                          </Text>
                        </View>
                      </TouchableOpacity>

                      <TouchableOpacity
                        className="bg-gray-500 rounded-lg px-3 py-2"
                        onPress={() => handleCancelPendingAlert(alert.id)}
                      >
                        <View className="flex-row items-center">
                          <MaterialIcons name="close" size={16} color="white" />
                          <Text className="text-white font-semibold ml-1">
                            Cancel
                          </Text>
                        </View>
                      </TouchableOpacity>

                      <TouchableOpacity
                        className="bg-blue-600 rounded-lg px-3 py-2"
                        onPress={() => handleForwardAlert(alert.id)}
                      >
                        <View className="flex-row items-center">
                          <MaterialIcons
                            name="forward"
                            size={16}
                            color="white"
                          />
                          <Text className="text-white font-semibold ml-1">
                            Forward
                          </Text>
                        </View>
                      </TouchableOpacity>

                      <TouchableOpacity
                        className="bg-green-600 rounded-lg px-3 py-2"
                        onPress={() => handleViewReport(alert.id)}
                      >
                        <View className="flex-row items-center">
                          <MaterialIcons
                            name="description"
                            size={16}
                            color="white"
                          />
                          <Text className="text-white font-semibold ml-1">
                            Report
                          </Text>
                        </View>
                      </TouchableOpacity>

                      <TouchableOpacity
                        className="bg-indigo-600 rounded-lg px-3 py-2"
                        onPress={() =>
                          handleViewAlertDetails(alert.id, alert, false)
                        }
                      >
                        <View className="flex-row items-center">
                          <MaterialIcons name="info" size={16} color="white" />
                          <Text className="text-white font-semibold ml-1">
                            Details
                          </Text>
                        </View>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* Accepted/Current Alerts Section */}
        <View className="mb-6">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-lg font-bold text-gray-800">
              ✅ Accepted Alerts
            </Text>
          </View>

          {acceptedAlerts.length === 0 ? (
            <View className="bg-white rounded-xl p-8 items-center">
              <MaterialIcons
                name="assignment-turned-in"
                size={48}
                color="#6B7280"
              />
              <Text className="text-gray-800 text-lg font-semibold mt-2">
                No Accepted Alerts
              </Text>
              <Text className="text-gray-500 text-center mt-1">
                Alerts you&apos;ve accepted will appear here
              </Text>
            </View>
          ) : (
            <View className="space-y-3">
              {acceptedAlerts.map((alertResponder: AcceptedAlertResponder) => {
                const severityColor = getSeverityColor(
                  alertResponder.severity || "MEDIUM",
                );
                const statusColor = getResponderStatusColor(
                  alertResponder.responderStatus,
                );

                return (
                  <View
                    key={`${alertResponder.alertId}-${alertResponder.responderId}`}
                    className="bg-white rounded-xl p-4 shadow-sm border border-gray-100"
                  >
                    {/* Header with severity badge */}
                    <View className="flex-row items-start justify-between mb-3">
                      <View className="flex-row items-center flex-1">
                        <View
                          className="w-10 h-10 rounded-full items-center justify-center mr-3"
                          style={{ backgroundColor: severityColor + "20" }}
                        >
                          <MaterialIcons
                            name="warning"
                            size={20}
                            color={severityColor}
                          />
                        </View>
                        <View className="flex-1">
                          <Text className="font-bold text-gray-800 text-base">
                            {alertResponder.victim?.fullName ||
                              `Alert #${alertResponder.alertId.slice(-8).toUpperCase()}`}
                          </Text>
                          <View className="flex-row items-center">
                            <Text className="text-gray-500 text-sm">
                              {alertResponder.triggeredAt
                                ? getTimeAgo(alertResponder.triggeredAt)
                                : "Time unknown"}
                            </Text>
                            {alertResponder.forwarded && (
                              <View className="ml-2 px-2 py-0.5 bg-purple-100 rounded-full">
                                <Text className="text-xs text-purple-700 font-medium">
                                  Forwarded
                                </Text>
                              </View>
                            )}
                          </View>
                        </View>
                      </View>

                      {/* Status badges */}
                      <View className="items-end">
                        <View
                          className="px-2 py-1 rounded-full mb-1"
                          style={{ backgroundColor: severityColor + "20" }}
                        >
                          <Text
                            className="text-xs font-semibold"
                            style={{ color: severityColor }}
                          >
                            {alertResponder.severity || "MEDIUM"}
                          </Text>
                        </View>
                        <View
                          className="px-2 py-1 rounded-full"
                          style={{ backgroundColor: statusColor + "20" }}
                        >
                          <Text
                            className="text-xs font-semibold"
                            style={{ color: statusColor }}
                          >
                            {alertResponder.responderStatus}
                          </Text>
                        </View>
                      </View>
                    </View>

                    {/* Alert Details */}
                    <View className="mb-3 space-y-1">
                      {/* Location */}
                      <View className="flex-row items-center">
                        <MaterialIcons
                          name="location-on"
                          size={16}
                          color="#6B7280"
                        />
                        <Text
                          className="text-gray-600 ml-1 flex-1"
                          numberOfLines={1}
                        >
                          {alertResponder.address ||
                            (alertResponder.latitude
                              ? `${alertResponder.latitude.toFixed(4)}, ${alertResponder.longitude?.toFixed(4)}`
                              : "Location unknown")}
                        </Text>
                      </View>

                      {/* Victim phone */}
                      {alertResponder.victim?.phone && (
                        <View className="flex-row items-center">
                          <MaterialIcons
                            name="phone"
                            size={16}
                            color="#6B7280"
                          />
                          <Text className="text-gray-600 ml-1">
                            {alertResponder.victim.phone}
                          </Text>
                        </View>
                      )}

                      {/* Alert message */}
                      {alertResponder.alertMessage && (
                        <View className="flex-row items-start">
                          <MaterialIcons
                            name="message"
                            size={16}
                            color="#6B7280"
                          />
                          <Text
                            className="text-gray-600 ml-1 flex-1"
                            numberOfLines={2}
                          >
                            {alertResponder.alertMessage}
                          </Text>
                        </View>
                      )}

                      {/* ETA if set */}
                      {alertResponder.eta && (
                        <View className="flex-row items-center">
                          <MaterialIcons
                            name="timer"
                            size={16}
                            color="#2563EB"
                          />
                          <Text className="text-blue-600 ml-1">
                            ETA: {alertResponder.eta} min
                          </Text>
                        </View>
                      )}
                    </View>

                    {/* Action Buttons */}
                    <View className="flex-row flex-wrap gap-2">
                      <TouchableOpacity
                        className="bg-blue-600 rounded-lg px-3 py-2"
                        onPress={() =>
                          handleNavigateToUser(alertResponder.alertId)
                        }
                      >
                        <View className="flex-row items-center">
                          <MaterialIcons
                            name="navigation"
                            size={16}
                            color="white"
                          />
                          <Text className="text-white font-semibold ml-1">
                            Navigate
                          </Text>
                        </View>
                      </TouchableOpacity>

                      <TouchableOpacity
                        className="bg-amber-600 rounded-lg px-3 py-2"
                        onPress={() =>
                          handleUpdateReport(alertResponder.alertId)
                        }
                      >
                        <View className="flex-row items-center">
                          <MaterialIcons
                            name="edit-note"
                            size={16}
                            color="white"
                          />
                          <Text className="text-white font-semibold ml-1">
                            Report
                          </Text>
                        </View>
                      </TouchableOpacity>

                      <TouchableOpacity
                        className="bg-green-600 rounded-lg px-3 py-2"
                        onPress={() => handleUpdateStatus(alertResponder)}
                      >
                        <View className="flex-row items-center">
                          <MaterialIcons name="sync" size={16} color="white" />
                          <Text className="text-white font-semibold ml-1">
                            Status
                          </Text>
                        </View>
                      </TouchableOpacity>

                      <TouchableOpacity
                        className="bg-gray-600 rounded-lg px-3 py-2"
                        onPress={() =>
                          handleViewAlertDetails(
                            alertResponder.alertId,
                            alertResponder,
                            true,
                          )
                        }
                      >
                        <View className="flex-row items-center">
                          <MaterialIcons name="info" size={16} color="white" />
                          <Text className="text-white font-semibold ml-1">
                            Details
                          </Text>
                        </View>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* Critical Alerts Section */}
        <View className="mb-6">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-lg font-bold text-gray-800">
              🚨 Critical Alerts
            </Text>
            {criticalAlerts.length > 0 && (
              <View className="bg-red-100 px-2 py-1 rounded-full">
                <Text className="text-red-700 text-sm font-medium">
                  {criticalAlerts.length} active
                </Text>
              </View>
            )}
          </View>

          {criticalAlerts.length === 0 ? (
            <View className="bg-white rounded-xl p-8 items-center">
              <MaterialIcons name="check-circle" size={48} color="#16A34A" />
              <Text className="text-gray-800 text-lg font-semibold mt-2">
                No Critical Alerts
              </Text>
              <Text className="text-gray-500 text-center mt-1">
                All clear - no critical emergencies
              </Text>
            </View>
          ) : (
            <View className="space-y-3">
              {criticalAlerts.map((alertResponder: AcceptedAlertResponder) => {
                const statusColor = getResponderStatusColor(
                  alertResponder.responderStatus,
                );

                return (
                  <View
                    key={`${alertResponder.alertId}-${alertResponder.responderId}`}
                    className="bg-red-50 rounded-xl p-4 shadow-sm border border-red-300"
                  >
                    {/* Header */}
                    <View className="flex-row items-start justify-between mb-3">
                      <View className="flex-row items-center flex-1">
                        <View className="w-10 h-10 rounded-full items-center justify-center mr-3 bg-red-200">
                          <MaterialIcons
                            name="warning"
                            size={22}
                            color="#DC2626"
                          />
                        </View>
                        <View className="flex-1">
                          <Text className="font-bold text-gray-800 text-base">
                            {alertResponder.victim?.fullName ||
                              `Alert #${alertResponder.alertId.slice(-8).toUpperCase()}`}
                          </Text>
                          <View className="flex-row items-center">
                            <Text className="text-red-600 text-sm font-medium">
                              CRITICAL
                            </Text>
                            <Text className="text-gray-500 text-sm ml-2">
                              •{" "}
                              {alertResponder.triggeredAt
                                ? getTimeAgo(alertResponder.triggeredAt)
                                : "Time unknown"}
                            </Text>
                          </View>
                        </View>
                      </View>

                      {/* Status badge */}
                      <View
                        className="px-2 py-1 rounded-full"
                        style={{ backgroundColor: statusColor + "20" }}
                      >
                        <Text
                          className="text-xs font-semibold"
                          style={{ color: statusColor }}
                        >
                          {alertResponder.responderStatus}
                        </Text>
                      </View>
                    </View>

                    {/* Alert Details */}
                    <View className="mb-3 space-y-1">
                      {/* Location */}
                      <View className="flex-row items-center">
                        <MaterialIcons
                          name="location-on"
                          size={16}
                          color="#DC2626"
                        />
                        <Text
                          className="text-gray-700 ml-1 flex-1 font-medium"
                          numberOfLines={1}
                        >
                          {alertResponder.address ||
                            (alertResponder.latitude
                              ? `${alertResponder.latitude.toFixed(4)}, ${alertResponder.longitude?.toFixed(4)}`
                              : "Location unknown")}
                        </Text>
                      </View>

                      {/* Victim phone */}
                      {alertResponder.victim?.phone && (
                        <View className="flex-row items-center">
                          <MaterialIcons
                            name="phone"
                            size={16}
                            color="#DC2626"
                          />
                          <Text className="text-gray-700 ml-1 font-medium">
                            {alertResponder.victim.phone}
                          </Text>
                        </View>
                      )}

                      {/* Alert message */}
                      {alertResponder.alertMessage && (
                        <View className="flex-row items-start">
                          <MaterialIcons
                            name="message"
                            size={16}
                            color="#6B7280"
                          />
                          <Text
                            className="text-gray-600 ml-1 flex-1"
                            numberOfLines={2}
                          >
                            {alertResponder.alertMessage}
                          </Text>
                        </View>
                      )}
                    </View>

                    {/* Action Buttons */}
                    <View className="flex-row flex-wrap gap-2">
                      <TouchableOpacity
                        className="bg-red-600 rounded-lg px-3 py-2"
                        onPress={() =>
                          handleNavigateToUser(alertResponder.alertId)
                        }
                      >
                        <View className="flex-row items-center">
                          <MaterialIcons
                            name="navigation"
                            size={16}
                            color="white"
                          />
                          <Text className="text-white font-semibold ml-1">
                            Navigate
                          </Text>
                        </View>
                      </TouchableOpacity>

                      <TouchableOpacity
                        className="bg-amber-600 rounded-lg px-3 py-2"
                        onPress={() =>
                          handleUpdateReport(alertResponder.alertId)
                        }
                      >
                        <View className="flex-row items-center">
                          <MaterialIcons
                            name="edit-note"
                            size={16}
                            color="white"
                          />
                          <Text className="text-white font-semibold ml-1">
                            Report
                          </Text>
                        </View>
                      </TouchableOpacity>

                      <TouchableOpacity
                        className="bg-green-600 rounded-lg px-3 py-2"
                        onPress={() => handleUpdateStatus(alertResponder)}
                      >
                        <View className="flex-row items-center">
                          <MaterialIcons name="sync" size={16} color="white" />
                          <Text className="text-white font-semibold ml-1">
                            Status
                          </Text>
                        </View>
                      </TouchableOpacity>

                      <TouchableOpacity
                        className="bg-gray-600 rounded-lg px-3 py-2"
                        onPress={() =>
                          handleViewAlertDetails(
                            alertResponder.alertId,
                            alertResponder,
                            true,
                          )
                        }
                      >
                        <View className="flex-row items-center">
                          <MaterialIcons name="info" size={16} color="white" />
                          <Text className="text-white font-semibold ml-1">
                            Details
                          </Text>
                        </View>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* Quick Navigation */}
        {/* <View className="mb-6">
          <Text className="text-lg font-bold text-gray-800 mb-3">
            📱 Navigation
          </Text>
          <View className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <TouchableOpacity
              className="flex-row items-center py-3 border-b border-gray-100"
              onPress={() => router.push("/sos" as any)}
            >
              <MaterialIcons name="history" size={24} color="#6B7280" />
              <Text className="text-gray-700 ml-3 flex-1">Alert History</Text>
              <MaterialIcons name="chevron-right" size={20} color="#9CA3AF" />
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-row items-center py-3 border-b border-gray-100"
              onPress={() => router.push("/reports" as any)}
            >
              <MaterialIcons name="assignment" size={24} color="#6B7280" />
              <Text className="text-gray-700 ml-3 flex-1">Reports</Text>
              <MaterialIcons name="chevron-right" size={20} color="#9CA3AF" />
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-row items-center py-3"
              onPress={() => router.push("/settings" as any)}
            >
              <MaterialIcons name="tune" size={24} color="#6B7280" />
              <Text className="text-gray-700 ml-3 flex-1">
                Responder Settings
              </Text>
              <MaterialIcons name="chevron-right" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          </View>
        </View> */}
      </ScrollView>

      <NotificationModal
        visible={showNotifications}
        onClose={() => setShowNotifications(false)}
      />

      {/* Forward Alert Modal - New searchable multi-select */}
      <ForwardAlertModal
        visible={showForwardModal}
        onClose={() => {
          setShowForwardModal(false);
          setSelectedAlertId("");
        }}
        onForward={submitForwardAlert}
        isLoading={loading}
      />

      {/* Status Update Modal */}
      <Modal
        visible={showStatusModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowStatusModal(false)}
      >
        <View className="flex-1 justify-center items-center bg-black bg-opacity-50">
          <View className="bg-white rounded-xl p-6 mx-4 w-80">
            <Text className="text-lg font-bold text-gray-800 mb-2">
              Update Your Status
            </Text>

            {selectedAcceptedAlert && (
              <View className="mb-4 p-2 bg-gray-50 rounded-lg">
                <Text className="text-gray-500 text-sm">
                  Current:{" "}
                  <Text className="font-medium text-gray-700">
                    {selectedAcceptedAlert.responderStatus}
                  </Text>
                </Text>
              </View>
            )}

            <View className="space-y-3">
              {/* Show all status options like AlertDetailsModal */}
              {[
                {
                  status: ResponderStatus.ACCEPTED,
                  label: "Accept Alert",
                  bg: "bg-blue-600",
                  icon: "check-circle",
                },
                {
                  status: ResponderStatus.EN_ROUTE,
                  label: "On My Way (En Route)",
                  bg: "bg-cyan-600",
                  icon: "directions-car",
                },
                {
                  status: ResponderStatus.ARRIVED,
                  label: "I've Arrived",
                  bg: "bg-indigo-600",
                  icon: "location-on",
                },
                {
                  status: ResponderStatus.RESOLVED,
                  label: "Mark as Resolved",
                  bg: "bg-green-600",
                  icon: "check-circle",
                },
                {
                  status: ResponderStatus.REJECTED,
                  label: "Reject Alert",
                  bg: "bg-red-600",
                  icon: "cancel",
                },
                {
                  status: ResponderStatus.CANCELED,
                  label: "Cancel My Response",
                  bg: "bg-gray-600",
                  icon: "close",
                },
              ].map((option) => {
                const isCurrent =
                  selectedAcceptedAlert?.responderStatus === option.status;
                return (
                  <TouchableOpacity
                    key={option.status}
                    className={`${option.bg} rounded-lg px-4 py-3 flex-row items-center justify-center ${
                      isCurrent
                        ? "ring-2 ring-offset-2 ring-gray-400 opacity-70"
                        : ""
                    }`}
                    onPress={() => {
                      if (option.status === ResponderStatus.CANCELED) {
                        handleCancelAlert();
                      } else {
                        updateResponderStatusLocal(option.status);
                      }
                    }}
                    disabled={isCurrent}
                  >
                    <MaterialIcons
                      name={option.icon as any}
                      size={20}
                      color="white"
                    />
                    <Text className="text-white font-semibold text-center ml-2">
                      {option.label}
                      {isCurrent ? " (Current)" : ""}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity
              className="bg-gray-200 rounded-lg px-4 py-3 mt-4"
              onPress={() => {
                setShowStatusModal(false);
                setSelectedAcceptedAlert(null);
              }}
            >
              <Text className="text-gray-700 font-semibold text-center">
                Close
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Alert Details Modal */}
      <AlertDetailsModal
        visible={showAlertDetailsModal}
        onClose={() => {
          setShowAlertDetailsModal(false);
          setSelectedAlertForDetails(null);
          setSelectedAlertObject(null);
          setAlertDetailsData(null);
          setCurrentResponderStatus(null);
        }}
        alert={selectedAlertObject}
        alertDetails={alertDetailsData}
        isResponder={true}
        isAcceptedResponder={selectedAlertIsAccepted}
        isVictim={false}
        currentResponderStatus={currentResponderStatus || undefined}
        onStatusUpdate={loadAlerts}
        loadingDetails={loadingUserDetails}
      />
    </View>
  );
}
