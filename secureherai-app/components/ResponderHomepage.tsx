import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Modal,
  TextInput,
} from "react-native";
import { useEffect, useState, useCallback } from "react";
import { StatusBar } from "expo-status-bar";
import { MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useAlert } from "../context/AlertContext";
import { useNotifications } from "../context/NotificationContext";
import Header from "./Header";
import NotificationModal from "./NotificationModal";
import { Alert as AlertType } from "../types/sos";
import { AlertStatus } from "../types/AlertStatus";
import apiService from "../services/api";

// Interface for accepted alert response from backend
interface AcceptedAlertResponder {
  alertId: string;
  responderId: string;
  status: AlertStatus;
  acceptedAt: string;
  eta?: string;
}

export default function ResponderHomepage() {
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
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
  const [badgeNumber, setBadgeNumber] = useState<string>("");
  const [showAlertDetailsModal, setShowAlertDetailsModal] = useState(false);
  const [selectedAlertForDetails, setSelectedAlertForDetails] = useState<
    string | null
  >(null);
  const [alertDetailsData, setAlertDetailsData] = useState<any>(null);
  const [loadingUserDetails, setLoadingUserDetails] = useState(false);
  const { showAlert, showConfirmAlert } = useAlert();
  useNotifications(); // For notification count in header

  const loadAlerts = useCallback(async () => {
    try {
      setLoading(true);
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
          "pending alerts"
        );
        setPendingAlerts(pendingResponse.data);
      } else {
        console.error(
          "ResponderHomepage: Failed to load pending alerts:",
          pendingResponse.error || "Unknown error"
        );
        setPendingAlerts([]);
      }

      if (acceptedResponse.success && acceptedResponse.data) {
        console.log(
          "ResponderHomepage: Loaded",
          acceptedResponse.data.length,
          "accepted/critical alerts"
        );

        // Separate ACCEPTED and CRITICAL alerts
        const acceptedOnly = acceptedResponse.data.filter(
          (alert: AcceptedAlertResponder) =>
            alert.status === AlertStatus.ACCEPTED
        );

        const criticalOnly = acceptedResponse.data.filter(
          (alert: AcceptedAlertResponder) =>
            alert.status === AlertStatus.CRITICAL
        );

        setAcceptedAlerts(acceptedOnly);
        setCriticalAlerts(criticalOnly);

        console.log("Separated accepted alerts:", acceptedOnly.length);
        console.log("Separated critical alerts:", criticalOnly.length);
      } else {
        console.error(
          "ResponderHomepage: Failed to load accepted alerts:",
          acceptedResponse.error || "Unknown error"
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
    }
  }, []);

  useEffect(() => {
    loadAlerts();

    // Refresh alerts every 30 seconds
    const interval = setInterval(loadAlerts, 30000);

    return () => clearInterval(interval);
  }, [loadAlerts]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAlerts();
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
            showAlert(
              "Success",
              "Emergency alert accepted. You are now the assigned responder.",
              "success"
            );
            loadAlerts(); // Refresh the list to move alert from pending to accepted
          } else {
            showAlert(
              "Error",
              response.error || "Failed to accept alert. Please try again.",
              "error"
            );
          }
        } catch (error) {
          console.error("Error accepting alert:", error);
          showAlert(
            "Error",
            "Failed to accept alert. Please try again.",
            "error"
          );
        }
      },
      undefined,
      "info"
    );
  };

  const handleRejectAlert = (alertId: string) => {
    showConfirmAlert(
      "Reject Emergency Alert",
      "Are you sure you want to reject this emergency alert? This will remove it from your pending alerts.",
      async () => {
        try {
          const response = await apiService.rejectAlert(alertId);

          if (response.success) {
            showAlert(
              "Success",
              "Emergency alert rejected successfully.",
              "success"
            );
            loadAlerts(); // Refresh the list to remove rejected alert
          } else {
            showAlert(
              "Error",
              response.error || "Failed to reject alert. Please try again.",
              "error"
            );
          }
        } catch (error) {
          console.error("Error rejecting alert:", error);
          showAlert(
            "Error",
            "Failed to reject alert. Please try again.",
            "error"
          );
        }
      },
      undefined,
      "warning"
    );
  };

  const handleForwardAlert = (alertId: string) => {
    setSelectedAlertId(alertId);
    setShowForwardModal(true);
  };

  const submitForwardAlert = async () => {
    if (!selectedAlertId || !badgeNumber.trim()) {
      showAlert("Error", "Please enter a valid badge number", "error");
      return;
    }

    try {
      setLoading(true);
      const response = await apiService.forwardAlert(
        selectedAlertId,
        badgeNumber.trim()
      );

      if (response.success) {
        showAlert("Success", "Alert forwarded successfully", "success");
        setShowForwardModal(false);
        setBadgeNumber("");
        setSelectedAlertId("");
        loadAlerts(); // Refresh the list
      } else {
        showAlert(
          "Error",
          response.error || "Failed to forward alert. Please try again.",
          "error"
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

  const updateAlertStatus = async (status: AlertStatus) => {
    if (!selectedAcceptedAlert) return;

    try {
      setLoading(true);

      // Update the overall alert status (responders can mark alerts as resolved, critical, or false alarm)
      const response = await apiService.updateAlertStatus(
        selectedAcceptedAlert.alertId,
        status
      );

      if (response.success) {
        const statusMessage =
          status === AlertStatus.RESOLVED
            ? "Alert marked as resolved successfully"
            : status === AlertStatus.CRITICAL
            ? "Alert escalated to critical status"
            : status === AlertStatus.FALSE_ALARM
            ? "Alert marked as false alarm"
            : "Alert marked as rejected";

        showAlert("Success", statusMessage, "success");
        setShowStatusModal(false);
        setSelectedAcceptedAlert(null);
        loadAlerts(); // Refresh the list
      } else {
        showAlert(
          "Error",
          response.error || "Failed to update alert status. Please try again.",
          "error"
        );
      }
    } catch (error) {
      console.error("Error updating alert status:", error);
      showAlert(
        "Error",
        "Failed to update alert status. Please try again.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleViewAlertDetails = async (alertId: string) => {
    setSelectedAlertForDetails(alertId);
    setShowAlertDetailsModal(true);
    setLoadingUserDetails(true);

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
          "warning"
        );
      }
    } catch (error) {
      console.error("Error fetching report for alert:", error);
      showAlert(
        "Error",
        "Failed to fetch report for this alert. Please try again.",
        "error"
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
          "warning"
        );
      }
    } catch (error) {
      console.error("Error fetching report for alert:", error);
      showAlert(
        "Error",
        "Failed to fetch report for this alert. Please try again.",
        "error"
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
            "error"
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
          "error"
        );
      }
    } catch (error) {
      console.error("Error starting navigation:", error);
      showAlert(
        "Error",
        "Failed to start navigation. Please try again.",
        "error"
      );
    }
  };

  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const alertTime = new Date(dateString);
    const diffInMinutes = Math.floor(
      (now.getTime() - alertTime.getTime()) / (1000 * 60)
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

  const getPriorityLevel = (alert: AlertType) => {
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

        {/* Pending Alerts Section */}
        <View className="mb-6">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-lg font-bold text-gray-800">
              🚨 Pending Emergency Alerts
            </Text>
            <TouchableOpacity
              onPress={loadAlerts}
              className="bg-gray-100 rounded-full p-2"
            >
              <MaterialIcons name="refresh" size={20} color="#374151" />
            </TouchableOpacity>
          </View>

          {loading ? (
            <View className="bg-white rounded-xl p-8 items-center">
              <Text className="text-gray-500">Loading emergency alerts...</Text>
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
                New emergency alerts will appear here automatically
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
                    </View>{" "}
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
                    <View className="flex-row space-x-2">
                      <TouchableOpacity
                        className="bg-red-600 rounded-lg px-3 py-2"
                        onPress={() => handleAcceptAlert(alert.id)}
                      >
                        <Text className="text-white font-semibold text-center">
                          Accept
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        className="bg-gray-500 rounded-lg px-3 py-2"
                        onPress={() => handleRejectAlert(alert.id)}
                      >
                        <Text className="text-white font-semibold text-center">
                          Reject
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        className="bg-blue-600 rounded-lg px-3 py-2"
                        onPress={() => handleForwardAlert(alert.id)}
                      >
                        <Text className="text-white font-semibold text-center">
                          Forward
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        className="bg-green-600 rounded-lg px-3 py-2"
                        onPress={() => handleViewReport(alert.id)}
                      >
                        <Text className="text-white font-semibold text-center">
                          View Report
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        className="bg-gray-100 rounded-lg px-3 py-2"
                        onPress={() => handleViewAlertDetails(alert.id)}
                      >
                        <MaterialIcons name="info" size={20} color="#374151" />
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
              {acceptedAlerts.map((alertResponder: AcceptedAlertResponder) => (
                <View
                  key={`${alertResponder.alertId}-${alertResponder.responderId}`}
                  className="bg-green-50 rounded-xl p-4 shadow-sm border border-green-200"
                >
                  {/* Header */}
                  <View className="flex-row items-start justify-between mb-3">
                    <View className="flex-row items-center">
                      <View className="w-10 h-10 rounded-full items-center justify-center mr-3 bg-green-200">
                        <MaterialIcons
                          name="check-circle"
                          size={20}
                          color="#059669"
                        />
                      </View>
                      <View>
                        <Text className="font-bold text-gray-800 text-base">
                          {`Alert #${alertResponder.alertId
                            .slice(-8)
                            .toUpperCase()}`}
                        </Text>

                        <Text className="text-green-600 text-sm">
                          Accepted on{" "}
                          {new Date(
                            alertResponder.acceptedAt
                          ).toLocaleDateString()}
                        </Text>
                      </View>
                    </View>

                    <View className="bg-green-100 px-2 py-1 rounded-full">
                      <Text className="text-xs font-semibold text-green-700">
                        {alertResponder.status?.toUpperCase() || "ACCEPTED"}
                      </Text>
                    </View>
                  </View>

                  {/* Alert Details */}
                  <View className="mb-3">
                    <Text className="text-gray-600 text-sm">
                      Status: Currently responding to this emergency
                    </Text>
                    {alertResponder.eta && (
                      <Text className="text-gray-600 text-sm">
                        ETA: {alertResponder.eta}
                      </Text>
                    )}
                  </View>

                  {/* Action Buttons */}
                  <View className="flex-row space-x-2">
                    <TouchableOpacity
                      className="bg-green-600 rounded-lg px-4 py-2 flex-1"
                      onPress={() =>
                        handleNavigateToUser(alertResponder.alertId)
                      }
                    >
                      <View className="flex-row items-center justify-center">
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
                      className="bg-orange-600 rounded-lg px-3 py-2"
                      onPress={() => handleUpdateReport(alertResponder.alertId)}
                    >
                      <Text className="text-white font-semibold text-center">
                        Update Report
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      className="bg-blue-600 rounded-lg px-3 py-2"
                      onPress={() => handleUpdateStatus(alertResponder)}
                    >
                      <Text className="text-white font-semibold text-center">
                        Status
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      className="bg-gray-100 rounded-lg px-3 py-2"
                      onPress={() =>
                        handleViewAlertDetails(alertResponder.alertId)
                      }
                    >
                      <MaterialIcons name="info" size={20} color="#374151" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Critical Alerts Section */}
        <View className="mb-6">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-lg font-bold text-gray-800">
              🚨 Critical Alerts
            </Text>
          </View>

          {criticalAlerts.length === 0 ? (
            <View className="bg-white rounded-xl p-8 items-center">
              <MaterialIcons name="warning" size={48} color="#6B7280" />
              <Text className="text-gray-800 text-lg font-semibold mt-2">
                No Critical Alerts
              </Text>
              <Text className="text-gray-500 text-center mt-1">
                Critical alerts will appear here
              </Text>
            </View>
          ) : (
            <View className="space-y-3">
              {criticalAlerts.map((alertResponder: AcceptedAlertResponder) => (
                <View
                  key={`${alertResponder.alertId}-${alertResponder.responderId}`}
                  className="bg-red-50 rounded-xl p-4 shadow-sm border border-red-200"
                >
                  {/* Header */}
                  <View className="flex-row items-start justify-between mb-3">
                    <View className="flex-row items-center">
                      <View className="w-10 h-10 rounded-full items-center justify-center mr-3 bg-red-200">
                        <MaterialIcons
                          name="warning"
                          size={24}
                          color="#DC2626"
                        />
                      </View>
                      <View className="flex-1">
                        <Text className="text-gray-800 font-semibold">
                          Alert #{alertResponder.alertId}
                        </Text>
                        <Text className="text-gray-600 text-sm">
                          {new Date(
                            alertResponder.acceptedAt || Date.now()
                          ).toLocaleString()}
                        </Text>
                      </View>
                    </View>

                    <View className="bg-red-100 px-2 py-1 rounded-full">
                      <Text className="text-xs font-semibold text-red-700">
                        {alertResponder.status?.toUpperCase() || "CRITICAL"}
                      </Text>
                    </View>
                  </View>

                  {/* Alert Details */}
                  <View className="mb-3">
                    <Text className="text-gray-600 text-sm">
                      Status: Critical emergency requiring immediate attention
                    </Text>
                    {alertResponder.eta && (
                      <Text className="text-gray-600 text-sm">
                        ETA: {alertResponder.eta}
                      </Text>
                    )}
                  </View>

                  {/* Action Buttons */}
                  <View className="flex-row space-x-2">
                    <TouchableOpacity
                      className="bg-red-600 rounded-lg px-4 py-2 flex-1"
                      onPress={() =>
                        handleNavigateToUser(alertResponder.alertId)
                      }
                    >
                      <View className="flex-row items-center justify-center">
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
                      className="bg-orange-600 rounded-lg px-3 py-2"
                      onPress={() => handleUpdateReport(alertResponder.alertId)}
                    >
                      <Text className="text-white font-semibold text-center">
                        Update Report
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      className="bg-blue-600 rounded-lg px-3 py-2"
                      onPress={() => handleUpdateStatus(alertResponder)}
                    >
                      <Text className="text-white font-semibold text-center">
                        Status
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      className="bg-gray-100 rounded-lg px-3 py-2"
                      onPress={() =>
                        handleViewAlertDetails(alertResponder.alertId)
                      }
                    >
                      <MaterialIcons name="info" size={20} color="#374151" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
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

      {/* Forward Alert Modal */}
      <Modal
        visible={showForwardModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowForwardModal(false)}
      >
        <View className="flex-1 justify-center items-center bg-black bg-opacity-50">
          <View className="bg-white rounded-xl p-6 mx-4 w-80">
            <Text className="text-lg font-bold text-gray-800 mb-4">
              Forward Alert
            </Text>

            <Text className="text-gray-600 mb-2">
              Enter the badge number of the responder you want to forward this
              alert to:
            </Text>

            <TextInput
              className="border border-gray-300 rounded-lg px-3 py-2 mb-4"
              placeholder="Badge Number (e.g., P12345)"
              value={badgeNumber}
              onChangeText={setBadgeNumber}
              autoCapitalize="characters"
            />

            <View className="flex-row space-x-3">
              <TouchableOpacity
                className="bg-gray-200 rounded-lg px-4 py-2 flex-1"
                onPress={() => {
                  setShowForwardModal(false);
                  setBadgeNumber("");
                  setSelectedAlertId("");
                }}
              >
                <Text className="text-gray-700 font-semibold text-center">
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="bg-blue-600 rounded-lg px-4 py-2 flex-1"
                onPress={submitForwardAlert}
              >
                <Text className="text-white font-semibold text-center">
                  Forward
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Status Update Modal */}
      <Modal
        visible={showStatusModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowStatusModal(false)}
      >
        <View className="flex-1 justify-center items-center bg-black bg-opacity-50">
          <View className="bg-white rounded-xl p-6 mx-4 w-80">
            <Text className="text-lg font-bold text-gray-800 mb-4">
              Update Alert Status
            </Text>

            <Text className="text-gray-600 mb-4">
              Select the new status for this alert:
            </Text>

            <View className="space-y-3">
              <TouchableOpacity
                className="bg-green-600 rounded-lg px-4 py-3"
                onPress={() => updateAlertStatus(AlertStatus.RESOLVED)}
              >
                <Text className="text-white font-semibold text-center">
                  Mark as Resolved
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="bg-red-600 rounded-lg px-4 py-3"
                onPress={() => updateAlertStatus(AlertStatus.CRITICAL)}
              >
                <Text className="text-white font-semibold text-center">
                  Escalate to Critical
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="bg-yellow-500 rounded-lg px-4 py-3"
                onPress={() => updateAlertStatus(AlertStatus.FALSE_ALARM)}
              >
                <Text className="text-white font-semibold text-center">
                  Mark as False Alarm
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="bg-red-500 rounded-lg px-4 py-3"
                onPress={() => updateAlertStatus(AlertStatus.REJECTED)}
              >
                <Text className="text-white font-semibold text-center">
                  Mark as Rejected
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              className="bg-gray-200 rounded-lg px-4 py-3 mt-4"
              onPress={() => {
                setShowStatusModal(false);
                setSelectedAcceptedAlert(null);
              }}
            >
              <Text className="text-gray-700 font-semibold text-center">
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Alert Details Modal */}
      <Modal
        visible={showAlertDetailsModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowAlertDetailsModal(false)}
      >
        <View className="flex-1 justify-center items-center bg-black bg-opacity-50">
          <View className="bg-white rounded-xl p-6 mx-6 w-220 max-h-[80%]">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-lg font-bold text-gray-800">
                Alert Details
              </Text>
              <TouchableOpacity onPress={() => setShowAlertDetailsModal(false)}>
                <MaterialIcons name="close" size={24} color="#374151" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {selectedAlertForDetails && (
                <View className="space-y-4">
                  {/* Alert Info */}
                  <View className="border-b border-gray-200 pb-4">
                    <Text className="font-semibold text-gray-700 mb-2">
                      Alert Information
                    </Text>
                    {alertDetailsData?.alert ? (
                      <>
                        <Text className="text-gray-600 mb-1">
                          ID:{" "}
                          {alertDetailsData.alert.id?.slice(-8).toUpperCase() ||
                            "Unknown"}
                        </Text>
                        <Text className="text-gray-600 mb-1">
                          Time:{" "}
                          {alertDetailsData.alert.triggeredAt
                            ? new Date(
                                alertDetailsData.alert.triggeredAt
                              ).toLocaleString()
                            : "Unknown"}
                        </Text>
                        <Text className="text-gray-600 mb-1">
                          Type:{" "}
                          {alertDetailsData.alert.triggerMethod
                            ?.charAt(0)
                            .toUpperCase() +
                            alertDetailsData.alert.triggerMethod?.slice(1) ||
                            "Unknown"}
                        </Text>
                        {alertDetailsData.alert.alertMessage && (
                          <Text className="text-gray-600 mb-1">
                            Message: {alertDetailsData.alert.alertMessage}
                          </Text>
                        )}
                      </>
                    ) : (
                      <Text className="text-gray-500">
                        Loading alert information...
                      </Text>
                    )}
                  </View>

                  {/* Location Info */}
                  <View className="border-b border-gray-200 pb-4">
                    <Text className="font-semibold text-gray-700 mb-2">
                      Location
                    </Text>
                    {alertDetailsData?.alert ? (
                      <>
                        <Text className="text-gray-600 mb-1">
                          Address: {alertDetailsData.alert.address || "Unknown"}
                        </Text>
                        <Text className="text-gray-600 mb-1">
                          Coordinates: {alertDetailsData.alert.latitude},{" "}
                          {alertDetailsData.alert.longitude}
                        </Text>
                      </>
                    ) : (
                      <Text className="text-gray-500">
                        Loading location information...
                      </Text>
                    )}
                  </View>

                  {/* User Details */}
                  <View className="border-b border-gray-200 pb-4">
                    <Text className="font-semibold text-gray-700 mb-2">
                      User Information
                    </Text>
                    {loadingUserDetails ? (
                      <Text className="text-gray-500">
                        Loading user details...
                      </Text>
                    ) : alertDetailsData?.user ? (
                      <View>
                        <Text className="text-gray-600 mb-1">
                          Name: {alertDetailsData.user.fullName || "Unknown"}
                        </Text>
                        <Text className="text-gray-600 mb-1">
                          Email: {alertDetailsData.user.email || "Unknown"}
                        </Text>
                        <Text className="text-gray-600 mb-1">
                          Phone:{" "}
                          {alertDetailsData.user.phoneNumber || "Unknown"}
                        </Text>
                        <Text className="text-gray-600 mb-1">
                          User ID: {alertDetailsData.user.userId}
                        </Text>
                      </View>
                    ) : (
                      <Text className="text-red-600">
                        Could not load user details
                      </Text>
                    )}
                  </View>

                  {/* Response Details */}
                  {alertDetailsData?.responder && (
                    <View className="border-b border-gray-200 pb-4">
                      <Text className="font-semibold text-gray-700 mb-2">
                        Response Information
                      </Text>
                      <Text className="text-gray-600 mb-1">
                        Status:{" "}
                        {alertDetailsData.responder.status?.toUpperCase() ||
                          "Unknown"}
                      </Text>
                      {alertDetailsData.responder.acceptedAt && (
                        <Text className="text-gray-600 mb-1">
                          Accepted:{" "}
                          {new Date(
                            alertDetailsData.responder.acceptedAt
                          ).toLocaleString()}
                        </Text>
                      )}
                      {alertDetailsData.responder.eta && (
                        <Text className="text-gray-600 mb-1">
                          ETA: {alertDetailsData.responder.eta}
                        </Text>
                      )}
                      {alertDetailsData.responder.arrivalTime && (
                        <Text className="text-gray-600 mb-1">
                          Arrived:{" "}
                          {new Date(
                            alertDetailsData.responder.arrivalTime
                          ).toLocaleString()}
                        </Text>
                      )}
                    </View>
                  )}

                  {/* Additional Info */}
                  {alertDetailsData?.alert?.notes && (
                    <View className="pb-4">
                      <Text className="font-semibold text-gray-700 mb-2">
                        Notes
                      </Text>
                      <Text className="text-gray-600">
                        {alertDetailsData.alert.notes}
                      </Text>
                    </View>
                  )}
                </View>
              )}
            </ScrollView>

            <TouchableOpacity
              className="bg-[#67082F] rounded-lg px-4 py-3 mt-4"
              onPress={() => setShowAlertDetailsModal(false)}
            >
              <Text className="text-white font-semibold text-center">
                Close
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
