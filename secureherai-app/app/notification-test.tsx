import React, { useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, Alert } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useNotifications } from "../context/NotificationContext";
import { useAuth } from "../context/AuthContext";
import { NotificationType } from "../types/notification";
import Header from "../components/Header";
import NotificationModal from "../components/NotificationModal";
import AlertNotificationViewer from "../components/AlertNotificationViewer";

export default function NotificationTestScreen() {
  const { user } = useAuth();
  const {
    notifications,
    unreadCount,
    fetchNotifications,
    fetchUnreadNotifications,
    refreshNotificationCount,
    addNotification,
  } = useNotifications();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showAlertViewer, setShowAlertViewer] = useState(false);
  const [testAlertId, setTestAlertId] = useState<string>("");

  const handleTestEmergencyNotification = () => {
    // Simulate adding a test emergency notification
    const testNotification = {
      id: `test-${Date.now()}`,
      title: "Emergency Response Required",
      message: "Emergency Response Needed - Test Alert",
      type: NotificationType.EMERGENCY_REQUEST,
      isRead: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour TTL
      alertId: "test-alert-123",
      batchNumber: 1,
      recipientId: user?.userId || "",
      recipientUserId: user?.userId || "",
      recipientName: user?.fullName || "Test User",
    };

    addNotification(testNotification);
    Alert.alert(
      "Test Notification Added",
      "A test emergency notification has been added"
    );
  };

  const handleRefreshData = async () => {
    try {
      await Promise.all([
        fetchNotifications(),
        fetchUnreadNotifications(),
        refreshNotificationCount(),
      ]);
      Alert.alert("Success", "Notification data refreshed");
    } catch {
      Alert.alert("Error", "Failed to refresh notification data");
    }
  };

  return (
    <View className="flex-1 bg-gray-50">
      <Header
        title="Notification System Test"
        showNotificationDot={true}
        onNotificationPress={() => setShowNotifications(true)}
      />

      <ScrollView className="flex-1 p-4">
        <View className="bg-white rounded-lg p-4 mb-4 shadow-sm">
          <Text className="text-lg font-bold text-gray-800 mb-2">
            TTL Notification System Test
          </Text>
          <Text className="text-gray-600 mb-4">
            Test the emergency notification system with TTL functionality
          </Text>

          {/* Notification Stats */}
          <View className="bg-blue-50 p-3 rounded-lg mb-4">
            <Text className="text-blue-800 font-semibold">Current Stats:</Text>
            <Text className="text-blue-700">
              Total Notifications: {notifications.length}
            </Text>
            <Text className="text-blue-700">Unread Count: {unreadCount}</Text>
          </View>

          {/* Test Actions */}
          <View className="space-y-3">
            <TouchableOpacity
              onPress={handleTestEmergencyNotification}
              className="bg-red-500 p-3 rounded-lg flex-row items-center justify-center"
            >
              <MaterialIcons name="emergency" size={20} color="white" />
              <Text className="text-white font-semibold ml-2">
                Add Test Emergency Notification
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setShowNotifications(true)}
              className="bg-blue-500 p-3 rounded-lg flex-row items-center justify-center"
            >
              <MaterialIcons name="notifications" size={20} color="white" />
              <Text className="text-white font-semibold ml-2">
                View All Notifications ({unreadCount} unread)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleRefreshData}
              className="bg-green-500 p-3 rounded-lg flex-row items-center justify-center"
            >
              <MaterialIcons name="refresh" size={20} color="white" />
              <Text className="text-white font-semibold ml-2">
                Refresh Notification Data
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Alert Notification Viewer Test */}
        <View className="bg-white rounded-lg p-4 mb-4 shadow-sm">
          <Text className="text-lg font-bold text-gray-800 mb-2">
            Alert Notifications Viewer Test
          </Text>
          <Text className="text-gray-600 mb-4">
            Test viewing all notifications for a specific alert
          </Text>

          <View className="bg-yellow-50 p-3 rounded-lg mb-3">
            <Text className="text-yellow-800 font-semibold">
              Test Alert ID:
            </Text>
            <Text className="text-yellow-700">test-alert-123</Text>
          </View>

          <TouchableOpacity
            onPress={() => {
              setTestAlertId("test-alert-123");
              setShowAlertViewer(true);
            }}
            className="bg-purple-500 p-3 rounded-lg flex-row items-center justify-center"
          >
            <MaterialIcons name="list" size={20} color="white" />
            <Text className="text-white font-semibold ml-2">
              View Test Alert Notifications
            </Text>
          </TouchableOpacity>
        </View>

        {/* Current Notifications List */}
        <View className="bg-white rounded-lg p-4 shadow-sm">
          <Text className="text-lg font-bold text-gray-800 mb-3">
            Current Notifications
          </Text>
          {notifications.length === 0 ? (
            <Text className="text-gray-500 text-center py-4">
              No notifications yet. Add a test notification to see it here.
            </Text>
          ) : (
            <View className="space-y-2">
              {notifications.slice(0, 5).map((notification) => (
                <View
                  key={notification.id}
                  className={`p-3 rounded-lg border ${
                    notification.isRead
                      ? "bg-gray-50 border-gray-200"
                      : "bg-blue-50 border-blue-200"
                  }`}
                >
                  <Text className="font-medium text-gray-800">
                    {notification.message}
                  </Text>
                  <Text className="text-sm text-gray-500 mt-1">
                    Type: {notification.type}
                  </Text>
                  {notification.expiresAt && (
                    <Text className="text-xs text-red-600 mt-1">
                      Expires:{" "}
                      {new Date(notification.expiresAt).toLocaleString()}
                    </Text>
                  )}
                  {notification.batchNumber && (
                    <Text className="text-xs text-purple-600">
                      Batch: {notification.batchNumber}
                    </Text>
                  )}
                </View>
              ))}
              {notifications.length > 5 && (
                <Text className="text-center text-gray-500 py-2">
                  ... and {notifications.length - 5} more
                </Text>
              )}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Notification Modal */}
      <NotificationModal
        visible={showNotifications}
        onClose={() => setShowNotifications(false)}
      />

      {/* Alert Notification Viewer */}
      {showAlertViewer && (
        <View className="absolute inset-0 bg-white">
          <AlertNotificationViewer
            alertId={testAlertId}
            alertTitle="Test Alert Notifications"
            onClose={() => setShowAlertViewer(false)}
          />
        </View>
      )}
    </View>
  );
}
