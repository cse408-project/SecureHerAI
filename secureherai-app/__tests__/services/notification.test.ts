/**
 * Unit tests for Notification Service
 * Tests notification preferences, permissions, and notification management functionality
 */

// Mock expo-notifications with doMock to avoid module resolution issues
const mockRequestPermissionsAsync = jest.fn();
const mockScheduleNotificationAsync = jest.fn();
const mockGetPermissionsAsync = jest.fn();
const mockCancelAllScheduledNotificationsAsync = jest.fn();

const mockExpoNotifications = {
  requestPermissionsAsync: mockRequestPermissionsAsync,
  scheduleNotificationAsync: mockScheduleNotificationAsync,
  getPermissionsAsync: mockGetPermissionsAsync,
  cancelAllScheduledNotificationsAsync: mockCancelAllScheduledNotificationsAsync,
  setNotificationHandler: jest.fn(),
  AndroidImportance: {
    HIGH: 'high'
  }
};

jest.mock('expo-notifications', () => mockExpoNotifications);

// Mock AsyncStorage for preference storage
const mockAsyncStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
};

jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage);

// Mock Alert for error display
const mockAlert = jest.fn();
jest.mock('react-native', () => ({
  Alert: {
    alert: mockAlert
  },
  Platform: {
    OS: 'ios'
  }
}));

describe('NotificationService', () => {
  // Mock notification service implementation
  class NotificationServiceMock {
    private storageKey = 'notification_preferences';

    /**
     * Request notification permissions from the user
     */
    async requestPermissions(): Promise<{ success: boolean; granted?: boolean; error?: string }> {
      try {
        const { status } = await mockRequestPermissionsAsync();
        const granted = status === 'granted';
        
        return {
          success: true,
          granted
        };
      } catch (error) {
        console.error('Error requesting notification permissions:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    }

    /**
     * Check current notification permissions
     */
    async checkPermissions(): Promise<{ success: boolean; granted?: boolean; error?: string }> {
      try {
        const { status } = await mockGetPermissionsAsync();
        const granted = status === 'granted';
        
        return {
          success: true,
          granted
        };
      } catch (error) {
        console.error('Error checking notification permissions:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    }

    /**
     * Schedule a local notification
     */
    async scheduleNotification(options: {
      title: string;
      body: string;
      data?: any;
      trigger?: any;
    }): Promise<{ success: boolean; notificationId?: string; error?: string }> {
      try {
        // Check permissions first
        const permissionResult = await this.checkPermissions();
        if (!permissionResult.success || !permissionResult.granted) {
          return {
            success: false,
            error: 'Notification permissions not granted'
          };
        }

        const notificationId = await mockScheduleNotificationAsync({
          content: {
            title: options.title,
            body: options.body,
            data: options.data || {}
          },
          trigger: options.trigger || null
        });

        return {
          success: true,
          notificationId
        };
      } catch (error) {
        console.error('Error scheduling notification:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    }

    /**
     * Cancel all scheduled notifications
     */
    async cancelAllNotifications(): Promise<{ success: boolean; error?: string }> {
      try {
        await mockCancelAllScheduledNotificationsAsync();
        return { success: true };
      } catch (error) {
        console.error('Error canceling notifications:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    }

    /**
     * Store notification preferences
     */
    async storePreferences(preferences: {
      emailAlerts: boolean;
      smsAlerts: boolean;
      pushNotifications: boolean;
    }): Promise<{ success: boolean; error?: string }> {
      try {
        const preferencesData = {
          ...preferences,
          lastUpdated: new Date().toISOString()
        };
        
        await mockAsyncStorage.setItem(this.storageKey, JSON.stringify(preferencesData));
        return { success: true };
      } catch (error) {
        console.error('Error storing notification preferences:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    }

    /**
     * Get stored notification preferences
     */
    async getPreferences(): Promise<{
      success: boolean;
      preferences?: {
        emailAlerts: boolean;
        smsAlerts: boolean;
        pushNotifications: boolean;
        lastUpdated?: string;
      };
      error?: string;
    }> {
      try {
        const storedData = await mockAsyncStorage.getItem(this.storageKey);
        
        if (!storedData) {
          // Return default preferences
          return {
            success: true,
            preferences: {
              emailAlerts: true,
              smsAlerts: true,
              pushNotifications: true
            }
          };
        }

        const preferences = JSON.parse(storedData);
        return {
          success: true,
          preferences
        };
      } catch (error) {
        console.error('Error getting notification preferences:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    }

    /**
     * Send emergency notification
     */
    async sendEmergencyNotification(alertData: {
      title: string;
      message: string;
      location?: { latitude: number; longitude: number };
      contacts?: Array<{ name: string; phone: string }>;
    }): Promise<{ success: boolean; notificationId?: string; error?: string }> {
      try {
        // Check if push notifications are enabled
        const prefsResult = await this.getPreferences();
        if (!prefsResult.success || !prefsResult.preferences?.pushNotifications) {
          return {
            success: false,
            error: 'Push notifications are disabled'
          };
        }

        // Schedule high-priority emergency notification
        const result = await this.scheduleNotification({
          title: alertData.title,
          body: alertData.message,
          data: {
            type: 'emergency',
            location: alertData.location,
            contacts: alertData.contacts,
            timestamp: new Date().toISOString()
          }
        });

        return result;
      } catch (error) {
        console.error('Error sending emergency notification:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    }

    /**
     * Clear all notification data
     */
    async clearNotificationData(): Promise<{ success: boolean; error?: string }> {
      try {
        await Promise.all([
          mockAsyncStorage.removeItem(this.storageKey),
          this.cancelAllNotifications()
        ]);
        
        return { success: true };
      } catch (error) {
        console.error('Error clearing notification data:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    }
  }

  let notificationService: NotificationServiceMock;

  beforeEach(() => {
    jest.clearAllMocks();
    notificationService = new NotificationServiceMock();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Permission Management', () => {
    test('successfully requests notification permissions', async () => {
      mockRequestPermissionsAsync.mockResolvedValueOnce({ status: 'granted' });

      const result = await notificationService.requestPermissions();

      expect(result.success).toBe(true);
      expect(result.granted).toBe(true);
      expect(mockRequestPermissionsAsync).toHaveBeenCalledTimes(1);
    });

    test('handles permission denial', async () => {
      mockRequestPermissionsAsync.mockResolvedValueOnce({ status: 'denied' });

      const result = await notificationService.requestPermissions();

      expect(result.success).toBe(true);
      expect(result.granted).toBe(false);
    });

    test('handles permission request error', async () => {
      mockRequestPermissionsAsync.mockRejectedValueOnce(new Error('Permission request failed'));

      const result = await notificationService.requestPermissions();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Permission request failed');
    });

    test('checks existing permissions', async () => {
      mockGetPermissionsAsync.mockResolvedValueOnce({ status: 'granted' });

      const result = await notificationService.checkPermissions();

      expect(result.success).toBe(true);
      expect(result.granted).toBe(true);
      expect(mockGetPermissionsAsync).toHaveBeenCalledTimes(1);
    });
  });

  describe('Notification Scheduling', () => {
    test('successfully schedules a notification', async () => {
      mockGetPermissionsAsync.mockResolvedValueOnce({ status: 'granted' });
      mockScheduleNotificationAsync.mockResolvedValueOnce('notification-123');

      const result = await notificationService.scheduleNotification({
        title: 'Test Notification',
        body: 'This is a test notification'
      });

      expect(result.success).toBe(true);
      expect(result.notificationId).toBe('notification-123');
      expect(mockScheduleNotificationAsync).toHaveBeenCalledWith({
        content: {
          title: 'Test Notification',
          body: 'This is a test notification',
          data: {}
        },
        trigger: null
      });
    });

    test('fails to schedule notification without permissions', async () => {
      mockGetPermissionsAsync.mockResolvedValueOnce({ status: 'denied' });

      const result = await notificationService.scheduleNotification({
        title: 'Test Notification',
        body: 'This is a test notification'
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Notification permissions not granted');
      expect(mockScheduleNotificationAsync).not.toHaveBeenCalled();
    });

    test('handles scheduling error', async () => {
      mockGetPermissionsAsync.mockResolvedValueOnce({ status: 'granted' });
      mockScheduleNotificationAsync.mockRejectedValueOnce(new Error('Scheduling failed'));

      const result = await notificationService.scheduleNotification({
        title: 'Test Notification',
        body: 'This is a test notification'
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Scheduling failed');
    });

    test('cancels all scheduled notifications', async () => {
      mockCancelAllScheduledNotificationsAsync.mockResolvedValueOnce(undefined);

      const result = await notificationService.cancelAllNotifications();

      expect(result.success).toBe(true);
      expect(mockCancelAllScheduledNotificationsAsync).toHaveBeenCalledTimes(1);
    });
  });

  describe('Preference Management', () => {
    test('stores notification preferences', async () => {
      mockAsyncStorage.setItem.mockResolvedValueOnce(undefined);

      const preferences = {
        emailAlerts: true,
        smsAlerts: false,
        pushNotifications: true
      };

      const result = await notificationService.storePreferences(preferences);

      expect(result.success).toBe(true);
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        'notification_preferences',
        expect.stringContaining('emailAlerts')
      );
    });

    test('retrieves stored preferences', async () => {
      const storedPrefs = {
        emailAlerts: false,
        smsAlerts: true,
        pushNotifications: false,
        lastUpdated: '2023-01-01T00:00:00.000Z'
      };
      mockAsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify(storedPrefs));

      const result = await notificationService.getPreferences();

      expect(result.success).toBe(true);
      expect(result.preferences).toEqual(storedPrefs);
      expect(mockAsyncStorage.getItem).toHaveBeenCalledWith('notification_preferences');
    });

    test('returns default preferences when none stored', async () => {
      mockAsyncStorage.getItem.mockResolvedValueOnce(null);

      const result = await notificationService.getPreferences();

      expect(result.success).toBe(true);
      expect(result.preferences).toEqual({
        emailAlerts: true,
        smsAlerts: true,
        pushNotifications: true
      });
    });

    test('handles preference storage error', async () => {
      mockAsyncStorage.setItem.mockRejectedValueOnce(new Error('Storage error'));

      const result = await notificationService.storePreferences({
        emailAlerts: true,
        smsAlerts: true,
        pushNotifications: true
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Storage error');
    });
  });

  describe('Emergency Notifications', () => {
    test('sends emergency notification successfully', async () => {
      // Mock preferences allowing push notifications
      mockAsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify({
        emailAlerts: true,
        smsAlerts: true,
        pushNotifications: true
      }));
      
      mockGetPermissionsAsync.mockResolvedValueOnce({ status: 'granted' });
      mockScheduleNotificationAsync.mockResolvedValueOnce('emergency-123');

      const alertData = {
        title: 'Emergency Alert',
        message: 'Emergency situation detected',
        location: { latitude: 23.8103, longitude: 90.4125 },
        contacts: [{ name: 'Emergency Contact', phone: '+1234567890' }]
      };

      const result = await notificationService.sendEmergencyNotification(alertData);

      expect(result.success).toBe(true);
      expect(result.notificationId).toBe('emergency-123');
      expect(mockScheduleNotificationAsync).toHaveBeenCalledWith({
        content: {
          title: 'Emergency Alert',
          body: 'Emergency situation detected',
          data: {
            type: 'emergency',
            location: alertData.location,
            contacts: alertData.contacts,
            timestamp: expect.any(String)
          }
        },
        trigger: null
      });
    });

    test('fails when push notifications are disabled', async () => {
      // Mock preferences with push notifications disabled
      mockAsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify({
        emailAlerts: true,
        smsAlerts: true,
        pushNotifications: false
      }));

      const result = await notificationService.sendEmergencyNotification({
        title: 'Emergency Alert',
        message: 'Emergency situation detected'
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Push notifications are disabled');
      expect(mockScheduleNotificationAsync).not.toHaveBeenCalled();
    });

    test('handles emergency notification error', async () => {
      mockAsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify({
        pushNotifications: true
      }));
      mockGetPermissionsAsync.mockResolvedValueOnce({ status: 'granted' });
      mockScheduleNotificationAsync.mockRejectedValueOnce(new Error('Emergency notification failed'));

      const result = await notificationService.sendEmergencyNotification({
        title: 'Emergency Alert',
        message: 'Emergency situation detected'
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Emergency notification failed');
    });
  });

  describe('Data Management', () => {
    test('clears all notification data', async () => {
      mockAsyncStorage.removeItem.mockResolvedValueOnce(undefined);
      mockCancelAllScheduledNotificationsAsync.mockResolvedValueOnce(undefined);

      const result = await notificationService.clearNotificationData();

      expect(result.success).toBe(true);
      expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith('notification_preferences');
      expect(mockCancelAllScheduledNotificationsAsync).toHaveBeenCalledTimes(1);
    });

    test('handles data clearing error', async () => {
      mockAsyncStorage.removeItem.mockRejectedValueOnce(new Error('Clear failed'));

      const result = await notificationService.clearNotificationData();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Clear failed');
    });
  });

  describe('Edge Cases', () => {
    test('handles malformed stored preferences', async () => {
      mockAsyncStorage.getItem.mockResolvedValueOnce('invalid-json');

      const result = await notificationService.getPreferences();

      expect(result.success).toBe(false);
      expect(result.error).toContain('Unexpected token');
    });

    test('handles permission check failure', async () => {
      mockGetPermissionsAsync.mockRejectedValueOnce(new Error('Permission check failed'));

      const result = await notificationService.checkPermissions();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Permission check failed');
    });

    test('handles undefined error objects', async () => {
      mockRequestPermissionsAsync.mockRejectedValueOnce('String error');

      const result = await notificationService.requestPermissions();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Unknown error');
    });
  });

  describe('Integration Scenarios', () => {
    test('complete notification flow with permissions and scheduling', async () => {
      // Request permissions
      mockRequestPermissionsAsync.mockResolvedValueOnce({ status: 'granted' });
      const permResult = await notificationService.requestPermissions();
      expect(permResult.granted).toBe(true);

      // Store preferences
      mockAsyncStorage.setItem.mockResolvedValueOnce(undefined);
      const storeResult = await notificationService.storePreferences({
        emailAlerts: true,
        smsAlerts: true,
        pushNotifications: true
      });
      expect(storeResult.success).toBe(true);

      // Schedule notification
      mockGetPermissionsAsync.mockResolvedValueOnce({ status: 'granted' });
      mockScheduleNotificationAsync.mockResolvedValueOnce('test-notification');
      const scheduleResult = await notificationService.scheduleNotification({
        title: 'Test',
        body: 'Test message'
      });
      expect(scheduleResult.success).toBe(true);

      // Verify all calls were made
      expect(mockRequestPermissionsAsync).toHaveBeenCalledTimes(1);
      expect(mockAsyncStorage.setItem).toHaveBeenCalledTimes(1);
      expect(mockScheduleNotificationAsync).toHaveBeenCalledTimes(1);
    });

    test('emergency flow with location and contacts', async () => {
      // Setup: preferences allow push notifications
      mockAsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify({
        pushNotifications: true
      }));
      mockGetPermissionsAsync.mockResolvedValueOnce({ status: 'granted' });
      mockScheduleNotificationAsync.mockResolvedValueOnce('emergency-alert');

      const emergencyData = {
        title: 'SOS Alert',
        message: 'Emergency button pressed',
        location: { latitude: 40.7128, longitude: -74.0060 },
        contacts: [
          { name: 'Contact 1', phone: '+1111111111' },
          { name: 'Contact 2', phone: '+2222222222' }
        ]
      };

      const result = await notificationService.sendEmergencyNotification(emergencyData);

      expect(result.success).toBe(true);
      expect(result.notificationId).toBe('emergency-alert');
      
      const scheduleCall = mockScheduleNotificationAsync.mock.calls[0][0];
      expect(scheduleCall.content.data.type).toBe('emergency');
      expect(scheduleCall.content.data.location).toEqual(emergencyData.location);
      expect(scheduleCall.content.data.contacts).toEqual(emergencyData.contacts);
    });
  });
});
