import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  ReactNode,
} from "react";
import { Platform, AppState, AppStateStatus } from "react-native";
import ApiService from "../services/api";
import websocketService, {
  NotificationMessage,
  EmergencyAlertMessage,
} from "../services/websocketService";
import pushNotificationService from "../services/pushNotificationService";
import {
  Notification,
  AlertNotificationsResponse,
  AcceptEmergencyRequest,
} from "../types/notification";

interface EmergencyAlert extends EmergencyAlertMessage {
  id: string;
  receivedAt: Date;
  acknowledged: boolean;
}

interface NotificationContextType {
  // State
  notifications: Notification[];
  emergencyAlerts: EmergencyAlert[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  isConnected: boolean;

  // Actions
  fetchNotifications: (page?: number, size?: number) => Promise<void>;
  fetchUnreadNotifications: () => Promise<void>;
  refreshNotificationCount: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<boolean>;
  markAllAsRead: () => Promise<boolean>;
  acceptEmergency: (request: AcceptEmergencyRequest) => Promise<boolean>;
  getAlertNotifications: (
    alertId: string,
  ) => Promise<AlertNotificationsResponse | null>;
  clearError: () => void;
  addNotification: (notification: Notification) => void;

  // Real-time actions
  connectRealtime: () => Promise<void>;
  disconnectRealtime: () => void;
  acknowledgeEmergencyAlert: (alertId: number) => void;
  respondToEmergencyAlert: (alertId: number, accepted: boolean) => void;
  clearEmergencyAlert: (alertId: number) => void;
}

interface NotificationContextType {
  // State
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;

  // Actions
  fetchNotifications: (page?: number, size?: number) => Promise<void>;
  fetchUnreadNotifications: () => Promise<void>;
  refreshNotificationCount: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<boolean>;
  markAllAsRead: () => Promise<boolean>;
  acceptEmergency: (request: AcceptEmergencyRequest) => Promise<boolean>;
  getAlertNotifications: (
    alertId: string,
  ) => Promise<AlertNotificationsResponse | null>;
  clearError: () => void;
  addNotification: (notification: Notification) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined,
);

interface NotificationProviderProps {
  children: ReactNode;
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [emergencyAlerts, setEmergencyAlerts] = useState<EmergencyAlert[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const appState = useRef(AppState.currentState);
  const isInitialized = useRef(false);

  // Fetch all notifications
  const fetchNotifications = async (page?: number, size?: number) => {
    setLoading(true);
    setError(null);
    try {
      const response = await ApiService.getNotifications(page, size);
      if (response.success && response.data) {
        setNotifications(response.data.notifications || []);
        setUnreadCount(response.data.unreadCount || 0);
      } else {
        setError(response.error || "Failed to fetch notifications");
      }
    } catch (err) {
      setError("Network error while fetching notifications");
      console.error("Error fetching notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch unread notifications only
  const fetchUnreadNotifications = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await ApiService.getUnreadNotifications();
      if (response.success && response.data) {
        const unreadNotifications = response.data.notifications || [];
        // Update existing notifications with unread ones
        setNotifications((prev) => {
          const unreadIds = unreadNotifications.map((n: Notification) => n.id);
          const filteredPrev = prev.filter((n) => !unreadIds.includes(n.id));
          return [...unreadNotifications, ...filteredPrev];
        });
        setUnreadCount(unreadNotifications.length);
      } else {
        setError(response.error || "Failed to fetch unread notifications");
      }
    } catch (err) {
      setError("Network error while fetching unread notifications");
      console.error("Error fetching unread notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  // Refresh notification count only
  const refreshNotificationCount = async () => {
    try {
      const response = await ApiService.getNotificationCount();
      if (response.success && response.data) {
        setUnreadCount(response.data.unreadCount || 0);
      }
    } catch (err) {
      console.error("Error refreshing notification count:", err);
    }
  };

  // Mark notification as read
  const markAsRead = async (notificationId: string): Promise<boolean> => {
    try {
      const response = await ApiService.markNotificationAsRead(notificationId);
      if (response.success) {
        // Update local state
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notificationId ? { ...n, isRead: true } : n,
          ),
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
        return true;
      } else {
        setError(response.error || "Failed to mark notification as read");
        return false;
      }
    } catch (err) {
      setError("Network error while marking notification as read");
      console.error("Error marking notification as read:", err);
      return false;
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async (): Promise<boolean> => {
    try {
      const response = await ApiService.markAllNotificationsAsRead();
      if (response.success) {
        // Update local state
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        setUnreadCount(0);
        return true;
      } else {
        setError(response.error || "Failed to mark all notifications as read");
        return false;
      }
    } catch (err) {
      setError("Network error while marking all notifications as read");
      console.error("Error marking all notifications as read:", err);
      return false;
    }
  };

  // Accept emergency response
  const acceptEmergency = async (
    request: AcceptEmergencyRequest,
  ): Promise<boolean> => {
    try {
      const response = await ApiService.acceptEmergencyResponse(request);
      if (response.success) {
        // Refresh notifications to get updated state
        await fetchNotifications();
        return true;
      } else {
        setError(response.error || "Failed to accept emergency response");
        return false;
      }
    } catch (err) {
      setError("Network error while accepting emergency response");
      console.error("Error accepting emergency response:", err);
      return false;
    }
  };

  // Get notifications for a specific alert
  const getAlertNotifications = async (
    alertId: string,
  ): Promise<AlertNotificationsResponse | null> => {
    try {
      const response = await ApiService.getNotificationsForAlert(alertId);
      if (response.success) {
        return response.data as AlertNotificationsResponse;
      } else {
        setError(response.error || "Failed to fetch alert notifications");
        return null;
      }
    } catch (err) {
      setError("Network error while fetching alert notifications");
      console.error("Error fetching alert notifications:", err);
      return null;
    }
  };

  // Add a new notification (for real-time updates)
  const addNotification = (notification: Notification) => {
    setNotifications((prev) => [notification, ...prev]);
    if (!notification.isRead) {
      setUnreadCount((prev) => prev + 1);
    }
  };

  // Clear error
  const clearError = () => {
    setError(null);
  };

  // =====================
  // Real-time Notification Functions
  // =====================

  // Initialize push notifications
  const initializePushNotifications = async () => {
    try {
      const token = await pushNotificationService.initialize();
      if (token) {
        await pushNotificationService.registerWithBackend();

        // Listen for incoming notifications
        pushNotificationService.addNotificationListener((notification) => {
          console.log("Push notification received:", notification);
          const data = notification.request.content.data;

          if (data?.type === "EMERGENCY_ALERT") {
            handleEmergencyAlert(data as unknown as EmergencyAlertMessage);
          }
        });

        // Listen for notification taps
        pushNotificationService.addResponseListener((response) => {
          console.log("Notification tapped:", response);
          const data = response.notification.request.content.data;

          if (data?.alertId) {
            // Navigate to alert details - this will be handled by the navigation context
            console.log("User tapped emergency alert:", data.alertId);
          }
        });
      }
    } catch (err) {
      console.error("Failed to initialize push notifications:", err);
    }
  };

  // Handle incoming emergency alert
  const handleEmergencyAlert = (alert: EmergencyAlertMessage) => {
    const emergencyAlert: EmergencyAlert = {
      ...alert,
      id: `alert-${alert.alertId}-${Date.now()}`,
      receivedAt: new Date(),
      acknowledged: false,
    };

    setEmergencyAlerts((prev) => {
      // Avoid duplicates
      const exists = prev.some((a) => a.alertId === alert.alertId);
      if (exists) return prev;
      return [emergencyAlert, ...prev];
    });

    setUnreadCount((prev) => prev + 1);

    // Show local notification if app is in background
    if (appState.current !== "active" && Platform.OS !== "web") {
      pushNotificationService.showEmergencyNotification(
        "🚨 Emergency Alert!",
        `${alert.victimName} needs help! ${alert.distanceKm.toFixed(1)}km away`,
        { alertId: alert.alertId, type: "EMERGENCY_ALERT" },
      );
    }
  };

  // Handle WebSocket messages - OPTIMIZED FOR SPEED
  const handleWebSocketMessage = (message: NotificationMessage) => {
    console.log("🚀 Processing WebSocket message type:", message.type);

    switch (message.type) {
      case "EMERGENCY_ALERT":
        handleEmergencyAlert(message.payload as EmergencyAlertMessage);
        break;

      case "ALERT_UPDATE":
      case "RESPONDER_UPDATE":
      case "RESPONDER_LOCATION":
      case "VICTIM_LOCATION":
        // Update existing alert status IMMEDIATELY
        const update = message.payload;
        setEmergencyAlerts((prev) => {
          const updated = prev.map((alert) =>
            alert.alertId === update.alertId
              ? { ...alert, ...update, receivedAt: new Date() }
              : alert,
          );
          console.log("⚡ Alert updated instantly:", update.alertId);
          return updated;
        });
        break;

      case "ALERT_CANCELLED":
        // Remove cancelled alert IMMEDIATELY
        setEmergencyAlerts((prev) =>
          prev.filter((alert) => alert.alertId !== message.payload.alertId),
        );
        console.log("⚡ Alert cancelled:", message.payload.alertId);
        break;

      case "SYSTEM":
        // Handle system notifications
        console.log("System notification:", message.payload);
        break;
    }
  };

  // Connect to real-time services
  const connectRealtime = async () => {
    try {
      // Connect WebSocket
      const connected = await websocketService.connect();
      if (connected) {
        // Add message listener
        websocketService.addMessageListener(handleWebSocketMessage);
        websocketService.addConnectionListener(setIsConnected);
      }

      // Initialize push notifications (non-blocking)
      if (Platform.OS !== "web") {
        initializePushNotifications();
      }
    } catch (err) {
      console.error("Failed to connect real-time services:", err);
    }
  };

  // Disconnect from real-time services
  const disconnectRealtime = () => {
    websocketService.disconnect();
    pushNotificationService.removeListeners();
    setIsConnected(false);
  };

  // Acknowledge emergency alert
  const acknowledgeEmergencyAlert = (alertId: number) => {
    websocketService.acknowledgeAlert(alertId);
    setEmergencyAlerts((prev) =>
      prev.map((alert) =>
        alert.alertId === alertId ? { ...alert, acknowledged: true } : alert,
      ),
    );
  };

  // Respond to emergency alert
  const respondToEmergencyAlert = (alertId: number, accepted: boolean) => {
    websocketService.respondToAlert(alertId, accepted);
  };

  // Clear a specific emergency alert
  const clearEmergencyAlert = (alertId: number) => {
    setEmergencyAlerts((prev) =>
      prev.filter((alert) => alert.alertId !== alertId),
    );
  };

  // Handle app state changes (background/foreground)
  useEffect(() => {
    const subscription = AppState.addEventListener(
      "change",
      (nextAppState: AppStateStatus) => {
        if (
          appState.current.match(/inactive|background/) &&
          nextAppState === "active"
        ) {
          // App came to foreground - reconnect WebSocket if needed
          if (!websocketService.isConnected()) {
            websocketService.connect();
          }
          // Refresh notifications
          refreshNotificationCount();
        }
        appState.current = nextAppState;
      },
    );

    return () => {
      subscription.remove();
    };
  }, []);

  // Initialize on mount - only fetch count, real-time connection happens on login
  useEffect(() => {
    if (!isInitialized.current) {
      isInitialized.current = true;
      refreshNotificationCount();
    }

    // Cleanup on unmount
    return () => {
      disconnectRealtime();
    };
  }, []);

  const value: NotificationContextType = {
    notifications,
    emergencyAlerts,
    unreadCount,
    loading,
    error,
    isConnected,
    fetchNotifications,
    fetchUnreadNotifications,
    refreshNotificationCount,
    markAsRead,
    markAllAsRead,
    acceptEmergency,
    getAlertNotifications,
    clearError,
    addNotification,
    connectRealtime,
    disconnectRealtime,
    acknowledgeEmergencyAlert,
    respondToEmergencyAlert,
    clearEmergencyAlert,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error(
      "useNotifications must be used within a NotificationProvider",
    );
  }
  return context;
}

export default NotificationContext;
