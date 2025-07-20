import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useState, useEffect, useCallback } from "react";
import { useAlert } from "../../context/AlertContext";
import Header from "../../components/Header";
import apiService from "../../services/api";
import { Alert as AlertType } from "../../types/sos";
import NotificationModal from "../../components/NotificationModal";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function SOSScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState<AlertType[]>([]);
  const [isResponder, setIsResponder] = useState(false);
  const [cancelingAlertId, setCancelingAlertId] = useState<string | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);

  const { showAlert, showConfirmAlert } = useAlert();

  // Check if user is a responder
  const checkUserRole = async () => {
    try {
      const userDataStr = await AsyncStorage.getItem("user_data");
      if (userDataStr) {
        const userData = JSON.parse(userDataStr);
        const roles = userData.roles || [];
        setIsResponder(roles.includes("RESPONDER") || roles.includes("ADMIN"));
      }
    } catch (error) {
      console.error("Error checking user role:", error);
    }
  };

  // Load alerts based on user role
  const loadAlerts = useCallback(async () => {
    try {
      setLoading(true);

      // Determine which API endpoint to call based on user role
      const response = isResponder
        ? await apiService.getActiveAlerts()
        : await apiService.getUserAlerts();

      if (response.success && response.alerts) {
        setAlerts(response.alerts);
      } else {
        console.error(
          "Failed to load alerts:",
          response.error || "Unknown error"
        );
        showAlert("Error", "Failed to load alerts. Please try again.", "error");
      }
    } catch (error) {
      console.error("Error loading alerts:", error);
      showAlert("Error", "An error occurred while loading alerts.", "error");
    } finally {
      setLoading(false);
    }
  }, [isResponder, showAlert]);

  useEffect(() => {
    // Check user role first, then load alerts
    checkUserRole().then(() => loadAlerts());
  }, [loadAlerts]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAlerts();
    setRefreshing(false);
  };

  const handleCancelAlert = (alertId: string) => {
    showConfirmAlert(
      "Cancel Alert",
      "Are you sure you want to cancel this alert? This will notify all responders that the emergency is resolved.",
      async () => {
        try {
          setCancelingAlertId(alertId);
          const response = await apiService.cancelAlert(alertId);

          if (response.success) {
            showAlert(
              "Success",
              "Alert has been canceled successfully.",
              "success"
            );
            // Refresh the alerts list
            loadAlerts();
          } else {
            showAlert(
              "Error",
              response.message || "Failed to cancel alert. Please try again.",
              "error"
            );
          }
        } catch (error) {
          console.error("Error canceling alert:", error);
          showAlert(
            "Error",
            "An error occurred while canceling the alert.",
            "error"
          );
        } finally {
          setCancelingAlertId(null);
        }
      },
      undefined,
      "warning"
    );
  };

  const handleViewUpdateReport = async (alert: AlertType) => {
    try {
      // First, try to get the auto-generated report for this alert
      const reportResponse = await apiService.getReportByAlertId(alert.id);

      if (reportResponse.success && reportResponse.report) {
        // Report exists, navigate to update it
        const reportParams = new URLSearchParams({
          id: reportResponse.report.reportId,
          mode: "update",
          fromAlert: "true",
        });

        // Navigate to report details/update page
        // @ts-ignore
        import("expo-router").then(({ router }) => {
          router.push(`/reports/details?${reportParams.toString()}`);
        });
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "text-red-600 bg-red-50 border-red-200";
      case "CANCELED":
        return "text-orange-600 bg-orange-50 border-orange-200";
      case "RESOLVED":
        return "text-green-600 bg-green-50 border-green-200";
      case "VERIFIED":
        return "text-purple-600 bg-purple-50 border-purple-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  const getTypeIcon = (triggerMethod: string) => {
    switch (triggerMethod) {
      case "VOICE":
        return "record-voice-over";
      case "TEXT":
        return "chat";
      default:
        return "emergency";
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return `${date.toLocaleDateString()} at ${date.toLocaleTimeString()}`;
  };

  const handleTestAlert = () => {
    showConfirmAlert(
      "Test Emergency Alert",
      "This will send a test emergency alert to your trusted contacts. They will be notified that this is a test.",
      () => {
        showAlert(
          "Test Alert Sent",
          "Test emergency alert has been sent to your trusted contacts.",
          "success"
        );
      },
      undefined,
      "info"
    );
  };

  const handleManageContacts = () => {
    showAlert("Info", "Redirecting to trusted contacts management...", "info");
    // TODO: Navigate to contacts management
  };

  const handleEmergencySettings = () => {
    showAlert("Info", "Emergency settings will be available soon.", "info");
  };

  return (
    <View className="flex-1 bg-[#FFE4D6] max-w-screen-md mx-auto w-full">
      <Header
        title={isResponder ? "Active Alerts" : "Emergency Management"}
        onNotificationPress={() => setShowNotifications(true)}
        showNotificationDot={false}
      />

      <ScrollView
        className="flex-1 p-4 pb-10"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {!isResponder && (
          <>
            {/* Quick Emergency Actions */}
            <View className="bg-white rounded-lg p-4 shadow-sm mb-4">
              <Text className="text-lg font-bold text-[#67082F] mb-4">
                Emergency Actions
              </Text>

              <TouchableOpacity
                className="flex-row items-center p-3 bg-red-50 rounded-lg mb-3 border border-red-200"
                onPress={handleTestAlert}
              >
                <View className="w-10 h-10 bg-red-600 rounded-full items-center justify-center mr-3">
                  <MaterialIcons name="bug-report" size={20} color="white" />
                </View>
                <View className="flex-1">
                  <Text className="text-red-700 font-semibold">
                    Send Test Alert
                  </Text>
                  <Text className="text-red-600 text-sm">
                    Test your emergency system
                  </Text>
                </View>
                <MaterialIcons name="chevron-right" size={24} color="#67082F" />
              </TouchableOpacity>

              <TouchableOpacity
                className="flex-row items-center p-3 bg-blue-50 rounded-lg mb-3 border border-blue-200"
                onPress={handleManageContacts}
              >
                <View className="w-10 h-10 bg-blue-600 rounded-full items-center justify-center mr-3">
                  <MaterialIcons name="people" size={20} color="white" />
                </View>
                <View className="flex-1">
                  <Text className="text-blue-700 font-semibold">
                    Manage Trusted Contacts
                  </Text>
                  <Text className="text-blue-600 text-sm">
                    Add or edit emergency contacts
                  </Text>
                </View>
                <MaterialIcons name="chevron-right" size={24} color="#67082F" />
              </TouchableOpacity>

              <TouchableOpacity
                className="flex-row items-center p-3 bg-purple-50 rounded-lg border border-purple-200"
                onPress={handleEmergencySettings}
              >
                <View className="w-10 h-10 bg-purple-600 rounded-full items-center justify-center mr-3">
                  <MaterialIcons name="settings" size={20} color="white" />
                </View>
                <View className="flex-1">
                  <Text className="text-purple-700 font-semibold">
                    Emergency Settings
                  </Text>
                  <Text className="text-purple-600 text-sm">
                    Configure alert preferences
                  </Text>
                </View>
                <MaterialIcons name="chevron-right" size={24} color="#67082F" />
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* Alerts */}
        <View className="bg-white rounded-lg p-4 shadow-sm">
          <Text className="text-lg font-bold text-[#67082F] mb-4">
            {isResponder ? "Active Emergency Alerts" : "Your Alert History"}
          </Text>

          {loading ? (
            <View className="items-center py-8">
              <ActivityIndicator size="large" color="#67082F" />
              <Text className="text-gray-500 mt-4">Loading alerts...</Text>
            </View>
          ) : alerts.length === 0 ? (
            <View className="items-center py-8">
              <MaterialIcons name="history" size={48} color="#9CA3AF" />
              <Text className="text-gray-500 mt-2 text-center">
                {isResponder
                  ? "No active alerts at the moment"
                  : "No emergency alerts yet"}
              </Text>
              <Text className="text-gray-400 text-sm text-center mt-1">
                {isResponder
                  ? "When users send emergency alerts, they will appear here"
                  : "Your emergency alert history will appear here"}
              </Text>
            </View>
          ) : (
            alerts.map((alert) => (
              <View
                key={alert.id}
                className="border-b border-gray-100 py-4 last:border-b-0"
              >
                <View className="flex-row items-start">
                  <View className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center mr-3">
                    <MaterialIcons
                      name={getTypeIcon(alert.triggerMethod)}
                      size={20}
                      color="#67082F"
                    />
                  </View>

                  <View className="flex-1">
                    <View className="flex-row items-center justify-between mb-1">
                      <Text className="font-semibold text-gray-900">
                        {alert.triggerMethod} Alert
                      </Text>
                      <View
                        className={`px-2 py-1 rounded-full border ${getStatusColor(
                          alert.status
                        )}`}
                      >
                        <Text className="text-xs font-medium">
                          {alert.status}
                        </Text>
                      </View>
                    </View>

                    <Text className="text-gray-600 text-sm mb-1">
                      {formatDate(alert.triggeredAt)}
                    </Text>

                    {alert.address && (
                      <Text className="text-gray-500 text-sm mb-1">
                        📍 {alert.address}
                      </Text>
                    )}

                    {alert.alertMessage && (
                      <Text className="text-gray-800 text-sm mt-2 bg-gray-50 p-2 rounded-md">
                        &ldquo;{alert.alertMessage}&rdquo;
                      </Text>
                    )}

                    <View className="flex-row mt-3">
                      {/* View/Update Report button */}
                      <TouchableOpacity
                        className="bg-blue-100 rounded-md py-2 px-3 mr-2 flex-row items-center"
                        onPress={() => handleViewUpdateReport(alert)}
                      >
                        <MaterialIcons
                          name="description"
                          size={16}
                          color="#1E40AF"
                        />
                        <Text className="text-blue-700 text-xs font-medium ml-1">
                          Update Report
                        </Text>
                      </TouchableOpacity>

                      {/* Cancel button - only show for active alerts owned by user */}
                      {alert.status === "ACTIVE" && !isResponder && (
                        <TouchableOpacity
                          className="bg-red-100 rounded-md py-2 px-3 flex-row items-center"
                          onPress={() => handleCancelAlert(alert.id)}
                          disabled={cancelingAlertId === alert.id}
                        >
                          {cancelingAlertId === alert.id ? (
                            <ActivityIndicator size="small" color="#B91C1C" />
                          ) : (
                            <>
                              <MaterialIcons
                                name="cancel"
                                size={16}
                                color="#B91C1C"
                              />
                              <Text className="text-red-700 text-xs font-medium ml-1">
                                Cancel Alert
                              </Text>
                            </>
                          )}
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Help Section */}
        <View className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 mt-4 border border-blue-200">
          <View className="flex-row items-center mb-2">
            <MaterialIcons name="info" size={20} color="#3B82F6" />
            <Text className="text-blue-700 font-semibold ml-2">
              How to Use Emergency Features
            </Text>
          </View>
          <Text className="text-blue-600 text-sm leading-relaxed">
            • Go to the <Text className="font-semibold">Home</Text> tab to
            access the main SOS button{"\n"}• Press and hold the SOS button for
            3 seconds to trigger an emergency alert{"\n"}• Use quick actions on
            the home page for specific emergency needs{"\n"}• Manage your
            trusted contacts to ensure alerts reach the right people
          </Text>
        </View>
      </ScrollView>

      <NotificationModal
        visible={showNotifications}
        onClose={() => setShowNotifications(false)}
      />
    </View>
  );
}
