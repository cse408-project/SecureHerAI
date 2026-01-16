import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";
import Constants from "expo-constants";
import api from "./api";

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
    priority: Notifications.AndroidNotificationPriority.MAX,
  }),
});

/**
 * Service for handling push notifications with Expo
 */
class PushNotificationService {
  private expoPushToken: string | null = null;
  private notificationListener: Notifications.Subscription | null = null;
  private responseListener: Notifications.Subscription | null = null;

  /**
   * Initialize push notifications and register device
   */
  async initialize(): Promise<string | null> {
    try {
      // Check if it's a physical device (push notifications don't work on simulators)
      if (Platform.OS !== "web" && !Device.isDevice) {
        console.log("Push notifications require a physical device");
        return null;
      }

      // Get notification permissions
      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== "granted") {
        console.log("Push notification permission not granted");
        return null;
      }

      // Get Expo push token
      const projectId =
        Constants.expoConfig?.extra?.eas?.projectId ??
        Constants.easConfig?.projectId;

      if (!projectId) {
        console.log("Project ID not found, cannot get push token");
        return null;
      }

      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId,
      });

      this.expoPushToken = tokenData.data;
      console.log("Expo Push Token:", this.expoPushToken);

      // Configure Android notification channel
      if (Platform.OS === "android") {
        await this.configureAndroidChannel();
      }

      return this.expoPushToken;
    } catch (error) {
      console.error("Error initializing push notifications:", error);
      return null;
    }
  }

  /**
   * Configure Android notification channel for emergency alerts
   */
  private async configureAndroidChannel(): Promise<void> {
    await Notifications.setNotificationChannelAsync("emergency-alerts", {
      name: "Emergency Alerts",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF0000",
      sound: "default",
      enableLights: true,
      enableVibrate: true,
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      bypassDnd: true,
    });

    await Notifications.setNotificationChannelAsync("general", {
      name: "General Notifications",
      importance: Notifications.AndroidImportance.DEFAULT,
      sound: "default",
    });
  }

  /**
   * Register push token with backend
   */
  async registerWithBackend(
    deviceId?: string,
    deviceName?: string
  ): Promise<boolean> {
    if (!this.expoPushToken) {
      console.log("No push token available to register");
      return false;
    }

    try {
      await api.registerDeviceToken({
        token: this.expoPushToken,
        tokenType: "EXPO_PUSH",
        platform: Platform.OS.toUpperCase(),
        deviceId: deviceId || Device.deviceName || "unknown",
        deviceName: deviceName || Device.modelName || "Unknown Device",
      });
      console.log("Push token registered with backend");
      return true;
    } catch (error) {
      console.error("Failed to register push token with backend:", error);
      return false;
    }
  }

  /**
   * Add listener for received notifications
   */
  addNotificationListener(
    callback: (notification: Notifications.Notification) => void
  ): void {
    this.notificationListener =
      Notifications.addNotificationReceivedListener(callback);
  }

  /**
   * Add listener for notification responses (when user taps notification)
   */
  addResponseListener(
    callback: (response: Notifications.NotificationResponse) => void
  ): void {
    this.responseListener =
      Notifications.addNotificationResponseReceivedListener(callback);
  }

  /**
   * Remove all listeners
   */
  removeListeners(): void {
    if (this.notificationListener) {
      Notifications.removeNotificationSubscription(this.notificationListener);
      this.notificationListener = null;
    }
    if (this.responseListener) {
      Notifications.removeNotificationSubscription(this.responseListener);
      this.responseListener = null;
    }
  }

  /**
   * Get current push token
   */
  getPushToken(): string | null {
    return this.expoPushToken;
  }

  /**
   * Schedule a local notification
   */
  async scheduleLocalNotification(
    title: string,
    body: string,
    data?: Record<string, unknown>,
    seconds: number = 1
  ): Promise<string> {
    return await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds,
      },
    });
  }

  /**
   * Show immediate notification
   */
  async showNotification(
    title: string,
    body: string,
    data?: Record<string, unknown>,
    channelId: string = "general"
  ): Promise<string> {
    return await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
        ...(Platform.OS === "android" && { channelId }),
      },
      trigger: null, // Immediate
    });
  }

  /**
   * Show emergency notification with high priority
   */
  async showEmergencyNotification(
    title: string,
    body: string,
    data?: Record<string, unknown>
  ): Promise<string> {
    return await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: true,
        priority: Notifications.AndroidNotificationPriority.MAX,
        ...(Platform.OS === "android" && { channelId: "emergency-alerts" }),
      },
      trigger: null,
    });
  }

  /**
   * Clear all notifications
   */
  async clearAllNotifications(): Promise<void> {
    await Notifications.dismissAllNotificationsAsync();
  }

  /**
   * Get badge count
   */
  async getBadgeCount(): Promise<number> {
    return await Notifications.getBadgeCountAsync();
  }

  /**
   * Set badge count
   */
  async setBadgeCount(count: number): Promise<void> {
    await Notifications.setBadgeCountAsync(count);
  }

  /**
   * Deactivate token on logout
   */
  async deactivateToken(): Promise<void> {
    if (this.expoPushToken) {
      try {
        await api.deactivateDeviceToken(this.expoPushToken);
        console.log("Push token deactivated");
      } catch (error) {
        console.error("Failed to deactivate push token:", error);
      }
    }
    this.expoPushToken = null;
  }
}

export const pushNotificationService = new PushNotificationService();
export default pushNotificationService;
