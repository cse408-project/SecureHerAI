import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import React, { useState, useEffect, useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAlert } from "../../context/AlertContext";
import { useAuth } from "../../context/AuthContext";
import Header from "../../components/Header";
import apiService from "../../services/api";
import { Alert as AlertType } from "../../types/sos";
import { AlertStatus } from "../../types/AlertStatus";
import { router } from "expo-router";
import NotificationModal from "../../components/NotificationModal";
import AlertDetailsModal from "../../components/AlertDetailsModal";

export default function SOSScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState<AlertType[]>([]);
  const [isResponder, setIsResponder] = useState(false);
  const [cancelingAlertId, setCancelingAlertId] = useState<string | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showAlertDetails, setShowAlertDetails] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<AlertType | null>(null);
  const [alertDetails, setAlertDetails] = useState<any>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [acceptedAlertIds, setAcceptedAlertIds] = useState<Set<string>>(
    new Set()
  ); // Track which alerts current responder has accepted
  const [viewMode, setViewMode] = useState<"all" | "my">("all"); // Toggle between all alerts and my alerts

  const { showAlert, showConfirmAlert } = useAlert();
  const { user } = useAuth(); // Get user from auth context

  // Helper function to check if current responder has accepted this alert
  const isCurrentResponderAccepted = useCallback(
    async (alert: AlertType): Promise<boolean> => {
      if (!isResponder || !user?.userId) {
        return false;
      }

      try {
        // Get alert details to check responder status
        const response = await apiService.getAlertDetails(alert.id);
        if (response.success && response.data?.responders) {
          return response.data.responders.some(
            (responder: any) =>
              responder.responderId === user.userId &&
              responder.status === AlertStatus.ACCEPTED
          );
        }
        return false;
      } catch (error) {
        console.error("Error checking responder status:", error);
        return false;
      }
    },
    [isResponder, user?.userId]
  );

  // Check if user is a responder
  const checkUserRole = useCallback(async () => {
    try {
      // First try to get role from auth context user
      if (user?.role) {
        const isResponderUser = user.role === "RESPONDER";
        console.log(
          "SOSScreen: User role from context:",
          user.role,
          "Is responder:",
          isResponderUser
        );
        setIsResponder(isResponderUser);
        return;
      }

      // Fallback to AsyncStorage if auth context doesn't have user data yet
      const userDataStr = await AsyncStorage.getItem("user_data");
      if (userDataStr) {
        const userData = JSON.parse(userDataStr);
        console.log("SOSScreen: User data from storage:", userData);
        // Check the role property (not roles array)
        const userRole = userData.role;
        const isResponderUser = userRole === "RESPONDER";
        console.log(
          "SOSScreen: User role from storage:",
          userRole,
          "Is responder:",
          isResponderUser
        );
        setIsResponder(isResponderUser);
      } else {
        // No user data found, default to regular user
        setIsResponder(false);
      }
    } catch (error) {
      console.error("Error checking user role:", error);
      setIsResponder(false);
    }
  }, [user?.role]);

  // Check which alerts the current responder has accepted
  const checkAcceptedAlerts = useCallback(
    async (alertsData: AlertType[]) => {
      if (!isResponder || !user?.userId) return;

      const accepted = new Set<string>();

      // Check each alert to see if current responder has accepted it
      for (const alert of alertsData) {
        try {
          const response = await apiService.getAlertDetails(alert.id);
          if (response.success && response.data?.responders) {
            const hasAccepted = response.data.responders.some(
              (responder: any) => responder.responderId === user.userId
            );
            if (hasAccepted) {
              accepted.add(alert.id);
            }
          }
        } catch (error) {
          console.error(`Error checking alert ${alert.id}:`, error);
        }
      }

      setAcceptedAlertIds(accepted);
    },
    [isResponder, user?.userId]
  );

  // Load alerts based on user role and view mode
  const loadAlerts = useCallback(async () => {
    try {
      setLoading(true);

      // Determine which API endpoint to call based on user role and view mode
      let response;
      if (isResponder) {
        if (viewMode === "my") {
          // For responders in "my" mode, get their historical alerts (excluding ACTIVE and CANCELED)
          response = await apiService.getMyAlerts();
        } else {
          // For responders in "all" mode, get all active alerts from all users
          response = await apiService.getAllAlerts();
        }
      } else {
        // For regular users, get their own alerts
        response = await apiService.getUserAlerts();
      }

      if (response.success && (response.alerts || response.data)) {
        const alertsData = response.alerts || response.data;
        setAlerts(alertsData);

        // For responders in "all" mode, check which alerts they have accepted
        if (isResponder && viewMode === "all" && user?.userId) {
          await checkAcceptedAlerts(alertsData);
        } else {
          // Clear accepted alerts for "my" mode since the data structure is different
          setAcceptedAlertIds(new Set());
        }
      } else {
        console.error(
          "Failed to load alerts:",
          response.error || "Unknown error"
        );
        setAlerts([]);
      }
    } catch (error) {
      console.error("Error loading alerts:", error);
      setAlerts([]);
    } finally {
      setLoading(false);
    }
  }, [isResponder, viewMode, user?.userId, checkAcceptedAlerts]);

  // Get filtered alerts based on status filter
  const getFilteredAlerts = useCallback(() => {
    if (!statusFilter) {
      return alerts; // Return all alerts if no filter is set
    }

    return alerts.filter(
      (alert) => alert.status.toUpperCase() === statusFilter.toUpperCase()
    );
  }, [alerts, statusFilter]);

  // Handle status filter change
  const handleFilterChange = (status: string | null) => {
    setStatusFilter(status === statusFilter ? null : status); // Toggle off if already selected
  };

  useEffect(() => {
    // Check user role first, then load alerts
    checkUserRole().then(() => loadAlerts());
  }, [loadAlerts, user, checkUserRole]); // Re-run when user changes

  // Reload alerts when view mode changes
  useEffect(() => {
    if (isResponder) {
      loadAlerts();
    }
  }, [viewMode, loadAlerts, isResponder]);

  // Reload alerts when view mode changes for responders
  useEffect(() => {
    if (isResponder) {
      loadAlerts();
    }
  }, [viewMode, isResponder, loadAlerts]);

  // Re-check user role when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      checkUserRole().then(() => loadAlerts());
    }, [loadAlerts, checkUserRole])
  );

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

  const handleViewAlertDetails = async (alert: AlertType) => {
    try {
      setSelectedAlert(alert);
      setLoadingDetails(true);

      const response = await apiService.getAlertDetails(alert.id);

      if (response.success) {
        setAlertDetails(response);
        setShowAlertDetails(true);
      } else {
        showAlert(
          "Error",
          response.error || "Failed to load alert details. Please try again.",
          "error"
        );
      }
    } catch (error) {
      console.error("Error fetching alert details:", error);
      showAlert(
        "Error",
        "An error occurred while loading alert details.",
        "error"
      );
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleNavigateToResponder = async (alert: AlertType) => {
    try {
      if (!alert.latitude || !alert.longitude) {
        showAlert(
          "Error",
          "Alert location is not available for navigation",
          "error"
        );
        return;
      }

      // For users, navigate to responder location
      // For responders, navigate to user location
      const targetLocation = {
        latitude: alert.latitude,
        longitude: alert.longitude,
        address: alert.address || "Alert Location",
      };

      router.push({
        pathname: "/navigation" as any,
        params: {
          alertId: alert.id,
          userRole: isResponder ? "RESPONDER" : "USER",
          targetLocation: JSON.stringify(targetLocation),
          targetUserId: isResponder ? alert.userId : "responder", // This should come from alert details
        },
      });
    } catch (error) {
      console.error("Error navigating to responder:", error);
      showAlert(
        "Error",
        "Failed to start navigation. Please try again.",
        "error"
      );
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case AlertStatus.ACTIVE:
        return "text-red-600 bg-red-50 border-red-200";
      case AlertStatus.ACCEPTED:
        return "text-blue-600 bg-blue-50 border-blue-200";
      case AlertStatus.CANCELED:
        return "text-orange-600 bg-orange-50 border-orange-200";
      case AlertStatus.RESOLVED:
        return "text-green-600 bg-green-50 border-green-200";
      case AlertStatus.CRITICAL:
        return "text-purple-600 bg-purple-50 border-purple-200";
      case AlertStatus.FALSE_ALARM:
        return "text-gray-600 bg-gray-50 border-gray-200";
      case AlertStatus.REJECTED:
        return "text-red-600 bg-red-50 border-red-200";
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
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* {!isResponder && (
          <>
            Quick Emergency Actions
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
        )} */}

        {/* Alerts */}
        <View className="bg-white rounded-lg p-4 shadow-sm">
          <Text className="text-lg font-bold text-[#67082F] mb-4">
            {isResponder ? "All System Alerts" : "Your Alert History"}
          </Text>

          {/* View Mode Toggle - Only show for responders */}
          {isResponder && (
            <View className="bg-white rounded-lg p-4 shadow-sm mb-4">
              <Text className="text-lg font-bold text-[#67082F] mb-3">
                Alert View
              </Text>
              <View className="flex-row">
                <TouchableOpacity
                  className={`flex-1 py-3 px-4 rounded-l-lg border ${
                    viewMode === "all"
                      ? "bg-[#67082F] border-[#67082F]"
                      : "bg-white border-gray-300"
                  }`}
                  onPress={() => setViewMode("all")}
                >
                  <Text
                    className={`text-center font-medium ${
                      viewMode === "all" ? "text-white" : "text-gray-700"
                    }`}
                  >
                    All Alerts
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className={`flex-1 py-3 px-4 rounded-r-lg border-l-0 border ${
                    viewMode === "my"
                      ? "bg-[#67082F] border-[#67082F]"
                      : "bg-white border-gray-300"
                  }`}
                  onPress={() => setViewMode("my")}
                >
                  <Text
                    className={`text-center font-medium ${
                      viewMode === "my" ? "text-white" : "text-gray-700"
                    }`}
                  >
                    My Alerts
                  </Text>
                </TouchableOpacity>
              </View>
              <Text className="text-sm text-gray-500 mt-2 text-center">
                {viewMode === "all"
                  ? "View all active alerts from users"
                  : "View your accepted alerts history (you can update status)"}
              </Text>
            </View>
          )}

          {/* Status Filters - Only show for responders in "all" mode */}
          {isResponder && viewMode === "all" && (
            <View className="flex-row flex-wrap mb-4">
              <Text className="text-gray-700 mr-2 self-center">
                Filter by:{" "}
              </Text>
              {[
                AlertStatus.ACTIVE,
                AlertStatus.ACCEPTED,
                AlertStatus.RESOLVED,
                AlertStatus.CANCELED,
                AlertStatus.CRITICAL,
                AlertStatus.FALSE_ALARM,
                AlertStatus.REJECTED,
              ].map((status) => (
                <TouchableOpacity
                  key={status}
                  className={`px-3 py-1 rounded-full mr-2 mb-2 border ${
                    statusFilter === status
                      ? "bg-blue-100 border-blue-500"
                      : "bg-gray-50 border-gray-300"
                  }`}
                  onPress={() => handleFilterChange(status)}
                >
                  <Text
                    className={`text-xs font-medium ${
                      statusFilter === status
                        ? "text-blue-700"
                        : "text-gray-600"
                    }`}
                  >
                    {status}
                  </Text>
                </TouchableOpacity>
              ))}
              {statusFilter && (
                <TouchableOpacity
                  className="px-3 py-1 rounded-full mr-2 mb-2 bg-red-50 border border-red-300"
                  onPress={() => setStatusFilter(null)}
                >
                  <Text className="text-xs font-medium text-red-600">
                    Clear Filter
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {loading ? (
            <View className="items-center py-8">
              <ActivityIndicator size="large" color="#67082F" />
              <Text className="text-gray-500 mt-4">Loading alerts...</Text>
            </View>
          ) : getFilteredAlerts().length === 0 ? (
            <View className="items-center py-8">
              <MaterialIcons name="history" size={48} color="#9CA3AF" />
              <Text className="text-gray-500 mt-2 text-center">
                {isResponder
                  ? statusFilter
                    ? `No ${statusFilter.toLowerCase()} alerts found`
                    : "No alerts in the system at the moment"
                  : "No emergency alerts yet"}
              </Text>
              <Text className="text-gray-400 text-sm text-center mt-1">
                {isResponder
                  ? statusFilter
                    ? "Try changing or clearing the filter"
                    : "All system alerts from users will appear here"
                  : "Your emergency alert history will appear here"}
              </Text>
            </View>
          ) : (
            getFilteredAlerts().map((alert) => (
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
                      {/* View Details button */}
                      <TouchableOpacity
                        className="bg-purple-100 rounded-md py-2 px-3 mr-2 flex-row items-center"
                        onPress={() => handleViewAlertDetails(alert)}
                      >
                        <MaterialIcons name="info" size={16} color="#7E22CE" />
                        <Text className="text-purple-700 text-xs font-medium ml-1">
                          View Details
                        </Text>
                      </TouchableOpacity>

                      {/* Update Report button - Always available for users, conditional for responders */}
                      {!isResponder ? (
                        // For users: Always show "Update Report"
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
                      ) : // For responders: Show "Update Report" if accepted, "View Report" if not
                      acceptedAlertIds.has(alert.id) ? (
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
                      ) : (
                        <TouchableOpacity
                          className="bg-gray-100 rounded-md py-2 px-3 mr-2 flex-row items-center"
                          onPress={() => handleViewUpdateReport(alert)}
                        >
                          <MaterialIcons
                            name="description"
                            size={16}
                            color="#6B7280"
                          />
                          <Text className="text-gray-500 text-xs font-medium ml-1">
                            View Report
                          </Text>
                        </TouchableOpacity>
                      )}

                      {/* Navigation button */}
                      {!isResponder
                        ? // For users: Show navigation for ACCEPTED and CRITICAL alerts
                          (alert.status === AlertStatus.ACCEPTED ||
                            alert.status === AlertStatus.CRITICAL) && (
                            <TouchableOpacity
                              className="bg-green-100 rounded-md py-2 px-3 mr-2 flex-row items-center"
                              onPress={() => handleNavigateToResponder(alert)}
                            >
                              <MaterialIcons
                                name="navigation"
                                size={16}
                                color="#059669"
                              />
                              <Text className="text-green-700 text-xs font-medium ml-1">
                                Navigate
                              </Text>
                            </TouchableOpacity>
                          )
                        : // For responders: Show navigation only if they have accepted the alert
                          acceptedAlertIds.has(alert.id) && (
                            <TouchableOpacity
                              className="bg-green-100 rounded-md py-2 px-3 mr-2 flex-row items-center"
                              onPress={() => handleNavigateToResponder(alert)}
                            >
                              <MaterialIcons
                                name="navigation"
                                size={16}
                                color="#059669"
                              />
                              <Text className="text-green-700 text-xs font-medium ml-1">
                                Navigate
                              </Text>
                            </TouchableOpacity>
                          )}

                      {/* Cancel button - only show for active alerts owned by user */}
                      {alert.status === AlertStatus.ACTIVE && !isResponder && (
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

      <AlertDetailsModal
        visible={showAlertDetails}
        onClose={() => setShowAlertDetails(false)}
        alert={selectedAlert}
        alertDetails={alertDetails}
        isResponder={isResponder}
        isAcceptedResponder={
          isResponder && viewMode === "my"
            ? true // In "My Alerts" mode, responder can always update status since these are their accepted alerts
            : selectedAlert?.id
            ? acceptedAlertIds.has(selectedAlert.id)
            : false
        }
        loadingDetails={loadingDetails}
        onStatusUpdate={onRefresh}
      />
    </View>
  );
}
