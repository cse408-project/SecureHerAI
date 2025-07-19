import React, { useEffect, useState } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useNotifications } from "../context/NotificationContext";
import { useAlert } from "../context/AlertContext";
import { Notification, NotificationType } from "../types/notification";
import { format, formatDistanceToNow } from "date-fns";

interface NotificationModalProps {
  visible: boolean;
  onClose: () => void;
  // Legacy support
  notifications?: { id: number; message: string }[];
}

export default function NotificationModal({
  visible,
  onClose,
  notifications: legacyNotifications,
}: NotificationModalProps) {
  const {
    notifications,
    unreadCount,
    loading,
    error,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    acceptEmergency,
    clearError,
  } = useNotifications();
  const { showAlert } = useAlert();

  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (visible) {
      fetchNotifications();
      clearError();
    }
  }, [visible]);

  const handleMarkAsRead = async (notificationId: string) => {
    setProcessingIds((prev) => new Set(prev).add(notificationId));
    try {
      await markAsRead(notificationId);
    } catch (err) {
      console.error("Error marking notification as read:", err);
    } finally {
      setProcessingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(notificationId);
        return newSet;
      });
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const success = await markAllAsRead();
      if (success) {
        showAlert("Success", "All notifications marked as read", "success");
      }
    } catch (err) {
      console.error("Error marking all notifications as read:", err);
    }
  };

  const handleAcceptEmergency = async (notification: Notification) => {
    if (!notification.alertId || !notification.senderId) return;

    setProcessingIds((prev) => new Set(prev).add(notification.id));
    try {
      const success = await acceptEmergency({
        alertId: notification.alertId,
        alertUserId: notification.senderId,
        responderName: "Current User", // You might want to get this from user context
        notificationId: notification.id,
      });

      if (success) {
        showAlert(
          "Emergency Response",
          "You have successfully accepted the emergency request!",
          "success"
        );
        await markAsRead(notification.id);
      }
    } catch (err) {
      console.error("Error accepting emergency:", err);
      showAlert(
        "Error",
        "Failed to accept emergency request. Please try again.",
        "error"
      );
    } finally {
      setProcessingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(notification.id);
        return newSet;
      });
    }
  };

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case NotificationType.EMERGENCY_REQUEST:
        return "warning";
      case NotificationType.EMERGENCY_ACCEPTED:
        return "check-circle";
      case NotificationType.EMERGENCY_EXPIRED:
        return "access-time";
      case NotificationType.SYSTEM:
        return "info";
      default:
        return "notifications";
    }
  };

  const getNotificationColor = (type: NotificationType) => {
    switch (type) {
      case NotificationType.EMERGENCY_REQUEST:
        return "#FF4444";
      case NotificationType.EMERGENCY_ACCEPTED:
        return "#4CAF50";
      case NotificationType.EMERGENCY_EXPIRED:
        return "#FF9800";
      case NotificationType.SYSTEM:
        return "#2196F3";
      default:
        return "#67082F";
    }
  };

  const isExpired = (notification: Notification) => {
    if (!notification.expiresAt) return false;
    return new Date(notification.expiresAt) < new Date();
  };

  const canAcceptEmergency = (notification: Notification) => {
    return (
      notification.type === NotificationType.EMERGENCY_REQUEST &&
      !notification.isRead &&
      !isExpired(notification) &&
      notification.alertId &&
      notification.senderId
    );
  };

  const renderNotification = (notification: Notification) => {
    const isProcessing = processingIds.has(notification.id);
    const iconName = getNotificationIcon(notification.type);
    const iconColor = getNotificationColor(notification.type);
    const timeAgo = formatDistanceToNow(new Date(notification.createdAt), {
      addSuffix: true,
    });

    return (
      <View
        key={notification.id}
        className={`p-4 border-b border-gray-200 ${
          !notification.isRead ? "bg-blue-50" : "bg-white"
        }`}
      >
        <View className="flex-row items-start space-x-3">
          <MaterialIcons
            name={iconName as any}
            size={24}
            color={iconColor}
            style={{ marginTop: 2 }}
          />
          <View className="flex-1">
            <View className="flex-row justify-between items-start mb-1">
              <Text
                className="font-semibold text-gray-900 flex-1"
                numberOfLines={2}
              >
                {notification.title}
              </Text>
              {!notification.isRead && (
                <View className="w-2 h-2 bg-blue-500 rounded-full ml-2 mt-1" />
              )}
            </View>

            <Text className="text-gray-700 mb-2" numberOfLines={3}>
              {notification.message}
            </Text>

            <View className="flex-row justify-between items-center">
              <Text className="text-xs text-gray-500">
                {timeAgo}
                {notification.batchNumber &&
                  ` • Batch ${notification.batchNumber}`}
                {isExpired(notification) && " • Expired"}
              </Text>

              <View className="flex-row space-x-2">
                {canAcceptEmergency(notification) && (
                  <TouchableOpacity
                    onPress={() => handleAcceptEmergency(notification)}
                    disabled={isProcessing}
                    className="bg-red-600 px-3 py-1 rounded-full"
                  >
                    {isProcessing ? (
                      <ActivityIndicator size="small" color="white" />
                    ) : (
                      <Text className="text-white text-xs font-medium">
                        Accept Emergency
                      </Text>
                    )}
                  </TouchableOpacity>
                )}

                {!notification.isRead && (
                  <TouchableOpacity
                    onPress={() => handleMarkAsRead(notification.id)}
                    disabled={isProcessing}
                    className="bg-gray-600 px-3 py-1 rounded-full"
                  >
                    {isProcessing ? (
                      <ActivityIndicator size="small" color="white" />
                    ) : (
                      <Text className="text-white text-xs font-medium">
                        Mark Read
                      </Text>
                    )}
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        </View>
      </View>
    );
  };

  const renderLegacyNotification = (notification: {
    id: number;
    message: string;
  }) => (
    <View key={notification.id} className="p-4 border-b border-gray-200">
      <Text className="text-gray-700">{notification.message}</Text>
    </View>
  );

  const displayNotifications = legacyNotifications || notifications;
  const isLegacyMode = !!legacyNotifications;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/30 justify-center items-center">
        <View className="bg-white rounded-2xl w-[90%] max-h-[80%] shadow-xl">
          {/* Header */}
          <View className="flex-row justify-between items-center p-4 border-b border-gray-200">
            <View className="flex-row items-center">
              <Text className="font-bold text-lg text-[#67082F]">
                Notifications
              </Text>
              {!isLegacyMode && unreadCount > 0 && (
                <View className="ml-2 bg-red-500 rounded-full px-2 py-0.5">
                  <Text className="text-white text-xs font-bold">
                    {unreadCount}
                  </Text>
                </View>
              )}
            </View>

            <View className="flex-row items-center space-x-2">
              {!isLegacyMode && unreadCount > 0 && (
                <TouchableOpacity
                  onPress={handleMarkAllAsRead}
                  className="bg-[#67082F] px-3 py-1 rounded-full"
                >
                  <Text className="text-white text-xs font-medium">
                    Mark All Read
                  </Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity onPress={onClose}>
                <MaterialIcons name="close" size={24} color="#67082F" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Content */}
          <ScrollView className="max-h-96">
            {loading ? (
              <View className="p-8 items-center">
                <ActivityIndicator size="large" color="#67082F" />
                <Text className="text-gray-500 mt-2">
                  Loading notifications...
                </Text>
              </View>
            ) : error ? (
              <View className="p-8 items-center">
                <MaterialIcons name="error" size={48} color="#FF4444" />
                <Text className="text-red-600 mt-2 text-center">{error}</Text>
                <TouchableOpacity
                  onPress={() => fetchNotifications()}
                  className="mt-4 bg-[#67082F] px-4 py-2 rounded-full"
                >
                  <Text className="text-white font-medium">Retry</Text>
                </TouchableOpacity>
              </View>
            ) : displayNotifications.length === 0 ? (
              <View className="p-8 items-center">
                <MaterialIcons
                  name="notifications-none"
                  size={48}
                  color="#ccc"
                />
                <Text className="text-gray-500 mt-2 text-center">
                  No notifications
                </Text>
              </View>
            ) : (
              <View>
                {isLegacyMode
                  ? legacyNotifications.map(renderLegacyNotification)
                  : notifications.map(renderNotification)}
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
