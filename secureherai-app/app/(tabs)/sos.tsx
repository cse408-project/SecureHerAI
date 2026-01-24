import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Modal,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import React, { useState, useEffect, useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAlert } from "../../context/AlertContext";
import { useAuth } from "../../context/AuthContext";
import Header from "../../components/Header";
import PageControlBar from "../../components/PageControlBar";
import apiService from "../../services/api";
import { Alert as AlertType } from "../../types/sos";
import { AlertStatus, ResponderStatus } from "../../types/AlertStatus";
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
    new Set(),
  ); // Track which alerts current responder has accepted
  const [viewMode, setViewMode] = useState<"my" | "all">("my"); // Toggle between my alerts and all alerts (my first)
  const [searchQuery, setSearchQuery] = useState(""); // Search query
  const [showFilterModal, setShowFilterModal] = useState(false); // Filter modal state

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
              responder.status === ResponderStatus.ACCEPTED,
          );
        }
        return false;
      } catch (error) {
        console.error("Error checking responder status:", error);
        return false;
      }
    },
    [isResponder, user?.userId],
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
          isResponderUser,
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
          isResponderUser,
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
              (responder: any) => responder.responderId === user.userId,
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
    [isResponder, user?.userId],
  );

  // Load alerts based on user role and view mode
  const loadAlerts = useCallback(async () => {
    try {
      setLoading(true);

      // Determine which API endpoint to call based on user role and view mode
      let response;
      if (viewMode === "my") {
        if (isResponder) {
          // For responders in "my" mode, get their historical alerts (excluding ACTIVE and CANCELED)
          response = await apiService.getMyAlerts();
        } else {
          // For regular users in "my" mode, get their own alerts
          response = await apiService.getUserAlerts();
        }
      } else {
        // For "all" mode, get all alerts (both users and responders can see all)
        response = await apiService.getAllAlerts();
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
          response.error || "Unknown error",
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

  // Get filtered alerts based on status filter and search query
  const getFilteredAlerts = useCallback(() => {
    let filtered = alerts;

    // Apply status filter
    if (statusFilter) {
      filtered = filtered.filter(
        (alert) => alert.status.toUpperCase() === statusFilter.toUpperCase(),
      );
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (alert) =>
          alert.id.toLowerCase().includes(query) ||
          alert.triggerMethod?.toLowerCase().includes(query) ||
          alert.status?.toLowerCase().includes(query) ||
          alert.address?.toLowerCase().includes(query) ||
          alert.alertMessage?.toLowerCase().includes(query),
      );
    }

    return filtered;
  }, [alerts, statusFilter, searchQuery]);

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
    loadAlerts();
  }, [viewMode, loadAlerts]);

  // Re-check user role when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      checkUserRole().then(() => loadAlerts());
    }, [loadAlerts, checkUserRole]),
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
              "success",
            );
            // Refresh the alerts list
            loadAlerts();
          } else {
            showAlert(
              "Error",
              response.message || "Failed to cancel alert. Please try again.",
              "error",
            );
          }
        } catch (error) {
          console.error("Error canceling alert:", error);
          showAlert(
            "Error",
            "An error occurred while canceling the alert.",
            "error",
          );
        } finally {
          setCancelingAlertId(null);
        }
      },
      undefined,
      "warning",
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
          "error",
        );
      }
    } catch (error) {
      console.error("Error fetching alert details:", error);
      showAlert(
        "Error",
        "An error occurred while loading alert details.",
        "error",
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
          "error",
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
        "error",
      );
    }
  };

  // Use unified status color helper - consistent across app
  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case "CRITICAL":
        return "text-red-700 bg-red-100 border-red-300";
      case "ACTIVE":
        return "text-amber-700 bg-amber-100 border-amber-300";
      case "PENDING":
        return "text-orange-600 bg-orange-50 border-orange-200";
      case "ACCEPTED":
        return "text-blue-700 bg-blue-100 border-blue-300";
      case "EN_ROUTE":
        return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case "ARRIVED":
        return "text-indigo-600 bg-indigo-50 border-indigo-200";
      case "RESOLVED":
        return "text-green-700 bg-green-100 border-green-300";
      case "CANCELED":
        return "text-gray-700 bg-gray-100 border-gray-300";
      case "FALSE_ALARM":
        return "text-purple-700 bg-purple-100 border-purple-300";
      case "REJECTED":
        return "text-red-600 bg-red-50 border-red-200";
      case "FORWARDED":
        return "text-cyan-600 bg-cyan-50 border-cyan-200";
      case "EXPIRED":
        return "text-stone-600 bg-stone-50 border-stone-200";
      default:
        return "text-gray-700 bg-gray-100 border-gray-300";
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
          "success",
        );
      },
      undefined,
      "info",
    );
  };

  const handleManageContacts = () => {
    router.push("/(tabs)/contacts");
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

      {/* Standardized Control Bar */}
      <PageControlBar
        viewMode={viewMode}
        onViewModeChange={(mode) => setViewMode(mode)}
        myLabel="My Alerts"
        allLabel="All Alerts"
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search alerts..."
        onFilterPress={() => setShowFilterModal(true)}
        filterLabel="Filter"
        hasActiveFilter={statusFilter !== null}
        showAdd={false}
      />

      {/* Filter Modal */}
      <Modal
        visible={showFilterModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowFilterModal(false)}
      >
        <View className="flex-1 bg-black/50 justify-center items-center">
          <View className="bg-white rounded-lg p-6 m-4 w-11/12 max-w-md">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-lg font-bold text-[#67082F]">
                Filter Alerts
              </Text>
              <TouchableOpacity
                onPress={() => setShowFilterModal(false)}
                className="p-1 rounded-full"
              >
                <MaterialIcons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <Text className="text-sm font-semibold text-gray-700 mb-2">
              Status
            </Text>
            <View className="flex-row flex-wrap mb-4">
              {[
                AlertStatus.WAITING,
                AlertStatus.ACTIVE,
                AlertStatus.FINISHED,
                AlertStatus.EXPIRED,
              ].map((status) => (
                <TouchableOpacity
                  key={status}
                  className={`px-3 py-2 rounded-lg mr-2 mb-2 border ${
                    statusFilter === status
                      ? "bg-[#67082F] border-[#67082F]"
                      : "bg-gray-100 border-gray-200"
                  }`}
                  onPress={() => handleFilterChange(status)}
                >
                  <Text
                    className={`text-xs font-medium ${
                      statusFilter === status ? "text-white" : "text-gray-600"
                    }`}
                  >
                    {status}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View className="flex-row justify-between mt-2">
              <TouchableOpacity
                className="flex-1 mr-2 py-2.5 border border-gray-300 rounded-lg"
                onPress={() => {
                  setStatusFilter(null);
                  setShowFilterModal(false);
                }}
              >
                <Text className="text-center text-gray-700 font-medium">
                  Clear
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 ml-2 py-2.5 bg-[#67082F] rounded-lg"
                onPress={() => setShowFilterModal(false)}
              >
                <Text className="text-center text-white font-medium">
                  Apply
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <ScrollView
        className="flex-1 px-4 pb-10"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Alerts List */}
        <View className="bg-white rounded-lg p-4 shadow-sm">
          {loading ? (
            <View className="items-center py-8">
              <ActivityIndicator size="large" color="#67082F" />
              <Text className="text-gray-500 mt-4">Loading alerts...</Text>
            </View>
          ) : getFilteredAlerts().length === 0 ? (
            <View className="items-center py-8">
              <MaterialIcons
                name={searchQuery ? "search-off" : "history"}
                size={48}
                color="#9CA3AF"
              />
              <Text className="text-gray-500 mt-2 text-center">
                {searchQuery
                  ? "No alerts match your search"
                  : isResponder
                    ? statusFilter
                      ? `No ${statusFilter.toLowerCase()} alerts found`
                      : "No alerts in the system at the moment"
                    : statusFilter
                      ? `No ${statusFilter.toLowerCase()} alerts found`
                      : "No emergency alerts yet"}
              </Text>
              <Text className="text-gray-400 text-sm text-center mt-1">
                {searchQuery
                  ? "Try a different search term"
                  : isResponder
                    ? statusFilter
                      ? "Try changing or clearing the filter"
                      : "All system alerts from users will appear here"
                    : statusFilter
                      ? "Try changing or clearing the filter"
                      : "Your emergency alert history will appear here"}
              </Text>
              {(statusFilter || searchQuery) && (
                <TouchableOpacity
                  className="mt-4 px-4 py-2 bg-gray-100 rounded-lg"
                  onPress={() => {
                    setStatusFilter(null);
                    setSearchQuery("");
                  }}
                >
                  <Text className="text-gray-700 font-medium">
                    Clear Filters
                  </Text>
                </TouchableOpacity>
              )}
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
                          alert.status,
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
                        ? // For users: Show navigation for ACTIVE alerts (responder has accepted)
                          alert.status === AlertStatus.ACTIVE && (
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
