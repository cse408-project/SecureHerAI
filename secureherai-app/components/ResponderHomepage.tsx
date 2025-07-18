import { View, Text, TouchableOpacity, ScrollView, RefreshControl } from "react-native";
import { useEffect, useRef, useState, useCallback } from "react";
import { StatusBar } from "expo-status-bar";
import { MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useAlert } from "../context/AlertContext";
import { useNotifications } from "../context/NotificationContext";
import Header from "./Header";
import NotificationModal from "./NotificationModal";
import { Alert as AlertType } from "../types/sos";
import apiService from "../services/api";

export default function ResponderHomepage() {
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [pendingAlerts, setPendingAlerts] = useState<AlertType[]>([]);
  const [acceptedAlerts, setAcceptedAlerts] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const { showAlert, showConfirmAlert } = useAlert();
  const { refreshNotificationCount } = useNotifications();

  const loadAlerts = useCallback(async () => {
    try {
      setLoading(true);
      console.log("ResponderHomepage: Loading pending and accepted alerts");
      
      // Load both pending and accepted alerts in parallel
      const [pendingResponse, acceptedResponse] = await Promise.all([
        apiService.getPendingAlerts(),
        apiService.getAcceptedAlerts()
      ]);
      
      if (pendingResponse.success && pendingResponse.data) {
        console.log("ResponderHomepage: Loaded", pendingResponse.data.length, "pending alerts");
        setPendingAlerts(pendingResponse.data);
      } else {
        console.error("ResponderHomepage: Failed to load pending alerts:", pendingResponse.error || "Unknown error");
        setPendingAlerts([]);
      }

      if (acceptedResponse.success && acceptedResponse.data) {
        console.log("ResponderHomepage: Loaded", acceptedResponse.data.length, "accepted alerts");
        setAcceptedAlerts(acceptedResponse.data);
      } else {
        console.error("ResponderHomepage: Failed to load accepted alerts:", acceptedResponse.error || "Unknown error");
        setAcceptedAlerts([]);
      }
    } catch (error) {
      console.error("ResponderHomepage: Error loading alerts:", error);
      setPendingAlerts([]);
      setAcceptedAlerts([]);
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
          // Get the alert details to extract the user ID
          const alertDetails = pendingAlerts.find(alert => alert.id === alertId);
          if (!alertDetails) {
            showAlert("Error", "Alert not found. Please refresh and try again.", "error");
            return;
          }

          // Accept the emergency alert
          const response = await apiService.acceptEmergencyResponse({
            alertId: alertId,
            alertUserId: alertDetails.userId,
            responderName: "Emergency Responder" // You might want to get this from user profile
          });

          if (response.success) {
            showAlert("Success", "Emergency alert accepted. Coordinates sent to your device.", "success");
            loadAlerts(); // Refresh the list to move alert from pending to accepted
          } else {
            showAlert("Error", response.error || "Failed to accept alert. Please try again.", "error");
          }
        } catch (error) {
          console.error("Error accepting alert:", error);
          showAlert("Error", "Failed to accept alert. Please try again.", "error");
        }
      },
      undefined,
      "info"
    );
  };

  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const alertTime = new Date(dateString);
    const diffInMinutes = Math.floor((now.getTime() - alertTime.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  const getAlertTypeIcon = (triggerMethod: string) => {
    switch (triggerMethod?.toLowerCase()) {
      case 'voice':
        return 'record-voice-over';
      case 'text':
        return 'message';
      case 'manual':
        return 'touch-app';
      default:
        return 'warning';
    }
  };

  const getAlertTypeColor = (triggerMethod: string) => {
    switch (triggerMethod?.toLowerCase()) {
      case 'voice':
        return '#F59E0B'; // amber
      case 'text':
        return '#3B82F6'; // blue
      case 'manual':
        return '#EF4444'; // red
      default:
        return '#6B7280'; // gray
    }
  };

  const getPriorityLevel = (alert: AlertType) => {
    const alertAge = new Date().getTime() - new Date(alert.triggeredAt).getTime();
    const ageInMinutes = alertAge / (1000 * 60);
    
    if (ageInMinutes < 5) return { level: "CRITICAL", color: "#DC2626", bgColor: "#FEE2E2" };
    if (ageInMinutes < 15) return { level: "HIGH", color: "#EA580C", bgColor: "#FED7AA" };
    if (ageInMinutes < 60) return { level: "MEDIUM", color: "#D97706", bgColor: "#FEF3C7" };
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
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Quick Stats */}
        <View className="mb-6">
          <View className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <Text className="text-lg font-bold text-gray-800 mb-3">📊 Response Overview</Text>
            <View className="flex-row justify-between">
              <View className="items-center">
                <Text className="text-2xl font-bold text-red-600">{pendingAlerts.length}</Text>
                <Text className="text-sm text-gray-600">Pending Alerts</Text>
              </View>
              <View className="items-center">
                <Text className="text-2xl font-bold text-green-600">
                  {pendingAlerts.filter((alert: AlertType) => new Date().getTime() - new Date(alert.triggeredAt).getTime() < 5 * 60 * 1000).length}
                </Text>
                <Text className="text-sm text-gray-600">Critical (&lt;5m)</Text>
              </View>
              <View className="items-center">
                <Text className="text-2xl font-bold text-blue-600">
                  {acceptedAlerts.length}
                </Text>
                <Text className="text-sm text-gray-600">Accepted</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View className="mb-6">
          <Text className="text-lg font-bold text-gray-800 mb-3">🚀 Quick Actions</Text>
          <View className="flex-row justify-between">
            <TouchableOpacity 
              className="bg-blue-600 rounded-lg p-4 flex-1 mr-2 items-center"
              onPress={() => router.push("/reports/submit" as any)}
            >
              <MaterialIcons name="assignment" size={24} color="white" />
              <Text className="text-white font-semibold mt-1 text-center">Submit Report</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              className="bg-green-600 rounded-lg p-4 flex-1 ml-2 items-center"
              onPress={() => router.push("/settings" as any)}
            >
              <MaterialIcons name="settings" size={24} color="white" />
              <Text className="text-white font-semibold mt-1 text-center">Status Settings</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Pending Alerts Section */}
        <View className="mb-6">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-lg font-bold text-gray-800">🚨 Pending Emergency Alerts</Text>
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
              <Text className="text-gray-800 text-lg font-semibold mt-2">All Clear</Text>
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
                          style={{ backgroundColor: alertTypeColor + '20' }}
                        >
                          <MaterialIcons
                            name={getAlertTypeIcon(alert.triggerMethod)}
                            size={20}
                            color={alertTypeColor}
                          />
                        </View>
                        <View>
                          <Text className="font-bold text-gray-800 text-base">
                            Emergency Alert #{alert.id.slice(-8).toUpperCase()}
                          </Text>
                          <Text className="text-gray-500 text-sm">
                            {getTimeAgo(alert.triggeredAt)}
                          </Text>
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
                        <MaterialIcons name="location-on" size={16} color="#6B7280" />
                        <Text className="text-gray-600 ml-1 flex-1">
                          {alert.address || `${alert.latitude}, ${alert.longitude}`}
                        </Text>
                      </View>
                      
                      {alert.alertMessage && (
                        <View className="flex-row items-start mb-2">
                          <MaterialIcons name="message" size={16} color="#6B7280" />
                          <Text className="text-gray-600 ml-1 flex-1">
                            "{alert.alertMessage}"
                          </Text>
                        </View>
                      )}
                      
                      <View className="flex-row items-center">
                        <MaterialIcons name="access-time" size={16} color="#6B7280" />
                        <Text className="text-gray-600 ml-1">
                          Trigger Method: {alert.triggerMethod?.charAt(0).toUpperCase() + alert.triggerMethod?.slice(1)}
                        </Text>
                      </View>
                    </View>

                    {/* Action Buttons */}
                    <View className="flex-row space-x-2">
                      <TouchableOpacity
                        className="bg-red-600 rounded-lg px-4 py-2 flex-1"
                        onPress={() => handleAcceptAlert(alert.id)}
                      >
                        <Text className="text-white font-semibold text-center">Accept & Respond</Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity
                        className="bg-gray-100 rounded-lg px-4 py-2"
                        onPress={() => {
                          // TODO: Navigate to alert details
                          showAlert("Info", "Alert details feature coming soon", "info");
                        }}
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
            <Text className="text-lg font-bold text-gray-800">✅ Accepted/Current Alerts</Text>
          </View>

          {acceptedAlerts.length === 0 ? (
            <View className="bg-white rounded-xl p-8 items-center">
              <MaterialIcons name="assignment-turned-in" size={48} color="#6B7280" />
              <Text className="text-gray-800 text-lg font-semibold mt-2">No Accepted Alerts</Text>
              <Text className="text-gray-500 text-center mt-1">
                Alerts you've accepted will appear here
              </Text>
            </View>
          ) : (
            <View className="space-y-3">
              {acceptedAlerts.map((alertResponder: any) => (
                <View
                  key={`${alertResponder.alertId}-${alertResponder.responderId}`}
                  className="bg-green-50 rounded-xl p-4 shadow-sm border border-green-200"
                >
                  {/* Header */}
                  <View className="flex-row items-start justify-between mb-3">
                    <View className="flex-row items-center">
                      <View className="w-10 h-10 rounded-full items-center justify-center mr-3 bg-green-200">
                        <MaterialIcons name="check-circle" size={20} color="#059669" />
                      </View>
                      <View>
                        <Text className="font-bold text-gray-800 text-base">
                          Alert #{alertResponder.alertId.slice(-8).toUpperCase()}
                        </Text>
                        <Text className="text-green-600 text-sm">
                          Accepted on {new Date(alertResponder.acceptedAt).toLocaleDateString()}
                        </Text>
                      </View>
                    </View>
                    
                    <View className="bg-green-100 px-2 py-1 rounded-full">
                      <Text className="text-xs font-semibold text-green-700">
                        {alertResponder.status?.toUpperCase() || 'ACCEPTED'}
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
                      className="bg-blue-600 rounded-lg px-4 py-2 flex-1"
                      onPress={() => {
                        showAlert("Info", "Update status feature coming soon", "info");
                      }}
                    >
                      <Text className="text-white font-semibold text-center">Update Status</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      className="bg-gray-100 rounded-lg px-4 py-2"
                      onPress={() => {
                        showAlert("Info", "View details feature coming soon", "info");
                      }}
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
        <View className="mb-6">
          <Text className="text-lg font-bold text-gray-800 mb-3">📱 Navigation</Text>
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
              <Text className="text-gray-700 ml-3 flex-1">Responder Settings</Text>
              <MaterialIcons name="chevron-right" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <NotificationModal
        visible={showNotifications}
        onClose={() => setShowNotifications(false)}
      />
    </View>
  );
}
