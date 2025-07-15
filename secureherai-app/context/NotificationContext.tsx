import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import ApiService from "../services/api";
import {
  Notification,
  AlertNotificationsResponse,
  AcceptEmergencyRequest,
} from "../types/notification";

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
    alertId: string
  ) => Promise<AlertNotificationsResponse | null>;
  clearError: () => void;
  addNotification: (notification: Notification) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

interface NotificationProviderProps {
  children: ReactNode;
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
            n.id === notificationId ? { ...n, isRead: true } : n
          )
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
    request: AcceptEmergencyRequest
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
    alertId: string
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

  // Auto-refresh notification count on mount and periodically
  useEffect(() => {
    refreshNotificationCount();

    // Refresh count every 30 seconds
    const interval = setInterval(refreshNotificationCount, 30000);

    return () => clearInterval(interval);
  }, []);

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    loading,
    error,
    fetchNotifications,
    fetchUnreadNotifications,
    refreshNotificationCount,
    markAsRead,
    markAllAsRead,
    acceptEmergency,
    getAlertNotifications,
    clearError,
    addNotification,
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
      "useNotifications must be used within a NotificationProvider"
    );
  }
  return context;
}

export default NotificationContext;
