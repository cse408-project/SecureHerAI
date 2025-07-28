import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  requestNotificationPermission, 
  getCurrentToken, 
  setupForegroundMessageHandler,
  isPushNotificationSupported,
  getNotificationPermissionStatus
} from '../services/firebase';
import ApiService from '../services/api';

interface PushNotificationContextType {
  isSupported: boolean;
  isEnabled: boolean;
  permissionStatus: string;
  fcmToken: string | null;
  requestPermission: () => Promise<boolean>;
  enablePushNotifications: () => Promise<boolean>;
  disablePushNotifications: () => Promise<boolean>;
  refreshToken: () => Promise<void>;
}

const PushNotificationContext = createContext<PushNotificationContextType | undefined>(undefined);

interface PushNotificationProviderProps {
  children: ReactNode;
}

export const PushNotificationProvider: React.FC<PushNotificationProviderProps> = ({ children }) => {
  const [isSupported, setIsSupported] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState('default');
  const [fcmToken, setFcmToken] = useState<string | null>(null);

  useEffect(() => {
    initializePushNotifications();
  }, []);

  const initializePushNotifications = async () => {
    // Check if push notifications are supported
    const supported = isPushNotificationSupported();
    setIsSupported(supported);

    if (!supported) {
      console.log('Push notifications are not supported on this platform');
      return;
    }

    // Check current permission status
    const permission = getNotificationPermissionStatus();
    setPermissionStatus(permission);

    // Check if user has previously enabled push notifications
    const storedPreference = await AsyncStorage.getItem('push_notifications_enabled');
    const previouslyEnabled = storedPreference === 'true';

    if (permission === 'granted' && previouslyEnabled) {
      await enablePushNotificationsInternal();
    }

    // Set up foreground message handler
    setupForegroundMessageHandler();
  };

  const requestPermission = async (): Promise<boolean> => {
    try {
      const result = await requestNotificationPermission();
      
      if (result.success && result.token) {
        setPermissionStatus('granted');
        setFcmToken(result.token);
        return true;
      } else {
        setPermissionStatus('denied');
        console.error('Failed to get permission:', result.error);
        return false;
      }
    } catch (error) {
      console.error('Error requesting permission:', error);
      setPermissionStatus('denied');
      return false;
    }
  };

  const enablePushNotifications = async (): Promise<boolean> => {
    try {
      // First request permission if not already granted
      if (permissionStatus !== 'granted') {
        const permissionGranted = await requestPermission();
        if (!permissionGranted) {
          return false;
        }
      }

      const success = await enablePushNotificationsInternal();
      if (success) {
        await AsyncStorage.setItem('push_notifications_enabled', 'true');
        setIsEnabled(true);
      }
      return success;
    } catch (error) {
      console.error('Error enabling push notifications:', error);
      return false;
    }
  };

  const enablePushNotificationsInternal = async (): Promise<boolean> => {
    try {
      // Get current token
      const token = await getCurrentToken();
      
      if (!token) {
        console.error('No FCM token available');
        return false;
      }

      setFcmToken(token);

      // For web push notifications, we don't need backend registration
      // The token is handled directly by Firebase Web SDK
      console.log('FCM token obtained successfully for web push notifications:', token);
      
      // Store token locally for reference
      await AsyncStorage.setItem('fcm_token', token);
      return true;
    } catch (error) {
      console.error('Error in enablePushNotificationsInternal:', error);
      return false;
    }
  };

  const disablePushNotifications = async (): Promise<boolean> => {
    try {
      // For web push notifications, just clear local storage
      if (fcmToken) {
        await AsyncStorage.removeItem("fcm_token");
        setFcmToken(null);
      }

      // Clear local storage
      await AsyncStorage.setItem('push_notifications_enabled', 'false');
      
      setIsEnabled(false);
      
      console.log('Push notifications disabled');
      return true;
    } catch (error) {
      console.error('Error disabling push notifications:', error);
      return false;
    }
  };

  const refreshToken = async (): Promise<void> => {
    try {
      if (permissionStatus === 'granted' && isEnabled) {
        const token = await getCurrentToken();
        if (token && token !== fcmToken) {
          setFcmToken(token);
          
          // For web push notifications, just update local storage
          await AsyncStorage.setItem('fcm_token', token);
          console.log('FCM token refreshed:', token);
        }
      }
    } catch (error) {
      console.error('Error refreshing FCM token:', error);
    }
  };

  const value: PushNotificationContextType = {
    isSupported,
    isEnabled,
    permissionStatus,
    fcmToken,
    requestPermission,
    enablePushNotifications,
    disablePushNotifications,
    refreshToken
  };

  return (
    <PushNotificationContext.Provider value={value}>
      {children}
    </PushNotificationContext.Provider>
  );
};

export const usePushNotification = (): PushNotificationContextType => {
  const context = useContext(PushNotificationContext);
  if (!context) {
    throw new Error('usePushNotification must be used within a PushNotificationProvider');
  }
  return context;
};

export default PushNotificationContext;
