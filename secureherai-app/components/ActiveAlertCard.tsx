import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Alert as AlertType } from "../types/sos";
import { AlertStatus, ResponderStatus } from "../types/AlertStatus";
import { useAlert } from "../context/AlertContext";
import { useNotifications } from "../context/NotificationContext";
import apiService from "../services/api";

// Constants for poke feature
const POKE_COOLDOWN_SECONDS = 10;
const MAX_POKES = 2; // Same as MAX_RESPONDERS in backend

interface ActiveAlertCardProps {
  alert: AlertType;
  onRefresh: () => void;
  onCancel: (alertId: string) => void;
}

export default function ActiveAlertCard({
  alert,
  onRefresh,
  onCancel,
}: ActiveAlertCardProps) {
  const { showAlert: showAlertModal, showConfirmAlert } = useAlert();
  const { emergencyAlerts, connectRealtime } = useNotifications();
  const [isPoking, setIsPoking] = useState(false);
  const [pokeCooldown, setPokeCooldown] = useState(0);
  const [pokeCount, setPokeCount] = useState(0);
  const [showSeverityModal, setShowSeverityModal] = useState(false);
  const [alertDetails, setAlertDetails] = useState<any>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(true);
  const [isCanceling, setIsCanceling] = useState(false);
  const [isGettingReport, setIsGettingReport] = useState(false);

  // Severity options
  const severityOptions = [
    { value: "LOW", label: "Low", color: "#10B981", icon: "info" },
    { value: "MEDIUM", label: "Medium", color: "#F59E0B", icon: "warning" },
    { value: "HIGH", label: "High", color: "#EF4444", icon: "error" },
    {
      value: "CRITICAL",
      label: "Critical",
      color: "#B91C1C",
      icon: "dangerous",
    },
  ];

  // Load alert details
  const loadAlertDetails = useCallback(async () => {
    try {
      setIsLoadingDetails(true);
      const response = await apiService.getAlertDetails(alert.id);
      if (response.success) {
        setAlertDetails(response);
        // Get poke count from response if available
        if (response.alert && response.alert.pokeCount !== undefined) {
          setPokeCount(response.alert.pokeCount);
        }
      }
    } catch (error) {
      console.error("Error loading alert details:", error);
    } finally {
      setIsLoadingDetails(false);
    }
  }, [alert.id]);

  useEffect(() => {
    loadAlertDetails();
    connectRealtime(); // Connect WebSocket for real-time updates

    // Reduced polling interval to 120 seconds for faster fallback
    // WebSocket now has 4s heartbeat so updates should be near-instant
    const statusPollInterval = setInterval(() => {
      loadAlertDetails();
    }, 120000);

    return () => {
      clearInterval(statusPollInterval);
    };
  }, [loadAlertDetails, connectRealtime]);

  // Refresh alert details when receiving WebSocket updates
  useEffect(() => {
    if (emergencyAlerts.length > 0) {
      // Check if any emergency alert relates to this alert
      console.log("📡 WebSocket update received, refreshing alert details...");
      loadAlertDetails();
      onRefresh();
    }
  }, [emergencyAlerts, loadAlertDetails, onRefresh]);

  // Cooldown timer
  useEffect(() => {
    if (pokeCooldown > 0) {
      const timer = setTimeout(() => {
        setPokeCooldown(pokeCooldown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [pokeCooldown]);

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case "WAITING":
        return {
          bg: "bg-yellow-100",
          text: "text-yellow-700",
          border: "border-yellow-400",
          label: "Waiting for Responder",
        };
      case "ACTIVE":
        return {
          bg: "bg-green-100",
          text: "text-green-700",
          border: "border-green-400",
          label: "Responder Active",
        };
      default:
        return {
          bg: "bg-gray-100",
          text: "text-gray-700",
          border: "border-gray-400",
          label: status,
        };
    }
  };

  const handlePoke = async () => {
    if (pokeCooldown > 0 || pokeCount >= MAX_POKES) return;

    setIsPoking(true);
    try {
      const response = await apiService.pokeAlert(alert.id);
      if (response.success) {
        setPokeCount((prev) => prev + 1);
        setPokeCooldown(POKE_COOLDOWN_SECONDS);
        showAlertModal(
          "Poke Sent",
          "Your alert has been sent to additional nearby responders.",
          "success",
        );
        // Refresh alert details to get updated responder count
        loadAlertDetails();
      } else {
        showAlertModal(
          "Error",
          response.error || "Failed to poke alert",
          "error",
        );
      }
    } catch (error) {
      console.error("Error poking alert:", error);
      showAlertModal("Error", "Failed to send poke", "error");
    } finally {
      setIsPoking(false);
    }
  };

  const handleChangeSeverity = async (newSeverity: string) => {
    try {
      const response = await apiService.updateAlertSeverity(
        alert.id,
        newSeverity,
      );
      if (response.success) {
        showAlertModal("Success", "Severity updated successfully", "success");
        setShowSeverityModal(false);
        onRefresh();
      } else {
        showAlertModal(
          "Error",
          response.error || "Failed to update severity",
          "error",
        );
      }
    } catch (error) {
      console.error("Error updating severity:", error);
      showAlertModal("Error", "Failed to update severity", "error");
    }
  };

  const handleEditReport = async () => {
    setIsGettingReport(true);
    try {
      const data = await apiService.getReportByAlertId(alert.id);
      if (data.report && data.report.reportId) {
        router.push(
          `/reports/details?id=${data.report.reportId}&mode=update&fromAlert=true` as any,
        );
      } else {
        showAlertModal("Info", "No report found for this alert.", "info");
      }
    } catch (error) {
      console.error("Error getting report:", error);
      showAlertModal("Error", "Failed to load report.", "error");
    } finally {
      setIsGettingReport(false);
    }
  };

  const handleCancel = () => {
    showConfirmAlert(
      "Cancel Alert",
      "Are you sure you want to cancel this alert? Responders will be notified.",
      async () => {
        setIsCanceling(true);
        try {
          await onCancel(alert.id);
        } finally {
          setIsCanceling(false);
        }
      },
      undefined,
      "warning",
    );
  };

  const handleNavigate = async () => {
    try {
      // Check if any responder is in an active state (ACCEPTED, EN_ROUTE, or ARRIVED)
      const activeResponder = alertDetails?.responders?.find(
        (r: any) =>
          r.status === ResponderStatus.ACCEPTED ||
          r.status === ResponderStatus.EN_ROUTE ||
          r.status === ResponderStatus.ARRIVED,
      );

      if (!activeResponder) {
        showAlertModal(
          "Info",
          "No active responder available for navigation",
          "info",
        );
        return;
      }

      // Get alert location for navigation (victim navigates to see responder coming to them)
      if (!alert.latitude || !alert.longitude) {
        showAlertModal(
          "Error",
          "Alert location is not available for navigation",
          "error",
        );
        return;
      }

      // Navigate to NavigationScreen with user role
      const targetLocation = {
        latitude: alert.latitude,
        longitude: alert.longitude,
        address: alert.address || "Alert Location",
      };

      router.push({
        pathname: "/navigation" as any,
        params: {
          alertId: alert.id,
          userRole: "USER",
          targetLocation: JSON.stringify(targetLocation),
          targetUserId: activeResponder.responderId || "responder",
        },
      });
    } catch (error) {
      console.error("Error starting navigation:", error);
      showAlertModal(
        "Error",
        "Failed to start navigation. Please try again.",
        "error",
      );
    }
  };

  const statusColors = getStatusColor(alert.status);
  const canPoke =
    pokeCooldown === 0 &&
    pokeCount < MAX_POKES &&
    alert.status === AlertStatus.WAITING;

  // Get responder status info - simple status order: ACCEPTED > EN_ROUTE > ARRIVED
  const getResponderStatusText = () => {
    if (!alertDetails?.responders || alertDetails.responders.length === 0) {
      return "Searching for responders...";
    }

    const accepted = alertDetails.responders.filter(
      (r: any) => r.status === ResponderStatus.ACCEPTED,
    );
    const pending = alertDetails.responders.filter(
      (r: any) => r.status === ResponderStatus.PENDING,
    );
    const enRoute = alertDetails.responders.filter(
      (r: any) => r.status === ResponderStatus.EN_ROUTE,
    );
    const arrived = alertDetails.responders.filter(
      (r: any) => r.status === ResponderStatus.ARRIVED,
    );
    const forwarded = alertDetails.responders.filter(
      (r: any) => r.status === ResponderStatus.FORWARDED,
    );
    const canceled = alertDetails.responders.filter(
      (r: any) => r.status === ResponderStatus.CANCELED,
    );
    const rejected = alertDetails.responders.filter(
      (r: any) => r.status === ResponderStatus.REJECTED,
    );

    // Priority order: ACCEPTED > EN_ROUTE > ARRIVED
    if (accepted.length > 0) {
      return `✅ ${accepted.length} responder(s) accepted`;
    }
    if (enRoute.length > 0) {
      return `🚗 ${enRoute.length} responder(s) on the way`;
    }
    if (arrived.length > 0) {
      return `🎉 ${arrived.length} responder(s) arrived`;
    }
    if (pending.length > 0) {
      return `⏳ ${pending.length} responder(s) notified, waiting...`;
    }
    if (forwarded.length > 0 || canceled.length > 0 || rejected.length > 0) {
      return "Searching for more responders...";
    }
    return "No responders yet";
  };

  // Get detailed responder breakdown for display
  const getResponderBreakdown = () => {
    if (!alertDetails?.responders || alertDetails.responders.length === 0) {
      return null;
    }

    const statusCounts: Record<string, number> = {};
    alertDetails.responders.forEach((r: any) => {
      statusCounts[r.status] = (statusCounts[r.status] || 0) + 1;
    });

    return statusCounts;
  };

  // Get style for each responder status
  const getResponderStatusStyle = (status: string) => {
    switch (status) {
      case ResponderStatus.PENDING:
        return { bg: "bg-yellow-100", color: "#D97706", icon: "schedule" };
      case ResponderStatus.ACCEPTED:
        return { bg: "bg-green-100", color: "#059669", icon: "check-circle" };
      case ResponderStatus.EN_ROUTE:
        return { bg: "bg-blue-100", color: "#2563EB", icon: "directions-car" };
      case ResponderStatus.ARRIVED:
        return { bg: "bg-emerald-100", color: "#10B981", icon: "location-on" };
      case ResponderStatus.FORWARDED:
        return { bg: "bg-purple-100", color: "#7C3AED", icon: "forward" };
      case ResponderStatus.CANCELED:
        return { bg: "bg-gray-100", color: "#6B7280", icon: "cancel" };
      case ResponderStatus.REJECTED:
        return { bg: "bg-red-100", color: "#DC2626", icon: "close" };
      case ResponderStatus.RESOLVED:
        return { bg: "bg-teal-100", color: "#14B8A6", icon: "done-all" };
      default:
        return { bg: "bg-gray-100", color: "#6B7280", icon: "help" };
    }
  };

  return (
    <View className="bg-white rounded-xl shadow-md mx-4 mb-3 border-l-4 border-[#67082F] overflow-hidden">
      {/* Header */}
      <View className={`p-3 ${statusColors.bg}`}>
        <View className="flex-row items-center justify-between mb-1.5">
          <View className="flex-row items-center">
            <MaterialIcons name="emergency" size={22} color="#67082F" />
            <Text className="text-[#67082F] font-bold text-base ml-2">
              Active Alert
            </Text>
          </View>
          <View
            className={`px-2.5 py-0.5 rounded-full ${statusColors.bg} border ${statusColors.border}`}
          >
            <Text className={`text-xs font-semibold ${statusColors.text}`}>
              {statusColors.label}
            </Text>
          </View>
        </View>

        {/* Alert Status Explanation */}
        <View className="mb-1.5 p-1.5 bg-white/60 rounded-md">
          <View className="flex-row items-center">
            <MaterialIcons
              name={
                alert.status === AlertStatus.WAITING
                  ? "hourglass-top"
                  : "check-circle"
              }
              size={14}
              color={
                alert.status === AlertStatus.WAITING ? "#D97706" : "#059669"
              }
            />
            <Text
              className="text-xs font-medium ml-1.5"
              style={{
                color:
                  alert.status === AlertStatus.WAITING ? "#D97706" : "#059669",
              }}
            >
              {alert.status === AlertStatus.WAITING
                ? "WAITING - No responder accepted yet"
                : "ACTIVE - A responder is helping you"}
            </Text>
          </View>
        </View>

        {/* Responder Status */}
        <View className="flex-row items-center mt-1">
          <MaterialIcons name="people" size={14} color="#6B7280" />
          <Text className="text-gray-600 text-xs ml-1.5">
            {isLoadingDetails ? "Loading..." : getResponderStatusText()}
          </Text>
        </View>

        {/* Responder Status Breakdown */}
        {!isLoadingDetails && getResponderBreakdown() && (
          <View className="mt-1.5 flex-row flex-wrap gap-1">
            {Object.entries(getResponderBreakdown()!).map(([status, count]) => {
              const statusStyle = getResponderStatusStyle(status);
              return (
                <View
                  key={status}
                  className={`px-1.5 py-0.5 rounded-full flex-row items-center ${statusStyle.bg}`}
                >
                  <MaterialIcons
                    name={statusStyle.icon as any}
                    size={9}
                    color={statusStyle.color}
                  />
                  <Text
                    className="text-[10px] ml-0.5"
                    style={{ color: statusStyle.color }}
                  >
                    {count} {status.toLowerCase()}
                  </Text>
                </View>
              );
            })}
          </View>
        )}

        {/* Alert Message */}
        {alert.alertMessage && (
          <View className="mt-2 pt-1.5 border-t border-gray-200/50 flex-row items-start">
            <MaterialIcons
              name="message"
              size={14}
              color="#6B7280"
              style={{ marginTop: 2 }}
            />
            <Text className="text-gray-700 text-xs italic ml-1.5 flex-1">
              &quot;{alert.alertMessage}&quot;
            </Text>
          </View>
        )}
      </View>

      {/* Action Buttons */}
      <View className="p-2.5 bg-[#FFF5F0]">
        <View className="flex-row flex-wrap gap-1.5">
          {/* Severity Change */}
          <TouchableOpacity
            className="flex-1 min-w-[45%] flex-row items-center justify-center px-2.5 py-1.5 bg-blue-50 rounded-lg border border-blue-200"
            onPress={() => setShowSeverityModal(true)}
          >
            <MaterialIcons name="flag" size={14} color="#3B82F6" />
            <Text className="text-blue-700 text-xs font-medium ml-1">
              Severity
            </Text>
          </TouchableOpacity>

          {/* Navigate (only when alert is ACTIVE) */}
          {alert.status === AlertStatus.ACTIVE && (
            <TouchableOpacity
              className="flex-1 min-w-[45%] flex-row items-center justify-center px-2.5 py-1.5 bg-green-50 rounded-lg border border-green-200"
              onPress={handleNavigate}
            >
              <MaterialIcons name="navigation" size={14} color="#059669" />
              <Text className="text-green-700 text-xs font-medium ml-1">
                Navigate
              </Text>
            </TouchableOpacity>
          )}

          {/* Poke (only when waiting) */}
          {alert.status === AlertStatus.WAITING && (
            <TouchableOpacity
              className={`flex-1 min-w-[45%] flex-row items-center justify-center px-2.5 py-1.5 rounded-lg border ${
                canPoke
                  ? "bg-purple-50 border-purple-200"
                  : "bg-gray-100 border-gray-200"
              }`}
              onPress={handlePoke}
              disabled={!canPoke || isPoking}
            >
              {isPoking ? (
                <ActivityIndicator size="small" color="#7C3AED" />
              ) : (
                <>
                  <MaterialIcons
                    name="notifications-active"
                    size={14}
                    color={canPoke ? "#7C3AED" : "#9CA3AF"}
                  />
                  <Text
                    className={`text-xs font-medium ml-1 ${
                      canPoke ? "text-purple-700" : "text-gray-400"
                    }`}
                  >
                    {pokeCooldown > 0
                      ? `Wait ${pokeCooldown}s`
                      : pokeCount >= MAX_POKES
                        ? `Max Pokes (${MAX_POKES})`
                        : `Poke (${pokeCount}/${MAX_POKES})`}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          )}

          {/* Edit Report Button */}
          <TouchableOpacity
            className="flex-1 min-w-[45%] flex-row items-center justify-center px-2.5 py-1.5 bg-indigo-50 rounded-lg border border-indigo-200"
            onPress={handleEditReport}
            disabled={isGettingReport}
          >
            {isGettingReport ? (
              <ActivityIndicator size="small" color="#4F46E5" />
            ) : (
              <>
                <MaterialIcons name="edit" size={14} color="#4F46E5" />
                <Text className="text-indigo-700 text-xs font-medium ml-1">
                  Edit Report
                </Text>
              </>
            )}
          </TouchableOpacity>

          {/* Cancel */}
          <TouchableOpacity
            className="flex-1 min-w-[45%] flex-row items-center justify-center px-2.5 py-1.5 bg-red-50 rounded-lg border border-red-200"
            onPress={handleCancel}
            disabled={isCanceling}
          >
            {isCanceling ? (
              <ActivityIndicator size="small" color="#B91C1C" />
            ) : (
              <>
                <MaterialIcons name="cancel" size={14} color="#B91C1C" />
                <Text className="text-red-700 text-xs font-medium ml-1">
                  Cancel
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Severity Change Modal */}
      <Modal
        visible={showSeverityModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowSeverityModal(false)}
      >
        <View className="flex-1 bg-black/50 justify-center items-center">
          <View className="bg-[#FFE4D6] rounded-2xl p-5 m-4 w-11/12 max-w-md border-2 border-[#67082F]/20 shadow-xl">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-lg font-bold text-[#67082F]">
                Change Severity
              </Text>
              <TouchableOpacity
                onPress={() => setShowSeverityModal(false)}
                className="p-1 bg-white/70 rounded-full"
              >
                <MaterialIcons name="close" size={22} color="#67082F" />
              </TouchableOpacity>
            </View>

            <View className="space-y-2">
              {severityOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  className={`flex-row items-center p-3 rounded-xl border-2 ${
                    alert.severity === option.value
                      ? "shadow-sm"
                      : "border-gray-200"
                  }`}
                  style={
                    alert.severity === option.value
                      ? {
                          borderColor: option.color,
                          backgroundColor: `${option.color}20`,
                        }
                      : { backgroundColor: "white" }
                  }
                  onPress={() => handleChangeSeverity(option.value)}
                >
                  <MaterialIcons
                    name={option.icon as any}
                    size={20}
                    color={option.color}
                  />
                  <Text
                    className="ml-3 text-sm font-semibold"
                    style={{ color: option.color }}
                  >
                    {option.label}
                  </Text>
                  {alert.severity === option.value && (
                    <MaterialIcons
                      name="check-circle"
                      size={18}
                      color={option.color}
                      style={{ marginLeft: "auto" }}
                    />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
