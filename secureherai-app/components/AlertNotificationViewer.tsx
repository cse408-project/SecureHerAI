import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useNotifications } from "../context/NotificationContext";
import { AlertNotificationsResponse } from "../types/notification";
import { format } from "date-fns";

interface AlertNotificationViewerProps {
  alertId: string;
  alertTitle?: string;
  onClose: () => void;
}

export default function AlertNotificationViewer({
  alertId,
  alertTitle = "Alert Notifications",
  onClose,
}: AlertNotificationViewerProps) {
  const { getAlertNotifications } = useNotifications();
  const [alertNotifications, setAlertNotifications] =
    useState<AlertNotificationsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAlertNotifications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getAlertNotifications(alertId);
      if (response) {
        setAlertNotifications(response);
      } else {
        setError("Failed to load alert notifications");
      }
    } catch (err) {
      setError("Error loading alert notifications");
      console.error("Error loading alert notifications:", err);
    } finally {
      setLoading(false);
    }
  }, [alertId, getAlertNotifications]);

  useEffect(() => {
    loadAlertNotifications();
  }, [loadAlertNotifications]);

  const formatTimestamp = (timestamp: string) => {
    try {
      return format(new Date(timestamp), "MMM dd, yyyy 'at' hh:mm a");
    } catch {
      return timestamp;
    }
  };

  const renderInAppNotifications = () => {
    if (!alertNotifications?.inAppNotifications?.length) {
      return (
        <View className="p-4 bg-gray-50 rounded-lg">
          <Text className="text-gray-500 text-center">
            No in-app notifications
          </Text>
        </View>
      );
    }

    return (
      <View className="space-y-2">
        {alertNotifications.inAppNotifications.map((notification) => (
          <View
            key={notification.id}
            className="bg-white p-4 rounded-lg border border-gray-200"
          >
            <View className="flex-row justify-between items-start mb-2">
              <Text className="font-semibold text-gray-900 flex-1">
                {notification.title}
              </Text>
              <View className="flex-row items-center space-x-2">
                {notification.batchNumber && (
                  <View className="bg-blue-100 px-2 py-1 rounded-full">
                    <Text className="text-blue-700 text-xs font-medium">
                      Batch {notification.batchNumber}
                    </Text>
                  </View>
                )}
                <View
                  className={`w-3 h-3 rounded-full ${
                    notification.isRead ? "bg-gray-300" : "bg-blue-500"
                  }`}
                />
              </View>
            </View>

            <Text className="text-gray-700 mb-3">{notification.message}</Text>

            <View className="flex-row justify-between items-center">
              <Text className="text-sm text-gray-500">
                {formatTimestamp(notification.createdAt)}
              </Text>
              {notification.expiresAt && (
                <Text className="text-sm text-orange-600">
                  Expires: {formatTimestamp(notification.expiresAt)}
                </Text>
              )}
            </View>
          </View>
        ))}
      </View>
    );
  };

  const renderEmailNotifications = () => {
    if (!alertNotifications?.emailNotifications?.length) {
      return (
        <View className="p-4 bg-gray-50 rounded-lg">
          <Text className="text-gray-500 text-center">
            No email notifications
          </Text>
        </View>
      );
    }

    return (
      <View className="space-y-2">
        {alertNotifications.emailNotifications.map((email) => (
          <View
            key={email.id}
            className="bg-white p-4 rounded-lg border border-gray-200"
          >
            <View className="flex-row justify-between items-start mb-2">
              <Text className="font-semibold text-gray-900 flex-1">
                {email.subject}
              </Text>
              <View className="flex-row items-center space-x-2">
                {email.batchNumber && (
                  <View className="bg-green-100 px-2 py-1 rounded-full">
                    <Text className="text-green-700 text-xs font-medium">
                      Batch {email.batchNumber}
                    </Text>
                  </View>
                )}
                <View
                  className={`px-2 py-1 rounded-full ${
                    email.status === "DELIVERED"
                      ? "bg-green-100"
                      : email.status === "FAILED"
                      ? "bg-red-100"
                      : "bg-yellow-100"
                  }`}
                >
                  <Text
                    className={`text-xs font-medium ${
                      email.status === "DELIVERED"
                        ? "text-green-700"
                        : email.status === "FAILED"
                        ? "text-red-700"
                        : "text-yellow-700"
                    }`}
                  >
                    {email.status}
                  </Text>
                </View>
              </View>
            </View>

            <Text className="text-gray-600 mb-2">
              To: {email.recipientEmail}
            </Text>

            <View className="flex-row justify-between items-center">
              <Text className="text-sm text-gray-500">
                Sent: {formatTimestamp(email.sentAt)}
              </Text>
            </View>
          </View>
        ))}
      </View>
    );
  };

  const renderResponderAcceptances = () => {
    if (!alertNotifications?.responderAcceptances?.length) {
      return (
        <View className="p-4 bg-gray-50 rounded-lg">
          <Text className="text-gray-500 text-center">
            No responder acceptances yet
          </Text>
        </View>
      );
    }

    return (
      <View className="space-y-2">
        {alertNotifications.responderAcceptances.map((acceptance) => (
          <View
            key={acceptance.id}
            className="bg-green-50 p-4 rounded-lg border border-green-200"
          >
            <View className="flex-row items-center mb-2">
              <MaterialIcons name="check-circle" size={20} color="#059669" />
              <Text className="font-semibold text-green-900 ml-2">
                {acceptance.responderName}
              </Text>
            </View>

            <Text className="text-green-700 mb-2">
              Accepted emergency response
            </Text>

            <Text className="text-sm text-green-600">
              {formatTimestamp(acceptance.acceptedAt)}
            </Text>
          </View>
        ))}
      </View>
    );
  };

  if (loading) {
    return (
      <View className="flex-1 bg-white p-6 justify-center items-center">
        <ActivityIndicator size="large" color="#67082F" />
        <Text className="text-gray-500 mt-4">
          Loading alert notifications...
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 bg-white p-6 justify-center items-center">
        <MaterialIcons name="error" size={48} color="#EF4444" />
        <Text className="text-red-600 text-center mt-4 mb-6">{error}</Text>
        <TouchableOpacity
          onPress={loadAlertNotifications}
          className="bg-[#67082F] px-6 py-3 rounded-lg"
        >
          <Text className="text-white font-medium">Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      {/* Header */}
      <View className="bg-[#67082F] px-4 pt-12 pb-6">
        <View className="flex-row justify-between items-center">
          <Text className="text-white text-xl font-bold flex-1">
            {alertTitle}
          </Text>
          <TouchableOpacity onPress={onClose}>
            <MaterialIcons name="close" size={24} color="white" />
          </TouchableOpacity>
        </View>

        {alertNotifications && (
          <View className="mt-4 bg-white/10 p-3 rounded-lg">
            <Text className="text-white text-sm">
              Total Notifications: {alertNotifications.totalNotifications}
            </Text>
            <Text className="text-white text-sm">Alert ID: {alertId}</Text>
          </View>
        )}
      </View>

      <ScrollView className="flex-1 p-4">
        {/* Responder Acceptances */}
        <View className="mb-6">
          <Text className="text-lg font-bold text-gray-900 mb-3">
            Emergency Responses
          </Text>
          {renderResponderAcceptances()}
        </View>

        {/* In-App Notifications */}
        <View className="mb-6">
          <Text className="text-lg font-bold text-gray-900 mb-3">
            In-App Notifications
          </Text>
          {renderInAppNotifications()}
        </View>

        {/* Email Notifications */}
        <View className="mb-6">
          <Text className="text-lg font-bold text-gray-900 mb-3">
            Email Notifications
          </Text>
          {renderEmailNotifications()}
        </View>
      </ScrollView>
    </View>
  );
}
